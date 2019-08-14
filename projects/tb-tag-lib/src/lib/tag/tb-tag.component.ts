import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Observable, BehaviorSubject, VirtualAction, zip } from 'rxjs';

import { TbLog } from '../_models/tb-log.model';
import { TbTag } from '../_models/tbtag.model';
import { TbTagService } from '../_services/tb-tag-lib.service';

import * as _ from 'lodash';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material/tree';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { flatMap, map } from 'rxjs/operators';

import { ITreeState, ITreeOptions, TreeComponent, TreeNode, TreeModel, TREE_ACTIONS } from 'angular-tree-component';


@Component({
  selector: 'tb-tag',
  templateUrl: './tb-tag.component.html',
  styleUrls: ['./tb-tag.component.scss']
})
export class TbTagComponent implements OnInit {
  @ViewChild('treeComponent') private treeComponent: TreeComponent;

  //
  // INPUT / OUTPUT
  //
  @Input() userId: number;
  // @Input() objectId: number;
  @Input() set objectId(data: number) {
    this._objectId = data;
  }
  @Input() baseApiUrl = 'http://localhost:8001';
  // ??? Input() noApiCall = false;
  @Input() objectName = 'photo';
  @Input() objectEndpoint = '/api/photos';
  @Input() tagName = 'photoTag';
  @Input() tagEndpoint = '/api/photo_tags';
  @Input() apiRelationPath = '/api/photo_photo_tag_relations';
  @Input() apiRetrievePath = '/api/photos/{id}/photo_tag_relations';
  @Input() apiTagsRelationsPath = '/api/photo_tags/{id}/photo_relations';
  @Input() set basicTags(data: Array<TbTag>) {
    // this.basicTagsSet = true;
    this._basicTags = data;
    this.tagService.setBasicTags(data);
  }

  @Output() newTag = new EventEmitter<TbTag>();
  @Output() removedTag = new EventEmitter<TbTag>();
  @Output() log = new EventEmitter<TbLog>();
  @Output() httpError = new EventEmitter<any>();

  _basicTags: Array<TbTag>;
  _objectId: number;
  userTags: Array<TbTag>;
  userTagsObservable = new BehaviorSubject<Array<TbTag>>([]);
  objectsTags: Array<TbTag> = [];
  isLoadingBasicTags = false;
  isLoadingUsersTags = false;
  isCreatingNewTag = false;
  apiRenamingTagPath = false;
  apiCreatingNewTag = false;

  // tree
  zipTagPathRename: Array<Observable<any>> = [];
  state: ITreeState = {
    expandedNodeIds: {},
    hiddenNodeIds: {},
    activeNodeIds: {}
  };

  options: ITreeOptions = {
    allowDrag: (node) => true,
    getNodeClone: (node) => ({
      ...node.data,
      id: node.id,
      name: `copy of ${node.data.name}`
    }),
    nodeHeight: 40,
    /*actionMapping: {
      mouse: {
        click: (tree, node, $event) => {
          if (node.hasChildren) { TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event); }
        }
      }
    }*/
  };


  tree: Array<TbTag> = [];
  // treeDataSource: MatTreeFlatDataSource<NgTreeNode, any>;
  // expandedNodeSet = new Set<string>();
  // dragging = false;
  // expandTimeout: any;
  // expandDelay = 1000;
  // treeDisabled = false;

  /*_transformer = (node: NgTreeNode, level: number) => {
    return new TreeFlatNode(
      node.id.toString(),
      !!node.children && node.children.length > 0,
      node.name,
      node.path,
      level,
      node.type,
      node.selected
    );
  }*/

  // tslint:disable-next-line:member-ordering
  // treeFlattener = new MatTreeFlattener(this._transformer, node => node.level, node => node.expandable, node => node.children);
  // tslint:disable-next-line:member-ordering
  // treeControl = new FlatTreeControl<TreeFlatNode>(node => node.level, node => node.expandable);

  constructor(
    private tagService: TbTagService,
    private fb: FormBuilder) { }


