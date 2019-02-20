import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Observable } from 'rxjs';

import { TbLog } from '../_models/tb-log.model';
import { PhotoTag } from '../_models/phototag.model';
import { TbPhototagLibService } from '../_services/tb-phototag-lib.service';
import { TreeService } from '../_services/tb-tree.service';

@Component({
  selector: 'tb-phototag',
  templateUrl: './tb-phototag.component.html',
  styleUrls: ['./tb-phototag.component.scss']
})
export class TbPhototagComponent implements OnInit {
  //
  // INPUT / OUTPUT
  //
  @Input() userId: number;
  @Input() photoId: number;
  @Input() photoTags: Array<PhotoTag> = [];
  @Input() baseApiUrl = 'http://localhost:8000';

  @Output() log = new EventEmitter<TbLog>();
  @Output() newTag = new EventEmitter<PhotoTag>();
  @Output() tagToRemove = new EventEmitter<PhotoTag>();

  basicTags: Array<PhotoTag> = [];
  userTags: Array<PhotoTag> = [];
  filteredUserTags: Observable<PhotoTag[]>;
  isLoadingBasicTags = false;
  isLoadingUsersTags = false;
  cantLoadUsersTags = false;
  showTree = false;

  constructor(
    private phototagService: TbPhototagLibService,
    private treeService: TreeService,
    private fb: FormBuilder) { }

  ngOnInit() {
    // Set baseApiUrl
    this.phototagService.setBaseApiUrl(this.baseApiUrl);
    // Set userId available
    this.treeService.setUserId(this.userId);

    // Get tags
    this.getTags(this.userId);

  }

  /**
   * Get basic and user's tags
   */
  getTags(userId: number): void {
    this.userTags = [];

    // Get basic tags
    this.isLoadingBasicTags = true;
    this.phototagService.getBasicTags().subscribe(_tags => {
      this.log.emit({module: 'tb-phototag-lib', type: 'info', message_fr: `Les tags par défaut ont bien été chargés`});
      this.isLoadingBasicTags = false;
      this.basicTags = _tags;
    }, error => {
      this.isLoadingBasicTags = false;
      this.log.emit({module: 'tb-phototag-lib', type: 'error', message_fr: `Les tags par défaut n'ont pas pu être chargés`});
    });

    // Get user's tags
    this.isLoadingUsersTags = true;
    this.phototagService.getUserTags(userId).subscribe(_tags => {
      this.log.emit({module: 'tb-phototag-lib', type: 'info', message_fr: `Les tags utilisateurs ont bien été chargés`});
      this.isLoadingUsersTags = false;
      this.userTags = this.userTags.concat(_tags);
    }, error => {
      this.isLoadingUsersTags = false;
      this.cantLoadUsersTags = true;
      this.log.emit({module: 'tb-phototag-lib', type: 'error', message_fr: `Les tags utilisateurs n'ont pas pu être chargés`});
    });
  }

  /**
   * When user select a tag, emit it
   */
  addTag(tag: PhotoTag): void {
    if (!this.basicTagAlreadyUsed(tag) || !this.userTagAlreadyUsed(tag)) {
      tag.pending = true;
      setTimeout(() => {
        tag.pending = false;
      }, 1000);
      this.newTag.emit(tag);
      this.log.emit({module: 'tb-phototag-lib', type: 'success', message_fr: `Le tag "${tag.name}" est ajouté à votre photo`});
    }
  }

  toggleTree() {
    this.showTree = !this.showTree;
  }

  basicTagAlreadyUsed(tag: PhotoTag): boolean {
    if (this.photoTags.length > 0) {
      for (const _tag of this.photoTags) {
        if (tag.name === _tag.name) { return true; }
      }
    }
    return false;
  }

  userTagAlreadyUsed(tag: PhotoTag): boolean {
    if (this.photoTags.length > 0) {
      for (const _tag of this.photoTags) {
        if (tag.id === _tag.id) { return true; }
      }
    }
    return false;
  }

  removeBasicTag(tag: PhotoTag) {
    this.tagToRemove.emit(tag);
  }

  removeUserTag(tag: PhotoTag) {
    this.tagToRemove.emit(tag);
  }

  getColor(tag: PhotoTag) {
    if (this.basicTagAlreadyUsed(tag)) {
      return 'primary';
    } else {
      return 'none';
    }
  }

  /**
   * Bind phototag-tree logs
   */
  _log(logMessage: TbLog) {
    this.log.emit(logMessage);
  }

}
