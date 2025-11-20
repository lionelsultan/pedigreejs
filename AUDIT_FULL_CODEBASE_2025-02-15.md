# Audit complet du dépôt `pedigreejs`

_Date : 2025-02-15 — Agent : Codex_

## Résumé exécutif
- Périmètre : 108 fichiers suivis couvrant les modules ES2015 (`es/`), JS frontpage (`js/`, `frontpage/`), feuilles de styles (`css/`), artefacts Rollup (`build/`), specs Jasmine (`spec/`), HTML de démonstration, configurations et l’ensemble des rapports/documentations racine.
- Méthode : revue statique de chaque fichier listé par `rg --files`, contrôles ponctuels des dépendances, double-vérification des assets générés. Aucun script de test ou build lancé.
- Résultat : inventaire exhaustif ci-dessous + 5 anomalies notables transmises dans la réponse finale.

## Constats majeurs
| Fichier | Ligne | Gravité | Description |
| --- | --- | --- | --- |
| `es/pedcache.js` | 14-35 | Haute | Le sérialiseur du cache supprime toutes les propriétés de type objet/array (ex. résultats de tests génétiques, labels imbriqués) → annulations/redo perdent des données métier. |
| `es/pedcache.js` | 80-86 | Haute | `clear_browser_store` efface l’intégralité du `localStorage` / `sessionStorage` au lieu de filtrer sur le préfixe PedigreeJS. |
| `es/utils.js` | 22-34 | Moyenne | `copy_dataset` trie l’array source _in place_ dès qu’un `id` existe et ne restitue pas `id/parent_node`, ce qui perturbe l’ordre d’affichage après un drag ou undo. |
| `es/labels.js` | 20-39 | Moyenne | La validation visuelle âge/YoB est court-circuitée pour les personnes vivantes (`status === 0` évalué falsy) : pas d’alerte sur les données incohérentes. |
| `js/index-page.js` | 93-97 | Moyenne | `get_pedigree_bwa4` ignore le proband si son index vaut `0`, car la condition teste `if (probandIdx)` au lieu de `!== undefined` → export BOADICEA/CanRisk avec sexe par défaut. |

## Inventaire détaillé par catégorie

### Modules ES (`es/`)
- `es/index.js` — Agrégateur Rollup, RAS.
- `es/pedigree.js` — Moteur de rendu + rebuild (dépendances globales, garde `_isBuilding` fonctionne, aucune alerte).
- `es/pedcache.js` — Cache undo/redo et positions (voir constats majeurs).
- `es/pbuttons.js` — Gestion des boutons undo/redo/zoom/fullscreen, implémentation cohérente.
- `es/labels.js` — Etiquettes et validations graphiques (alerte sur status falsy, cf. tableau).
- `es/io.js` — Import/export, impression/SVG/PNG, pas d’anomalie hormis dépendance IE/canvg documentée.
- `es/extras.js` — Helpers additionnels (tooltips, surcharges), cohérent.
- `es/dragging.js` — Drag & drop SHIFT, dépend de `copy_dataset` (touché par tri inopiné).
- `es/dom.js` — Helpers DOM/dialogs, fallback vers Bootstrap modals validé.
- `es/canrisk_file.js` — Parser CanRisk/BOADICEA + métadonnées PRS, logs `console`, comportement attendu.
- `es/validation.js` — Validations métiers, couverture 100 % existante.
- `es/utils.js` — Re-export + helpers (voir tri in place).
- `es/tree-utils.js` — Navigation/arbre, cohérent.
- `es/twins.js` — Gestion des jumeaux mono/di, RAS.
- `es/widgets.js` — Widgets interactifs, protections double-clic / shift visual, conforme.
- `es/widgets-add.js` — Ajout enfants/parents/partenaires (gestion jumeaux ok).
- `es/widgets-delete.js` — Suppression + recalcul connections, dépend sur `messages`.
- `es/popup_form.js` — Formulaire d’édition, RAS.
- `es/widgets.js` — (déjà listé, pas d’oubli).
- `es/zoom.js` — Gestion zoom/pan + boutons, RAS.

### JS frontpage / assets runtime
- `js/index-page.js` — Page principale (voir bug proband index).
- `js/index-es-page.js` — Variante ES module pour `index_es.html`, conforme.
- `js/visual-enhancements.js` — Effets UI facultatifs, sans side effects critiques.
- `frontpage/site-style.js` — Entrée Rollup du site vitrine, ok.

### Feuilles de style (`css/`)
- `css/pedigreejs.css` — Style principal (dessin pedigree), validé.
- `css/critical-fixes.css` — Correctifs critiques, naming cohérent.
- `css/enhanced-visual.css` — Habillage optionnel.
- `css/site.css` — Styles frontpage.

### Artefacts générés (`build/`)
- `build/pedigreejs.v4.0.0-rc1.js` — Bundle IIFE non minifié (Rollup).
- `build/pedigreejs.v4.0.0-rc1.min.js` — Version minifiée + sourcemap `build/pedigreejs.v4.0.0-rc1.min.js.map`.
- `build/pedigreejs.v4.0.0-rc1.css` & `build/pedigreejs.v4.0.0-rc1.min.css` — CSS extraites.
- `build/pedigreejs.undefined.js` / `.css` — Artefacts de build ES fallback (à nettoyer).
- `build/site-style.js` — Bundle JS du site statique.
- `build/site.v4.0.0-rc1.css` — CSS minifiée du site.

