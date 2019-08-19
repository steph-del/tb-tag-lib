import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule, MatAutocompleteModule, MatProgressSpinnerModule, MatChipsModule, MatIconModule,
         MatDialogModule, MatButtonModule, MatMenuModule, MatSnackBarModule, MatTooltipModule,
         MatCheckboxModule, MatFormFieldModule, MatTreeModule, MatListModule, MatCardModule } from '@angular/material';

import { TbTagComponent } from './tag/tb-tag.component';
import { TreeModule } from 'angular-tree-component';

import { UnslashPipe } from './_pipes/unslash.pipe';

@NgModule({
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    TreeModule.forRoot(),
    MatInputModule, MatAutocompleteModule, MatProgressSpinnerModule, MatChipsModule, MatIconModule, MatDialogModule,
    MatButtonModule, MatMenuModule, MatSnackBarModule, MatCheckboxModule, MatFormFieldModule, MatTreeModule, MatListModule,
    MatCardModule, MatTooltipModule
  ],
  declarations: [TbTagComponent, UnslashPipe],
  exports: [TbTagComponent]
})
export class TbTagLibModule { }
