# AUDIT FONCTIONNEL COMPLET – PedigreeJS (14 février 2025)

**Commit audité** : `4ecb9244`  
**Périmètre** : `/es` (17 modules ES2015, ~4 800 LOC) + scripts frontpage (`index.html`, `index_es.html`), assets générés (`build/`).  
**Stack** : D3.js 7.9, jQuery 3.3, Rollup 4, Jasmine Browser Runner.  
**Objectif** : cartographier l’ensemble des fonctions métier (construction, édition, validation, persistance et I/O des pedigrees) et identifier les points de vigilance fonctionnels.

---

## 1. Méthodologie & Livrables
- Inspection systématique de chaque module `es/*.js` via lecture dirigée et repérage des API exportées.
- Revues croisées des flux front (`index*.html`, `js/index*.js`) pour comprendre l’orchestration côté démo.
- Analyse des tests `spec/javascripts/*` pour qualifier la couverture fonctionnelle existante.
- Consolidation dans ce rapport + plan d’actions proposé section 7.

---

## 2. Architecture fonctionnelle

### 2.1 Modules et responsabilités

| Couche | Module (LOC) | Responsabilité principale |
| --- | --- | --- |
| **Orchestration** | `pedigree.js` (577) | Contrôle complet de `build()` / `rebuild()`, injection SVG, liaison boutons/zoom/drag, déclenchement validation. |
| **Navigation & calcul** | `tree-utils.js` (441), `utils.js` (75) | Construction hiérarchique, requêtes (siblings, partners, proband), ajustements spatiaux, racines D3 partagées. |
| **UI dynamique** | `widgets.js` (843), `popup_form.js` (307), `pbuttons.js` (197), `labels.js` (124), `dom.js` (173) | Widgets contextuels (ajout parent/enfant, suppression), formulaires d’édition, boutons undo/redo/fullscreen, rendu labels multi-lignes, helpers DOM/accessibilité. |
| **Interactions avancées** | `zoom.js` (150), `dragging.js` (98), `twins.js` (73), `extras.js` (106) | Zoom + pan synchronisés avec cache, drag & drop contrôlé, synchronisation jumeaux, widgets secondaires (terminaisons, cellule, etc.). |
| **Données & persistance** | `pedcache.js` (281) | Historique (undo/redo), stockage session/localStorage/array, sérialisation état zoom. |
| **Validation & règles métier** | `validation.js` (234) | Cohérence parents/sexes, YOB/âge/statut, unicité identifiants, détection individus orphelins. |
| **Interopérabilité** | `io.js` (663), `canrisk_file.js` (417) | Import/export BOADICEA v4 et CanRisk, chargement PED/JSON, export SVG/PNG, impression, download double format. |
| **Entrée frontpage** | `index.js` (22) | Re-export modulaire (ESM) pour consommation externe/tests. |

### 2.2 Flux runtime clé
1. `build(options)` (`pedigree.js:18-346`) agrège les options, installe boutons IO (`pbuttons.addButtons`, `io.addIO`), initialise cache (`pedcache.init_cache`), puis valide le dataset (`utils.validate_pedigree` → `validation.js`).
2. `group_top_level` et `utils.buildTree` associent partenaires/top-level puis bâtissent une hiérarchie D3 avec un `hidden_root`.
3. `utils.adjust_coords` + `tree-utils` corrigent les positions (espacements conditionnels, parents intermédiaires, consanguinité).
4. `addWidgets`, `addLabels`, `init_zoom`, `init_dragging` branchent les interactions après montage du SVG.
5. `pedcache` stocke chaque mutation (édition via `popup_form`, boutons undo/redo, zoom/pan) en session/local/array selon `store_type`.
6. `io.js` fournit les commandes load/save/print (fichiers BOADICEA `.bwad`/CanRisk `.canrisk`, export PNG/SVG via Canvas/CanVG si IE).

### 2.3 États partagés
- `utils.roots` (map par `targetDiv`) garde la hiérarchie D3 courante pour `rebuild`/zoom. C’est la dernière variable globale résiduelle.
- `pedcache.cache` contient la pile d’instantanés (dataset + coordonnées/zoom) avec LRU en mode array.
- `widgets` / `popup_form` manipulent directement `opts.dataset` (mutations en place), puis poussent l’état vers `pedcache.save`.

---

## 3. Processus fonctionnels détaillés

