# Plan d'actions - Amélioration PedigreeJS

*Document de suivi des corrections et améliorations identifiées dans l'audit de code*

**Créé le** : 2024-11-09
**Dernière mise à jour** : 2024-11-10
**Statut global** : 🟡 En cours

---

## 🎯 Vue d'ensemble

Suite à l'audit de code complet de PedigreeJS, ce plan d'actions détaille la stratégie de correction des 21 axes d'amélioration identifiés, organisés en 4 phases progressives.

**Estimation totale** : 6-10h de refactoring intensif

---

## 📊 État d'avancement global

| Phase | Statut | Avancement | Durée estimée | Durée réelle |
|-------|--------|------------|---------------|--------------|
| Phase 1 - Architecture critique | 🟢 **Terminé** | 100% | 2-3h | ~1h |
| Phase 2 - Performance | 🟡 **Planifié** | 0% | 1.5-2h | - |
| Phase 3 - Tests et documentation | 🔴 **À faire** | 0% | 1-2h | - |
| Phase 4 - Modernisation | 🔴 **À faire** | 0% | 1-2h | - |

**Légende statuts** : 🔴 À faire | 🟡 En cours | 🟢 Terminé | ⚠️ Bloqué

---

## 🚀 Phase 1 - Architecture critique (Priorité P1)

**Objectif** : Découpler les modules core et éliminer les dépendances circulaires
**Durée estimée** : 2-3h
**Durée réelle** : ~2h (refactoring 1h + audit 1h)
**Statut** : 🟢 **Terminé et Audité à 100%** (2024-11-10)

### Actions détaillées

#### 1.1 Scinder `utils.js` en modules thématiques
- **Statut** : 🟢 Terminé
- **Fichiers concernés** : `es/utils.js`
- **Action réalisée** :
  - ✅ Créé `es/validation.js` (234 LOC - fonctions validate_*)
  - ✅ Créé `es/dom.js` (173 LOC - manipulation DOM, UI, dimensions SVG)
  - ✅ Créé `es/tree-utils.js` (420 LOC - navigation arbre, construction, géométrie)
  - ✅ Réduit `es/utils.js` (775 → 75 LOC)
  - ✅ Maintenu compatibilité via ré-exports
- **Résultat** : Tous les tests passent (133 specs, 0 failures)

#### 1.2 Éliminer le state global
- **Statut** : 🟡 Partiellement fait
- **Fichiers concernés** : `es/utils.js`, `es/widgets.js`, `es/dragging.js`
- **Action réalisée** :
  - ✅ Variables `dragging` et `last_mouseover` déjà encapsulées dans widgets.js (scope module)
  - ⚠️ Variable `utils.roots` conservée (refactoring complexe nécessitant modifications multiples)
- **Note** : Refactoring complet de `roots` reporté à phase ultérieure

#### 1.3 Refactoring imports circulaires
- **Statut** : 🟢 Vérifié
- **Fichiers concernés** : `es/utils.js`, `es/pedcache.js`
- **Résultat** : Aucune dépendance circulaire détectée (utils → pedcache uniquement)
- **Livrable** : ✅ Graphe de dépendances acyclique confirmé

#### 1.4 Audit et tests complets Phase 1 ⭐ NOUVEAU
- **Statut** : 🟢 Terminé
- **Fichiers créés** :
  - `spec/javascripts/validation_spec.js` (246 LOC, ~25 specs)
  - `spec/javascripts/dom_spec.js` (227 LOC, ~22 specs)
  - `spec/javascripts/tree-utils_spec.js` (424 LOC, ~33 specs)
  - `PHASE1_AUDIT_REPORT.md` (250 LOC - rapport complet)
- **Fichiers modifiés** :
  - `es/index.js` - Ajout exports nouveaux modules pour testing
  - `es/dom.js` - Correction bug `is_fullscreen()` (undefined → boolean)
- **Résultat** :
  - ✅ **100% couverture** : 35/35 fonctions testées
  - ✅ **133 specs, 0 failures** (53 originaux + 80 nouveaux)
  - ✅ Bug de production corrigé
  - ✅ Documentation complète de l'audit

### Critères de validation Phase 1
- [x] `utils.js` < 300 LOC ✅ **75 LOC** (objectif dépassé : -90% vs baseline 775 LOC)
- [x] Aucune variable globale dans le scope window (sauf `utils.roots` reporté)
- [x] Aucune dépendance circulaire détectée ✅
- [x] Tests existants passent sans modification ✅ **133 specs, 0 failures**
- [x] **BONUS** : Couverture tests 100% nouveaux modules ✅ **35/35 fonctions testées**
- [x] **BONUS** : Bug production corrigé ✅ `is_fullscreen()` fixed

