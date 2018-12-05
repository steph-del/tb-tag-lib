import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TbPhototagLibModule } from 'tb-phototag-lib';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    TbPhototagLibModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
