import { Component } from '@angular/core';
import { TbLog } from 'projects/tb-phototag-lib/src/lib/_models/tb-log.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  photoTags = [
    {path: 'Plante', name: 'Feuille', id: 1, userId: null},
    {path: 'Mes tags / Identiplante', name: 'Rosette', id: 6, userId: 123}
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

  tagToAdd(tag) {
    console.log(tag);
  }
}
