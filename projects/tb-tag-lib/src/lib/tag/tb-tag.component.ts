import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Observable } from 'rxjs';

import { TbLog } from '../_models/tb-log.model';
import { TbTag } from '../_models/tbtag.model';
import { TbTagService } from '../_services/tb-tag-lib.service';
import { TreeService } from '../_services/tb-tree.service';

import * as _ from 'lodash';

@Component({
  selector: 'tb-tag',
  templateUrl: './tb-tag.component.html',
  styleUrls: ['./tb-tag.component.scss']
})
export class TbTagComponent implements OnInit, OnChanges {
  //
  // INPUT / OUTPUT
  //
  @Input() userId: number;
  // @Input() objectId: number;
  @Input() set objectId(data: number) {
    this._objectId = data;
  }
  @Input() baseApiUrl = 'http://localhost:8000';
  @Input() noApiCall = false;
  @Input() objectName = 'photo';
  @Input() objectEndpoint = '/api/photos';
  @Input() tagName = 'photoTag';
  @Input() tagEndpoint = '/api/photo_tags';
  @Input() apiRelationPath = '/api/photo_photo_tag_relations';
  @Input() apiRetrievePath = '/api/photos/{id}/photo_tag_relations';
  @Input() apiTagsRelationsPath = '/api/photo_tags/{id}/photo_relations';
  @Input() set basicTags(data: Array<TbTag>) {
    this.basicTagsSet = true;
    this._basicTags = data;
    this.tagService.setBasicTags(data);
  }

  @Output() newTag = new EventEmitter<TbTag>();
  @Output() removedTag = new EventEmitter<TbTag>();
  @Output() log = new EventEmitter<TbLog>();
  @Output() httpError = new EventEmitter<any>();

  _basicTags: Array<TbTag> = [];
  _objectId: number;
  basicTagsByCategory: Array<Array<TbTag>> = [];
  basicTagsSet = false;
  userTags: Array<TbTag> = [];
  objTgs: Array<TbTag> = [];
  filteredUserTags: Observable<TbTag[]>;
  isLoadingBasicTags = false;
  isLoadingUsersTags = false;
  cantLoadUsersTags = false;
  showTree = false;

  constructor(
    private tagService: TbTagService,
    private treeService: TreeService,
    private fb: FormBuilder) { }

