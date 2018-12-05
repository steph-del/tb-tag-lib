import { Injectable } from '@angular/core';

import { TreeItem } from '../_models/tree-item.model';
import { PhotoTag } from '../_models/phototag.model';

@Injectable({
  providedIn: 'root'
})
export class TreeService {

  public userId: number;

  constructor() { }

  setUserId(id: number): void {
    this.userId = id;
  }

  /**
  * Make tree. Path can be added at any time
  */
  growTree(path: string, tree: Array<any>, _isEditable: boolean = true): any {
    // replace several spaces
    path = path.replace(/\s\s+/g, ' ');
    path = path.replace(' / ', '/');

    // get separate path tags
    const tagsArray = path.split('/');

    // max depth = 4
    if (tagsArray.length > 4) {
      return;
    }
    const _tree: Array<any> = tree;
    let _parentTags = '';

    let i0: number = _tree.length;
    let i1 = 0;
    let i2 = 0;
    let i3 = 0;
    let j = 0;
    let k = 0;
    let l = 0;

    for (let i = 0 ; i < tagsArray.length ; i++) {
      let _tag = tagsArray[i];
      // remove first and last space, if present
      _tag = _tag.indexOf(' ') === 0 ? _tag.substring(1) : _tag;
      _tag = _tag.indexOf(' ') === _tag.length - 1 ? _tag.substring(0, _tag.length - 1) : _tag;
      tagsArray[i] = _tag;

      //
      const _type = 'folder';

      // first tag (-> no parent tags)
      if (i === 0) {
        _parentTags = '';
      // NOT first tag and parent tags not set
      } else if (i > 0 && _parentTags === '') {
        _parentTags = tagsArray[i - 1];
      // NOT first tag and parent tags already set
      } else if (i > 0 && _parentTags !== '') {
        _parentTags = _parentTags + ' / ' + tagsArray[i - 1];
      }


      // first tag level
      if (i === 0) {
        let found = false;
        _tree.forEach(treeItem => {
          if (treeItem.name === tagsArray[0]) { i0 = j; found = true; }
          j++;
        });
        if (found === false) {
          i0 = j;
          _tree[i0] = { path: _parentTags, isFolder: true, isLeaf: false, isEditing: false, isEditable: _isEditable, name: _tag, level: i, children: [] };
        }

      // second tag level
      } else if (i === 1) {
        let found = false;
        if (_tree[i0].children.length === 0) {
          /* do nothing */
        } else {
          _tree[i0].children.forEach(treeItem => {
            if (treeItem.name === tagsArray[i]) { i1 = k; found = true; }
            k++;
          });
        }
        if (found === false) {
          i1 = k;
          _tree[i0].children.push(
            { path: _parentTags, isFolder: true, isLeaf: false, isEditing: false, isEditable: _isEditable, name: _tag, level: i, children: []}
          );
        }

      // third tag level
      } else if (i === 2) {
        let found = false;
        if (_tree[i0].children[i1].length === 0) {
          /* do nothing */
        } else {
          _tree[i0].children[i1].children.forEach(treeItem => {
            if (treeItem.name === tagsArray[i]) { i2 = l; found = true; }
            l++;
          });
        }
        if (found === false) {
          i2 = l;
          _tree[i0].children[i1].children.push(
            { path: _parentTags, isFolder: true, isLeaf: false, isEditing: false, isEditable: _isEditable, name: _tag, level: i, children: []}
          );
        }

      // fourth tag level
      } else if (i === 3) {
        let found = false;
        if (_tree[i0].children[i1].children[i2].children.length === 0) {
          /* do nothing */
        } else {
          _tree[i0].children[i1].children[i2].children.forEach(treeItem => {
            if (treeItem.name === tagsArray[i]) { i3 = k; found = true; }
            k++;
          });
        }
        if (found === false) {
          _tree[i0].children[i1].children[i2].children.push(
            { path: _parentTags, isFolder: true, isLeaf: false, isEditing: false, isEditable: _isEditable, name: _tag, level: i, children: []}
          );
        }
      }
    // end for
    }
    return _tree;
  }

  /**
  * Add a tag into the tree
  */
  placeTag(tag: PhotoTag, tree: Array<any>, _isEditable: boolean = true): any {
    let path: string = tag.path;
    let tagName: string = tag.name;

    // replace several spaces
    path = path.replace(/\s\s+/g, ' ');
    path = path.replace(' / ', '/');
    tagName = tagName.replace(/\s\s+/g, ' ').trim();

    // get separate path tags
    const tagsArray = path.split('/');
    for (let i = 0; i < tagsArray.length; i++) {
      tagsArray[i] = tagsArray[i].trim();
    }

    // max depth = 4
    if (tagsArray.length > 3) {
      return;
    }

    let i0: number = null;
    let i1: number = null;
    let i2: number = null;
    let i3: number = null;

    for (let i = 0 ; i < tagsArray.length ; i++) {
      if (i === 0) {
        for (let j = 0 ; j < tree.length ; j++) {
          if (tagsArray[i] === tree[j].name) { i0 = j; }
        }
      }
      if (i === 1) {
        for (let j = 0 ; j < tree[i0].children.length ; j++ ) {
          if (tagsArray[i] === tree[i0].children[j].name) { i1 = j; }
        }
      }
      if (i === 2) {
        for (let j = 0 ; j < tree[i0].children[i1].children.length ; j++ ) {
          if (tagsArray[i] === tree[i0].children[i1].children[j].name) { i2 = j; }
        }
      }
      if (i === 3) {
        for (let j = 0 ; j < tree[i0].children[i1].children[i2].children.length ; j++ ) {
          if (tagsArray[i] === tree[i0].children[i1].children[i2].children[j].name) { i3 = j; }
        }
      }
    // end for
    }

    let ti: TreeItem;

    // if (i0 === null) { ti = tree[0]; }
    if (i0 !== null && i1 === null && i2 === null && i3 === null) { ti = tree[i0]; }
    if (i0 !== null && i1 !== null && i2 === null && i3 === null) { ti = tree[i0].children[i1]; }
    if (i0 !== null && i1 !== null && i2 !== null && i3 === null) { ti = tree[i0].children[i1].children[i2]; }
    if (i0 !== null && i1 !== null && i2 !== null && i3 !== null) { ti = tree[i0].children[i1].children[i2].children[i3]; }

    if (ti.path === '') {
      ti.children.push(
        {id: tag.id, userId: tag.userId, path: ti.name, isFolder: false, isLeaf: true, isEditing: false, isEditable: _isEditable, name: tagName, level: ti.level + 1, children: []}
      );
    } else {
      ti.children.push(
        {id: tag.id, userId: tag.userId, path: ti.path + ' / ' + ti.name, isFolder: false, isLeaf: true, isEditing: false, isEditable: _isEditable, name: tagName, level: ti.level + 1, children: []}
      );
    }

    return ti;
  }

}
