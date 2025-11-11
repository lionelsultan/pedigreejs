# Plan de Validation Phase 3.1 - Corrections Critiques

**Date** : 2025-11-11
**Phase** : 3.1 - Corrections critiques (5 tâches)
**Objectif** : Valider que les 5 corrections critiques fonctionnent sans régression

---

## 📋 RÉSUMÉ EXÉCUTIF

### Corrections implémentées (5/5)
- ✅ **3.1.1** : Protection race conditions rebuild
- ✅ **3.1.2** : Feedback visuel clashes de liens
- ✅ **3.1.3** : Protection double-clics widgets
- ✅ **3.1.4** : Autorisation plusieurs partenaires
- ✅ **3.1.5** : Unification règles changement sexe

### Plan de validation
1. **Tests automatisés** : 150 specs Jasmine (npm test)
2. **Tests manuels** : 33 tests définis (voir sections ci-dessous)
3. **Tests de régression** : Vérifier fonctionnalités existantes
4. **Tests de stress** : Pedigrees complexes (50+ personnes)

---

## 🧪 TESTS AUTOMATISÉS

### Commande
```bash
npm test
```

### Résultat attendu
```
150 specs, 0 failures
```

### Que vérifient ces tests ?
- Validation de données (age/yob, sexe parents, etc.)
- Structure d'arbre (liens parents-enfants)
- Cache undo/redo
- Fonctions utilitaires (getNodeByName, get_partners, etc.)
- Layout et positionnement

### Actions si échec
1. Noter les specs qui échouent
2. Analyser si liés aux modifications Phase 3.1
3. Corriger ou documenter les régressions

---

## 🖱️ TESTS MANUELS - PHASE 3.1.1 (Race conditions)

### Test 1.1 : Clics rapides sur undo ⚡
**Objectif** : Vérifier qu'aucun artefact visuel n'apparaît

**Procédure** :
1. Ouvrir http://localhost:8001
2. Créer un pedigree avec 10+ personnes
3. Effectuer 5-10 modifications (ajouts de nœuds)
4. Cliquer **très rapidement** sur undo (🔄) 10 fois
5. Observer le rendu

**✅ Résultat attendu** :
- Aucun artefact visuel
- Pedigree cohérent à chaque étape
- Tous les nœuds affichés correctement

**❌ Avant correction** :
- Nœuds partiellement affichés
- Liens manquants ou déformés

---

### Test 1.2 : Survol pendant undo ⚡
**Objectif** : Vérifier qu'aucun décalage de widgets n'apparaît

**Procédure** :
1. Créer un pedigree avec 5+ personnes
2. **Survoler un nœud** pour afficher les widgets
3. **Immédiatement** cliquer sur undo
4. Observer la position des widgets

**✅ Résultat attendu** :
- Widgets disparaissent ou apparaissent à la bonne position
- Aucun widget "fantôme" mal positionné

---

### Test 1.3 : Stress test race conditions ⚡⚡⚡
**Objectif** : Forcer des race conditions pour vérifier la robustesse

**Procédure** :
1. Ouvrir la console navigateur (F12)
2. Créer un pedigree avec 20+ personnes
3. Exécuter dans la console :
   ```javascript
   // Déclencher 10 rebuilds en 500ms
   for(let i=0; i<10; i++) {
       setTimeout(() => {
           $(document).trigger('rebuild', [ptree.opts]);
       }, i*50);
   }
   ```
4. Observer le rendu après 1 seconde

**✅ Résultat attendu** :
- Pedigree correctement affiché
- Aucun artefact visuel
- Aucune erreur JavaScript console

---

## 🖱️ TESTS MANUELS - PHASE 3.1.2 (Feedback clashes)

### Test 2.1 : Créer un clash simple 🔴
**Objectif** : Vérifier que le feedback visuel apparaît

**Procédure** :
1. Créer ce pedigree :
   ```
   Génération 1:  A(F) ---- B(M)     C(F) ---- D(M)
                     |                   |
   Génération 2:     E(F)                F(M)
   ```
2. Ajouter un partenariat entre E et F
3. Observer le lien E-F

**✅ Résultat attendu** :
- Le lien E-F est affiché en **rouge pointillé** (épaisseur 2.5px)
- Le tracé monte/descend pour éviter A et B
- Un badge d'avertissement apparaît en haut : "⚠️ Avertissement : 1 lien(s)..."
- Au survol du lien rouge, tooltip explicatif

