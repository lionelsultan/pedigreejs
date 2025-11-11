# Plan d'actions - Amélioration PedigreeJS

*Document de suivi des corrections et améliorations identifiées dans l'audit de code*

**Créé le** : 2024-11-09
**Dernière mise à jour** : 2025-11-11 (Audit UX/UI + Phase 3 UX)
**Statut global** : 🟡 En cours

---

## 🎯 Vue d'ensemble

Suite à l'audit de code complet de PedigreeJS, ce plan d'actions détaille la stratégie de correction des 21 axes d'amélioration identifiés, organisés en 4 phases progressives.

**Estimation totale** : 6-10h de refactoring intensif

---

## 📊 État d'avancement global

| Phase | Statut | Avancement | Durée estimée | Durée réelle |
|-------|--------|------------|---------------|--------------|
| Phase 1 - Architecture critique | 🟢 **Terminé** | 100% | 2-3h | ~2h |
| Phase 2 - Performance | 🟢 **Terminé** | 100% | 1.5-2h | ~1.5h |
| **Phase 3 - Corrections UX/UI** ⭐ | 🔴 **À faire** | 0% | 6-8h | - |
| Phase 4 - Tests et documentation | 🔴 **À faire** | 0% | 1-2h | - |
| Phase 5 - Modernisation | 🔴 **À faire** | 0% | 1-2h | - |

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

**Objectif** : Mesurer performance et optimiser si nécessaire
**Durée estimée** : 1.5-2h (approche conservatrice)
**Durée réelle** : ~1.5h (instrumentation 30 min + cache 1h)
**Statut** : 🟢 **Terminé** (2024-11-10)

### ✅ Résultat : Optimisations NON nécessaires

**Principe appliqué** : "Mesurer d'abord, optimiser ensuite" - Éviter les optimisations prématurées

**Conclusion** :
- ✅ Performance mesurée : 4-31ms pour 10-100 personnes
- ✅ **93-75% plus rapide** que le seuil de 100ms
- ❌ Rendu incrémental **NON nécessaire** (performances excellentes)
- ❌ Batching DOM **NON justifié** (temps largement acceptables)
- ✅ TODOs cache résolus (bonus)

### Actions détaillées (approche révisée)

#### 2.1 Mesurer la performance actuelle ⭐ PRIORITÉ
- **Statut** : 🟢 Terminé
- **Fichiers concernés** : `spec/javascripts/performance_spec.js` (nouveau)
- **Action réalisée** :
  - ✅ Implémenté instrumentation Web Performance API
  - ✅ Mesuré temps de rebuild sur datasets : 10, 30, 50, 100 personnes
  - ✅ Établi baseline de performance réelle
  - ✅ Documenté résultats dans PHASE2_PERFORMANCE_REPORT.md
- **Résultats** :
  - 10 personnes : 4ms
  - 30 personnes : 7ms
  - 50 personnes : 25ms
  - 100 personnes : 31ms
- **Livrable** : ✅ Tests performance (413 LOC) + rapport complet
- **Durée** : 30 min

#### 2.2 Résoudre TODO pedcache.js:98 ⭐ PRIORITÉ
- **Statut** : 🟢 Terminé
- **Fichiers concernés** : `es/pedcache.js`, `spec/javascripts/pedcache_spec.js` (nouveau)
- **Action réalisée** :
  - ✅ Complété implémentation array cache fallback
  - ✅ Implémenté LRU eviction simple (FIFO, max 500 entrées)
  - ✅ Implémenté position storage en mode array (setposition/getposition)
  - ✅ Créé serialize_dataset() pour gérer références circulaires D3
  - ✅ Documenté le fallback localStorage → array
  - ✅ Tests de non-régression (12 nouveaux tests)
- **Livrable** : ✅ TODOs résolus (98 + 206), tests (287 LOC), +58 LOC pedcache.js
- **Durée** : 1h

#### 2.3 Décision éclairée sur optimisations ⭐ PRIORITÉ
- **Statut** : 🟢 Terminé
- **Action réalisée** :
  - ✅ Analysé résultats des mesures
  - ✅ Décidé : rebuild incrémental **NON nécessaire** (7-25ms << 100ms)
  - ✅ Décidé : batching DOM **NON nécessaire** (performances excellentes)
  - ✅ Documenté décisions et justifications
