
## PedigreeJS

**Version** : v4.0.0-rc1  
**Status** : 🔧 Refactoring en cours

PedigreeJS est une bibliothèque JavaScript modulaire permettant de construire et d'afficher des pedigrees (arbres familiaux) dans le navigateur. Le projet utilise ES2015 modules avec D3.js pour la visualisation SVG.

## 🚀 Quick Start

```bash
npm install
npm run build
npm test
```

Pour plus de détails, visitez la [page du projet](https://ccge-boadicea.github.io/pedigreejs/).

## 📊 État du projet

### Architecture
- **17 modules ES2015** (~4 900 lignes de code)
  - 14 modules originaux
  - 3 nouveaux modules utilitaires (validation, dom, tree-utils)
- **Stack** : D3.js v7.9.0, jQuery 3.3.1, Rollup, Jasmine
- **Formats de sortie** : Bundle IIFE + source maps
- **Tests** : Jasmine (53 specs passants, couverture partielle)

### 📋 Statut développement
- ✅ **Audit de code complet** - Analyse détaillée effectuée (9 nov 2024)
- ✅ **Phase 1 terminée** - Refactoring architectural (10 nov 2024)
  - utils.js découpé : 775 → 75 LOC (-90%)
  - 3 nouveaux modules créés : validation.js, dom.js, tree-utils.js
  - Tous les tests passent (53 specs, 0 failures)
- 🔴 **Phases 2-4 à venir** - Performance, tests, modernisation

### 📚 Documentation disponible
- **[AUDIT_PEDIGREEJS.md](AUDIT_PEDIGREEJS.md)** - Rapport d'audit technique complet
- **[PLAN_ACTIONS.md](PLAN_ACTIONS.md)** - Plan d'amélioration détaillé
- **[SESSION_CONTEXT.md](SESSION_CONTEXT.md)** - Contexte technique pour contributeurs

## 🧪 Tests

Les tests Jasmine sont définis dans [pedigree_spec.js](spec/javascripts/pedigree_spec.js).

```bash
npm test  # Lance les tests navigateur
```

## 🔧 Build

[Rollup](https://rollupjs.org/) est utilisé pour créer le bundle ECMAScript 5 :

```bash
npm run build              # Build normal + minifié
npm run build-es           # Build ES modules
```
## License

This software is distributed under the GPL either version 3 or later license.

## Publication
pedigreejs: a web-based graphical pedigree editor. Carver T, et al. [Bioinformatics, Volume 34, Issue 6, 15 March 2018](http://dx.doi.org/10.1093/bioinformatics/btx705).
