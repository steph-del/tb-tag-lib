import { Injectable } from '@angular/core';

import { TreeItem } from '../_models/tree-item.model';
import { TbTag } from '../_models/tbtag.model';

@Injectable({
  providedIn: 'root'
})
export class TreeService {

  public userId: number;
  public tree: any;
  public flatTree: any;

  constructor() { }

  setUserId(id: number): void {
    this.userId = id;
  }

}
