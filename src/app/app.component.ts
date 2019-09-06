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
    { category: 'Organes' ,     name: 'Fleur', id: null, userId: null} ,
    { category: 'Organes' ,     name: 'Feuille', id: null, userId: null} ,
    { category: 'Organes' ,     name: 'Fruit', id: null, userId: null} ,
    { category: 'Organes' ,     name: 'Port', id: null, userId: null} ,
    { category: 'Organes' ,     name: 'Écorce', id: null, userId: null} ,
    { category: 'Organes' ,     name: 'Rameau', id: null, userId: null} ,
    { category: 'Organes' ,     name: 'Graine', id: null, userId: null} ,
    { category: 'Organes' ,     name: 'Bourgeon', id: null, userId: null} ,
    { category: 'Organes' ,     name: 'Cotylédon', id: null, userId: null} ,
    { category: 'Organes' ,     name: 'Organe souterrain', id: null, userId: null} ,
    { category: 'Photo' ,       name: 'Scan', id: null, userId: null} ,
    { category: 'Photo' ,       name: 'Planche', id: null, userId: null} ,
    { category: 'Photo' ,       name: 'Dessin', id: null, userId: null} ,
    { category: 'Morphologie' , name: 'Plantule', id: null, userId: null} ,
    { category: 'Morphologie' , name: 'Rosette', id: null, userId: null} ,
  ];

  linkTag(tag: TbTag): void {
    console.log('link tag: ', tag);
  }

  unlinkTag(tag: TbTag): void {
    console.log('unlink tag: ', tag);
  }

}
