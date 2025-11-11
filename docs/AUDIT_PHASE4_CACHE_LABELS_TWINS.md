# Audit Phase 4 — Cache, Labels, Twins

## Périmètre
- `es/pedcache.js` (historique, undo/redo, position zoom)
- `es/labels.js` (affichage des labels sur les nœuds)
- `es/twins.js` (gestion des jumeaux, sync)
- `es/extras.js` déjà couvert en partie, relu ici pour dépendances `syncTwins`.

## Constat détaillé

### `es/pedcache.js`
- **Responsabilité** : stockage des états de dataset (localStorage ou fallback mémoire), gestion undo/redo, mémorisation du zoom/pan.
- **Points forts** :
  - `serialize_dataset` tente d’éviter les références circulaires (copie des champs scalaires, conversion enfants en noms).
  - Fallback array + LRU simple (max 500 entrées) lorsque le navigateur ne supporte pas le storage.
  - API complète (`init_cache`, `current`, `previous`, `next`, `clear`, `setposition/getposition`).
- **Risques/dettes** :
  - `serialize_dataset` ignore les objets imbriqués (ex. attributs `gene_test` objets) → perte potentielle d’informations dans l’historique.
  - Pas de chiffrement/compression ; stockage potentiellement volumineux (datasets + images).
  - `has_browser_storage` efface potentiellement toute la session (`localStorage.clear` dans `clear_browser_store`).
  - Fonction `clear_pedigree_data` supprime toutes les clés commençant par le préfixe → prudence si plusieurs pedigrées partagent `btn_target`.
  - Pas de gestion d’erreurs (quota exceeded) ni de tests unitaires.

### `es/labels.js`
- **Responsabilité** : ajout des labels (noms, âges, pathologies, customs) autour des nœuds.
- **Points forts** :
  - Paramétrable via `opts.labels` et `opts.diseases`, ordonnancement (age/yob d’abord).
  - `prefixInObj` exploité pour gérer les champs multi-prefixes.
- **Risques/dettes** :
  - Logique `ypos` stocke un `d.y_offset` sur l’objet D3 → peut interférer avec d’autres modules si non reset.
  - `getPx` dépend d’un calcul `getComputedStyle` sur `#targetDiv` : possible divergence si la police est modifiée dynamiquement.
  - Pas d’unit tests ; bugs d’affichage difficiles à détecter.

### `es/twins.js`
- **Responsabilité** : assignation et synchronisation des jumeaux, génération d’IDs.
- **Points forts** :
  - Fonctions simples, découplées (set, get ID, sync, check).
  - `syncTwins` maintient cohérence pour les monozygotes (sexe, age/yob).
- **Risques/dettes** :
  - `getUniqueTwinID` limite à 10 IDs + “A” ; pas extensible.
  - `syncTwins` modifie directement le dataset entier, sans contrôle d’effet (p.ex. sur attributs `status`).
  - `checkTwins` supprime l’ID si moins de 2 occurrences, mais ne prévient pas l’utilisateur.
  - Pas de tests indépendants (uniquement via `tree-utils_spec` indirectement).

## Recommandations Phase 4
1. **Améliorer `serialize_dataset`** : gérer les objets (ex. gene_test) et documenter les champs exclus.
2. **Ajouter des tests unitaires** pour `pedcache` (cycle init → undo/redo, fallback array, setposition) afin de fiabiliser l’historique.
3. **Labels** : envisager un `reset_y_offset` par nœud avant `addLabels`, ajouter des tests visuels ou snapshots.
4. **Twins** : documenter les limites (10 IDs), ajouter des tests sur `syncTwins` et `checkTwins`, et prévoir une stratégie d’allocation extensible.

*Phase 4 close — Phase 5 (CSS/build/docs) à venir.*
