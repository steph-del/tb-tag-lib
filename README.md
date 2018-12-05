# TbPhototagLibApp

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.0.8.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).


INSTALLATION : 
Ajouter le module angular-tree-component aux dépendances
Ajouter les imports css :
- @import "~@angular/material/prebuilt-themes/deeppurple-amber.css";
- @import '~angular-tree-component/dist/angular-tree-component.css';
Ajouter les icones material :
- <link href="https://fonts.googleapis.com/icon?family=Material+Icons" el="stylesheet"> dans index.html
- Ajouter le style suivant au niveau de l'app principale, après l'insertion d'`angular-tree-component.css` (désolé !)
```.node-content-wrapper {
  width: 100%;
  font-size: 16px;
}```