  ngOnInit() {
    // objectId provided ?
    if (!this._objectId && !this.noApiCall) {
      this.log.emit({module: 'tb-tag-lib', type: 'error', message_fr: 'Vous devez fournir un objectId pour initialiser le module'});
    }

    if (!this.basicTagsSet) { this.tagService.setBasicTags([]); }

    // Set API urls
    this.tagService.setBaseApiUrl(this.baseApiUrl);
    this.tagService.setApiRelationPath(this.apiRelationPath);
    this.tagService.setApiRetrievePath(this.apiRetrievePath);
    this.tagService.setApiTagsRelationsPath(this.apiTagsRelationsPath);
    this.tagService.setObjectName(this.objectName);
    this.tagService.setObjectEndpoint(this.objectEndpoint);
    this.tagService.setTagName(this.tagName);
    this.tagService.setTagEndpoint(this.tagEndpoint);
    // Set userId available
    this.treeService.setUserId(this.userId);

    // get object (ie photo) tags
    if (this._objectId) {
      this.getObjTags();
    }

    // Get tags
    this.getTags(this.userId);

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.objectId && changes.objectId.firstChange === false) {
      this.getObjTags();
    }
  }

  getObjTags(): void {
    this.tagService.getObjTags(this._objectId).subscribe(
      result => {
        this.objTgs = result['value'];
      },
      error => {
        this.httpError.next(error);
      }
    );
  }

  /**
   * Get basic and user's tags
   */
  getTags(userId: number): void {
    this.userTags = [];
    // Get basic tags
    this.isLoadingBasicTags = true;
    this.tagService.getBasicTags().subscribe(_tags => {
      this.log.emit({module: 'tb-tag-lib', type: 'info', message_fr: `Les tags par défaut ont bien été chargés`});
      this.isLoadingBasicTags = false;
      this.basicTags = _tags;
    }, error => {
      this.httpError.next(error);
      this.isLoadingBasicTags = false;
      this.log.emit({module: 'tb-tag-lib', type: 'error', message_fr: `Les tags par défaut n'ont pas pu être chargés`});
    });

    this.tagService.getBasicTagsByPath().subscribe(_tags => this.basicTagsByCategory = _tags);

    // Get user's tags
    this.isLoadingUsersTags = true;
    this.tagService.getUserTags(userId).subscribe(_tags => {
      this.log.emit({module: 'tb-tag-lib', type: 'info', message_fr: `Les tags utilisateurs ont bien été chargés`});
      this.isLoadingUsersTags = false;
      this.userTags = this.userTags.concat(_tags);
    }, error => {
      this.isLoadingUsersTags = false;
      this.cantLoadUsersTags = true;
      this.log.emit({module: 'tb-tag-lib', type: 'error', message_fr: `Les tags utilisateurs n'ont pas pu être chargés`});
    });
  }

  /**
   * When user select a tag, link it to the photo and emit the tag
   */
  linkTag(tag: TbTag): void {
    if (this._objectId && (!this.basicTagAlreadyUsed(tag) || !this.userTagAlreadyUsed(tag))) {
      tag.pending = true;
      this.tagService.linkTagToObject(tag.id, this._objectId).subscribe(
        success => {
          this.objTgs.push(tag);
          this.log.emit({module: 'tb-tag-lib', type: 'success', message_fr: `Le tag "${tag.name}" est ajouté à votre photo`});
          tag.pending = false;
        },
        error => {
          this.httpError.next(error);
          tag.pending = false;
          this.log.emit({module: 'tb-tag-lib', type: 'error', message_fr: `Impossible de lier le tag "${tag.name}" à votre photo`});
        }
      );
    } else if (!this._objectId && this.noApiCall) {
      this.objTgs.push(tag);
      this.newTag.next(tag);
    }
  }

  /**
   * When user unselect a tag, unlink it to the photo and emit the tag
   */
  unlinkTag(tag: TbTag): void {
    if (this._objectId) {
      tag.unlinking = true;
      this.tagService.unlinkTagToObject(tag.id, this._objectId).subscribe(
        success => {
          let i = 0;
          this.objTgs.forEach(objTag => {
            if (objTag.id === tag.id) { this.objTgs.splice(i, 1); }
            i++;
          });
          tag.unlinking = false;
        }, error => {
          this.httpError.next(error);
          tag.unlinking = false;
          this.log.emit({module: 'tb-tag-lib', type: 'error', message_fr: `Impossible de supprimer le lien entre le tag "${tag.name}" et votre photo`});
        }
      );
    } else if (!this._objectId && this.noApiCall) {
      let i = 0;
      this.objTgs.forEach(objTag => {
        if (objTag.name === tag.name && objTag.path === tag.path) { this.objTgs.splice(i, 1); }
        i++;
      });
      this.removedTag.next(tag);
    }
  }

  /**
   * When user select a basic tag, we create a new tag in db and then do the link
   */
  addBasicTag(tag: TbTag) {
    if (this.basicTagAlreadyUsed(tag)) { return; }
    tag.pending = true;
    tag.userId = this.userId;
    // is tag already exists ?
    let alreadyExistInDb = false;
    let tagToLink: TbTag = null;
    for (const uTag of this.userTags) {
      if (uTag.name === tag.name && uTag.path === tag.path) { alreadyExistInDb = true; tagToLink = uTag; }
    }

    if (this._objectId && alreadyExistInDb) {
      tag.pending = false;
      tagToLink.pending = true;
      // We only link the tag
      this.tagService.linkTagToObject(tagToLink.id, this._objectId).subscribe (
        success => {
          this.objTgs.push(tagToLink);
          tagToLink.pending = false;
        }, error => {
          this.httpError.next(error);
          tagToLink.pending = false;
          this.log.emit({module: 'tb-tag-lib', type: 'error', message_fr: `Impossible de lier le tag "${tag.name}" à votre photo`});
        }
      );
    } else if (this._objectId && !alreadyExistInDb) {
      // We first create the tag and the link it
      this.tagService.createTag(tag.name, tag.path, tag.userId, this._objectId).subscribe(
        successTag => {
          tag.pending = false;
          successTag.pending = true;
          this.userTags.push(successTag);
          // link
          this.tagService.linkTagToObject(successTag.id, this._objectId).subscribe(
            success => {
              this.objTgs.push(successTag);
              tag.pending = false;
              successTag.pending = false;
            },
            error => {
              this.httpError.next(error);
              successTag.pending = false;
              this.log.emit({module: 'tb-tag-lib', type: 'error', message_fr: `Impossible de lier le tag "${tag.name}" à votre photo`});
            }
          );
        }, error => {
          this.httpError.next(error);
          tag.pending = false;
          this.log.emit({module: 'tb-tag-lib', type: 'error', message_fr: `Impossible de créer le tag "${tag.name}"`});
        }
      );
    }
  }

  newTagFromTree(tag: TbTag) {
    // this.objTgs.push(tag);
    this.userTags.push(tag);
    this.newTag.next(tag);
  }

  removedTagFromTree() {
    this.getTags(this.userId);
  }

  toggleTree() {
    this.showTree = !this.showTree;
  }

  basicTagAlreadyUsed(tag: TbTag): boolean {
    if (this.objTgs.length > 0) {
      for (const _tag of this.objTgs) {
        if (tag.name === _tag.name && tag.path === _tag.path) { return true; }
      }
    }
    return false;
  }

  userTagAlreadyUsed(tag: TbTag): boolean {
    if (this.objTgs.length > 0) {
      for (const _tag of this.objTgs) {
        if (tag.id === _tag.id) { return true; }
      }
    }
    return false;
  }

  getColor(tag: TbTag) {
    if (this.basicTagAlreadyUsed(tag)) {
      return 'primary';
    } else {
      return 'none';
    }
  }

  treeComponentHttpError(error: any) {
    this.httpError.next(error);
  }

  getTagName(tag: TbTag): string {
    if (tag.name) {
      return tag.name;
    } else if (tag.path) {
      return _.last(_.split(tag.path, '/'));
    }
  }

  /**
   * Bind tag-tree logs
   */
  _log(logMessage: TbLog) {
    this.log.emit(logMessage);
  }

}
