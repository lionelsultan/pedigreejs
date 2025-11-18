# Audit EXHAUSTIF - Add Partner (3ème passe - ANALYSE COMPLÈTE)

**Date:** 2025-02-18
**Type:** Root Cause Analysis EXHAUSTIVE
**Statut:** 🔴 MULTIPLES BUGS CRITIQUES DÉCOUVERTS

---

## 🚨 BUGS CRITIQUES IDENTIFIÉS

### BUG #1: Sexe 'U' casse mother/father assignment 🔴 CRITIQUE

**Fichier:** `es/widgets-add.js:252-253`

**Code problématique:**
```javascript
child.mother = (tree_node.data.sex === 'F' ? tree_node.data.name : partner.name);
child.father = (tree_node.data.sex === 'F' ? partner.name : tree_node.data.name);
```

**Problème:** Si `tree_node.data.sex === 'U'`:
- Condition `=== 'F'` est false
- child.mother = partner.name (où partner.sex = 'U') ❌
- child.father = tree_node.data.name (où tree_node.sex = 'U') ❌

**Conséquence:**
- mother n'est pas femme
- father n'est pas homme
- **getChildren() CASSE** (ligne 140 tree-utils.js vérifie `mother.sex === 'F'`)

**Impact:** Partner avec sex='U' → enfant → getChildren() retourne [] → get_partners() ne trouve pas le partner → RENDU CASSÉ

---

### BUG #2: getChildren() nécessite mother.sex === 'F' 🔴 CRITIQUE

**Fichier:** `es/tree-utils.js:137-151`

**Code:**
```javascript
export function getChildren(dataset, mother, father) {
    let children = [];
    let names = [];
    if(mother.sex === 'F')  // ← VÉRIFICATION STRICTE
        $.each(dataset, function(_i, p) {
            if(mother.name === p.mother)
                if(!father || father.name === p.father) {
                    if($.inArray(p.name, names) === -1 && !p.noparents){
                        children.push(p);
                        names.push(p.name);
                    }
                }
        });
    return children;
}
```

**Problème:** La fonction vérifie **STRICTEMENT** que `mother.sex === 'F'`

**Conséquence:** Si mother.sex !== 'F' (par exemple 'U'), retourne [] (vide)

**Impact sur addpartner:** Si partner sex='U' créé comme mother → getChildren retourne [] → cascade de bugs

---

### BUG #3: Logique mother/father inversée pour sex='U' 🔴 CRITIQUE

**Analyse du code addpartner:**

```javascript
// Ligne 206-212: Déterminer sexe partner
let partner_sex = 'U';  // Default
if(tree_node.data.sex === 'F') {
    partner_sex = 'M';  // OK
} else if(tree_node.data.sex === 'M') {
    partner_sex = 'F';  // OK
}
// Si sex='U', partner_sex reste 'U'

// Ligne 252-253: Assigner mother/father
child.mother = (tree_node.data.sex === 'F' ? tree_node.data.name : partner.name);
child.father = (tree_node.data.sex === 'F' ? partner.name : tree_node.data.name);
```

**Scénario problématique:**
```
tree_node: sex='U', name='person1'
partner: sex='U', name='partner1'

child.mother = (false ? 'person1' : 'partner1') = 'partner1'  ← sex='U'!
child.father = (false ? 'partner1' : 'person1') = 'person1'   ← sex='U'!
```

**Résultat:** mother ET father ont sex='U', ce qui CASSE getChildren()

---

### BUG #4: Insertion index potentiellement incorrect 🟡 MOYEN

**Fichier:** `es/widgets-add.js:236-244`

**Code:**
```javascript
let idx = utils.getIdxByName(dataset, tree_node.data.name);
if(tree_node.data.sex === 'F') {
    // person is female, insert male partner BEFORE (at person's position, shifting person right)
    // idx stays the same
} else {
    // person is male, insert female partner AFTER
    idx++;
}
dataset.splice(idx, 0, partner);
```

**Problème:** Si tree_node.data.sex === 'U':
- Condition 'F' est false
- idx++ est exécuté
- Partner inséré APRÈS, alors que convention male-female est indéfinie pour 'U'

**Impact:** Ordre potentiellement incorrect pour sex='U'

---

### BUG #5: child_idx calculé APRÈS insertion partner 🟡 MOYEN

**Fichier:** `es/widgets-add.js:257-260`

**Code:**
```javascript
let person_idx = utils.getIdxByName(dataset, tree_node.data.name);  // APRÈS splice
let partner_idx = utils.getIdxByName(dataset, partner.name);        // APRÈS splice
let child_idx = Math.max(person_idx, partner_idx) + 1;
```

**Problème:** Les index sont recalculés APRÈS `dataset.splice(idx, 0, partner)` ligne 244