  ngOnInit() {
    // objectId provided ?
    if (!this._objectId/* && !this.noApiCall*/) {
      this.log.emit({module: 'tb-tag-lib', type: 'error', message_fr: 'Vous devez fournir un objectId pour initialiser le module'});
    }

    // Set API urls (bind data to tag service)
    this.tagService.setBaseApiUrl(this.baseApiUrl);
    this.tagService.setApiRelationPath(this.apiRelationPath);
    this.tagService.setApiRetrievePath(this.apiRetrievePath);
    this.tagService.setApiTagsRelationsPath(this.apiTagsRelationsPath);
    this.tagService.setObjectName(this.objectName);
    this.tagService.setObjectEndpoint(this.objectEndpoint);
    this.tagService.setTagName(this.tagName);
    this.tagService.setTagEndpoint(this.tagEndpoint);
    this.tagService.setUserId(Number(this.userId));

    // this.treeDataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    // User tags subscriber
    this.userTagsObservable.subscribe(
      newUserTags => {
        // update tree
        if (newUserTags.length > 0) {
          // this.rebuildTreeForData(this.tagService.buildTree(newUserTags));
          this.tree = this.tagService.buildTree(newUserTags);
        }
      }, error => {
        //
      }
    );

    // Start by getting both user tags and related object tags
    let _uTags: Array<TbTag>; // user tags
    let _oTags: any;          // object related tags
    this.tagService.getUserTags(this.userId).pipe(
      flatMap(uTags => {
        _uTags = uTags;
        return this.tagService.getObjectRelations(this._objectId);
      })
    ).subscribe(
      oTags => {
        _oTags = _.map(oTags, o => o[`${this.objectName}Tag`]);
        for (const uT of _uTags) {
          if (_.find(_oTags, oT => oT.id === uT.id)) { uT.selected = true; }
        }
        this.tree = this.tagService.buildTree(_uTags);
        this.userTagsObservable.next(_uTags);
      },
      error => console.log(error)
    );
  }

  // *********
  // USER TAGS
  // *********
  // this.userTagsObservable;

  // ********
  // TAG CRUD
  // ********
  getUserTags(): void {
    this.tagService.getUserTags(this.userId).subscribe(
      uTags => this.userTagsObservable.next(uTags),
      error => console.log(error)
    );
  }

  /**
   * When user click on a basic tag
   */
  basicTagClicked(bTag: TbTag): void {
    console.log(bTag);
  }

  /**
   * When user click on an user's tag or toggle a checkbox in the tree
   * @param node from the tree
   */
  uTagSelectionChange(node: TbTag): void {
    const clonedUserTags = this.cloneTags(this.userTagsObservable.getValue());
    const clonedUTag = this.findTagById(clonedUserTags, node.id);

    if (clonedUTag.selected) {
      // unlink object
      node.unlinking = true;
      clonedUTag.unlinking = true;
      this.tagService.unlinkTagToObject(clonedUTag.id, this._objectId).subscribe(
        result => {
          clonedUTag.selected = false;
          node.unlinking = false;
          clonedUTag.unlinking = false;
          this.userTagsObservable.next(clonedUserTags);
        }, error => {
          node.unlinking = false;
          clonedUTag.unlinking = false;
        }
      );
    } else {
      // link object
      node.linking = true;
      clonedUTag.linking = true;
      this.tagService.linkTagToObject(clonedUTag.id, this._objectId).subscribe(
        result => {
          // reload tree
          clonedUTag.selected = true;
          node.linking = false;
          clonedUTag.linking = false;
          this.userTagsObservable.next(clonedUserTags);
        }, error => {
          console.log(error);
          node.linking = false;
          clonedUTag.linking = false;
        }
      );
    }
  }

  /**
   * When user click on the edit button inside the tree
   * @param node from the tree
   */
  editTagName(node: TbTag): void {
    node.isEditingName = true;
  }
   /**
   * When user click on the cancel edit button inside the tree
   * @param node from the tree
   */
  stopEditingTagName(node: TbTag): void {
    node.isEditingName = false;
  }

  /**
   * When user validate a new name (click on the 'Validate' button)
   * @param node from the tree
   * @param newValue from the input
   */
  renameTag(node: TbTag, newValue: string): void {
    this.stopEditingTagName(node);
    // @Todo check name size (must not exceed 30 characters)
    const oldValue = _.clone(node.name);

    const clonedUserTags = this.cloneTags(this.userTagsObservable.getValue());
    const clonedUTag = this.findTagById(clonedUserTags, node.id);

    node.name = newValue;
    node.isSavingName = true;
    this.tagService.updateTagName(node).subscribe(
      result => {
        clonedUTag.name = newValue;
        this.userTagsObservable.next(clonedUserTags);
        node.isSavingName = false;
      }, error => {
        // @Todo manage error
        console.log(error);
        node.name = oldValue;
        node.isSavingName = false;
      }
    );

  }

