# Instructions de Validation - Phase 3.1

**Date** : 2025-11-11
**Statut** : Prêt pour validation

---

## ✅ SERVEUR DE TESTS JASMINE ACTIF

Le serveur de tests Jasmine est **en cours d'exécution** sur :

### 🔗 http://localhost:8888

---

## 📋 ÉTAPE 1 : Tests automatisés Jasmine

### Procédure

1. **Ouvrir votre navigateur** (Chrome, Firefox ou Safari)

2. **Naviguer vers** : http://localhost:8888

3. **Attendre le chargement** des tests (quelques secondes)

4. **Vérifier le résultat** en haut de la page :
   - ✅ **Succès** : "**150 specs, 0 failures**" (en vert)
   - ❌ **Échec** : "X specs, Y failures" (en rouge)

### Résultat attendu

```
Jasmine Browser Runner
150 specs, 0 failures
Finished in X.XXX seconds
```

### Si tous les tests passent ✅

➡️ **Les 5 corrections critiques n'introduisent AUCUNE régression**

Vous pouvez passer à l'**Étape 2** (tests manuels).

### Si des tests échouent ❌

1. **Noter** les specs qui échouent (nom du test)
2. **Copier** le message d'erreur
3. **Analyser** si lié aux modifications Phase 3.1 :
   - Race conditions (pedigree.js)
   - Clashes feedback (pedigree.js)
   - Double-clics (widgets.js)
   - Plusieurs partenaires (widgets.js)
   - Règles sexe (validation.js, popup_form.js, widgets.js)

4. **Signaler** le problème pour correction

---

## 📋 ÉTAPE 2 : Tests manuels (33 tests)

### Document de référence

📄 **PHASE3_VALIDATION_PLAN.md**

### Lancer le serveur d'application

```bash
npm run server
```

Puis ouvrir : **http://localhost:8001**

### Catégories de tests

#### Tests critiques (22 tests) - **PRIORITAIRES**

1. **Phase 3.1.1 - Race conditions** (3 tests)
   - Test 1.1 : Clics rapides sur undo ⚡
   - Test 1.2 : Survol pendant undo ⚡
   - Test 1.3 : Stress test race conditions ⚡⚡⚡

2. **Phase 3.1.2 - Feedback clashes** (4 tests)
   - Test 2.1 : Créer un clash simple 🔴
   - Test 2.2 : Plusieurs clashes 🔴🔴🔴
   - Test 2.3 : Résolution d'un clash ✅
   - Test 2.4 : Mode DEBUG 🐛

3. **Phase 3.1.3 - Double-clics** (5 tests)
   - Test 3.1 : Double-clic popup sexe 🖱️🖱️
   - Test 3.2 : Double-clic addpartner 🖱️🖱️
   - Test 3.3 : Double-clic delete 🖱️🖱️
   - Test 3.4 : Clics rapides successifs ⚡⚡⚡
   - Test 3.5 : Settings non bloqué ⚙️

4. **Phase 3.1.4 - Plusieurs partenaires** (4 tests)
   - Test 4.1 : Ajouter 2 partenaires successifs 🔗🔗
   - Test 4.2 : Remariage (cas réel) 💍💍
   - Test 4.3 : Trois partenaires 🔗🔗🔗
   - Test 4.4 : Widget toujours visible ♾️

5. **Phase 3.1.5 - Règles sexe** (5 tests)
   - Test 5.1 : Sans enfants - autorisé ✅
   - Test 5.2 : Avec enfants - interdit ❌
   - Test 5.3 : Sexe 'U' - autorisé ✅
   - Test 5.4 : Partenaire sans enfants ✅
   - Test 5.5 : Après suppression enfants ✅

#### Tests de régression (6 catégories)

- R1 : Undo/Redo
- R2 : Zoom/Pan
- R3 : Formulaire d'édition
- R4 : Widgets de base
- R5 : Jumeaux
- R6 : Labels

#### Tests de stress (3 tests)

- S1 : Pedigree 50+ personnes
- S2 : Manipulation intensive
- S3 : 10+ clashes

### Temps estimé

- **Tests critiques** : ~60 min
- **Tests régression** : ~30 min
- **Tests stress** : ~15 min
- **Total** : ~2h

---

## 📊 ÉTAPE 3 : Remplir le rapport

### Template

Voir section "RAPPORT DE VALIDATION" dans `PHASE3_VALIDATION_PLAN.md`

### Cocher au fur et à mesure

```markdown
## Tests Automatisés
- [x] npm test : 150 specs, 0 failures
- [x] Aucune régression détectée

## Tests Manuels (33 tests)
### Phase 3.1.1 - Race conditions (3 tests)
- [x] Test 1.1 : Clics rapides undo
- [x] Test 1.2 : Survol pendant undo
- [x] Test 1.3 : Stress test race conditions
...
```

---

## 🎯 CRITÈRES DE SUCCÈS

### ✅ Validation réussie si :

1. **Tests automatisés** : 150 specs, 0 failures
2. **Tests critiques** : Tous les 22 tests passent
3. **Tests régression** : Aucune régression détectée
4. **Tests stress** : Application stable
5. **Aucun bug bloquant** : Pas de crash, pas de perte de données

### ⚠️ Si problème détecté

1. Noter précisément le test qui échoue
2. Décrire le comportement observé vs attendu
3. Prendre screenshot si problème visuel
4. Copier erreurs console si crash
5. Signaler pour correction

---

## 🚀 APRÈS VALIDATION

### Si succès ✅

**Phase 3.1 est validée et prête pour production**

Options :
- **Option A** : Déployer les corrections en production
- **Option B** : Continuer avec Phase 3.2 (9 améliorations UX majeures)
- **Option C** : Pause et revue avant de continuer

### Si échec ❌

**Corrections nécessaires avant production**

1. Analyser les problèmes détectés
2. Corriger les bugs
3. Re-tester
4. Recommencer la validation

---

## 📞 SUPPORT

### Documentation disponible

- `PHASE3_VALIDATION_PLAN.md` - Plan détaillé des tests
- `PHASE3.1_COMPLETION_REPORT.md` - Rapport de complétion
- `PHASE3_TASK_3.1.X_COMPLETION.md` - Détails par tâche (5 fichiers)
- `AUDIT_UX_UI_2025-11-11.md` - Audit initial

### Fichiers modifiés

- `es/pedigree.js` - Tâches 3.1.1 + 3.1.2
- `es/widgets.js` - Tâches 3.1.3 + 3.1.4
- `es/validation.js` - Tâche 3.1.5
- `es/popup_form.js` - Tâche 3.1.5

---

**🎯 COMMENCER MAINTENANT : http://localhost:8888**