### 3.1 Construction & rendu du pedigree
- **Entrée** : JSON d’individus (`name`, `sex`, `mother`, `father`, diagnostics, flags `top_level`, `proband`, `nap` etc.).
- **Traitement** : D3 `tree()` avec séparation conditionnelle (parents cachés vs visibles), conversions en unités pixels selon `symbol_size`.
- **Sortie** : SVG avec `g.diagram` contenant nœuds (SVG shape dépendante du sexe/état) + liens parents/enfants + connecteurs conjoints/double-lignes consanguines.
- **Points d’attention** :
  - L’algorithme de groupement top-level considère uniquement les couples avec enfants. Les individus isolés restent en branch dérivées mais ne sont pas auto-alignés.
  - L’ordre d’itération du dataset influe sur l’arrangement horizontal (pas de tri déterministe autre que `id`).

### 3.2 Edition interactive (widgets & formulaires)
- **Widgets** (`widgets.js`): affichés au survol (link/child/sibling/parent icons). Chaque action clone `opts.dataset`, applique `add_*` puis `pedcache.save`.
- **Formulaire** (`popup_form.js`): modale jQuery UI permettant de modifier attributs, toggler cancers, statuts, jumeaux. Supporte :
  - Génération auto d’IDs parents quand on ajoute un parent inexistant.
  - Gestion twin/dizygotic : setters synchronisés via `twins.js`.
- **Validation UI** : soumission du form relance `pedigree.rebuild`. Absence de validation schema côté UI (on s’appuie sur `validation.js` et messages console).
- **Accessibilité** : boutons + icones ont `aria-label` (cf. `index.html:799-833`), mais l’éditeur modal reste stacké sur `<div id="dialog-form">` sans rôle ARIA spécifique.

### 3.3 Navigation, zoom & drag
- `zoom.js` applique `d3.zoom` sur le conteneur, limite min/max via `options.zoomIn/out`, expose boutons +/- via `pbuttons`.
- Facteur mémorisé dans `pedcache.position` pour restaurer le cadrage après reload.
- `dragging.js` permet de translater un sous-arbre (Shift+drag) en recalculant `p.x`/`p.y` puis en sauvegardant l’état. Aucune restriction métier : l’utilisateur peut générer des chevauchements qu’il devra corriger manuellement.

### 3.4 Historique, persistance & stockage
- `pedcache.js` supporte trois modes (`session`, `local`, `array`). Les opérations clés :
  - `init_cache` prépare la pile et ajoute l’état initial.
  - `save` pousse un snapshot (dataset deep copy + position + timestamp) avec LRU 500 entrées en mode array.
  - `undo`/`redo` ajustent `nstore` (index) et renvoient un dataset cloné à `rebuild`.
- Risque détecté : la sérialisation JSON ne gère pas les méthodes/objets complexes mais l’état ne contient que des POJOs → acceptable.

### 3.5 Import / Export (interopérabilité)
- `io.js` :
  - **Load** : input `<input type="file">` (JSON) → `handle_file_select` lit, `pedigree.rebuild` applique.
  - **Save** : `save_dataset` (JSON) + `save_svg` (XML) + `save_png` (Canvas -> PNG, fallback `canvg` pour IE).
  - **BOADICEA / CanRisk** : `get_pedigree_bwa4` (index.html:248) et `canrisk_file.get_non_anon_pedigree` (js/index-page.js:113) transforment le dataset courant en fichiers tabulés.
  - **Impression** : `window.print()` après masquage des widgets (`@media print`).
- **Limites** :
  - Pas de validation structurée des fichiers entrants (failures loggées en console).
  - Export CanRisk n’anonymise pas les identifiants (fonction nommée `get_non_anon_pedigree`).

### 3.6 Validation métier
- `validation.js` couvre :
  - Concordance Age/YOB vs année courante (`validate_age_yob`).
  - Vérification existence parents référencés, sexes cohérents, absence de cycles analytiques.
  - Détection d’individus non connectés (`warn_on_unconnected_nodes` – log console).
- La validation est activée par défaut (`options.validate: true`) mais peut être bypassée (utilisateur peut injecter sa fonction).
- Absence de messages UI : les erreurs lèvent `utils.create_err` (console.error + throw), stoppant `build`. À documenter pour les intégrateurs.

---

