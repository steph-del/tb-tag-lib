import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule, MatAutocompleteModule, MatProgressSpinnerModule, MatChipsModule, MatIconModule, MatDialogModule, MatButtonModule, MatMenuModule } from '@angular/material';

import { TbPhototagTreeLibComponent } from './tree/tb-phototag-tree.component';
import { TbPhototagComponent } from './phototag/tb-phototag.component';
import { TreeModule } from 'angular-tree-component';

import { TreeService } from './_services/tb-tree.service';

@NgModule({
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    TreeModule.forRoot(),
    MatInputModule, MatAutocompleteModule, MatProgressSpinnerModule, MatChipsModule, MatIconModule, MatDialogModule, MatButtonModule, MatMenuModule
  ],
  declarations: [TbPhototagTreeLibComponent, TbPhototagComponent],
  exports: [TbPhototagTreeLibComponent, TbPhototagComponent]
})
export class TbPhototagLibModule {
  providers: [
    TreeService
  ];
}
