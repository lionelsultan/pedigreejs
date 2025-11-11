## Audit Phase 2 — Modules Widgets & UI

### Périmètre
- `es/widgets.js` (gestion des widgets SVG, interactions, drag consanguin, évènements globaux)
- `es/widgets-add.js`, `es/widgets-delete.js` (helpers déplacés lors de la refactorisation)
- `es/popup_form.js` (formulaire latéral + binding DOM)
- `es/dom.js` (dialogs, helpers UI)
- Liens avec `pedcache`, `utils.roots`, événements `$(document).trigger`.

### Cartographie & responsabilités
| Module | Responsabilités principales |
| --- | --- |
| `widgets.js` | Ajout des widgets (icônes FontAwesome), gestion survol/clic, verrou anti double clic, drag consanguin, liaison avec `popup_form`, `pedcache`, `pedcache_current`, `utils` |
| `widgets-add.js` | Mutations dataset pour ajout (enfants, fratrie, parents, partenaire), génération IDs, gestion twins |
| `widgets-delete.js` | Suppression d’un nœud et remontée ancêtres, repositionnement enfants, validation, messages d’alerte |
| `popup_form.js` | Binding form/DOM, synchronisation dataset, logiques UX (auto-enable pathologie, lock sexe) |
| `dom.js` | Fonctions de dialogues (jQuery UI + fallback Bootstrap modal), helpers `print_opts`, détection Fullscreen |

### Constat détaillé
#### `widgets.js`
- **Points forts** :
  - Verrou `_widgetClickInProgress` + timer pour éviter les double-clics destructifs.
  - Gestion du `Shift` pour drag consanguin avec feedback visuel (cursor, couleur).
  - Exports direct de `addchild/addsibling/...` garantissent compatibilité API (ex. `extras.js`).
- **Risques / dettes** :
  - Fichier toujours massif (~800 LOC) : mélange UI/DOM/dataset → difficile à tester.
  - Multiples dépendances globales (`utils.roots`, `pedcache_current`, évènements `$(document).trigger('rebuild')`).
  - Aucun test Jasmine sur les interactions drag/consanguinité ou suppression (sauf nouveaux tests partiels).
  - Usage intensif de jQuery dans un contexte D3 → double manip du DOM.

#### `widgets-add.js`
- **Points forts** : centralise la logique d’ajout ; réutilisation de `setMzTwin`, `getUniqueTwinID`, `getAllChildren`.
- **Risques** :
  - `addparents` manipule intensivement le dataset (réordonne, duplique parents, gère orphelins) sans tests dédiés.
  - Beaucoup de `utils.getIdxByName` (O(n)) → performances potentiellement linéaires sur gros arbres.

#### `widgets-delete.js`
- **Points forts** : fonction unique `delete_node_dataset` isolée, inclut validations et avertissements.
- **Risques** :
  - Couplage fort à `utils.roots` / `flatten` ; dépend de `node.parent_node` généré par `buildTree`.
  - Utilise `utils.messages` pour les dialogues mais pas de promesse/callback pour la réponse (suppose un “OK”).
  - Tests partiels seulement ajoutés récemment (pas d’E2E DOM).

#### `popup_form.js`
- **Points forts** : prise en compte des verrous (ex. proband, sexe parent), intégration `jQuery.validate` fallback.
- **Risques** :
  - Code long (300+ LOC) manipulant directement le DOM via jQuery ; difficile à maintenir.
  - Dépendances implicites à `utils.roots` (pour retrouver dataset courant) et à la structure du formulaire HTML (IDs codés en dur).
  - Aucune couverture de tests.

#### `dom.js`
- **Points forts** : fallback auto (`try/catch` sur jQuery UI -> Bootstrap modal), centralisation des dialogues, helpers `is_fullscreen`, `print_opts`.
- **Risques** :
  - `messages` repose sur jQuery UI ; fallback Bootstrap manipule directement le DOM (#errModal) -> dépendance forte à la page.
  - `print_opts` injecte du HTML dans `body` (risque de fuite mémoire, dépendances CSS).

### Couplages notables
- **États globaux** : reliance à `utils.roots` (pour flatten/drag/delete), `pedcache` (historiques), événements custom `build/rebuild/fhChange`.
- **jQuery omniprésent** : flux widgets ↔ formulaire ↔ dialogues.
- **Structure HTML fixe** : IDs `#node_properties`, `#errModal`, `#person_details` supposés présents.

### Recommandations Phase 2
1. **Segmenter `widgets.js` davantage** : séparer UI (DOM) vs logiques dataset (helpers déjà extraits, mais d’autres sous-blocs possibles : drag consanguin, overlay).
2. **Introduire un service d’événements** : encapsuler `$(document).trigger('rebuild')` / `fhChange` dans une API typed, facilitant tests et remplacements.
3. **Couverture de tests ciblée** :
   - `widgets-delete`: cas success + split warning (partiellement fait) + suppression parents adoptés.
   - Drag consanguin : vérifier la création de couples via SHIFT+drag (peut être simulé via dataset).
   - `popup_form`: tests unitaires sur `save`, `nodeclick`, `updateStatus`.
4. **Réduire la dépendance jQuery** : identifier les helpers purement data (par ex. `$.map` -> `Array.map`), préparer une migration progressive.
5. **Documenter les IDs/UI contractuels** : liste des éléments DOM requis (form, modals, widgets) dans `docs/` pour éviter des intégrations fragiles.

*Phase 2 close — prochain périmètre : Phase 3 (IO, extras, drag/zoom, boutons, etc.).*
