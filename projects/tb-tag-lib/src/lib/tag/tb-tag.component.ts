// TODO PREVENT SENDING FORM FOR ALL BUTTONS

import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';

import { Observable, BehaviorSubject, VirtualAction, zip } from 'rxjs';

import { TbLog } from '../_models/tb-log.model';
import { TbTag } from '../_models/tbtag.model';
import { TbTagService } from '../_services/tb-tag-lib.service';

import * as _ from 'lodash';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material/tree';
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
  @Input() baseApiUrl = 'http://localhost:8000';
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
    data.map(bTag => bTag.path = '/');
    this._basicTags = data;
    this.tagService.setBasicTags(data);
  }

  @Output() newTag = new EventEmitter<TbTag>();
  @Output() removedTag = new EventEmitter<TbTag>();
  @Output() log = new EventEmitter<TbLog>();
  @Output() httpError = new EventEmitter<any>();

  _basicTags: Array<TbTag>;
  _objectId: number;
  basicTagsByCategory: Array<Array<TbTag>> = [];
  userTags: Array<TbTag>;
  userTagsObservable = new BehaviorSubject<Array<TbTag>>([]);
  objectsTags: Array<TbTag> = [];
  isLoadingBasicTags = false;
  isLoadingUsersTags = false;
  isCreatingNewTag = false;
  isDeletingTag = false;
  tagToBeDeleted: TbTag;
  tagToBeDeletedRelatedObjects: Array<any> = [];
  apiRenamingTagPath = false;
  apiCreatingNewTag = false;
  apiLoadingRelatedObects = false;
  apiDeletingTag = false;

  // form
  newTagInput: FormControl;
  editTagInput: FormControl;

  // tree
  stackObservables: Array<Observable<any>> = [];
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
  userTagsAtDragStart: Array<TbTag>;

  constructor(
    private tagService: TbTagService,
    private fb: FormBuilder) { }

  static noSlash(control: FormControl) {
    return control.value.indexOf('/') === -1 ? null : { containsSlash: true };
  }

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

    // basic tags
    this.tagService.getBasicTagsByCategory().subscribe(_tags => this.basicTagsByCategory = _tags);

    // User tags subscriber
    this.userTagsObservable.subscribe(
      newUserTags => {
        // update tree
        if (newUserTags.length > 0) {
          // this.rebuildTreeForData(this.tagService.buildTree(newUserTags));
          this.userTags = newUserTags;
          this.tree = this.tagService.buildTree(newUserTags);
        }
      }, error => {
        //
      }
    );

    // Form input
    this.newTagInput = new FormControl('', [TbTagComponent.noSlash]);
    this.editTagInput = new FormControl('', [TbTagComponent.noSlash]);

    // Start by getting both user tags and related object tags
    let _uTags: Array<TbTag>; // user tags
    let _oTags: any;          // object related tags
    this.isLoadingUsersTags = true;
    this.tagService.getUserTags(this.userId).pipe(
      flatMap(uTags => {
        _uTags = uTags;
        return this.tagService.getObjectRelations(this._objectId);
      })
    ).subscribe(
      oTags => {
        _oTags = oTags && oTags.length > 0 ? _.map(oTags, o => o[`${this.objectName}Tag`]) : [];
        for (const uT of _uTags) {
          if (_.find(_oTags, oT => oT.id === uT.id)) { uT.selected = true; }
        }
        if (_oTags.length > 0) {
          this.tree = this.tagService.buildTree(_uTags);
          this.userTagsObservable.next(_uTags);
        }
        this.isLoadingUsersTags = false;
      },
      error => {
        // @Todo manage error
        console.log(error);
        this.isLoadingUsersTags = false;
      }
    );
  }

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
   * When user select a basic tag, we create a new tag in db and then do the link
   */
  addBasicTagToUserTags(bTag: TbTag): void {
    if (this.findTagByNameAndPath(this.userTagsObservable.getValue(), bTag.name, bTag.path) == null) {
      this.isCreatingNewTag = false;

      const clonedUserTags = this.cloneTags(this.userTagsObservable.getValue());

      this.apiCreatingNewTag = true;
      bTag.loading = true;
      this.tagService.createTag(bTag.name, bTag.path).subscribe(
        result => {
          clonedUserTags.push(result);
          this.userTagsObservable.next(clonedUserTags);
          bTag.loading = false;
          this.uTagSelectionChange(result); /* uncomment for the tag to be selected immediately after its creation */
          this.apiCreatingNewTag = false;
        }, error => {
          // @Todo manage error
          bTag.loading = false;
          this.apiCreatingNewTag = false;
        }
      );
    } else {
      console.log(`Le tag '${bTag.name}' est déjà présent dans vos tags. Vous ne pouvez pas l'ajouter un seconde fois`);
    }
  }

  basicTagAlreadyExistsInUserTags(bTag: TbTag): boolean {
    const uTags = this.userTagsObservable.getValue();
    if (this.findTagByNameAndPath(uTags, bTag.name, bTag.path)) {
      return true;
    } else {
      return false;
    }
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
   * Before editing the tag, we toggle `isEditingName` for every user's tag to `false`
   * @param node from the tree
   */
  editTagName(node: TbTag): void {
    const uTags = this.userTagsObservable.getValue();
    this.stopEditingTagsName(uTags);
    const tagToEdit = this.findTagById(uTags, node.id);
    if (tagToEdit) { tagToEdit.isEditingName = true; }
    this.userTagsObservable.next(uTags);
  }
   /**
   * When user click on the cancel edit button inside the tree
   * @param node from the tree
   */
  stopEditingTagName(node: TbTag): void {
    node.isEditingName = false;
    const uTags = this.userTagsObservable.getValue();
    const stopEditingTag = this.findTagById(uTags, node.id);
    if (stopEditingTag) { stopEditingTag.isEditingName = false; }
  }

  /**
   * Recursively stop editing tags
   */
  stopEditingTagsName(tags: Array<TbTag>): void {
    for (const tag of tags) {
      tag.isEditingName = false;
      if (tag.children && tag.children.length > 0) {
        this.stopEditingTagsName(tag.children);
      }
    }
  }

  /**
   * When user validate a new name (click on the 'Validate' button)
   * 1st update tag name
   * 2ng update child paths
   * @param node from the tree
   * @param newValue from the input
   */
  renameTag(node: TbTag, newValue: string): void {
    this.stopEditingTagName(node);
    // @Todo check name size (must not exceed 30 characters) AND alos for children !!!!!

    const oldValue = _.clone(node.name);

    const clonedUserTags = this.cloneTags(this.userTagsObservable.getValue());
    const clonedUTag = this.findTagById(clonedUserTags, node.id);

    node.name = newValue;
    node.isSavingName = true;

    this.stackObservables = [];

    this.stackObservables.push(this.tagService.updateTagName(node));

    this.parseChildNodesAndRenamePath(node, `/${oldValue}/`, `/${newValue}/`); // REPLACE /OLDVALUE/ BY /NEWVALUE/ (slashes to avoid path name 'side effect')

    if (this.stackObservables.length > 0) {
      const zipCall = zip(...this.stackObservables).subscribe(
        results => {
          // OK
          const updatedTags = this.assignTagsValues(this.userTags, results);
          this.stackObservables = [];
          // this.userTagsObservable.next(updatedTags);
          // No need to rebuild tree, just update tags chips data
          this.userTags = updatedTags;
          node.isSavingName = false;
        }, error => {
          // @Todo manage error
          this.stackObservables = [];
          node.isSavingName = false;
        }
      );
    }
  }

  parseChildNodesAndRenamePath(node: TbTag, oldValue: string, newValue: string): void {
    if (node.children && node.children.length > 0) {
      for (const nodeChild of node.children) {
        const newPath = nodeChild.path.replace(oldValue, newValue);
        // @Todo check path size : must not exceed 255 characters
        nodeChild.path = newPath;
        // push observable on the stack
        this.stackObservables.push(this.tagService.updateTagPath(nodeChild));
        if (nodeChild.children && nodeChild.children.length > 0) {
          this.parseChildNodesAndRenamePath(nodeChild, oldValue, newValue);
        }
      }
    }
  }

  public cloneTags(tags: Array<TbTag>): Array<TbTag> {
    return _.cloneDeep(tags);
  }

  /**
   * Recursively parse an array of tags and get the tag with the given id
   */
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
   * Recursively parse an array of tags and get the tag with the given name/path values
   */
  public findTagByNameAndPath(tags: Array<TbTag>, name: string, path: string): TbTag {
    let result, subResult;
    tags.forEach(tag => {
      if (tag.name.toLowerCase() === name.toLocaleLowerCase() && tag.path.toLowerCase() === path.toLowerCase()) {
        result = tag;
      } else if (tag.children) {
        subResult = this.findTagByNameAndPath(tag.children, name, path);
        if (subResult) { result = subResult; }
      }
    });
    return result;
  }

  /**
   * Recursively parse an array of tags and remove the tag with the given id
   */
  public removeTagById(tags: Array<TbTag>, id: number): void {
    tags.forEach(tag => {
      if (Number(tag.id) === Number(id)) {
        _.remove(tags, t => t === tag);
      } else if (tag.children) {
        this.removeTagById(tag.children, id);
      }
    });
  }

  /**
   * When user create a new tag
   * @param value entered by the user
   */
  createNewTag(value: string) {
    if (this.findTagByNameAndPath(this.userTagsObservable.getValue(), value, '/') == null) {
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
    } else {
      console.log(`Le tag '${value}' est déjà présent dans vos tags. Vous ne pouvez pas l'ajouter un seconde fois`);
    }
  }

  // ************************
  // TAGS AND RELATES OBJECTS
  // ************************
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
   * At drag start, save current user's tags value
   * This allow to set the tree at its previous state if drop is not possible or if it aborts
   */
  dragStart(): void {
    this.userTagsAtDragStart = this.userTagsObservable.getValue();
  }

  /**
   * When user moves a node inside the tree
   * @param event provided by angular-tree
   */
  moveNode(event: {eventName: string, node: TbTag, to: {index: number, parent: any}, treeModel: TreeModel}) {
    const uTags = this.userTagsObservable.getValue();

    this.renameNodePaths(event.node, event.to.parent);

    // check path length
    if (event.node.path.length > 255) {
      // set previous tags value
      // @Todo notify user
      console.log('ABORT DRAG AND DROP, PATH OVERSIZE');
      if (this.userTagsAtDragStart) { this.userTagsObservable.next(this.userTagsAtDragStart); }
      this.userTagsAtDragStart = null;
    } else {
      if (this.stackObservables.length > 0) {
        this.apiRenamingTagPath = true;
        const zipCall = zip(...this.stackObservables).subscribe(
          results => {
            const updatedTags = this.assignTagsValues(uTags, results);
            this.stackObservables = [];
            // this.userTagsObservable.next(updatedTags);
            // No need to rebuild tree, just update tags chips data
            this.userTags = updatedTags;
            this.userTagsAtDragStart = null;
            this.apiRenamingTagPath = false;
          }, error => {
            this.stackObservables = [];
            console.log(error);
            this.userTagsObservable.next(this.userTagsAtDragStart);
            // @Todo notify user & reload entire tree
            this.userTagsAtDragStart = null;
            this.apiRenamingTagPath = false;
          }
        );
      }
    }
  }

  /**
   * Parse the initialTags array and assign newTags value by their ids
   * Be carefull, this method is not recursive (no children parse) !
   */
  assignTagsValues(initialTags: Array<TbTag>, newTags: Array<TbTag>): Array<TbTag> {
    const clonedInitialTags = _.clone(initialTags);
    for (const nT of newTags) {
      // let tagToUpdate: TbTag;
      for (let cIT of clonedInitialTags) {
        if (cIT.id === nT.id) { cIT.name = nT.name; cIT.path = nT.path; }
      }
    }
    return clonedInitialTags;
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
   * and push API calls to `this.stackObservables` stack
   * Be carefull, you have to manually subscribe to `this.stackObservables` observables and also clean up the array we finished
   * @param node is a TbTag
   * @param parent is an object provided by angular-tree module
   */
  renameNodePaths(node: TbTag, parent: any): void {
    // parent can be a virtual node when moving a node at root
    if (parent.virtual) {
      if (node.path !== '/') {
        node.path = '/';
        // push observable on the stack
        this.stackObservables.push(this.tagService.updateTagPath(node));
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
        this.stackObservables.push(this.tagService.updateTagPath(node));
      }

      if (node.children && node.children.length > 0) {
        for (const childNode of node.children) {
          this.renameNodePaths(childNode, node);
        }
      }
    }
  }

  startDeletingTag(node: TbTag) {
    this.isDeletingTag = true;
    this.tagToBeDeleted = node;
    this.apiLoadingRelatedObects = true;
    this.tagService.getTagsRelations(node).subscribe(
      results => {
        // related objects to the provided tag (node)
        this.tagToBeDeletedRelatedObjects = results;
        this.apiLoadingRelatedObects = false;
      }, error => {
        // @Todo manage error
        this.apiLoadingRelatedObects = false;
        console.log(error);
      }
    );
  }

  stopDeletingTag() {
    this.isDeletingTag = false;
    this.tagToBeDeleted = null;
    this.tagToBeDeletedRelatedObjects = [];
  }

  deleteTag(tag: TbTag): void {
    if (tag.children && tag.children.length > 0) {
      // @Todo notify user
      return;
    }
    const clonedUserTags = this.cloneTags(this.userTagsObservable.getValue());
    const clonedTagToDelete = this.findTagById(clonedUserTags, tag.id);

    this.apiDeletingTag = true;
    this.tagService.deleteTag(tag).subscribe(
      result => {
        this.removeTagById(clonedUserTags, clonedTagToDelete.id);
        this.userTagsObservable.next(clonedUserTags);
        this.apiDeletingTag = false;
        this.stopDeletingTag();
        // @Todo notify user
      }, error => {
        // @Todo manage error
        console.log(error);
        this.apiDeletingTag = false;
      }
    );
  }

}
