import { Component, OnInit, OnDestroy, ViewChild, EventEmitter, Output, Input, Inject } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { TreeComponent, TreeNode } from 'angular-tree-component';

import { TbLog } from '../_models/tb-log.model';
import { TreeItem } from '../_models/tree-item.model';
import { TbTag } from '../_models/tbtag.model';

import { TreeService } from '../_services/tb-tree.service';
import { TbTagService } from '../_services/tb-tag-lib.service';

import {MatSnackBar} from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';

import { Subscription } from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'tb-tag-tree',
  templateUrl: './tb-tag-tree.component.html',
  styleUrls: ['./tb-tag-tree.component.scss']
})
export class TbTagTreeComponent implements OnInit {

  constructor() { }

  ngOnInit() { }
}