- **Décision** : ❌ Pas d'optimisations supplémentaires requises
- **Livrable** : ✅ Rapport complet avec recommandations Phase 3
- **Durée** : Inclus dans 2.1

#### 2.4 Implémenter rendu incrémental (SI NÉCESSAIRE)
- **Statut** : ⏭️ **NON REQUIS** (performances excellentes)
- **Fichiers concernés** : N/A
- **Décision** :
  - ❌ Rendu incrémental **non nécessaire**
  - Rebuild complet en 7-25ms pour datasets moyens
  - Modification architecture centrale **non justifiée**
- **Risque évité** : Refactoring complexe et risqué sans bénéfice

#### 2.5 Batching operations DOM (SI NÉCESSAIRE)
- **Statut** : ⏭️ **NON REQUIS** (performances excellentes)
- **Fichiers concernés** : N/A
- **Décision** :
  - ❌ Batching DOM **non nécessaire**
  - Aucun janking détecté dans les mesures
  - Temps totaux largement sous seuil acceptable
- **Risque évité** : Complexification code sans gain utilisateur

### Critères de validation Phase 2 (approche conservatrice)
- [x] Baseline de performance mesurée et documentée ⭐ ✅ **4-31ms mesurés**
- [x] TODO pedcache.js:98 résolu ⭐ ✅ **LRU eviction implémenté**
- [x] TODO pedcache.js:206 résolu (bonus) ✅ **Position array mode**
- [x] Décision éclairée documentée sur suite des optimisations ⭐ ✅ **Rapport complet**
- [x] **SI** rebuild > 100ms : Implémentation rendu incrémental → ✅ **NON requis (7-25ms)**
- [x] **SI** janking détecté : Batching DOM implémenté → ✅ **NON requis (fluide)**
- [x] Tests existants passent ✅ **150 specs, 0 failures** (+17 nouveaux tests)

---

## 🎨 Phase 3 - Corrections UX/UI (Priorité P1) ⭐ NOUVEAU

**Objectif** : Corriger les incohérences UX/UI ↔ logique technique identifiées dans l'audit
**Durée estimée** : 6-8h
**Statut** : 🔴 **À faire**
**Basé sur** : AUDIT_UX_UI_2025-11-11.md (score actuel : 6.9/10)

### 📋 Plan détaillé disponible

Un plan d'action complet a été créé dans **`PHASE3_PLAN_ACTIONS_UX.md`** avec :
- 19 problèmes identifiés (5 critiques 🔴, 9 majeurs ⚠️, 5 mineurs 🟡)
- Découpage en 3 sous-phases (3.1 Critiques, 3.2 UX, 3.3 Polish)
- Solutions techniques détaillées pour chaque problème
- Tests à effectuer et critères de succès
- Ordre d'exécution recommandé

### Résumé des problèmes critiques (🔴)

1. **Race condition dans rebuild** - Artefacts visuels lors de manipulations rapides
2. **Clashes de liens sans feedback** - Liens qui se croisent sans avertissement visuel
3. **Double-clic crée des doublons** - Protection manquante sur les widgets
4. **Logique addpartner incohérente** - Impossible d'ajouter plusieurs partenaires
5. **Règles de sexe conflictuelles** - Incohérence entre formulaire et éditeur

### Phase 3.1 - Corrections critiques (3-4h) - **EN COURS**

**Tâches prioritaires** :
- ✅ **3.1.1 : Race condition rebuild (30 min)** - Flag `_isBuilding` ✅ **COMPLÉTÉ** (2025-11-11)
- 🔴 3.1.2 : Feedback visuel clashes (1h) - Liens rouges + tooltips
- ✅ **3.1.3 : Débounce widgets (25 min)** - Protection double-clic ✅ **COMPLÉTÉ** (2025-11-11)
- ⚠️ 3.1.4 : Logique addpartner (1h) - Revoir conditions de visibilité (analyse requise)
- 🔴 3.1.5 : Unifier règles sexe (45 min) - Fonction `canChangeSex()` partagée **← PROCHAINE**

**Progression** : 2/5 tâches complétées (40%)
**Temps passé** : 55 min (objectif : 3-4h) - Excellent progrès !

### Phase 3.2 - Améliorations UX (2-3h)

**Tâches importantes** :
- Réactivation auto champs pathologie
- Feedback visuel drag consanguineous
- Préserver zoom en fullscreen
- Sélection sexe jumeaux dizygotes
- Corriger `keep_proband_on_reset`

