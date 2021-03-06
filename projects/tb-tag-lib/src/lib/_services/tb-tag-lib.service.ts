import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { map, tap, mergeMap } from 'rxjs/operators';
import { TbTag } from '../_models/tbtag.model';

import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class TbTagService {

  baseApiUrl: string;
  apiRelationPath = '/api/photo_photo_tag_relations';
  apiRetrievePath = '/api/photos/{id}/photo_tag_relations';
  apiTagsRelationsPath = '/api/photo_tags/{id}/photo_relations';
  objectName = 'photo';
  objectEndpoint = '/api/photos';
  tagName = 'photoTag';
  tagEndpoint = '/api/photo_tags';

  public basicTags = [];
  public isPatchingPaths = false;

  usersTags: Array<TbTag> = [];

  treeMustBeUpdated = new Subject<boolean>();

  constructor(private http: HttpClient) { }

  public setBasicTags(data: Array<TbTag>) {
    this.basicTags = data;
  }

  public setBaseApiUrl(data): void {
    this.baseApiUrl = data;
  }

  public setApiRelationPath(value: string): void {
    this.apiRelationPath = value;
  }

  public setApiRetrievePath(value: string): void {
    this.apiRetrievePath = value;
  }

  public setApiTagsRelationsPath(value: string): void {
    this.apiTagsRelationsPath = value;
  }

  public setObjectName(value: string): void {
    this.objectName = value;
  }

  public setObjectEndpoint(value: string): void {
    this.objectEndpoint = value;
  }

  public setTagName(value: string): void {
    this.tagName = value;
  }

  public setTagEndpoint(value: string): void {
    this.tagEndpoint = value;
  }

  public setUsersTags(tags: Array<TbTag>): void {
    this.usersTags = tags;
  }

  getBasicTags(): Observable<Array<TbTag>> {
    return of(this.basicTags);
  }

  public getBasicTagsByPath() {
    const categories: Array<string> = this.getUniqueBasicTagsPaths();
    const response: any = [];
    let i = 0;
    categories.forEach(category => {
      response[i] = [];
      for (const bTag of this.basicTags) {
        if (bTag.path === category) {
          response[i].push(bTag);
        }
      }
      i++;
    });
    return of(response);
  }

  public getUniqueBasicTagsPaths() {
    const tagPaths: string[] = [];
    let i = 0;
    for (const tag of this.basicTags) {
      if (i === 0) {
        tagPaths.push(tag.path);
      } else {
        if (tagPaths.indexOf(tag.path) === -1) {
          tagPaths.push(tag.path);
        }
      }
      i++;
    }
    return tagPaths;
  }

  getUserTags(userId: number): Observable<Array<TbTag>> {
    // Call API and get user's tags
    return this.http.get(`${this.baseApiUrl}${this.tagEndpoint}.json`).pipe(
      map(r => <Array<TbTag>>r),
      tap(r => this.setUsersTags(r))
    );
  }

  getObjTags(objectId: number): Observable<any> {
    const headers = {
      'content-type': 'application/ld+json',
      'accept': 'application/json'
    };

    return this.http.get(`${this.baseApiUrl}${this.apiRetrievePath.replace('{id}', objectId.toString())}`, {headers})
    .pipe(
      map(results => results as Array<any>),
      map(results => {
        const tags = [];
        for (const result of results) {
          tags.push(result[this.tagName]);
        }
        return of(tags);
      })
    );
  }

  getTagsRelations(objectId: number): Observable<Array<any>> {
    const headers = {};
    return this.http.get<Array<any>>(`${this.baseApiUrl}${this.apiTagsRelationsPath.replace('{id}', objectId.toString())}.json`, {headers});
  }

  removeTag(tag: TbTag): Observable<any> {
    // call API
    return this.http.delete<any>(`${this.baseApiUrl}${this.tagEndpoint}/${tag.id}`);
  }

  updateTag(tag: TbTag): Observable<TbTag> {
    // update existing tag through API
    if (tag.name) {
      return this.http.patch<TbTag>(`${this.baseApiUrl}${this.tagEndpoint}/${tag.id}`, {name: tag.name, path: tag.path});
    } else {
      return this.http.patch<TbTag>(`${this.baseApiUrl}${this.tagEndpoint}/${tag.id}`, {path: tag.path});
    }
  }

  /**
   * When a folder is renamed, all children tags must be updated
   */
  rewriteTagsPaths(path: string, newPath: string): void {
    this.isPatchingPaths = true;
    let tagsToUpdateCount = 0;
    let updatedTags = 0;
    this.usersTags.forEach(tagMayBeUpdated => {
      if (tagMayBeUpdated.path === path) {
        tagsToUpdateCount++;
        tagMayBeUpdated.path = newPath;
        this.updateTag(tagMayBeUpdated).subscribe(
          success => {
            this.isPatchingPaths = false;
            updatedTags++;
            if (updatedTags === tagsToUpdateCount) {
              // reset tree
              this.treeMustBeUpdated.next(true);
            }
          },
          error => {
            this.isPatchingPaths = false;
            // Can't do anything inside the service !
           }
        );
      }
    });
  }

  createTag(name: string, path: string, userId: number, objectId: number): Observable<TbTag> {
    // Call API
    return this.http.post<TbTag>(`${this.baseApiUrl}${this.tagEndpoint}`, {name: name, path: path, userId: userId});
  }

  createFolder(path: string, userId: number, objectId: number): Observable<TbTag> {
    if (_.take(path)[0] !== '/') { path = '/' + path; }
    return this.http.post<TbTag>(`${this.baseApiUrl}${this.tagEndpoint}`, {path, userId: userId});
  }

  updateFolder(tag: TbTag): Observable<TbTag> {
    if (_.take(tag.path)[0] !== '/') { tag.path = '/' + tag.path; }
    return this.http.patch<TbTag>(`${this.baseApiUrl}${this.tagEndpoint}/${tag.id}`, {path: tag.path});
  }

  linkTagToObject(tagId: number, objectId: number): Observable<any> {
    const headers = {
      'content-type': 'application/ld+json',
      'accept': 'application/json'
    };
    return this.http.post(`${this.baseApiUrl}${this.apiRelationPath}`, {[this.objectName]: `${this.objectEndpoint}/${objectId}`, [this.tagName]: `${this.tagEndpoint}/${tagId}`}, {headers});
  }

  unlinkTagToObject(tagId: number, objectId: number): Observable<any> {
    const headers = {
      'content-type': 'application/ld+json',
      'accept': 'application/json'
    };

    return this.http.get(`${this.baseApiUrl}${this.apiRetrievePath.replace('{id}', objectId.toString())}`, {headers})
      .pipe(
        map(r => r as Array<any>),
        map(r => {
          if (r.length > 0) {
            const relations = r;
            for (const relation of relations) {
              if (relation[this.tagName]['id'] === tagId) {
                // We get the relation id between objectId and tagId
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