  /**
   * When user click on an user's tag
   * DELETE
   */
  /*userTagSelectionChange(uTag: TbTag): void {
    const clonedUserTags = this.cloneTags(this.userTagsObservable.getValue());
    const clonedUTag = this.findTagById(clonedUserTags, uTag.id);
    const nodeTagInArray = this.findTagById(this.treeDataSource.data, uTag.id);

    if (clonedUTag.selected) {
      // unlink to object
      uTag.unlinking = true;
      nodeTagInArray.unlinking = true;
      this.tagService.unlinkTagToObject(clonedUTag.id, this._objectId).subscribe(
        result => {
          clonedUTag.selected = false;
          uTag.unlinking = false;
          nodeTagInArray.unlinking = false;
          this.userTagsObservable.next(clonedUserTags);
        }, error => {
          uTag.unlinking = false;
          nodeTagInArray.unlinking = false;
        }
      );
    } else {
      // link to object
      uTag.linking = true;
      nodeTagInArray.linking = true;
      this.tagService.linkTagToObject(clonedUTag.id, this._objectId).subscribe(
        result => {
          // reload tree
          clonedUTag.selected = true;
          uTag.linking = false;
          nodeTagInArray.linking = false;
          this.userTagsObservable.next(clonedUserTags);
        }, error => {
          console.log(error);
          uTag.linking = false;
          nodeTagInArray.linking = false;
        }
      );
    }
  }*/

  public cloneTags(tags: Array<TbTag>): Array<TbTag> {
    return _.cloneDeep(tags);
  }

  public findTagById(tags: Array<TbTag>, id: number): TbTag {
    let result, subResult;
    tags.forEach(tag => {
      if (Number(tag.id) === Number(id)) {
        result = tag;
      } else if (tag.children) {
        subResult = this.findTagById(tag.children, id);
        if (subResult) { result = subResult; }
      }
    });
    return result;
  }

  /**
   * When user create a new tag
   * @param value entered by the user
   */
  createNewTag(value: string) {
    console.log(value);
    this.isCreatingNewTag = false;

    const clonedUserTags = this.cloneTags(this.userTagsObservable.getValue());

    this.apiCreatingNewTag = true;
    this.tagService.createTag(value, '/').subscribe(
      result => {
        clonedUserTags.push(result);
        this.userTagsObservable.next(clonedUserTags);
        // this.uTagSelectionChange(result); /* uncomment for the tag to be selected immediately after its creation */
        this.apiCreatingNewTag = false;
      }, error => {
        // @Todo manage error
        this.apiCreatingNewTag = false;
      }
    );
  }

  // ************************
  // TAGS AND RELATES OBJECTS
  // ************************

  /**
   * When user select a basic tag, we create a new tag in db and then do the link
   */
  addBasicTagToUserTags(tag: TbTag) { }

  getTagColor(tag: TbTag): 'primary' | 'none' {
    return tag.selected ? 'primary' : 'none';
  }

  // *****
  // OTHER
  // *****

  /**
   * Bind tag-tree logs
   */
  _log(logMessage: TbLog) {
    this.log.emit(logMessage);
  }

  // ******************
  // DRAG & DROP EVENTS
  // ******************