---

## ⚡ Phase 2 - Performance (Priorité P1-P2)

**Objectif** : Optimiser le rendu et les interactions utilisateur
**Durée estimée** : 1.5-2h (approche conservatrice)
**Statut** : 🟡 **Planifié - Approche conservatrice**
**Date de reprise prévue** : 2024-11-11

### ⚠️ Approche conservatrice choisie

**Principe** : "Mesurer d'abord, optimiser ensuite" - Éviter les optimisations prématurées

**Rationale** :
- 11 appels `$(document).trigger('rebuild')` détectés dans le code
- Performance réelle **non mesurée** à ce jour
- Refactoring du système de rebuild = **risque élevé** de régression
- Objectif : Valider que l'optimisation est **nécessaire** avant de modifier

### Actions détaillées (approche révisée)

#### 2.1 Mesurer la performance actuelle ⭐ PRIORITÉ
- **Statut** : 🔴 À faire
- **Fichiers concernés** : Nouveau `es/performance-monitor.js` ou `es/pedigree.js`
- **Action** :
  - ✅ Implémenter instrumentation Web Performance API
  - ✅ Mesurer temps de rebuild sur datasets : 10, 30, 50, 100 personnes
  - ✅ Établir baseline de performance réelle
  - ✅ Documenter résultats dans rapport
- **Livrable** : Rapport de performance avec métriques précises
- **Durée** : 30 min

#### 2.2 Résoudre TODO pedcache.js:98 ⭐ PRIORITÉ
- **Statut** : 🔴 À faire
- **Fichiers concernés** : `es/pedcache.js`
- **Action** :
  - ✅ Compléter implémentation array cache fallback
  - ✅ Implémenter LRU eviction simple
  - ✅ Documenter le fallback localStorage → array
  - ✅ Tests de non-régression
- **Livrable** : TODO résolu, cache array fonctionnel
- **Durée** : 30 min

#### 2.3 Décision éclairée sur optimisations ⭐ PRIORITÉ
- **Statut** : 🔴 À faire
- **Action** :
  - ✅ Analyser résultats des mesures
  - ✅ Décider si rebuild incrémental nécessaire (si > 100ms)
  - ✅ Décider si batching DOM nécessaire
  - ✅ Documenter décisions et justifications
- **Livrable** : Rapport d'analyse + décision pour suite Phase 2
- **Durée** : 30 min

#### 2.4 Implémenter rendu incrémental (SI NÉCESSAIRE)
- **Statut** : ⏸️ Conditionnel (selon résultats mesures)
- **Fichiers concernés** : `es/pedigree.js`, `es/widgets.js`
- **Action** :
  - Remplacer `$(document).trigger('rebuild')` par système de dirty checking
  - Identifier nœuds modifiés uniquement
  - Update partiel SVG au lieu de re-rendu complet
- **Livrable** : Temps de rebuild réduit de 70%+ sur modifications mineures
- **⚠️ Risque** : Élevé - Modification architecture centrale

#### 2.5 Batching operations DOM (SI NÉCESSAIRE)
- **Statut** : ⏸️ Conditionnel (selon résultats mesures)
- **Fichiers concernés** : Tous modules avec manipulations D3
- **Action** :
  - Grouper 258 opérations D3 identifiées avec `requestAnimationFrame`
  - Implémenter queue d'opérations DOM
- **Livrable** : Fluidité améliorée, pas de janking sur grandes modifications

### Critères de validation Phase 2 (approche conservatrice)
- [ ] Baseline de performance mesurée et documentée ⭐
- [ ] TODO pedcache.js:98 résolu ⭐
- [ ] Décision éclairée documentée sur suite des optimisations ⭐
- [ ] **SI** rebuild > 100ms : Implémentation rendu incrémental
- [ ] **SI** janking détecté : Batching DOM implémenté
- [ ] Tests existants passent (53 specs, 0 failures)

---

## 🧪 Phase 3 - Tests et documentation (Priorité P1-P2)

**Objectif** : Couvrir modules non testés et documenter APIs  
**Durée estimée** : 1-2h  
**Statut** : 🔴 **À faire**

### Actions détaillées

#### 3.1 Tests modules manquants
- **Statut** : 🔴 À faire
- **Fichiers concernés** : `spec/javascripts/`
- **Action** :
  - Créer `zoom_spec.js` (fonctions zoom, pan, scale_to_fit)
  - Créer `dragging_spec.js` (interactions drag & drop)
  - Créer `twins_spec.js` (logique jumeaux monozygotes/dizygotes)
