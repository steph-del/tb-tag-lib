import { Component, OnInit, ViewChild, EventEmitter, Output, Input } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { TreeComponent, TreeNode } from 'angular-tree-component';

import { TbLog } from '../_models/tb-log.model';
import { TreeItem } from '../_models/tree-item.model';
import { TbTag } from '../_models/tbtag.model';

import { TreeService } from '../_services/tb-tree.service';
import { TbTagService } from '../_services/tb-tag-lib.service';

@Component({
  selector: 'tb-tag-tree',
  templateUrl: './tb-tag-tree.component.html',
  styleUrls: ['./tb-tag-tree.component.scss']
})
export class TbTagTreeComponent implements OnInit {
  @ViewChild('treeComponent') private treeComponent: TreeComponent;

  //
  // INPUT / OUTPUT
  //
  @Input() objectId: number;
  @Input() noApiCall = false;
  @Output() log = new EventEmitter<TbLog>();
  @Output() tagsHasChanged = new EventEmitter<boolean>();
  @Output() httpError = new EventEmitter<any>();
  @Output() _newTag = new EventEmitter<TbTag>();
  @Output() _removedTag = new EventEmitter<TbTag>();

  //
  // VARIABLES
  //
  userId: number;
  form: FormGroup;
  tree: Array<TreeItem> = [];
  tags: Array<TbTag> = [];
  basicTags: Array<TbTag> = [];
  userTags: Array<TbTag> = [];

  // tree option
  options = {
    allowDrag: true,
    allowDrop: (element, {parent, index}) => this._allowDrop(element, {parent, index}),
    useCheckbox: false
  };

  //
  // CODE
  //

  constructor(private treeService: TreeService, private tagService: TbTagService, private fb: FormBuilder) { }

  ngOnInit() {
    this.userId = this.treeService.userId;
    this.resetTree();

    // Create form
    this.form = this.fb.group({
      tagInput: this.fb.control(''),
      folderInput: this.fb.control(''),
    });
  }

  /**
  * When user drop a node
  */
  moveNode(event) {
    const movedNode: TreeItem = event.node;
    const movedInto: TreeItem = event.to.parent;
    if (this.objectId && movedNode.isFolder) {
      // update all paths
      this.tagService.rewriteTagsPaths(movedNode.path + '/' + movedNode.name, movedInto.path + '/' + movedInto.name + '/' + movedNode.name);
    } else if (this.objectId && movedNode.isLeaf) {
      // update movedNode path
      const newPath = movedInto.path === '/' ? movedInto.name : movedInto.path + '/' + movedInto.name;
      // update node
      if (this.objectId && !this.noApiCall) {
        this.tagService.updateTag({id: movedNode.id, userId: this.userId, name: movedNode.name, path: newPath, objectId: this.objectId})
        .subscribe(result => {
          this.log.emit({module: 'tb-tag-lib', type: 'info', message_fr: `Le tag "${movedNode.name}" a bien été déplacé et enregistré`});
        }, error => {
          // reset tree
          this.httpError.next(error);
          this.resetTree();
          this.log.emit({module: 'tb-tag-lib', type: 'error', message_fr: `Le tag "${movedNode.name}" n'a pas pu être déplacé et enregistré`});
        });
      }
    } else if (!this.objectId && this.noApiCall) {
      const newPath = movedInto.path === '/' ? movedInto.name : movedInto.path + '/' + movedInto.name;
      const newId = - Math.random() * 100000;
      const tagToRemove: TbTag = {id: event.node.id, userId: this.userId, name: movedNode.name, path: movedNode.path, objectId: event.node.id};
      const newTag: TbTag = {id: newId, userId: this.userId, name: movedNode.name, path: newPath, objectId: newId};

      movedNode.id = newId;

      this._removedTag.next(tagToRemove);
      this._newTag.next(newTag);
    }

    if (this.objectId && !this.noApiCall) { this.tagsHasChanged.emit(true); }
  }