### Phase 3.3 - Polish et optimisations (1-2h)

**Améliorations cosmétiques** (optionnel) :
- Tooltips boutons zoom
- Optimiser triggers `fhChange`
- Assouplir validation age/yob
- Documenter mode DEBUG
- Indicateurs visuels données invalides

### Critères de validation Phase 3

- [ ] Score UX/UI global : 6.9/10 → **8.5/10** (objectif)
- [ ] 5 problèmes critiques → **0 problème** (tous corrigés)
- [ ] 9 problèmes majeurs → **≤3 problèmes** (au moins 6 corrigés)
- [ ] Aucune régression : **150 specs passent** toujours
- [ ] Aucune race condition détectée en tests stress
- [ ] Feedback visuel clair pour toutes les interactions

### Livrables attendus

- [ ] **Code** : Modifications dans `pedigree.js`, `widgets.js`, `popup_form.js`, `pbuttons.js`, `zoom.js`, `validation.js`
- [ ] **Tests** : Ajout de tests si nécessaire, tous les tests passent
- [ ] **Documentation** : `PHASE3_COMPLETION_REPORT.md` avec avant/après, nouveau score UX/UI
- [ ] **Commits** : Commits atomiques par tâche avec messages descriptifs

### 🚦 Ordre recommandé d'exécution

**Semaine 1 - Critiques** : Tâches 3.1.1 → 3.1.3 → 3.1.5 → 3.1.2 → 3.1.4 (analyse requise)
**Semaine 2 - UX** : Tâches 3.2.x selon priorités projet
**Semaine 3 - Polish** : Tâches 3.3.x selon temps disponible (optionnel)

---

## 🧪 Phase 4 - Tests et documentation (Priorité P1-P2)

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

## 🔧 Phase 5 - Modernisation (Priorité P3)

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

### 2024-11-10 - Bug visuel critique corrigé - Ligne parent-partner
- **Bug identifié** : Ligne de connexion visuelle apparaissait du parent vers le partner au lieu de rester sur le fils
- **Type de bug** : Visuel (rendu SVG) - pas un bug de données
- **Cause racine** : `getChildren()` dans `tree-utils.js` ignorait le flag `noparents` lors de la construction de l'arbre
- **Investigation** :
  - ✅ Première approche incorrecte : enlever mother/father du partner → cassait la structure du dataset
  - ✅ Diagnostic final : `getChildren()` retournait tous les enfants sans vérifier `noparents`
  - ✅ Comparaison : `getAllChildren()` avait déjà la vérification `!('noparents' in p)`
- **Solution finale** :
  - `tree-utils.js:81` - Ajout de `&& !p.noparents` à la condition
  - Simple, élégant, aucun impact sur la structure des données
- **Modifications** :
  - `es/tree-utils.js:81` - Une seule ligne modifiée
  - `spec/javascripts/pedigree_spec.js:396-429` - Test de non-régression complet
  - `build/` - Bundles reconstruits
- **Test de non-régression** :
  - Vérifie que `getChildren()` exclut les partners avec `noparents=true`
  - Vérifie que le nombre d'enfants reste correct après ajout de partner
  - Vérifie que le partner existe bien dans le dataset avec `noparents=true`
- **Build** : ✅ Réussi sans erreur
- **Impact** : Bug visuel critique corrigé, structure du dataset préservée, aucune régression

### 2024-11-10 - Documentation et site web - Accessibilité complète
- **Refonte index.html** : 760 → 1131 LOC (WCAG 2.1 AA compliant)
- **Accessibilité** : Skip navigation, ARIA, sémantique HTML5, contraste couleurs
- **Design moderne** : Système de tokens CSS, palette bleue, responsive typography
- **SEO** : Meta tags, Open Graph, structure sémantique
- **UX** : Print styles, reduced motion, focus management
- **Documentation** : Mise à jour tous fichiers markdown (README, SESSION_CONTEXT, PLAN_ACTIONS)
- **Commits** :
  - `docs: Update documentation for Phase 2 completion`
  - `docs: Update index.html with Phase 1 & 2 improvements`
  - `style: Modernize index.html design with blue theme`
  - `a11y: Complete accessibility overhaul (WCAG 2.1 AA compliant)`

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