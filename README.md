
# TB Tag

Le projet est composée de 3 applications :

- **tb-tag-lib** : la librairie
- **tb-tag-lib-app** : l'application qui fait tourner la librairie (test)
- **tb-tag-lib-app-e2e** : les tests e2e (généré automatiquement par Angular)



Voir le fichier [**angular.json**](https://github.com/steph-del/tb-tag-lib/blob/master/angular.json) à la racine du projet.

## Installation de la librairie

- `yarn add https://github.com/steph-del/tb-tag-lib/releases/download/v0.1.0/tb-tsb-lib-0.1.0.tgz` (voir la dernière version)
- ou `npm install https://github.com/steph-del/tb-tag-lib/releases/download/v0.1.0/tb-tsb-lib-0.1.0.tgz`
- Dasn l'appli principale, vérifier les versions des dépendances (peer dependencies) de la librairie (angular/common, /core, /material, /cdk et rxjs)
- Importer un thème angular material dans le fichier css de l'application principale
- Ajouter les icones Material dans l'index.html de l'application principale :
`<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">`

Importer `TbTagLibModule` dans `app.module.ts` :`import { TbTagLibModule } from 'tb-tag-lib'`

## Utilisation du composant `<tb-tag>`

Exemple d'utilisation :
[**Application test**](https://github.com/steph-del/tb-tag-lib/tree/master/src/app)


### Paramètres en entrée @Input


| Paramètre                 | Requis | Type              | Valeurs | Valeur par défaut                      | Description |
| ---                       | ---    | ---               | ---     | ---                                    | ---         |
| userId                    | Oui    | number            |         | /                                      | identifiant de l'utilisateur. Utitlisé pour récupérer / ajouter / modifier ses tags |
| objectId                  | Oui    | number            |         | /                                      | identifiant de l'objet |
| baseApiUrl                | Oui    | string            |         | 'http://localhost:8000'                |             |
| objectName                | Oui    | string            |         | 'photo'                                | nom de l'objet lié au tag |
| objectEndPoint            | Oui    | string            |         | '/api/photos'                          | chemin d'accès API vers l'objet |
| tagName                   | Oui    | string            |         | 'photoTag'                             | nom du tag  |
| tagEndpoint               | Oui    | string            |         | '/api/photo_tags'                      | chemin d'accès API vers le tag |
| apiRelationPath           | Oui    | string            |         | '/api/photo_photo_tag_relations'       | chemin d'accès API vers la relation object <-> tag |
| apiRetrievePath           | Oui    | string            |         | '/api/photos/{id}/photo_tag_relations' | chemin d'accès API pour récupérer les relations afférentes à l'objet. `{id}` est automatiquement remplacé (conserver tel quel dans le paramètre). |
| apiTagsRelationsPath      | Oui    | string            |         | '/api/photo_tags/{id}/photo_relations' | chemin d'accès API pour récupérer les objets afférents au tag. `{id}` est automatiquement remplacé (conserver tel quel dans le paramètre). |
| basicTags                 | Non    | `[TagModel]`      |         | /                                      | liste de tags par défaut à afficher à l'utilisateur |
| noApiCall                 | Non    | boolean           |         | false                                  | ne pas effectuer les appels aux API. S'utilise de concert avec un `objectId === null` |


### Paramètres en sortie @Output

| Propriété          | Valeur(s)                     | Remarque |
| ---                | ---                           | ---         |
| log                | TbLogModel                    | revoie tous les évènements utiles pour l'utilisateur ou pour le déboguage |
| httpError          | -                             | renvoie les erreurs Http le cas échéant |
| linkTag            | TbTagModel                    | évènement émis lors de la création d'un nouveau tag SI `noApiCall === true` ET `objectId === null` |
| unlinkTag          | TbTagModel                    | évènement émis lors de la suppression d'un tag SI `noApiCall === true` ET `objectId === null` |


TbLogModel :

| Propriété   | Type             | Commentaire |
| ---         | ---              | ---         |
| module      | string           | ici, toujours 'tb-tag-module' |
| type        | string           | 'info' \| 'success' \| 'warning' \| 'error' |
| message_fr  | string           |
| description | string           | optionnel   |

Les logs avec le type 'info' ne sont pas à afficher à l'utilisateur. Ils peuvent par contre servir pour le déboguage.

TagModel : 

| Propriété   | Type             | Commentaire |
| ---         | ---              | ---         |
| id          | number           | 
| userId      | number           | 
| objectId    | number           |
| name        | string           |
| path        | string           | 

## Serveur de développement

Ne pas oublier de reconstruire la librairie avant de servir l'application (`npm run build_serve` fait les deux à la suite).

## Build
-  `npm run build_lib` pour construire la librairie
-  `npm run build_serve` pour construire la librairie et servir l'application principale
-  `npm run build_pack` for construire et packager la librairie


> The --prod meta-flag compiles with AOT by default.


Le build et la package sont dans le répertoire `dist/`.

## Tests unitaires
`ng test`

## Tests e2e
`ng e2e`
