# Audit Phase 3 — I/O, API externes et interactions avancées

## Périmètre
- `es/io.js` (import/export, impression, sauvegarde)
- `es/canrisk_file.js` (lecture CanRisk/BOADICEA)
- `es/extras.js` (API pour apps tierces)
- `es/dragging.js` (drag intra-génération)
- `es/zoom.js`, `es/pbuttons.js` (zoom/pan, boutons UI)
- Liens avec `pedcache`, `RESULT`, événements custom.

## Constat par module

### `es/io.js`
- **Forces** :
  - Gestion complète des exports (SVG, PNG via canvas, impression A4).
  - `load_data` supporte JSON, Linkage, BOADICEA 2.0/4.0, CanRisk (via `canrisk_file`).
  - Validation systématique après import (`utils.validate_pedigree`), reset de la position, triggers d’événements (`rebuild`, `riskfactorChange`, `fhChange`).
- **Risques/dettes** :
  - Dépend fortement de jQuery, `window`, `document`, `RESULT` global (non défini dans le module) → difficile à tester.
  - `print` injecte des styles hardcodés (`/static/css/canrisk.css`) → dépendance à un site externe.
  - `load_data` mélange logs, UI (`utils.messages`), resets, appels à fonctions globales (`acc_FamHist_ticked`) : couplage serré avec l’application hôte.
  - Pas de gestion fine des erreurs I/O (ex. `window.open` bloqué, `URL.createObjectURL` indisponible).
  - Aucun test dédié.

### `es/canrisk_file.js`
- **Forces** : parser complet, variables globales (`cancers`, `genetic_testX`, `pathology_tests`) exportées pour réutilisation.
- **Risques** :
  - Grosse fonction `readCanRisk` (plusieurs centaines de lignes) avec nombreux `try/catch` vides, console.log.
  - Dépend de jQuery (`$.map`, `$.each`) pour manipuler des tableaux.
  - Peu de validations explicites (vérifie longueur colonnes mais pas les types).
  - Tests existants limités (quelques cas dans `pedigree_spec.js`).

### `es/extras.js`
- **Forces** : API claire (`node_attr`, `proband_attr`, `proband_add_child`, `delete_node_by_name`), réutilise `widgets` helpers.
- **Risques** :
  - Chaque fonction clone le dataset via `pedcache.current` → dépend du cache pour refléter l’état réel.
  - Couplage à `rebuild(opts)` (import depuis `pedigree.js`) → re-render systématique.
  - Pas de validation des entrées (ex. `node_attr` accepte n’importe quelles clés/valeurs sans check).
- **Tests** : inexistants.

### `es/dragging.js`
- **Forces** : isolé, simple ; module gère SHIFT+drag, repositionnement dans dataset via `el_move`.
- **Risques** :
  - Se base sur `utils.roots[opts.targetDiv]` (encore une fois couplage global).
  - Aucun test ; dépend d’événements D3 (difficile à simuler).

### `es/zoom.js`
- **Forces** : encapsule `d3.zoom`, mémorise position via `pedcache.setposition/getposition`, fonctions utilitaires (`btn_zoom`, `scale_to_fit`, `get_bounds`).
- **Risques** :
  - `init_zoom` lit/écrit `opts.zoomIn/zoomOut`, mais change les `scaleExtent` à la volée; pas de tests.
  - `get_bounds` parcourt le DOM ; dépend de `getBBox` (non dispo server-side).

### `es/pbuttons.js`
- **Forces** : génère les boutons, connecte undo/redo/reset/fullscreen/zoom, appelle `pedcache.previous/next`.
- **Risques** :
  - Hardcode les icônes FontAwesome/classe CSS ; dépend du markup (#btn_target).
  - Toggle fullscreen multiplateforme très verbeux (pas factorisé).
  - Pas de tests (UI + interactions globales).

## Couplages transverses
- `RESULT`, `acc_FamHist_*` : appels non définis dans ce repo → dépendances à l’app hôte.
- `$(document).trigger` : `rebuild`, `fhChange`, `riskfactorChange` ; absence de typage ou service central.
- `pedcache` : utilisé pour sauvegarder/restaurer dataset/zoom dans toutes ces interactions.

## Recommandations Phase 3
1. **Isoler l’API I/O** : séparer parsing/validation (pure fonction) des effets (dialogs, triggers) pour testabilité.
2. **Documenter les dépendances externes** (`RESULT`, CSS, modals) dans `docs/` & `README` pour éviter les intégrations fragiles.
3. **Ajouter des tests** : au moins unitaires pour `extras.js`, parsing CanRisk/BOADICEA, et tests d’intégration pour `load_data` (avec mocks).
4. **Encapsuler les triggers** (`pedigreeEvents.emit('rebuild', opts)`) pour réduire les couplages.
5. **Prévoir la sortie progressive de jQuery** sur les modules de calcul (CanRisk parser) pour simplifier la maintenance.

*Phase 3 close — prochaine étape : Phase 4 (cache, labels, twins, etc.).*
