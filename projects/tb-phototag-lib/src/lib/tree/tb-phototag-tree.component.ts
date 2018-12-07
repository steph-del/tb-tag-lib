import { Component, OnInit, ViewChild, EventEmitter, Output, Input } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { TreeComponent, TreeNode } from 'angular-tree-component';

import { TbLog } from '../_models/tb-log.model';
import { TreeItem } from '../_models/tree-item.model';
import { PhotoTag } from '../_models/phototag.model';

import { TreeService } from '../_services/tb-tree.service';
import { TbPhototagLibService } from '../_services/tb-phototag-lib.service';

@Component({
  selector: 'tb-phototag-tree',
  templateUrl: './tb-phototag-tree.component.html',
  styleUrls: ['./tb-phototag-tree.component.scss']
})
export class TbPhototagTreeLibComponent implements OnInit {
  @ViewChild('treeComponent') private treeComponent: TreeComponent;

  //
  // INPUT / OUTPUT
  //
  @Input() photoId: number;
  @Output() log = new EventEmitter<TbLog>();
  @Output() tagsHasChanged = new EventEmitter<boolean>();

  //
  // VARIABLES
  //
  userId: number;
  form: FormGroup;
  tree: Array<TreeItem> = [];
  tags: Array<PhotoTag> = [];
  basicTags: Array<PhotoTag> = [];
  userTags: Array<PhotoTag> = [];

  // tree option
  options = {
    allowDrag: true,
    allowDrop: (element, {parent, index}) => this._allowDrop(element, {parent, index}),
    useCheckbox: false
  };

  //
  // CODE
  //

  constructor(private treeService: TreeService, private phototagService: TbPhototagLibService, private fb: FormBuilder) { }

  ngOnInit() {
    this.userId = this.treeService.userId;
    this.resetTree(this.userId);

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
    if (movedNode.isFolder) {
      // update all paths
      this.phototagService.rewriteTagsPaths(movedNode.path + ' / ' + movedNode.name, movedInto.path + ' / ' + movedInto.name + ' / ' + movedNode.name);
    } else if (movedNode.isLeaf) {
      // update movedNode path
      const newPath = movedInto.path === '' ? movedInto.name : movedInto.path + ' / ' + movedInto.name;
      // update node
      this.phototagService.updateTag({id: movedNode.id, userId: this.userId, name: movedNode.name, path: newPath, photoId: this.photoId})
      .subscribe(result => {
        this.log.emit({module: 'tb-phototag-lib', type: 'info', message_fr: `Le tag ${movedNode.name} a bien été déplacé et enregistré`});
      }, error => {
        // @todo undo change
        this.log.emit({module: 'tb-phototag-lib', type: 'error', message_fr: `Le tag ${movedNode.name} n'a pas pu être déplacé et enregistré`});
      });
    }

    this.tagsHasChanged.emit(true);
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
    // @todo emit renamed tag (old + new names + tag id) (could be linked to other photos)
    node.data.isEditing = false;
    newName = newName.trim();
    newName = newName.replace(/\s\s+/g, ' '); // repalce multi spaces

    if (node.data.isFolder) {
      // update tag all leaves tags inside the folder
      this.phototagService.rewriteTagsPaths(node.data.path + ' / ' + node.data.name, node.data.path + ' / ' + newName);
      // update node name
      node.data.name = newName;
    } else if (node.data.isLeaf) {
      // update tag
      const tag: PhotoTag = {id: node.data.id, userId: node.data.userId, path: node.data.path, name: newName, photoId: this.photoId};
      this.phototagService.updateTag(tag).subscribe(resultTag => {
        this.log.emit({module: 'tb-phototag-lib', type: 'info', message_fr: `Le tag ${tag.name} a bien été enregistré`});
        node.data.name = newName;
      }, error => {
        this.log.emit({module: 'tb-phototag-lib', type: 'error', message_fr: `Le tag ${tag.name} n'a pas pu être enregistré`});
      });
    }

    this.tagsHasChanged.emit(true);
  }

  /**
  * Delete a tag
  * - First delete the tag
  * - Is success, remove tree node
  */
  deleteTag(node: TreeNode): void {
    if (node.children.length > 0) {
      this.log.emit({module: 'tb-phototag-lib', type: 'warning', message_fr: `Vous ne pouvez pas supprimer un tag contenant d\'autres tags`});
      return;
    }

    const tag: PhotoTag = {id: node.data.id, userId: node.data.userId, name: node.data.name, path: node.data.path, photoId: this.photoId};
    // delete photo tag...
    this.phototagService.removeTag(tag).subscribe(success => {
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
      this.log.emit({module: 'tb-phototag-lib', type: 'info', message_fr: `Le tag ${tag.name} a bien été supprimé`});
    }, error => {
      this.log.emit({module: 'tb-phototag-lib', type: 'error', message_fr: `Impossible de supprimer le tag ${tag.name}`});
    });

    this.tagsHasChanged.emit(true);
  }

  /**
  * Tag a tree node as 'isEditing'
  */
  editTagName(node: TreeNode) {
    node.data.isEditing = true;
    this.treeComponent.treeModel.update();

    this.tagsHasChanged.emit(true);
  }

  /**
  * Create a new tag
  */
  newTag(event: any) {
    const name = event.target.value;
    this.phototagService.createTag(name, 'Mes tags', this.userId, this.photoId).subscribe(tag => {
      this.treeService.growTree(tag.path, this.tree);
      this.treeService.placeTag(tag, this.tree);
      this.treeComponent.treeModel.update();
      const nodeToExpand: TreeNode = this.treeComponent.treeModel.getNodeById(tag.id);
      nodeToExpand.parent.expand();
      this.log.emit({module: 'tb-phototag-lib', type: 'info', message_fr: `Le tag ${tag.name} a bien été créé`});
    }, error => {
      this.log.emit({module: 'tb-phototag-lib', type: 'error', message_fr: `Impossible de créer le tag ${event.target.value}`});
    });
    this.tagsHasChanged.emit(true);
    this.form.controls.tagInput.setValue('', {emitEvent: false});
  }

  /**
  * Create a new folder
  */
  newFolder(event: any) {
    const name = event.target.value;
    this.treeService.growTree(name, this.tree);
    this.treeComponent.treeModel.update();
    this.form.controls.folderInput.setValue('', {emitEvent: false});
  }

  /**
  * Reset the tree of tags : insert basic tags and user's tags
  */
  resetTree(userId: number): void {
    this.tree = [];

    // get user's tags
    let tags: Array<PhotoTag>;
    this.phototagService.getUserTags(this.userId).subscribe(result => {
      tags = result;
      if (tags.length > 0) {
        tags.forEach(tag => { this.treeService.growTree(tag.path, this.tree); });
        tags.forEach(tag => { this.treeService.placeTag(tag, this.tree); });
      }
    });
  }

}
