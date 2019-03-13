import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TbTagLibModule } from 'tb-tag-lib';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    TbTagLibModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
