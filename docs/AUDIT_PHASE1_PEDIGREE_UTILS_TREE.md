# Audit Phase 1 — Modules `pedigree.js`, `utils.js`, `tree-utils.js`

## Périmètre & méthode
- **Fichiers couverts** : `es/pedigree.js`, `es/utils.js`, `es/tree-utils.js` (~1 500 LOC).
- **Lecture** : analyse ligne à ligne, cartographie des responsabilités, recherche de patterns risqués (couplage, structures globales, manipulation dataset).
- **Compléments** : lecture des specs associées (`spec/javascripts/pedigree_spec.js`, `tree-utils_spec.js`, `validation_spec.js`) pour vérifier l’adéquation tests/comportements.

## Constat module par module

### `es/pedigree.js`
- **Responsabilité** : pipeline principal de rendu (fusion des options, validation, construction D3, widgets, labels, zoom/pan).
- **Points forts** :
  - Paramétrage complet via `options` (dimensions, couleurs, labels, toggles) avec fallback raisonnables (`build()` lignes 21-53).
  - Validation systématique (`utils.validate_pedigree`) avant le rendu ; regroupement des top-level par partenaires (`group_top_level`).
  - Usage clair de D3 (`d3.tree`) avec `adjust_coords`, `check_ptr_links`, clippaths, symboles conditionnels.
- **Risques / dettes** :
  - Couplage élevé avec `utils` (global `roots`, helpers multiples), `pedcache`, `widgets`, `io` ; toute évolution nécessite coordination.
  - Variables globales (`_isBuilding`, etc.) peu documentées ; risque de race condition si plusieurs pedigrées sur la même page.
  - Logique UI et rendu mêlées (ex. configuration des `widgets`, messages console) ; difficile à tester sans environnement DOM complet.
  - Pas de try/catch autour des segments D3 : une donnée malformée bloque tout le rendu.
- **Tests** : couverts indirectement via `spec/javascripts/pedigree_spec.js` (construction, import/export, deletion). Peu de tests unitaires ciblant la géométrie pure.

### `es/utils.js`
- **Responsabilité** : façade qui ré-exporte `validation.js`, `dom.js`, `tree-utils.js`, plus quelques helpers (copy, date, url) et l’état global `roots`.
- **Points forts** :
  - Découplage progressif : les modules refactorés (validation, dom, tree-utils) sont importés puis re-exportés pour compatibilité rétro.
  - `copy_dataset` nettoie les champs volatils (`id`, `parent_node`).
- **Risques / dettes** :
  - `roots` global reste la pierre angulaire de multiples modules (dragging, widgets, delete). Aucun namespace n’isole les différents pedigrées.
  - `copy_dataset` modifie l’ordre du dataset (tri par `id`) ; peut surprendre les consommateurs si l’ordre d’insertion importait.
  - Mélange de responsabilités : helpers DOM (`prefixInObj`), date/URL… pas toujours liés au cœur de PedigreeJS ; mériterait des sous-modules.
- **Tests** : `spec/javascripts/tree-utils_spec.js` et `validation_spec.js` couvrent les fonctions réexportées, mais pas `copy_dataset` ou les helpers de formatage.

### `es/tree-utils.js`
- **Responsabilité** : navigation d’arbre, géométrie, consanguinité, ancêtres, flattening, build d’arbre D3.
- **Points forts** :
  - Ensemble complet de fonctions (`getChildren`, `getAllSiblings`, `ancestors`, `flatten`, `buildTree`, `adjust_coords`).
  - Tests dédiés (`tree-utils_spec.js`) couvrant les cas usuels (recherche de nœuds, proband, siblings, twins).
  - `buildTree` gère la création de nœuds parents cachés et la cohérence des IDs.
- **Risques / dettes** :
  - Couplage avec `utils.roots` : certains helpers s’attendent à des structures enrichies (propriété `_dataset`, `parent_node`).
  - Complexité élevée de `buildTree` / `adjust_coords` : nombreuses branches, effets de bord sur le dataset (ajout de `parent_node`), difficile à refactorer.
  - Fonctions utilitaires (`flatten`, `overlap`, `nodesOverlap`) n’ont pas toutes un test direct ; dépendent de `opts` pour le symbole.
  - Beaucoup de dépendances à `jQuery` (`$.map`, `$.each`) pour des opérations purement JS.
- **Tests** : `tree-utils_spec.js` couvre les fonctions de navigation (indices, partenaires, enfants, twins, depth). Pas de tests ciblés pour `adjust_coords`, `buildTree`, ce qui laisse un gap sur la partie géométrie.

## Synthèse transversale
- **Couplage global** : `utils.roots` et les événements `$(document).trigger('rebuild')` lient fortement les modules ; tout audit ultérieur devra proposer une abstraction (cf. Phase 3 du plan).
- **Dépendance jQuery** omniprésente, même pour les opérations purement données ; complique l’exploitation en environnement moderne ou Node.
- **Tests** : bonne couverture sur navigation/validation, plus limitée sur le pipeline D3 et la géométrie (expiration `adjust_coords`).
- **Documentation** : README et audits mentionnent déjà plusieurs points, mais il manque une doc interne décrivant les invariants `dataset` (champ obligatoires, structure `parent_node`).

## Recommandations Phase 1
1. **Isoler l’état `roots`** dans un service (future phase) pour réduire le couplage.
2. **Documenter le contrat `dataset`** (champ requis, champs temporaires ajoutés par `buildTree`) dans `docs/`.
3. **Étendre les tests** : ajouter des specs ciblant `adjust_coords` / `buildTree` / `copy_dataset` pour éviter les régressions.
4. **Préparer la sortie de jQuery** : recenser les helpers nécessitant uniquement du JS natif (ex. `getIdxByName`), planifier une migration.

*Fin Phase 1 — prochaine étape : Phase 2 (widgets & UI).* 