  /**
  * Return true if a node is allowed to drop
  * Params are provided by tree node component (see options)
  * Drop is allowed for folder and non basic tags
  */
  _allowDrop(element, {parent, index}) {
    return parent.data.isFolder && parent.data.isEditable;
  }

  /**
  * Rename a tag path and its children paths
  */
  renameTag(node: TreeNode, newName: string) {
    // @todo emit renamed tag (old + new names + tag id) (could be linked to other objects)
    node.data.isEditing = false;
    newName = newName.trim();
    newName = newName.replace(/\s\s+/g, ' '); // repalce multi spaces

    if (node.data.isFolder) {
      // update tag all leaves tags inside the folder
      this.tagService.rewriteTagsPaths(node.data.path + '/' + node.data.name, node.data.path + '/' + newName);
      // update node name
      node.data.name = newName;
    } else if (this.objectId && node.data.isLeaf) {
      // update tag
      const tag: TbTag = {id: node.data.id, userId: node.data.userId, path: node.data.path, name: newName, objectId: this.objectId};
      this.tagService.updateTag(tag).subscribe(resultTag => {
        this.log.emit({module: 'tb-tag-lib', type: 'info', message_fr: `Le tag "${tag.name}" a bien été enregistré`});
        node.data.name = newName;
        this.tagsHasChanged.emit(true);
      }, error => {
        this.httpError.next(error);
        this.log.emit({module: 'tb-tag-lib', type: 'error', message_fr: `Le tag "${tag.name}" n'a pas pu être enregistré`});
      });
    } else if (!this.objectId && this.noApiCall) {
      if (node.data.isFolder) {
        // update tag all leaves tags inside the folder
        this.tagService.rewriteTagsPaths(node.data.path + '/' + node.data.name, node.data.path + '/' + newName);
      } else if (node.data.isLeaf) {

      // update tag
      const newId = - Math.random() * 100000;
      const tagToRemove: TbTag = {id: node.data.id, userId: this.userId, name: node.data.name, path: node.data.path, objectId: node.data.id};
      const newTag: TbTag = {id: newId, userId: this.userId, name: newName, path: node.data.path, objectId: newId};

      // update tag name
      node.data.name = newName;
      node.data.id = newId;

      this._removedTag.next(tagToRemove);
      this._newTag.next(newTag);
      }
    }
  }

  /**
  * Delete a tag
  * - First delete the tag
  * - Is success, remove tree node
  */
  deleteTag(node: TreeNode): void {
    if (node.children.length > 0) {
      this.log.emit({module: 'tb-tag-lib', type: 'warning', message_fr: `Vous ne pouvez pas supprimer un tag contenant d\'autres tags`});
      return;
    }

    if (this.objectId) {
      const tag: TbTag = {id: node.data.id, userId: node.data.userId, name: node.data.name, path: node.data.path, objectId: this.objectId};
      // delete object tag...
      this.tagService.removeTag(tag).subscribe(success => {
        // and then, remove node from tree
        const treeNodeToRemove: TreeNode = this.treeComponent.treeModel.getNodeById(node.data.id);
        const parentTreeNodeToRemove: TreeNode = treeNodeToRemove.parent;
        let i = 0;
        let j: number = null;
        parentTreeNodeToRemove.data.children.forEach(tntr => {
          if (tntr.id === node.data.id) { j = i; }
          i++;
        });
        if (j !== null) { parentTreeNodeToRemove.data.children.splice(j, 1); }
        this.treeComponent.treeModel.update();
        this.log.emit({module: 'tb-tag-lib', type: 'info', message_fr: `Le tag "${tag.name}" a bien été supprimé`});
      }, error => {
        this.httpError.next(error);
        this.log.emit({module: 'tb-tag-lib', type: 'error', message_fr: `Impossible de supprimer le tag "${tag.name}"`});
      });

      this.tagsHasChanged.emit(true);
    } else if (!this.objectId && this.noApiCall) {
      const tag: TbTag = {id: null, userId: node.data.userId, name: node.data.name, path: node.data.path, objectId: null};
      // remove tag from tree
      const treeNodeToRemove: TreeNode = this.treeComponent.treeModel.getNodeById(node.data.id);
      const parentTreeNodeToRemove: TreeNode = treeNodeToRemove.parent;
      let i = 0;
      let j: number = null;
      parentTreeNodeToRemove.data.children.forEach(tntr => {
        if (tntr.id === node.data.id) { j = i; }
        i++;
      });
      if (j !== null) { parentTreeNodeToRemove.data.children.splice(j, 1); }
      this.treeComponent.treeModel.update();
      // emit removed tag
      this._removedTag.next(tag);
    }
  }

