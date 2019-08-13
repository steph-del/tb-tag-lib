import { Component } from '@angular/core';

import { TbTag } from 'projects/tb-tag-lib/src/lib/_models/tbtag.model';
import { TbLog } from 'projects/tb-tag-lib/src/lib/_models/tb-log.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  tagObjectId = 10;
  enabled = true;

  public basicTags = [
    { id: null, userId: 22, name: 'feuille',             path: '/'},
    { id: null, userId: 22, name: 'Projets coopératifs', path: '/'},
    { id: null, userId: 22, name: 'Sauvages',            path: '/projets cooperatifs/'},
    { id: null, userId: 22, name: 'aDeterminer',         path: '/'},
    { id: null, userId: 22, name: 'WidgetSaisie',        path: '/projets cooperatifs/'},
    { id: null, userId: 22, name: 'Pollinisation',       path: '/'},
  ];

}
