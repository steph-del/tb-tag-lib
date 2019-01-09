import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PhotoTag } from '../_models/phototag.model';

@Injectable({
  providedIn: 'root'
})
export class TbPhototagLibService {

  fakeUserTags: Array<PhotoTag> = [
    {path: 'Mes tags / Identiplante', name: 'Plantule', id: 5, userId: 123, photoId: 123456},
    {path: 'Mes tags / Identiplante', name: 'Rosette', id: 6, userId: 123, photoId: 123456},
    {path: 'Mes tags / Identiplante / Sauvage', name: 'Vert clair', id: 7, userId: 123, photoId: 123456},
    {path: 'Mes tags / Identiplante / Sauvage', name: 'Vert foncé', id: 8, userId: 123, photoId: 123456}
  ];

  constructor() { }

  getBasicTags(): Observable<Array<PhotoTag>> {
    const tags = [
      {path: 'Plante', name: 'Feuille', id: 1, userId: null},
      {path: 'Plante', name: 'Tige', id: 2, userId: null},
      {path: 'Plante', name: 'Fleur', id: 3, userId: null},
      {path: 'Plante', name: 'Ecorce', id: 4, userId: null}
    ];
    return of(tags);
  }

  getUserTags(userId: number): Observable<Array<PhotoTag>> {
    // Call API and get user's tags
    return of(this.fakeUserTags);
  }

  removeTag(tag: PhotoTag): Observable<{success: boolean}> {
    // call API
    let i = 0;
    this.fakeUserTags.forEach(_tag => {
      if (_tag.id === tag.id) {
        this.fakeUserTags.splice(i, 1);
        return of({success: true });
      }
      i++;
    });
    return of({ success: false });
  }

  updateTag(tag: PhotoTag): Observable<PhotoTag> {
    // update existing tag through API
    // call API...
    let i = 0;
    this.fakeUserTags.forEach(_tag => {
      if (_tag.id === tag.id) { this.fakeUserTags[i] = tag; }
      i++;
    });
    // const response = tag;
    return of(tag);
    // return throwError(tag); // test : throw an error
  }

  /**
   * When a folder is renamed, all children tags must be updated
   */
  rewriteTagsPaths(path: string, newPath: string): void {
    this.fakeUserTags.forEach(tagMayBeUpdated => {
      if (tagMayBeUpdated.path === path) {
        tagMayBeUpdated.path = newPath;
        this.updateTag(tagMayBeUpdated);
      }
    });
  }

  createTag(name, path, userId, photoId): Observable<PhotoTag> {
    // Call API
    // Next line for dev only / When API will be connected, user's tag will be correcly retrieved from server
    const id = Math.floor(Math.random() * 10000 + 100);
    this.fakeUserTags.push({id: id, userId: userId, name: name, path: path, photoId: photoId});
    return of({id: id, userId: userId, name: name, path: path, photoId: photoId});
  }
}