**Conséquence:** person_idx a changé si partner inséré avant person

**Exemple:**
```
AVANT splice:
[father, mother, me]  → person_idx=2

splice(2, 0, partner):
[father, mother, partner, me]  → person_idx=3 maintenant!

child_idx = Math.max(3, 2) + 1 = 4  ← Correct par chance
```

**Analyse:** Actuellement fonctionne PAR CHANCE car Math.max prend le bon index, MAIS fragile

---

## 🔍 ANALYSE FLUX D'EXÉCUTION COMPLET

### Scénario 1: Person sex='F' (normal) ✅

```javascript
1. tree_node.data.sex = 'F'
2. partner_sex = 'M'
3. partner créé: {sex: 'M', ...}
4. idx = 2 (position de 'me')
5. idx reste 2 (sex='F')
6. splice(2, 0, partner) → [father, mother, partner(M), me(F), ...]
7. child.mother = 'me' (F) ✅
8. child.father = partner.name (M) ✅
9. getChildren(dataset, me) trouve enfant ✅
10. get_partners(me) trouve partner ✅
11. RENDU OK ✅
```

### Scénario 2: Person sex='M' (normal) ✅

```javascript
1. tree_node.data.sex = 'M'
2. partner_sex = 'F'
3. partner créé: {sex: 'F', ...}
4. idx = 2
5. idx++ → idx = 3
6. splice(3, 0, partner) → [father, mother, me(M), partner(F), ...]
7. child.mother = partner.name (F) ✅
8. child.father = 'me' (M) ✅
9. getChildren(dataset, partner) trouve enfant ✅
10. get_partners(me) trouve partner ✅
11. RENDU OK ✅
```

### Scénario 3: Person sex='U' (BUG) ❌

```javascript
1. tree_node.data.sex = 'U'
2. partner_sex = 'U'  ← Problème
3. partner créé: {sex: 'U', ...}
4. idx = 2
5. idx++ → idx = 3  ← Logique incorrecte
6. splice(3, 0, partner) → [father, mother, me(U), partner(U), ...]
7. child.mother = partner.name (U) ❌ PAS FEMME!
8. child.father = 'me' (U) ❌ PAS HOMME!
9. getChildren(dataset, partner) → ❌ RETOURNE [] (partner.sex !== 'F')
10. get_partners(me) → ❌ NE TROUVE PAS partner
11. RENDU CASSÉ ❌
```

---

## ✅ SOLUTIONS PROPOSÉES

### Solution #1: Forcer sex 'F' ou 'M' pour enfant (SIMPLE)

**Approche:** Ne jamais permettre sex='U' pour mother/father dans enfant

**Code:**
```javascript
// Déterminer qui est mother/father en fonction du sexe
let child_mother, child_father;

if(tree_node.data.sex === 'F') {
    // Person est femme → elle est mother
    child_mother = tree_node.data.name;
    child_father = partner.name;
} else if(tree_node.data.sex === 'M') {
    // Person est homme → il est father
    child_mother = partner.name;
    child_father = tree_node.data.name;
} else {
    // Person sex='U' → choisir arbitrairement ou forcer sexe
    // OPTION A: Forcer partner comme femme, person comme homme
    child_mother = partner.name;
    child_father = tree_node.data.name;
    // Mettre à jour les sexes pour cohérence
    partner.sex = 'F';
    tree_node.data.sex = 'M';
}

child.mother = child_mother;
child.father = child_father;
```

**Avantages:**
- ✅ Résout le problème getChildren()
- ✅ Assure cohérence
- ✅ Simple

**Inconvénients:**
- ❌ Force des sexes sur des personnes 'U'
- ❌ Modifie les données utilisateur

---

### Solution #2: Modifier getChildren() pour accepter sex='U' (COMPLEXE)

**Approche:** Modifier la logique getChildren() pour ne pas exiger sex='F'

**Code:**
```javascript
export function getChildren(dataset, mother, father) {
    let children = [];
    let names = [];
    // Chercher par mother.name sans vérifier sex
    $.each(dataset, function(_i, p) {
        if(mother.name === p.mother)
            if(!father || father.name === p.father) {
                if($.inArray(p.name, names) === -1 && !p.noparents){
                    children.push(p);
                    names.push(p.name);
                }
            }
    });
    return children;
}
```

**Avantages:**
- ✅ Support complet sex='U'
- ✅ Pas de modification des données

**Inconvénients:**
- ❌ Casse l'intention originale (mother DOIT être femme)
- ❌ Peut introduire des bugs ailleurs
- ❌ Impact sur tout le codebase

---

### Solution #3: Ne pas permettre sex='U' pour addpartner (SIMPLE ET SÛR)

