import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

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
  @ViewChild('input') input: ElementRef<HTMLInputElement>;

  //
  // INPUT / OUTPUT
  //
  @Input() userId: number;
  @Input() photoId: number;
  @Input() photoTags: Array<PhotoTag> = [];

  @Output() log = new EventEmitter<TbLog>();
  @Output() newTag = new EventEmitter<PhotoTag>();

  form: FormGroup;
  basicTags: Array<PhotoTag> = [];
  userTags: Array<PhotoTag> = [];
  filteredUserTags: Observable<PhotoTag[]>;
  selectedTags: Array<PhotoTag> = [];
  isLoadingTags = false;
  showTree = false;

  constructor(
    private phototagService: TbPhototagLibService,
    private treeService: TreeService,
    private fb: FormBuilder) { }

  ngOnInit() {
    // Set userId available
    this.treeService.setUserId(this.userId);

    // Create form
    this.form = this.fb.group({
      tagInput: this.fb.control('')
    });

    // Get tags
    this.getTags(this.userId);

  }

  /**
   * Get basic and user's tags
   */
  getTags(userId: number): void {
    this.userTags = [];

    // Get basic tags
    this.isLoadingTags = true;
    this.phototagService.getBasicTags().subscribe(_tags => {
      this.log.emit({module: 'tb-phototag-lib', type: 'info', message_fr: `Les tags par défaut ont bien été chargés`});
      this.isLoadingTags = false;
      this.basicTags = _tags;
    }, error => {
      this.isLoadingTags = false;
      this.log.emit({module: 'tb-phototag-lib', type: 'error', message_fr: `Les tags par défaut n'ont pas pu être chargés`});
    });

    // Get user's tags
    this.phototagService.getUserTags(userId).subscribe(_tags => {
      this.log.emit({module: 'tb-phototag-lib', type: 'info', message_fr: `Les tags utilisateurs ont bien été chargés`});
      this.isLoadingTags = false;
      this.userTags = this.userTags.concat(_tags);
    }, error => {
      this.isLoadingTags = false;
      this.log.emit({module: 'tb-phototag-lib', type: 'error', message_fr: `Les tags utilisateurs n'ont pas pu être chargés`});
    });
    // Set input to '' --> emit event --> filter available tags
    this.form.controls.tagInput.setValue('');
  }

  /**
   * When user select a tag, emit it
   */
  addTag(tag: PhotoTag): void {
    if (!this.basicTagAlreadyUsed(tag) || !this.userTagAlreadyUsed(tag)) {
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

  /**
   * Bind phototag-tree logs
   */
  _log(logMessage: TbLog) {
    this.log.emit(logMessage);
  }

}