- **Livrable** : Couverture modules critique à 100%

#### 3.2 Tests d'interface utilisateur
- **Statut** : 🔴 À faire
- **Fichiers concernés** : `spec/javascripts/widgets_spec.js`
- **Action** :
  - Tests événements click, hover, drag
  - Tests popup forms et validation
  - Tests interactions clavier
- **Livrable** : Couverture UI complète

#### 3.3 Documentation JSDoc
- **Statut** : 🔴 À faire
- **Fichiers concernés** : Tous modules `es/`
- **Action** :
  - JSDoc pour 103 fonctions exportées
  - Documentation paramètres et retours
  - Exemples d'utilisation
- **Livrable** : Documentation développeur complète

### Critères de validation Phase 3
- [ ] Couverture tests >80% (baseline à mesurer)
- [ ] Tous modules testés individuellement
- [ ] JSDoc généré sans erreurs
- [ ] Documentation APIs publiques complète

---

## 🔧 Phase 4 - Modernisation (Priorité P3)

**Objectif** : Améliorer DX et extensibilité  
**Durée estimée** : 1-2h  
**Statut** : 🔴 **À faire**

### Actions détaillées

#### 4.1 Build ES modules
- **Statut** : 🔴 À faire
- **Fichiers concernés** : `rollup.config.js`, `package.json`
- **Action** :
  - Ajouter output ESM à la configuration Rollup
  - Dual build IIFE + ESM
  - Export package.json avec "module" field
- **Livrable** : PedigreeJS intégrable dans frameworks modernes

#### 4.2 Types TypeScript
- **Statut** : 🔴 À faire
- **Fichiers concernés** : Nouveaux fichiers `.d.ts`
- **Action** :
  - Définir interfaces pour opts, dataset, nodes
  - Types pour APIs publiques
  - Configuration TypeScript basique
- **Livrable** : IntelliSense et validation types

#### 4.3 Architecture plugins
- **Statut** : 🔴 À faire
- **Fichiers concernés** : `es/widgets.js`, architecture générale
- **Action** :
  - Système de registration widgets custom
  - Event bus pour communication inter-modules
  - Configuration externalisée
- **Livrable** : Extensibilité sans modification core

### Critères de validation Phase 4
- [ ] Build ESM fonctionnel
- [ ] Types TypeScript valides
- [ ] Plugin système démonstrable
- [ ] Intégration React/Vue testée

---

## ❌ Éléments non couverts (nécessitent infrastructure externe)

### Limitations techniques identifiées
- **Tests cross-browser** : Requiert infrastructure CI étendue
- **Intégration continue** : Configuration GitHub Actions hors scope
- **Web Workers** : Complexité importante, découplage calculs
- **Tests end-to-end** : Cypress/Playwright nécessitent setup dédié

### Actions futures possibles
- Configuration CI/CD avec GitHub Actions
- Pipeline de tests automatiques multi-navigateurs
- Intégration outils de monitoring performance
- Setup environnement de développement Dockerisé

---

## 📝 Notes de suivi

### 2024-11-10 - Audit complet Phase 1 - 100% couverture
- **Audit exhaustif** : 897 LOC de tests créés
- **Couverture 100%** : 35/35 fonctions Phase 1 testées
- **133 specs, 0 failures** (53 originaux + 80 nouveaux)
- **Bug production** corrigé : `is_fullscreen()` retournait undefined
- **Rapport complet** : PHASE1_AUDIT_REPORT.md créé
- **Commit** : "test: add comprehensive Phase 1 tests with 100% coverage"

### 2024-11-10 - Fin de session - Phase 1 terminée
- Phase 1 refactoring complétée avec succès (~1h)
- Analyse Phase 2 effectuée
- **Décision** : Approche conservatrice pour Phase 2 (mesurer avant d'optimiser)
- Audit Phase 1 demandé et réalisé (~1h)
- Session suspendue, reprise prévue 2024-11-11

### 2024-11-09 - Initialisation
- Création du plan d'actions basé sur audit de code
- Définition des 4 phases et critères de validation
- Estimation durées et identification des risques

---

## 🔗 Références

- **Audit complet** : `AUDIT_PEDIGREEJS.md`
- **Code source** : `/es/` (4 500 LOC)
- **Tests actuels** : `/spec/javascripts/pedigree_spec.js` (685 LOC)
- **Configuration** : `rollup.config.js`, `package.json`, `.eslintrc.js`

---

*Ce document sera mis à jour au fur et à mesure de l'avancement des travaux de refactoring.*