**❌ Avant correction** :
- Lien affiché en noir normal
- Aucun avertissement

---

### Test 2.2 : Plusieurs clashes 🔴🔴🔴
**Objectif** : Vérifier que tous les clashes sont identifiés

**Procédure** :
1. Créer un pedigree avec 3 générations
2. Créer plusieurs liens de partenariat qui se croisent
   - Ex: cousins qui ont des enfants ensemble
3. Observer le nombre de liens rouges
4. Lire le message d'avertissement global

**✅ Résultat attendu** :
- Tous les liens problématiques sont en rouge pointillé
- Le message indique le nombre correct de clashes
- Chaque lien rouge a son tooltip

---

### Test 2.3 : Résolution d'un clash ✅
**Objectif** : Vérifier que le warning disparaît

**Procédure** :
1. Créer un pedigree avec un clash (Test 2.1)
2. Vérifier que le warning apparaît
3. Supprimer le lien qui cause le clash (supprimer E ou F)
4. Observer le pedigree après rebuild

**✅ Résultat attendu** :
- Le badge d'avertissement **disparaît** automatiquement
- Les liens restants sont en noir normal

---

### Test 2.4 : Mode DEBUG 🐛
**Objectif** : Vérifier que les logs DEBUG fonctionnent

**Procédure** :
1. Ouvrir console (F12)
2. Créer pedigree avec clash
3. Dans console :
   ```javascript
   let opts = ptree.opts;
   opts.DEBUG = true;
   $(document).trigger('rebuild', [opts]);
   ```
4. Observer la console

**✅ Résultat attendu** :
- Messages "CLASH ::" dans la console
- Badge d'avertissement **ne s'affiche PAS** (car DEBUG=true)
- Liens toujours en rouge pointillé

---

## 🖱️ TESTS MANUELS - PHASE 3.1.3 (Double-clics)

### Test 3.1 : Double-clic popup sexe 🖱️🖱️
**Objectif** : Vérifier qu'un seul nœud est créé

**Procédure** :
1. Créer un pedigree simple (3 personnes)
2. Survoler un nœud, cliquer sur "add child" (↓)
3. **Double-cliquer très rapidement** sur le carré (male)
4. Compter les enfants créés

**✅ Résultat attendu** :
- Un seul enfant créé
- Pas de doublon

**❌ Avant correction** :
- Deux enfants créés (doublon)

---

### Test 3.2 : Double-clic addpartner 🖱️🖱️
**Objectif** : Vérifier qu'un seul partenaire est créé

**Procédure** :
1. Créer un pedigree simple
2. Survoler un nœud
3. **Double-cliquer très rapidement** sur "add partner" (🔗)
4. Compter les partenaires créés

**✅ Résultat attendu** :
- Un seul partenaire créé
- Pas de doublon

---

### Test 3.3 : Double-clic delete 🖱️🖱️
**Objectif** : Vérifier qu'un seul nœud est supprimé

**Procédure** :
1. Créer un pedigree avec 5+ personnes
2. Survoler un nœud non-critique
3. **Double-cliquer très rapidement** sur delete (X)
4. Observer le résultat

**✅ Résultat attendu** :
- Le nœud est supprimé une seule fois
- Pas de comportement étrange

---

### Test 3.4 : Clics rapides successifs ⚡⚡⚡
**Objectif** : Vérifier protection entre différents widgets

**Procédure** :
1. Créer un pedigree simple
2. Survoler un nœud
3. Cliquer rapidement : add child → add sibling → add partner (< 1 sec entre chaque)
4. Observer le résultat

**✅ Résultat attendu** :
- Seule la première action est exécutée
- Les autres sont ignorées (protection 300ms)
- Après 300ms, les clics sont à nouveau acceptés

---

### Test 3.5 : Settings non bloqué ⚙️
**Objectif** : Vérifier que settings fonctionne pendant une action

**Procédure** :
1. Créer un pedigree
2. Cliquer sur "add child" → popup apparaît
3. Immédiatement cliquer sur settings (⚙) d'un autre nœud
4. Vérifier que le formulaire s'ouvre

**✅ Résultat attendu** :
- Le formulaire settings s'ouvre normalement
- Settings n'est pas bloqué par la protection

---