**Approche:** Si person a sex='U', demander à l'utilisateur de choisir le sexe avant d'ajouter partner

**Code:**
```javascript
// Au début de addpartner
if(tree_node.data.sex === 'U') {
    throw utils.create_err('Cannot add partner to person with unspecified sex. Please set sex first.');
}
```

**Avantages:**
- ✅ Évite tous les problèmes
- ✅ Simple et sûr
- ✅ Force l'utilisateur à clarifier les données

**Inconvénients:**
- ❌ Limitation fonctionnelle
- ❌ UX moins bonne

---

## 🎯 RECOMMANDATION

**Je recommande Solution #1 avec variante:**

```javascript
// Si person ou partner a sex='U', on ne peut pas déterminer mother/father
// → Lancer une erreur explicative
if(tree_node.data.sex === 'U' || partner_sex === 'U') {
    throw utils.create_err(
        'Cannot add partner: person has unspecified sex (U). ' +
        'Please edit the person and set sex to M or F before adding a partner.'
    );
}

// Reste du code avec assertion que sex est 'M' ou 'F'
child.mother = (tree_node.data.sex === 'F' ? tree_node.data.name : partner.name);
child.father = (tree_node.data.sex === 'F' ? partner.name : tree_node.data.name);
```

**Pourquoi:**
1. ✅ **Sûr:** Évite tous les bugs liés à sex='U'
2. ✅ **Clair:** Erreur explicite guide l'utilisateur
3. ✅ **Simple:** Pas de modification complexe de getChildren()
4. ✅ **Cohérent:** Respecte l'architecture existante (mother DOIT être femme)

---

## 🧪 AUTRES BUGS POTENTIELS À VÉRIFIER

### Bug potentiel #6: Validation parents inexistants

**Code ligne 225-230:**
```javascript
if(tree_node.data.mother && utils.getIdxByName(dataset, tree_node.data.mother) !== -1) {
    partner.mother = tree_node.data.mother;
}
```

**Question:** Que se passe-t-il si mother n'existe PAS dans dataset?
**Réponse:** partner.mother n'est PAS assigné → OK (pas de bug)

**MAIS:** Si tree_node.data.mother existe dans le STRING mais PAS dans dataset, on a une référence orpheline
**Statut:** ✅ Déjà géré par la validation

---

### Bug potentiel #7: Partner déjà existant dans dataset

**Question:** Que se passe-t-il si on appelle addpartner deux fois de suite rapidement (double-click)?

**Analyse:**
- Phase 3.1.3 a ajouté `_widgetClickInProgress` protection (widgets.js:298-304)
- Timeout 300ms (ligne 342-344)
- ✅ Protégé contre double-click

---

### Bug potentiel #8: Dataset corrompu (circular references)

**Question:** Que se passe-t-il si mother/father créent une boucle?

**Exemple:**
```
A.mother = B
B.mother = A  ← BOUCLE!
```

**Analyse:**
- validate_pedigree() devrait détecter (validation.js)
- Si validation désactivée (opts.validate = false), boucle possible
- ✅ Hors scope addpartner (problème de validation)

---

## 📋 CHECKLIST VALIDATION

### Tests à effectuer

- [ ] Test 1: Person sex='F' → partner sex='M' ✅
- [ ] Test 2: Person sex='M' → partner sex='F' ✅
- [ ] Test 3: Person sex='U' → erreur claire
- [ ] Test 4: Person top_level → partner top_level
- [ ] Test 5: Person with parents → partner with same parents
- [ ] Test 6: Multiple partners (2, 3, 4)
- [ ] Test 7: get_partners() détecte tous les partners
- [ ] Test 8: Rendu visuel correct
- [ ] Test 9: Ordre dataset correct
- [ ] Test 10: Protection double-click

---

## 💡 CONCLUSION EXHAUSTIVE

### Bugs découverts

1. 🔴 **CRITIQUE:** sex='U' casse mother/father assignment
2. 🔴 **CRITIQUE:** getChildren() nécessite mother.sex='F'
3. 🔴 **CRITIQUE:** Logique mother/father inversée pour 'U'
4. 🟡 **MOYEN:** Insertion index incorrect pour 'U'
5. 🟡 **MOYEN:** child_idx recalculé après splice (fragile)

### Recommandation finale

**BLOQUER addpartner si sex='U' avec erreur explicite**

Cela résout TOUS les bugs critiques sans modifier l'architecture existante.

---

**Prochaine action:** Implémenter la solution et tester exhaustivement

**Fichier à créer:** `test_addpartner_exhaustive.html` (créé)

**Statut:** 🔴 **BUGS CRITIQUES IDENTIFIÉS - CORRECTION NÉCESSAIRE**

---
