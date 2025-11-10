# Repository Guidelines

## Project Structure & Module Organization
Tous les modules ES2015 résident dans `es/`; `es/index.js` ré-exporte `tree-utils.js`, `validation.js`, `dom.js`, etc. Rollup dépose les bundles IIFE/ES dans `build/`, tandis que les styles sources restent dans `css/` et sont importés par l’entrée. Les démos (`index*.html`) servent de bac à sable, la documentation est regroupée dans `docs/`, et les specs Jasmine (`spec/javascripts/*_spec.js`) reflètent la structure des modules.

## Build, Test, and Development Commands
- `npm install` — installe Rollup, Jasmine, PostCSS et leurs plugins.
- `npm run build` — génère le bundle IIFE + sourcemap minifiée dans `build/`.
- `npm run build-es` — produit `build/pedigreejs.es.v4.0.0-rc1.js` et extrait le CSS.
- `npm test` — démarre `npx jasmine-browser-runner serve`; ouvrez l’URL pour lancer les 150 specs.
- `npm run server` — prévisualise `index.html` via `python -m http.server 8001`.
- `npm run browserlist` / `npm run check-updates` — met à jour la matrice navigateurs ou signale les dépendances obsolètes.

## Coding Style & Naming Conventions
Respectez les tabulations dures (cf. `es/tree-utils.js`), les points-virgules et les guillemets simples hors JSON. Les fichiers restent en kebab-case, les exports en camelCase, les constantes partagées en SCREAMING_SNAKE. Concentrez les manipulations DOM dans `dom.js` ou les widgets, gardez des helpers purs et importez les styles via l’entrée pour le pipeline Rollup/PostCSS. Le plugin ESLint est branché au build, d’où l’importance d’un lint local.

## Testing Guidelines
Chaque évolution doit fournir une spec Jasmine dans `spec/javascripts/` (`{module}_spec.js`). Gardez les suites rapides en simulant D3/jQuery quand c’est faisable. Préservez les 100 % de couverture atteints pour validation/dom/tree-utils et ajoutez un test de régression à chaque bug fix. Lancez `npm test` avant toute PR et joignez des captures lorsque l’UI évolue.

## Commit & Pull Request Guidelines
Rédigez des commits courts et à l’impératif (anglais ou français, ex. `Correction de bugs Parent Fils Conjointe`) en séparant les sujets. Chaque PR décrit le périmètre, les preuves de test et l’impact perf, puis lie les tickets et docs clés (`PLAN_ACTIONS.md`, `SESSION_CONTEXT.md`). Demandez une revue, garantissez la réussite de `npm test` et ajoutez des captures avant/après pour l’UI.

## Documentation & Context
Avant un chantier conséquent, relisez `AUDIT_PEDIGREEJS.md`, `PLAN_ACTIONS.md` et `SESSION_CONTEXT.md` pour rester aligné avec la feuille de route. Mettez à jour le document pertinent dès qu’un choix modifie l’architecture, le cache ou les engagements accessibilité. Les configurations sensibles (ex. import CanRisk) doivent être consignées dans `docs/` afin que les intégrateurs récupèrent la checklist complète.