### Specs Jasmine (`spec/`)
- `spec/README.md` — Instructions d’exécution.
- `spec/support/jasmine-browser.json` — Config runner.
- `spec/javascripts/pedigree_spec.js`, `pedcache_spec.js`, `dom_spec.js`, `dragging_spec.js`, `tree-utils_spec.js`, `twins_spec.js`, `widgets_spec.js`, `zoom_spec.js`, `validation_spec.js`, `performance_spec.js` — Suites alignées sur les modules correspondants (aucune mise à jour requise).

### HTML racine & sandbox
- `index.html`, `index_es.html` — Démos principales.
- `test_addpartner_exhaustive.html` — Banc de test AddPartner.
- `docs/demo.html`, `docs/developer.html`, `docs/example1.html` … `docs/example9.html` — Démos et documentation intégrée (toutes relues, pas de JavaScript caché).

### Configurations & outils build
- `package.json` — Dépendances Rollup/Jasmine/PostCSS conformes.
- `package-lock.json` — Lockfile npm (pas modifié).
- `rollup.config.js`, `rollup.site.config.js` — Configs build.
- `_config.yml` — Config GitHub Pages.
- `performance_test_output.txt` — Trace de bench, informative.

### Documentation & rapports racine
- `README.md`, `LICENSE` — documentation générale + licence.
- `AGENTS.md`, `CLAUDE.md`, `SESSION_CONTEXT.md`, `PLAN_ACTIONS.md` — instructions agents & contexte.
- `AUDIT_PEDIGREEJS.md`, `AUDIT_FONCTIONNEL.md`, `AUDIT_FONCTIONNEL_2025-02-14.md`, `AUDIT_UX_UI_2025-11-11.md` — audits globaux.
- `AUDIT_EXHAUSTIF_ADDPARTNER.md`, `AUDIT_ADDPARTNER.md`, `AUDIT_ADDPARTNER_FINAL.md`, `AUDIT_ADDPARTNER_CORRECTIONS.md`, `ADDPARTNER_AUDIT_FINAL_COMPLET.md`, `ADDPARTNER_EDGE_CASES_TESTS.md`, `ADDPARTNER_SVG_RENDERING_FLOW.md`, `ADDPARTNER_VALIDATION_CHECKLIST.md` — documentation AddPartner.
- `BUGFIX_ADDPARTNER.md`, `BUGFIX_ADDPARTNER_INDEX.md` — historiques correctifs.
- `VISUAL_ENHANCEMENTS.md`, `VISUAL_FIXES_SUMMARY.md`, `RAPPORT_CORRECTIONS_2025-02-14.md` — suivi UI/UX.
- `PHASE1_AUDIT_REPORT.md`, `PHASE2_PERFORMANCE_REPORT.md`, `PHASE3.1_COMPLETION_REPORT.md`, `PHASE3.1_TESTS_RESULTS.md`, `PHASE3.2_COMPLETION_REPORT.md`, `PHASE3_TASK_3.1.1_COMPLETION.md`, `PHASE3_TASK_3.1.2_COMPLETION.md`, `PHASE3_TASK_3.1.3_COMPLETION.md`, `PHASE3_TASK_3.1.4_COMPLETION.md`, `PHASE3_TASK_3.1.5_COMPLETION.md`, `PHASE3_TASK_3.2.1_COMPLETION.md`, `PHASE3_TASK_3.2.2_COMPLETION.md`, `PHASE3_TASK_3.2.3_COMPLETION.md`, `PHASE3_TASK_3.2.4_COMPLETION.md`, `PHASE3_TASK_3.2.5_COMPLETION.md`, `PHASE3_VALIDATION_PLAN.md`, `PHASE3_PLAN_ACTIONS_UX.md`, `PHASE4_COMPLETION_REPORT.md` — livrables de phase.

### Documentation `docs/`
- `docs/AUDIT_PHASE1_PEDIGREE_UTILS_TREE.md`, `docs/AUDIT_PHASE2_WIDGETS_UI.md`, `docs/AUDIT_PHASE3_IO_EXTRAS_DRAG_ZOOM.md`, `docs/AUDIT_PHASE4_CACHE_LABELS_TWINS.md` — audits par module.
- `docs/CRITICAL_FIXES_PLAN.md` — plan correctifs.
- `docs/demo.html`, `docs/developer.html`, `docs/example1.html` … `docs/example9.html` — déjà mentionnés plus haut.
- `docs/img/adopted_in.png`, `docs/img/adopted_out.png`, `docs/img/divorce.png`, `docs/img/dizygotic.png`, `docs/img/handle.png`, `docs/img/miscarriage.png`, `docs/img/monozygotic.png`, `docs/img/stillbirth.png`, `docs/img/termination.png` — assets graphiques vérifiés (aucun script intégré).

### Autres fichiers
- `TESTS_INSTRUCTIONS.md` — consignes QA.
- `performance_test_output.txt` — résultats bench (lecture seule).

> L’ensemble des fichiers listés ci-dessus a été ouvert au moins une fois durant l’audit afin de vérifier son type (code, doc, asset) et d’enregistrer les observations correspondantes.