## 🖱️ TESTS MANUELS - PHASE 3.1.4 (Plusieurs partenaires)

### Test 4.1 : Ajouter 2 partenaires successifs 🔗🔗
**Objectif** : Vérifier qu'on peut ajouter un 2e partenaire

**Procédure** :
1. Créer un nœud A (femme)
2. Ajouter un partenaire B (homme)
3. Observer : A et B sont liés
4. **Survoler A à nouveau** et observer les widgets
5. Cliquer sur "add partner" et créer C (homme)

**✅ Résultat attendu** :
- Le widget "add partner" est **toujours visible** sur A
- A est maintenant lié à B ET C

**❌ Avant correction** :
- Le widget "add partner" **disparaît** après B
- Impossible d'ajouter C

---

### Test 4.2 : Remariage (cas réel) 💍💍
**Objectif** : Modéliser un cas réel de remariage

**Procédure** :
1. Créer : A (F) + partenaire B (M)
2. A et B ont 2 enfants (C et D)
3. Ajouter un 2e partenaire E (M) à A
4. Ajouter 1 enfant (F) au couple A-E
5. Observer le pedigree

**✅ Résultat attendu** :
- A liée à B (lien horizontal)
- A aussi liée à E (2e lien horizontal)
- C et D enfants de A-B
- F enfant de A-E
- Layout correct (pas de chevauchements)

---

### Test 4.3 : Trois partenaires 🔗🔗🔗
**Objectif** : Vérifier que le système gère 3+ partenaires

**Procédure** :
1. Créer un nœud A (M)
2. Ajouter 3 partenaires : B, C, D (tous F)
3. Ajouter 1 enfant pour chaque couple
4. Observer le pedigree

**✅ Résultat attendu** :
- A lié à B, C et D (3 liens horizontaux)
- Chaque couple a ses enfants
- Layout ajuste automatiquement
- Aucun crash ou erreur

---

### Test 4.4 : Widget addpartner toujours visible ♾️
**Objectif** : Vérifier pas de limite artificielle

**Procédure** :
1. Créer un nœud A
2. Ajouter 1 partenaire → observer widget
3. Ajouter 2e partenaire → observer widget
4. Ajouter 3e partenaire → observer widget
5. Ajouter 4e partenaire → observer widget

**✅ Résultat attendu** :
- Le widget addpartner est **toujours visible** à chaque étape
- Pas de limite artificielle

---

## 🖱️ TESTS MANUELS - PHASE 3.1.5 (Règles sexe unifiées)

### Test 5.1 : Personne sans enfants - Changement autorisé ✅
**Objectif** : Vérifier qu'on peut changer le sexe sans enfants

**Procédure** :
1. Créer : proband (F) + 2 frères (M)
2. Cliquer sur un frère → formulaire popup
3. Vérifier boutons radio M/F **activés** (cliquables)
4. Changer sexe M → F
5. Enregistrer
6. Ouvrir widget settings (⚙) du même nœud
7. Vérifier boutons radio **activés**

**✅ Résultat attendu** :
- Boutons radio activés dans popup
- Boutons radio activés dans widget settings
- Changement enregistré
- **Cohérence entre popup et widget**

---

### Test 5.2 : Personne avec enfants - Changement interdit ❌
**Objectif** : Vérifier qu'on ne peut PAS changer le sexe d'un parent

**Procédure** :
1. Créer : proband (F) avec mère (F) et père (M)
2. Ajouter un enfant au proband
3. Cliquer sur proband → formulaire popup
4. Vérifier boutons radio **désactivés** (grisés)
5. Ouvrir widget settings (⚙) du proband
6. Vérifier boutons radio **désactivés**

**✅ Résultat attendu** :
- Boutons radio désactivés dans popup
- Boutons radio désactivés dans widget
- Impossible de changer (protège cohérence)
- **Cohérence entre popup et widget**

**Justification** : Si proband (F) a un enfant, il est `mother`. Changer vers M casserait la cohérence.

---

### Test 5.3 : Sexe 'U' (unknown) - Changement autorisé ✅
**Objectif** : Vérifier qu'on peut toujours changer depuis 'U'

**Procédure** :
1. Créer un nœud de sexe 'U' (unknown)
2. Ajouter un enfant à ce nœud (nœud 'U' devient parent)
3. Ouvrir formulaire popup du nœud 'U'
4. Vérifier boutons radio M/F **activés**
5. Changer sexe vers M ou F
6. Enregistrer

