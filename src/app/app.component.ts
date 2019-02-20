import { Component } from '@angular/core';

import { PhotoTag } from 'projects/tb-phototag-lib/src/lib/_models/phototag.model';
import { TbLog } from 'projects/tb-phototag-lib/src/lib/_models/tb-log.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  photoTags: Array<PhotoTag> = [
    {path: 'Plante', name: 'Feuille', id: -1, userId: null},
    {path: 'Plante', name: 'Tige', id: -2, userId: null},
    {path: 'Mes tags / Identiplante', name: 'Plantule', id: 1, userId: 123}
  ];

  log(log: TbLog) {
    if (log.type === 'info') {
      // tslint:disable-next-line:no-console
      console.info(log.message_fr);
    } else if (log.type === 'success') {
      console.log(log.message_fr);
    } else if (log.type === 'warning') {
      console.warn(log.message_fr);
    } else if (log.type === 'error') {
      console.error(log.message_fr);
    }
  }

  addTag(tagToAdd: PhotoTag): void {
    let alreadyExists = false;
    this.photoTags.forEach(_tag => {
      if (_tag === tagToAdd) { alreadyExists = true; }
    });
    if (!alreadyExists) {
      setTimeout(() => {
        this.photoTags.push(tagToAdd);
        console.log(this.photoTags);
      }, 1000);
    }
  }

  removeTag(tagToRemove: PhotoTag): void {
    console.log(tagToRemove);
    console.log(this.photoTags);
    let i = 0;
    this.photoTags.forEach(_tag => {
      if (_tag.id === tagToRemove.id && _tag.userId === tagToRemove.userId) { console.log('a'); this.photoTags.splice(i, 1); }
      i++;
    });
  }
}
