import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { PhotoTag } from '../_models/phototag.model';

@Injectable({
  providedIn: 'root'
})
export class TbPhototagLibService {

  baseApiUrl: string;
  apiPath = '/api/photo_tags';

  usersTags: Array<PhotoTag> = [];

  constructor(private http: HttpClient) { }

  public setBaseApiUrl(data): void {
    this.baseApiUrl = data;
  }

  public setUsersTags(tags: Array<PhotoTag>): void {
    this.usersTags = tags;
  }

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
    return this.http.get(`${this.baseApiUrl}${this.apiPath}.json`).pipe(
      map(r => <Array<PhotoTag>>r),
      tap(r => this.setUsersTags(r))
    );
  }

  removeTag(tag: PhotoTag): Observable<{success: boolean}> {
    // call API
    let i = 0;
    this.usersTags.forEach(_tag => {
      if (_tag.id === tag.id) {
        this.usersTags.splice(i, 1);
        return of({success: true });
      }
      i++;
    });
    return of({ success: false });
  }

  updateTag(tag: PhotoTag): Observable<any> {
    // update existing tag through API
    return this.http.patch(`${this.baseApiUrl}${this.apiPath}/${tag.id}`, {name: tag.name, path: tag.path});
  }

  /**
   * When a folder is renamed, all children tags must be updated
   */
  rewriteTagsPaths(path: string, newPath: string): void {
    this.usersTags.forEach(tagMayBeUpdated => {
      if (tagMayBeUpdated.path === path) {
        tagMayBeUpdated.path = newPath;
        this.updateTag(tagMayBeUpdated).subscribe(
          success => { /* cool */ },
          error => {
            // Can't do anything inside the service !
           }
        );
      }
    });
  }

  createTag(name: string, path: string, userId: number, photoId: number): Observable<any> {
    // Call API
    return this.http.post(`${this.baseApiUrl}${this.apiPath}`, {name: name, path: path, userId: userId});

  }
}