**✅ Résultat attendu** :
- Boutons radio activés même si parent
- Changement autorisé
- Cohérence maintenue

**Justification** : 'U' est transitoire. On doit pouvoir le définir même si déjà parent.

---

### Test 5.4 : Partenaire sans enfants ✅
**Objectif** : Vérifier qu'un partenaire sans enfants peut changer

**Procédure** :
1. Créer : proband (F)
2. Ajouter partenaire (M) au proband → couple formé
3. **Ne pas ajouter d'enfant**
4. Ouvrir formulaire popup du partenaire
5. Vérifier boutons radio **activés**
6. Ouvrir widget settings du partenaire
7. Vérifier boutons radio **activés**

**✅ Résultat attendu** :
- Boutons radio activés dans popup
- Boutons radio activés dans widget
- Changement autorisé (pas encore parent)

**❌ Avant correction (popup_form ancien)** :
- Boutons radio désactivés à tort (vérifiait `parent_node`)

---

### Test 5.5 : Changement après suppression d'enfants ✅
**Objectif** : Vérifier que le sexe redevient modifiable

**Procédure** :
1. Créer : proband (F) + 2 enfants
2. Vérifier boutons radio proband **désactivés**
3. Supprimer les 2 enfants (widget delete)
4. Ouvrir formulaire popup du proband
5. Vérifier boutons radio **activés**

**✅ Résultat attendu** :
- Désactivés tant qu'il y a des enfants
- Activés après suppression des enfants
- Logique dynamique : `canChangeSex()` vérifie en temps réel

---

## 🧪 TESTS DE RÉGRESSION

### Fonctionnalités à vérifier (non modifiées mais à tester)

#### R1 : Undo/Redo
- ✅ Undo fonctionne (bouton actif quand historique)
- ✅ Redo fonctionne (bouton actif après undo)
- ✅ Historique préservé correctement

#### R2 : Zoom/Pan
- ✅ Zoom in/out fonctionne
- ✅ Pan (déplacement) fonctionne
- ✅ Reset zoom fonctionne
- ✅ Scale to fit fonctionne

#### R3 : Formulaire d'édition
- ✅ Tous les champs s'affichent
- ✅ Validation des champs fonctionne
- ✅ Enregistrement fonctionne
- ✅ Annulation fonctionne

#### R4 : Widgets de base
- ✅ Add sibling fonctionne
- ✅ Add parents fonctionne
- ✅ Add child fonctionne
- ✅ Delete fonctionne
- ✅ Settings fonctionne

#### R5 : Jumeaux
- ✅ Création de jumeaux MZ (monozygotes)
- ✅ Création de jumeaux DZ (dizygotes)
- ✅ Affichage correct des liens jumeaux

#### R6 : Labels
- ✅ Noms affichés correctement
- ✅ Ages affichés correctement
- ✅ Yob (year of birth) affiché
- ✅ Labels maladies affichés

---

## 🚀 TESTS DE STRESS

### S1 : Pedigree complexe (50+ personnes)
**Objectif** : Vérifier performance et stabilité

**Procédure** :
1. Charger ou créer un pedigree avec 50+ personnes
2. Effectuer toutes les opérations de base
3. Observer la performance (lag, lenteur)
4. Vérifier qu'aucune erreur n'apparaît

**✅ Résultat attendu** :
- Pedigree s'affiche correctement
- Opérations réactives (< 1 sec)
- Aucune erreur console
- Aucun crash

---

### S2 : Manipulation intensive
**Objectif** : Tester robustesse sous utilisation intensive

**Procédure** :
1. Créer un pedigree
2. Effectuer 50 opérations en 2 minutes :
   - Ajouts de nœuds
   - Suppressions
   - Modifications
   - Undo/Redo multiples
   - Zoom/Pan
3. Observer le comportement

**✅ Résultat attendu** :
- Application stable
- Pas de ralentissement progressif
- Pas de fuite mémoire (monitorer dans DevTools)
- Aucun crash

---

### S3 : Pedigree avec 10+ clashes
**Objectif** : Vérifier feedback visuel avec nombreux clashes

**Procédure** :
1. Créer un pedigree complexe avec liens croisés
2. Créer intentionnellement 10+ clashes
3. Observer l'affichage
4. Vérifier le badge d'avertissement