## 4. Modèle de données
- **Identifiants** : `name` (clé unique, ≤7 chars pour BOADICEA), `display_name` (libellé UI).
- **Relations** : `mother` / `father` (références par `name`), `top_level` (racines), `noparents` (flag interne pour nœuds fantômes), `partners` (extrait via `get_partners`).
- **Attributs médicaux** : multiples cancers (`*_diagnosis_age`), statut (`status` 0/1), gènes (`{gene}_gene_test` avec `type`/`result`), pathologies (`er_bc_pathology`, etc.).
- **Flags UI** : `proband`, `adopted`, `deceased`, `pregnancy` (stillbirth/miscarriage).
- **Extensions** : `optionalLabels`/`labels` permettent de contrôler les attributs affichés sous chaque symbole (cf. `index_es.html:35-65` – configuration avancée).

---

## 5. Tests & observabilité
- **Tests unitaires** : `spec/javascripts/*.js` (≈150 specs) couvrent `validation`, `dom`, `tree-utils`, `pedcache`, ainsi que des tests de performance (Web Perf API).
- **Absences notables** :
  - Pas de tests automatisés pour `widgets`, `popup_form`, `io` (zone à forte complexité fonctionnelle).
  - Pas de scénarios headless pour les flux UI (ajout/édition/suppression).
  - La page démo sert de sandbox manuel mais aucune instrumentation analytics/log côté runtime.

---

## 6. Risques & points sensibles
1. **Mutations dataset en place** : `widgets` et `popup_form` modifient directement les objets de `opts.dataset` avant validation. En cas de crash, l’état global peut rester partiellement écrit (pas de transaction).
2. **Globals résiduels** : `utils.roots` maintient la hiérarchie active par `targetDiv`. Multi-instances sur la même page restent peu testées.
3. **Interop CanRisk non anonymisée** : l’export par défaut est « non anonym ». À rappeler côté produit pour éviter des fuites.
4. **Validation uniquement console** : l’utilisateur final n’est jamais notifié in-app ; un build qui échoue semble “freeze”.
5. **Tests UI manquants** : aucune couverture pour les cas critiques (consanguinité, suppression partenaire, adoption).
6. **Performances sur très grands pedigrees** : Phase 2 a mesuré 4–31 ms pour 10–100 personnes, mais aucun garde-fou côté UI (pas de pagination/virtualisation) → à surveiller >300 individus.
7. **Accessibilité** : la modale d’édition n’a pas de focus trap et le lecteur d’écran ne reçoit pas de mise à jour d’état.

---

## 7. Recommandations fonctionnelles
1. **Étendre la validation UX**  
   - Propager les messages d’erreur `validation.js` vers le DOM (bannière persistante) au lieu de `console.error`.
   - Ajouter des garde-fous sur les import JSON (schema + feedback utilisateur).

2. **Sécuriser les opérations d’édition**  
   - Encapsuler les mutations dans des fonctions pures (produire un nouveau dataset avant de le pousser dans `pedcache`).  
   - Ajouter des confirmations pour les suppressions de sous-arbre (`widgets.delete_node_dataset`).

3. **Renforcer l’automatisation**  
   - Créer des specs Jasmine supplémentaires ciblant `widgets`, `io`, `popup_form` avec datasets représentatifs (jumeaux, adoptions, consanguinité).  
   - Automatiser un smoke test Playwright pour les pages `index*.html`.

4. **Clarifier la gouvernance CanRisk/BOADICEA**  
   - Documenter les exigences d’anonymisation (ou proposer une option “anonymize before export”).  
   - Ajouter une vérification d’éligibilité (contrôle des champs obligatoires) avant de permettre le download.

5. **Accessibilité & UX**  
   - Ajouter un focus trap / rôle dialog sur le formulaire (`popup_form`).  
   - Exposer des raccourcis clavier documentés pour zoom/reset (actuellement cachés).

6. **Préparer la montée en charge**  
   - Étudier une option “compact layout” pour les grands pedigrees (>200 nœuds), en s’appuyant sur `tree-utils.adjust_coords`.  
   - Logger les métriques de build (temps, nombre nœuds) pour alimenter un tableau de bord.

---

## 8. Conclusion
Le code source PedigreeJS offre un socle fonctionnel riche, structuré en modules ciblés et déjà renforcé par des phases de refactorings (validation/dom/tree-utils isolés, pedcache modernisé). Les fonctionnalités critiques — construction d’arbres, édition interactive, historique, export BOADICEA/CanRisk — sont bien couvertes, mais il reste des marges d’amélioration sur la robustesse perçue (UX des erreurs), l’automatisation et la gestion de la conformité (données sensibles).  
Les recommandations ci-dessus constituent la feuille de route fonctionnelle prioritaire pour fiabiliser la librairie avant sa mise à disposition d’équipes cliniques ou de partenaires industriels.
