import { Component } from '@angular/core';

import { PhotoTag } from 'projects/tb-phototag-lib/src/lib/_models/phototag.model';
import { TbLog } from 'projects/tb-phototag-lib/src/lib/_models/tb-log.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

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
}
