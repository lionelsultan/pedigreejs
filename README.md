
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

Pour plus de détails, visitez la [page du projet](https://lionelsultan.github.io/pedigreejs/).

## 📊 État du projet

### Architecture
- **17 modules ES2015** (~4 900 lignes de code)
  - 14 modules originaux
  - 3 nouveaux modules utilitaires (validation, dom, tree-utils)
  - pedcache.js amélioré (LRU eviction, position array mode)
- **Stack** : D3.js v7.9.0, jQuery 3.3.1, Rollup, Jasmine
- **Formats de sortie** : Bundle IIFE + source maps
- **Tests** : Jasmine (**150 specs, 0 failures**)

### 📋 Statut développement
- ✅ **Audit de code complet** - Analyse détaillée effectuée (9 nov 2024)
- ✅ **Phase 1 terminée et auditée** - Refactoring architectural + tests (10 nov 2024)
  - utils.js découpé : 775 → 75 LOC (-90%)
  - 3 nouveaux modules créés : validation.js, dom.js, tree-utils.js
  - 897 LOC de nouveaux tests créés (validation_spec, dom_spec, tree-utils_spec)
  - **100% couverture** : 35/35 fonctions testées
  - Tous les tests passent (133 specs, 0 failures)
  - Bug de production corrigé (is_fullscreen)
- ✅ **Phase 2 terminée** - Performance et optimisation cache (10 nov 2024)
  - Performance mesurée : **4-31ms** pour 10-100 personnes (excellente)
  - TODOs pedcache.js résolus (LRU eviction + position array mode)
  - Tests de performance créés (413 LOC)
  - Tests cache array créés (287 LOC, 12 nouveaux tests)
  - **Décision** : Optimisations supplémentaires NON nécessaires
  - Tous les tests passent (**150 specs, 0 failures**)
- ✅ **Bug critique corrigé** - Relation parent-enfant lors de l'ajout de conjoint (10 nov 2024)
  - Bug : Le conjoint héritait des parents de l'enfant
  - Fix : Paramètre `skip_parent_copy` ajouté à `addsibling()`
  - Impact : Corrigé dans `addpartner()` et `addchild()`
  - Tests : 3 nouveaux tests de non-régression ajoutés
  - Build : Réussi sans erreur
- 🔴 **Phases 3-4 à venir** - Tests modules spécialisés, documentation, modernisation
- ✅ **Documentation mise à jour** - Site web modernisé avec accessibilité WCAG 2.1 AA (10 nov 2024)
  - index.html refonte complète (760 → 1131 LOC)
  - Design moderne avec système de tokens CSS
  - Accessibilité complète (skip nav, ARIA, contraste couleurs)
  - SEO optimisé (meta tags, Open Graph)
  - Documentation markdown à jour (Phases 1 et 2)

### 📚 Documentation disponible
- **[AUDIT_PEDIGREEJS.md](AUDIT_PEDIGREEJS.md)** - Rapport d'audit technique complet
- **[PLAN_ACTIONS.md](PLAN_ACTIONS.md)** - Plan d'amélioration détaillé
- **[SESSION_CONTEXT.md](SESSION_CONTEXT.md)** - Contexte technique pour contributeurs
- **[PHASE1_AUDIT_REPORT.md](PHASE1_AUDIT_REPORT.md)** - Rapport Phase 1 (100% couverture tests)
- **[PHASE2_PERFORMANCE_REPORT.md](PHASE2_PERFORMANCE_REPORT.md)** - Rapport Phase 2 (mesures performance + cache)

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
