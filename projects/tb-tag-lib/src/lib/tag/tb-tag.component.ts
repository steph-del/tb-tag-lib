import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Observable, BehaviorSubject } from 'rxjs';

import { TbLog } from '../_models/tb-log.model';
import { TbTag } from '../_models/tbtag.model';
import { TbTagService } from '../_services/tb-tag-lib.service';

import * as _ from 'lodash';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material/tree';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { flatMap, map } from 'rxjs/operators';

@Component({
  selector: 'tb-tag',
  templateUrl: './tb-tag.component.html',
  styleUrls: ['./tb-tag.component.scss']
})
export class TbTagComponent implements OnInit {
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

  tree: Array<TbTag> = [];
  treeDataSource: MatTreeFlatDataSource<any, any>;
  expandedNodeSet = new Set<string>();
  dragging = false;
  expandTimeout: any;
  expandDelay = 1000;
  treeDisabled = false;

  _transformer = (node: TreeNode, level: number) => {
    return new TreeFlatNode(
      node.id.toString(),
      !!node.children && node.children.length > 0,
      node.name,
      node.path,
      level,
      node.type,
      node.selected
    );
  }

  // tslint:disable-next-line:member-ordering
  treeFlattener = new MatTreeFlattener(this._transformer, node => node.level, node => node.expandable, node => node.children);
  // tslint:disable-next-line:member-ordering
  treeControl = new FlatTreeControl<TreeFlatNode>(node => node.level, node => node.expandable);

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

    this.treeDataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    // User tags subscriber
    this.userTagsObservable.subscribe(
      newUserTags => {
        // update tree
        if (newUserTags.length > 0) {
          this.rebuildTreeForData(this.tagService.buildTree(newUserTags));
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
   * When user click on an user's tag
   */
  userTagSelectionChange(uTag: TbTag): void {
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
  }

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
   * @param node ?
   * @param value entered by the user
   */
  createTag(node: TbTag, value: string) {
    console.log(node, value);
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
  drop(event: CdkDragDrop<string[]>) {
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
    const nodeToInsert: TreeNode = siblings.splice(siblingIndex, 1)[0];

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

  }

  /**
   * This constructs an array of nodes that matches the DOM,
   * and calls rememberExpandedTreeNodes to persist expand state
   */
  visibleNodes(): TreeNode[] {
    this.rememberExpandedTreeNodes(this.treeControl, this.expandedNodeSet);
    const result = [];

    function addExpandedChildren(node: TreeNode, expanded: Set<string>) {
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
  }

  // tslint:disable-next-line:no-shadowed-variable
  hasChild = (_: number, node: TreeFlatNode) => node.expandable;

  /**
   * The following methods are for persisting the tree expand state
   * after being rebuilt
   */

  rebuildTreeForData(data: any) {
    this.rememberExpandedTreeNodes(this.treeControl, this.expandedNodeSet);
    this.treeDataSource.data = data;
    this.forgetMissingExpandedNodes(this.treeControl, this.expandedNodeSet);
    this.expandNodesById(this.treeControl.dataNodes, Array.from(this.expandedNodeSet));
  }

  private rememberExpandedTreeNodes(
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
  }

  private forgetMissingExpandedNodes(
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
  }

  private expandNodesById(flatNodes: TreeFlatNode[], ids: string[]) {
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
  }

  private getParentNode(node: TreeFlatNode): TreeFlatNode | null {
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
  }

  /**
   * When user click on the tree node checkbox
   */
  public toggleTreeNodeSelection(node: TbTag): void {
    console.log(node);
  }

  /**
   * Experimental - opening tree nodes as you drag over them
   */
  dragStart() {
    this.dragging = true;
  }
  dragEnd() {
    this.dragging = false;
  }
  dragHover(node: TreeFlatNode) {
    if (this.dragging) {
      clearTimeout(this.expandTimeout);
      this.expandTimeout = setTimeout(() => {
        this.treeControl.expand(node);
      }, this.expandDelay);
    }
  }
  dragHoverEnd() {
    if (this.dragging) {
      clearTimeout(this.expandTimeout);
    }
  }

}



export interface TreeNode {
  id: number;
  userId: number;
  name: string;
  path: string;
  type: any;
  children: TreeNode[];
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