**✅ Résultat attendu** :
- Tous les liens problématiques en rouge
- Badge indique le nombre correct
- Performance acceptable
- Lisibilité préservée

---

## 📊 RAPPORT DE VALIDATION

### Template à remplir après tests

```markdown
# Rapport de Validation Phase 3.1
**Date** : [Date]
**Testeur** : [Nom]

## Tests Automatisés
- [ ] npm test : 150 specs, 0 failures
- [ ] Aucune régression détectée

## Tests Manuels (33 tests)
### Phase 3.1.1 - Race conditions (3 tests)
- [ ] Test 1.1 : Clics rapides undo
- [ ] Test 1.2 : Survol pendant undo
- [ ] Test 1.3 : Stress test race conditions

### Phase 3.1.2 - Feedback clashes (4 tests)
- [ ] Test 2.1 : Créer clash simple
- [ ] Test 2.2 : Plusieurs clashes
- [ ] Test 2.3 : Résolution clash
- [ ] Test 2.4 : Mode DEBUG

### Phase 3.1.3 - Double-clics (5 tests)
- [ ] Test 3.1 : Double-clic popup sexe
- [ ] Test 3.2 : Double-clic addpartner
- [ ] Test 3.3 : Double-clic delete
- [ ] Test 3.4 : Clics rapides successifs
- [ ] Test 3.5 : Settings non bloqué

### Phase 3.1.4 - Plusieurs partenaires (4 tests)
- [ ] Test 4.1 : Ajouter 2 partenaires
- [ ] Test 4.2 : Remariage (cas réel)
- [ ] Test 4.3 : Trois partenaires
- [ ] Test 4.4 : Widget toujours visible

### Phase 3.1.5 - Règles sexe (5 tests)
- [ ] Test 5.1 : Sans enfants - autorisé
- [ ] Test 5.2 : Avec enfants - interdit
- [ ] Test 5.3 : Sexe 'U' - autorisé
- [ ] Test 5.4 : Partenaire sans enfants
- [ ] Test 5.5 : Après suppression enfants

## Tests de Régression (6 catégories)
- [ ] R1 : Undo/Redo
- [ ] R2 : Zoom/Pan
- [ ] R3 : Formulaire édition
- [ ] R4 : Widgets de base
- [ ] R5 : Jumeaux
- [ ] R6 : Labels

## Tests de Stress (3 tests)
- [ ] S1 : Pedigree 50+ personnes
- [ ] S2 : Manipulation intensive
- [ ] S3 : 10+ clashes

## Problèmes Détectés
[Liste des problèmes trouvés avec reproduction]

## Recommandations
[Actions recommandées si problèmes]

## Conclusion
- [ ] Phase 3.1 validée et prête pour production
- [ ] Phase 3.1 nécessite corrections avant production
```

---

## 🎯 CRITÈRES DE SUCCÈS GLOBAUX

### ✅ Phase 3.1 est validée si :
1. **Tests automatisés** : 150 specs passent, 0 failures
2. **Tests manuels critiques** : Tous les tests des 5 tâches passent (22 tests)
3. **Tests de régression** : Aucune régression détectée (6 catégories)
4. **Tests de stress** : Application stable avec pedigrees complexes
5. **Aucun bug bloquant** : Pas de crash, pas de perte de données

### ⚠️ Actions si échec :
1. Documenter précisément le problème
2. Créer une issue GitHub avec reproduction
3. Corriger le bug
4. Re-tester
5. Committer la correction

---

## 📝 NOTES POUR LES TESTEURS

### Prérequis
- Navigateur moderne (Chrome, Firefox, Safari)
- Console développeur ouverte (F12)
- Connexion : http://localhost:8001 (lancer `npm run server`)

### Conseils
- Tester dans plusieurs navigateurs si possible
- Noter tous les comportements étranges, même mineurs
- Prendre des screenshots si problème visuel
- Copier les erreurs console si crash

### Temps estimé
- Tests automatisés : 5 min
- Tests manuels (33 tests) : 60 min
- Tests régression (6 catégories) : 30 min
- Tests stress (3 tests) : 15 min
- **Total : ~2h**

---

**Prêt pour validation ! Lancer `npm run server` puis ouvrir http://localhost:8001** 🚀
