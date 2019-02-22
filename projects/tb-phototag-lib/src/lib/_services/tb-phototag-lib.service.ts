import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, mergeMap } from 'rxjs/operators';
import { PhotoTag } from '../_models/phototag.model';

@Injectable({
  providedIn: 'root'
})
export class TbPhototagLibService {

  baseApiUrl: string;
  apiPath = '/api/photo_tags';
  apiRelationPath = '/api/photo_photo_tag_relations';
  apiRetrievePath = '/api/photos/{id}/photo_tag_relations';
  obj1Name = 'photo';
  obj1 = '/api/photos';
  obj2Name = 'photoTag';
  obj2 = '/api/photo_tags';

  usersTags: Array<PhotoTag> = [];

  constructor(private http: HttpClient) { }

  public setBaseApiUrl(data): void {
    this.baseApiUrl = data;
  }

  public setApiPAth(value: string): void {
    this.apiPath = value;
  }

  public setApiRelationPath(value: string): void {
    this.apiRelationPath = value;
  }

  public setApiRetrievePath(value: string): void {
    this.apiRetrievePath = value;
  }

  public setObj1Name(value: string): void {
    this.obj1Name = value;
  }

  public setObj1(value: string): void {
    this.obj1 = value;
  }

  public setObj2Name(value: string): void {
    this.obj2Name = value;
  }

  public setObj2(value: string): void {
    this.obj2 = value;
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

  getPhotoTags(photoId: number): Observable<any> {
    const headers = {
      'content-type': 'application/ld+json',
      'accept': 'application/json'
    };

    return this.http.get(`${this.baseApiUrl}${this.apiRetrievePath.replace('{id', photoId.toString())}`, {headers})
    .pipe(
      map(results => results as Array<any>),
      map(results => {
        const tags = [];
        for (const result of results) {
          tags.push(result[this.obj2Name]);
        }
        return of(tags);
      })
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

  linkTagToPhoto(tagId: number, photoId: number): Observable<any> {
    const headers = {
      'content-type': 'application/ld+json',
      'accept': 'application/json'
    };
    return this.http.post(`${this.baseApiUrl}${this.apiRelationPath}`, {[this.obj1Name]: `${this.obj1}/${photoId}`, [this.obj2Name]: `${this.obj2}/${tagId}`}, {headers});
  }

  unlinkTagToPhoto(tagId: number, photoId: number): Observable<any> {
    const headers = {
      'content-type': 'application/ld+json',
      'accept': 'application/json'
    };

    return this.http.get(`${this.baseApiUrl}${this.apiRetrievePath.replace('{id}', photoId.toString())}`, {headers})
      .pipe(
        map(r => r as Array<any>),
        map(r => {
          if (r.length > 0) {
            const relations = r;
            for (const relation of relations) {
              if (relation[this.obj2Name]['id'] === tagId) {
                // We get the relation id between photoId and tagId
                return of(relation['id']);
              }
            }
          } else {
            // no relation found
            return of(null);
          }
        }),
        mergeMap(relationId => {
          if (relationId['value'] === null) {
            throw new Error;
          } else {
            return this.http.delete(`${this.baseApiUrl}${this.apiRelationPath}/${relationId['value']}`);
          }
        })
      );
  }
}
