# Plan d'actions - Amélioration PedigreeJS

*Document de suivi des corrections et améliorations identifiées dans l'audit de code*

**Créé le** : 2024-11-09  
**Dernière mise à jour** : 2024-11-09  
**Statut global** : 🟡 Planification

---

## 🎯 Vue d'ensemble

Suite à l'audit de code complet de PedigreeJS, ce plan d'actions détaille la stratégie de correction des 21 axes d'amélioration identifiés, organisés en 4 phases progressives.

**Estimation totale** : 6-10h de refactoring intensif

---

## 📊 État d'avancement global

| Phase | Statut | Avancement | Durée estimée | Durée réelle |
|-------|--------|------------|---------------|--------------|
| Phase 1 - Architecture critique | 🔴 **À faire** | 0% | 2-3h | - |
| Phase 2 - Performance | 🔴 **À faire** | 0% | 2-3h | - |
| Phase 3 - Tests et documentation | 🔴 **À faire** | 0% | 1-2h | - |
| Phase 4 - Modernisation | 🔴 **À faire** | 0% | 1-2h | - |

**Légende statuts** : 🔴 À faire | 🟡 En cours | 🟢 Terminé | ⚠️ Bloqué

---

## 🚀 Phase 1 - Architecture critique (Priorité P1)

**Objectif** : Découpler les modules core et éliminer les dépendances circulaires  
**Durée estimée** : 2-3h  
**Statut** : 🔴 **À faire**

### Actions détaillées

#### 1.1 Scinder `utils.js` en modules thématiques
- **Statut** : 🔴 À faire
- **Fichiers concernés** : `es/utils.js`
- **Action** : 
  - Créer `es/validation.js` (fonctions validate_*)
  - Créer `es/dom.js` (manipulation DOM, getNodeByName, etc.)
  - Créer `es/math.js` (calculs géométriques, overlap, etc.)
  - Mettre à jour tous les imports dans les modules dépendants
- **Risques** : Impact sur 8+ modules, tests de régression nécessaires

#### 1.2 Éliminer le state global
- **Statut** : 🔴 À faire  
- **Fichiers concernés** : `es/utils.js`, `es/widgets.js`, `es/dragging.js`
- **Action** :
  - Encapsuler `utils.roots` dans une classe PedigreeState
  - Éliminer `dragging` et `last_mouseover` globaux
  - Passer state via paramètres ou context
- **Livrable** : Variables globales éliminées, state encapsulé

#### 1.3 Refactoring imports circulaires
- **Statut** : 🔴 À faire
- **Fichiers concernés** : `es/utils.js`, `es/pedcache.js`
- **Action** : Créer module de configuration partagé pour réduire dépendances croisées
- **Livrable** : Graphe de dépendances acyclique

### Critères de validation Phase 1
- [ ] `utils.js` < 300 LOC (actuellement 775 LOC)
- [ ] Aucune variable globale dans le scope window
- [ ] Aucune dépendance circulaire détectée
- [ ] Tests existants passent sans modification

---

## ⚡ Phase 2 - Performance (Priorité P1-P2)

**Objectif** : Optimiser le rendu et les interactions utilisateur  
**Durée estimée** : 2-3h  
**Statut** : 🔴 **À faire**

### Actions détaillées

#### 2.1 Implémenter rendu incrémental
- **Statut** : 🔴 À faire
- **Fichiers concernés** : `es/pedigree.js`, `es/widgets.js`
- **Action** :
  - Remplacer `$(document).trigger('rebuild')` par système de dirty checking
  - Identifier nœuds modifiés uniquement
  - Update partiel SVG au lieu de re-rendu complet
- **Livrable** : Temps de rebuild réduit de 70%+ sur modifications mineures

#### 2.2 Batching operations DOM
- **Statut** : 🔴 À faire
- **Fichiers concernés** : Tous modules avec manipulations D3
- **Action** :
  - Grouper 258 opérations D3 identifiées avec `requestAnimationFrame`
  - Implémenter queue d'opérations DOM
- **Livrable** : Fluidité améliorée, pas de janking sur grandes modifications

#### 2.3 Cache intelligent
- **Statut** : 🔴 À faire
- **Fichiers concernés** : `es/pedcache.js`
- **Action** :
  - Résoudre TODO ligne 98 sur array cache
  - Implémenter LRU eviction
  - Optimiser invalidation cache
- **Livrable** : TODO pedcache.js résolu, cache efficace

### Critères de validation Phase 2
- [ ] Rebuild <100ms sur dataset 50 personnes (baseline à mesurer)
- [ ] Aucun setTimeout/setInterval non justifié
- [ ] Cache LRU fonctionnel avec eviction
- [ ] Performance mesurée avec Web Performance API

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