  /**
   * Handle the drop - here we rearrange the data based on the drop event,
   * then rebuild the tree.
   * */
  /*drop(event: CdkDragDrop<string[]>) {
    // construct a list of visible nodes, this will match the DOM.
    const visibleNodes = this.visibleNodes();

    // deep clone the data source so we can mutate it
    const changedData = JSON.parse(JSON.stringify(this.treeDataSource.data));
    const initialData: Array<TbTag> = JSON.parse(JSON.stringify(this.treeDataSource.data));
    console.log('initialData :');
    console.log(initialData);

    // recursive find function to find siblings of node
    function findNodeSiblings(arr: Array<any>, id: string): Array<any> {
      let result, subResult;
      arr.forEach(item => {
        if (item.id.toString() === id) {
          result = arr;
        } else if (item.children) {
          subResult = findNodeSiblings(item.children, id);
          if (subResult) { result = subResult; }
        }
      });
      return result;
    }

    // remove the node from its old place
    const node = event.item.data;

    // console.log('-------');
    // console.log(findNodeSiblings(changedData, node.id));

    const siblings = findNodeSiblings(changedData, node.id);
    const siblingIndex = siblings.findIndex(n => n.id.toString() === node.id.toString());
    const nodeToInsert: NgTreeNode = siblings.splice(siblingIndex, 1)[0];

    // determine where to insert the node
    const nodeAtDest = visibleNodes[event.currentIndex];
    if (nodeAtDest.id === nodeToInsert.id) { return; }

    // determine drop index relative to destination array
    let relativeIndex = event.currentIndex; // default if no parent
    const nodeAtDestFlatNode = this.treeControl.dataNodes.find(n => nodeAtDest.id.toString() === n.id);
    const parent = this.getParentNode(nodeAtDestFlatNode);
    if (parent) {
      const parentIndex = visibleNodes.findIndex(n => n.id.toString() === parent.id) + 1;
      relativeIndex = event.currentIndex - parentIndex;
    }

    // get siblings
    const newSiblings = findNodeSiblings(changedData, nodeAtDest.id.toString());

    // get node destination
    const nodeDestination = visibleNodes[event.currentIndex]; // OK !!!

    console.log('node destination :');
    console.log(nodeDestination);

    // API CALL... THEN INSERT NODE AND REBUILD TREE IF SUCCESS
    this.treeDisabled = true;
    setTimeout(() => {
      // insert node
      newSiblings.splice(relativeIndex, 0, nodeToInsert);

      // rebuild tree with mutated data
      this.rebuildTreeForData(changedData);

      this.treeDisabled = false;
    }, 1000);

  }*/

  /**
   * This constructs an array of nodes that matches the DOM,
   * and calls rememberExpandedTreeNodes to persist expand state
   */
  /*visibleNodes(): NgTreeNode[] {
    this.rememberExpandedTreeNodes(this.treeControl, this.expandedNodeSet);
    const result = [];

    function addExpandedChildren(node: NgTreeNode, expanded: Set<string>) {
      result.push(node);
      if (node.children && expanded.has(node.id.toString())) {
        node.children.map(child => addExpandedChildren(child, expanded));
      }
    }
    this.treeDataSource.data.forEach(node => {
      addExpandedChildren(node, this.expandedNodeSet);
    });
    console.log('visible nodes :');
    console.log(result);
    return result;
  }*/

  // tslint:disable-next-line:no-shadowed-variable
  // hasChild = (_: number, node: TreeFlatNode) => node.expandable;

  /**
   * The following methods are for persisting the tree expand state
   * after being rebuilt
   */

  /*rebuildTreeForData(data: any) {
    this.rememberExpandedTreeNodes(this.treeControl, this.expandedNodeSet);
    this.treeDataSource.data = data;
    this.forgetMissingExpandedNodes(this.treeControl, this.expandedNodeSet);
    this.expandNodesById(this.treeControl.dataNodes, Array.from(this.expandedNodeSet));
  }*/

  /*private rememberExpandedTreeNodes(
    treeControl: FlatTreeControl<TreeFlatNode>,
    expandedNodeSet: Set<string>
  ) {
    if (treeControl.dataNodes) {
      treeControl.dataNodes.forEach((node) => {
        if (treeControl.isExpandable(node) && treeControl.isExpanded(node)) {
          // capture latest expanded state
          expandedNodeSet.add(node.id);
        }
      });
    }
  }*/

  /*private forgetMissingExpandedNodes(
    treeControl: FlatTreeControl<TreeFlatNode>,
    expandedNodeSet: Set<string>
  ) {
    if (treeControl.dataNodes) {
      expandedNodeSet.forEach((nodeId) => {
        // maintain expanded node state
        if (!treeControl.dataNodes.find((n) => n.id === nodeId)) {
          // if the tree doesn't have the previous node, remove it from the expanded list
          expandedNodeSet.delete(nodeId);
        }
      });
    }
  }*/

  /*private expandNodesById(flatNodes: TreeFlatNode[], ids: string[]) {
    if (!flatNodes || flatNodes.length === 0) { return; }
    const idSet = new Set(ids);
    return flatNodes.forEach((node) => {
      if (idSet.has(node.id)) {
        this.treeControl.expand(node);
        let parent = this.getParentNode(node);
        while (parent) {
          this.treeControl.expand(parent);
          parent = this.getParentNode(parent);
        }
      }
    });
  }*/

