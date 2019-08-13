import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject, BehaviorSubject } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { TbTag } from '../_models/tbtag.model';

import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class TbTagService {

  userId: number;
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

  usersTags = new BehaviorSubject<Array<TbTag>>([]);

  constructor(private http: HttpClient) { }

  public setBasicTags(data: Array<TbTag>) { this.basicTags = data; }
  public setBaseApiUrl(data): void { this.baseApiUrl = data; }
  public setApiRelationPath(value: string): void { this.apiRelationPath = value; }
  public setApiRetrievePath(value: string): void { this.apiRetrievePath = value; }
  public setApiTagsRelationsPath(value: string): void { this.apiTagsRelationsPath = value; }
  public setObjectName(value: string): void { this.objectName = value; }
  public setObjectEndpoint(value: string): void { this.objectEndpoint = value; }
  public setTagName(value: string): void { this.tagName = value; }
  public setTagEndpoint(value: string): void { this.tagEndpoint = value; }
  public setUsersTags(tags: Array<TbTag>): void { this.usersTags.next(tags); }
  public setUserId(userId: number): void { this.userId = userId; }

  getBasicTags(): Observable<Array<TbTag>> {
    if (this.basicTags) {
      return of(this.basicTags);
    } else {
      return of(null);
    }
  }

  getUserTags(userId: number): Observable<Array<TbTag>> {
    return this.http.get<Array<TbTag>>(`${this.baseApiUrl}${this.tagEndpoint}.json`).pipe(
      map(tags => this.cleanTags(tags))
    );
  }
  /*
  getUserTags(userId: number): Observable<Array<TbTag>> {

    const uTags =  [
      { id: 17, userId: 22, name: 'feuille',             path: '/'},
      { id: 18, userId: 22, name: 'Projets coopératifs', path: '/'},
      { id: 19, userId: 22, name: 'Sub2',                path: '/projets cooperatifs/'},
      { id: 13, userId: 22, name: 'Sauvages',            path: '/projets cooperatifs/sub2/'},
      { id: 14, userId: 22, name: 'aDeterminer',         path: '/'},
      { id: 15, userId: 22, name: 'WidgetSaisie',        path: '/projets cooperatifs/'},
      { id: 16, userId: 22, name: 'Sub 3',               path: '/projets cooperatifs/sub2/'},
      { id: 17, userId: 22, name: 'Pollinisation',       path: '/projets cooperatifs/sub2/sub 3/'},
    ];
    this.usersTags.next(this.cleanTags(uTags));
  }
  */

  // *******
  // TAGS...
  // *******
  /**
   * Replace path values with accents and majuscules
   */
  cleanTags(tags: Array<TbTag>): Array<TbTag> {
    const names = tags.map(t => t.name);
    const paths = tags.map(t => t.path.split('/')).filter(el => !this.isEmptyArray(el)).map(a => this.removeEmptyStringInArray(a));
    const uniquPaths = this.flattenStringArray(paths).filter((v, i, a) => a.indexOf(v) === i); // filter removes duplicate entries

    let namesTable: Array<[string, string]>;
    for (const n of names) {
      if (namesTable && namesTable.length > 0) { namesTable.push([n, this.removeAccentAndUpperCase(n)]); } else { namesTable = [[n, this.removeAccentAndUpperCase(n)]]; }
    }

    for (const item of tags) {
      for (const name of namesTable) {
        if (item.path.indexOf(name[1]) !== -1) { item.path = item.path.replace(name[1], name[0]); }
      }
    }

    return tags;
  }

  private isEmptyArray(array: Array<string>): boolean {
    for (const item of array) {
      if (item !== '') { return false; }
    }
    return true;
  }

  private removeEmptyStringInArray(array: Array<string>): Array<string> {
    const responseArray: Array<string> = [];
    for (const item of array) {
      if (item !== '') { responseArray.push(item); }
    }
    return responseArray;
  }

  private flattenStringArray(array: Array<Array<string>>): Array<string> {
    const responseArray: Array<string> = [];
    for (const items of array) {
      for (const item of items) {
        responseArray.push(item);
      }
    }
    return responseArray;
  }

  private removeAccentAndUpperCase(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  // *********
  // TREE CRUD
  // *********

  /**
   * Build a nested tree structure object from simple tags with inline 'path' and 'name' data
   * @param tags an array of TbTag objects
   */
  buildTree(_tags: Array<TbTag>): Array<TbTag> {
    const tags = _.cloneDeep(_tags);

    // Set tag depth
    for (const tag of tags) { tag.depth = tag.path.split('/').filter(t => t !== '').length; }

    // Group tags by depth
    const tagsGroupedByLength = _.groupBy(tags, 'depth');

    // Result init
    const resultTags: Array<TbTag> = [];

    // 0 depth
    for (const tag of tagsGroupedByLength[0]) {
      resultTags.push(tag);
    }

    // 1...x depth
    for (let index = 1; index < Object.keys(tagsGroupedByLength).length; index++) {
      for (const tag of tagsGroupedByLength[index]) {
        const arrayPaths = tag.path.split('/').filter(p => p !== '');
        const parentTag = _.find(tagsGroupedByLength[index - 1], t => t.name === arrayPaths[index - 1]);
        !parentTag.children || parentTag.children.length === 0 ? parentTag.children = [tag] : parentTag.children.push(tag);
      }
    }

    return resultTags;
  }

  // ********
  // TAG CRUD
  // ********
  createTag(name: string, path: string): Observable<TbTag> {
    return of(null);
  }

  removeTag(tag: TbTag): Observable<any> {
    return of(null);
  }

  updateTag(tag: TbTag): Observable<TbTag> {
    return of(null);
  }

  // ************************
  // OBJECTS - TAGS RELATIONS
  // ************************
  /**
   * GET tags related to a specific object by its id
   * @param objectId number
   */
  getObjectRelations(objectId: number): Observable<any> {
    const apiPath = this.baseApiUrl + this.apiRetrievePath.replace('{id}', objectId.toString());
    const headers = {'content-type': 'application/ld+json', 'accept': 'application/json'};
    return this.http.get(apiPath, {headers});
  }

  isTagRelatedToObject(objectId: number, tagId: number): boolean {
    return false;
  }

  getTagsRelationsToObjects(objectId: number): Observable<Array<any>> {
    return of(null);
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