  /**
  * Tag a tree node as 'isEditing'
  */
  editTagName(node: TreeNode) {
    node.data.isEditing = true;
    this.treeComponent.treeModel.update();

    if (this.objectId && !this.noApiCall) { this.tagsHasChanged.emit(true); }
  }

  /**
  * Create a new tag
  */
  newTag(data: any) {
    let name: string;
    if (typeof(data) === 'object') {
      name = data.target.value;
    } else {
      name = data;
    }
    if (this.objectId) {
      this.tagService.createTag(name, '/', this.userId, this.objectId).subscribe(tag => {
        this.treeService.growTree(tag.path, this.tree);
        this.treeService.placeTag(tag, this.tree);
        this.treeComponent.treeModel.update();
        const nodeToExpand: TreeNode = this.treeComponent.treeModel.getNodeById(tag.id);
        nodeToExpand.parent.expand();
        this.log.emit({module: 'tb-tag-lib', type: 'info', message_fr: `Le tag "${tag.name}" a bien été créé`});
      }, error => {
        this.httpError.next(error);
        this.log.emit({module: 'tb-tag-lib', type: 'error', message_fr: `Impossible de créer le tag "${name}"`});
      });
      this.tagsHasChanged.emit(true);
      this.form.controls.tagInput.setValue('', {emitEvent: false});
    } else if (!this.objectId && this.noApiCall) {
      const tempId = - Math.random() * 100000;
      const tag: TbTag = {id: tempId, userId: this.userId, name: name, path: '/', objectId: tempId};
      this.treeService.growTree(tag.path, this.tree);
      this.treeService.placeTag(tag, this.tree);
      this.treeComponent.treeModel.update();
      const nodeToExpand: TreeNode = this.treeComponent.treeModel.getNodeById(tag.id);
      nodeToExpand.parent.expand();
      this._newTag.next(tag);
    }
  }

  /**
  * Create a new folder
  */
  newFolder(data: any) {
    let name: string;
    if (typeof(data) === 'object') {
      name = data.target.value;
    } else {
      name = data;
    }
    this.treeService.growTree('/' + name, this.tree);
    this.treeComponent.treeModel.update();
    this.form.controls.folderInput.setValue('', {emitEvent: false});
  }

  /**
  * Reset the tree of tags : insert basic tags and user's tags
  */
  resetTree(): void {
    this.tree = [];

    // get user's tags
    let tags: Array<TbTag>;
    this.tagService.getUserTags(this.userId).subscribe(result => {
      tags = result;
      if (tags.length > 0) {
        tags.forEach(tag => { this.treeService.growTree(tag.path, this.tree); });
        tags.forEach(tag => { this.treeService.placeTag(tag, this.tree); });
        this.treeComponent.treeModel.update();
        this.treeComponent.treeModel.expandAll();
        this.treeComponent.sizeChanged();
      }
    });
  }

  onInitialized(tree: TreeComponent) {
    // Expand nodes
    tree.treeModel.expandAll();
  }

  switchExpandedNode(node: TreeNode): void {
    node.isExpanded ? node.collapse() : node.expand();
  }

}