  /*private getParentNode(node: TreeFlatNode): TreeFlatNode | null {
    const currentLevel = node.level;
    if (currentLevel < 1) {
      return null;
    }
    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;
    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];
      if (currentNode.level < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }*/

  /**
   * When user click on the tree node checkbox
   */
  /*public toggleTreeNodeSelection(node: TbTag): void {
    console.log(node);
  }*/

  /**
   * Experimental - opening tree nodes as you drag over them
   */
  /*dragStart() {
    this.dragging = true;
    for (const node of this.treeDataSource.data) {
      const emptyChildTreeNode: NgTreeNode = {
        id: -1,
        userId: this.userId,
        name: 'empty child',
        path: '/',
        type: '',
        children: [],
        selected: false
      };
      const emptyTreeNode: NgTreeNode = {
        id: -1,
        userId: this.userId,
        name: 'empty',
        path: '/',
        type: '',
        children: [emptyChildTreeNode],
        selected: false
      };
      if (node.children.length === 0) {
        node.children.push(emptyTreeNode);
      }
    }
  }*/

  /*dragEnd() {
    this.dragging = false;
  }*/

  /*dragHover(node: TreeFlatNode) {
    console.log('DRAG HOVER');
    console.log(node);
    if (this.dragging) {
      clearTimeout(this.expandTimeout);
      this.expandTimeout = setTimeout(() => {
        this.treeControl.expand(node);
      }, this.expandDelay);
    }
  }*/

  /*dragHoverEnd() {
    if (this.dragging) {
      clearTimeout(this.expandTimeout);
    }
  }*/

  /**
   * When user moves a node inside the tree
   * @param event provided by angular-tree
   */
  moveNode(event: {eventName: string, node: TbTag, to: {index: number, parent: any}, treeModel: TreeModel}) {
    console.log('MOVE NODE : ');
    console.log(event);
    console.log('GET NODE BY INDEX', event.to.index);
    console.log(event.treeModel.getNodeById(event.to.index));

    this.renameNodePaths(event.node, event.to.parent);
    console.log(this.zipTagPathRename);
    if (this.zipTagPathRename.length > 0) {
      this.apiRenamingTagPath = true;
      const zipCall = zip(...this.zipTagPathRename).subscribe(
        results => {
          this.zipTagPathRename = [];
          console.log(results);
          this.apiRenamingTagPath = false;
        }, error => {
          // @Todo notify user & reload entire tree
          this.zipTagPathRename = [];
          console.log(error);
          this.apiRenamingTagPath = false;
        }
      );
    }
  }

  /**
   * Expand / collapse a tree node
   * @param node provided by angular-tree
   */
  expandNode(node: TreeNode): void {
    if (node.isExpanded) { node.collapse(); } else { node.expand(); }
  }

  /**
   * Recursively rename tag path
   * and push API calls to `this.zipTagPathRename` stack
   * Be carefull, you have to manually subscribe to `this.zipTagPathRename` observables and also clean up the array we finished
   * @param node is a TbTag
   * @param parent is an object provided by angular-tree module
   */
  renameNodePaths(node: TbTag, parent: any): void {
    console.log(`RENAME PATH FOR : ${node.name} (${node.path})`);
    console.log(parent);
    // parent can be a virtual node when moving a node at root
    if (parent.virtual) {
      if (node.path !== '/') {
        node.path = '/';
        // push observable on the stack
        this.zipTagPathRename.push(this.tagService.updateTagPath(node));
      }

      if (node.children && node.children.length > 0) {
        for (const childNode of node.children) {
          this.renameNodePaths(childNode, node);
        }
      }
    } else {
      const newPath = parent.path + this.tagService.removeAccentAndUpperCase(parent.name) + '/';
      // @Todo check path size : must not exceed 255 characters
      if (newPath !== node.path) {
        node.path = newPath;
        // push observable on the stack
        this.zipTagPathRename.push(this.tagService.updateTagPath(node));
      }

      if (node.children && node.children.length > 0) {
        for (const childNode of node.children) {
          this.renameNodePaths(childNode, node);
        }
      }
    }
  }

}


/*
export interface NgTreeNode {
  id: number;
  userId: number;
  name: string;
  path: string;
  type: any;
  children: NgTreeNode[];
  selected: boolean;
}

export class TreeFlatNode {
  constructor(
    public id: string,
    public expandable: boolean,
    public name: string,
    public path: string,
    public level: number,
    public type: any,
    public selected: boolean,
  ) {}
}
*/
