# Audit Complet: Fonctionnalité "Add Partner"

**Date:** 2025-02-18
**Type:** Audit technique, fonctionnel, et UX/UI
**Fichiers concernés:**
- `es/widgets-add.js` (fonction addpartner)
- `es/widgets.js` (widget click handler)

---

## 🔍 PROBLÈMES IDENTIFIÉS

### Catégorie 1: Problèmes Techniques Critiques

#### ❌ P1.1: Gestion incorrecte du sexe 'U' (unspecified)
**Ligne:** 205
**Code actuel:**
```javascript
let partner = {"name": utils.makeid(4), "sex": tree_node.data.sex === 'F' ? 'M' : 'F'};
```
**Problème:** Si la personne a un sexe 'U' (unspecified), le partenaire sera 'F', ce qui n'est pas logique.
**Impact:** Partner incorrect si personne de sexe indéterminé
**Sévérité:** 🟡 Moyen

#### ❌ P1.2: Ordre d'assignation dataset incorrect
**Ligne:** widgets.js:333-334
**Code actuel:**
```javascript
addpartner(opts, newdataset, d.data.name);  // Ligne 333
opts.dataset = newdataset;                   // Ligne 334
```
**Problème:** addpartner est appelé AVANT que opts.dataset soit mis à jour. Si addpartner utilise opts.dataset en interne, il verra l'ancien dataset.
**Impact:** Potentiel usage de données obsolètes
**Sévérité:** 🔴 Élevé

#### ❌ P1.3: Enfant toujours de sexe masculin
**Ligne:** 227
**Code actuel:**
```javascript
let child = {"name": utils.makeid(4), "sex": "M"};
```
**Problème:** L'enfant est hardcodé en "M" sans raison apparente
**Impact:** Pas de diversité, biais dans les données
**Sévérité:** 🟡 Moyen

#### ❌ P1.4: Création d'enfant sans vérifier enfants existants
**Ligne:** 226-236
**Problème:** addpartner crée TOUJOURS un nouvel enfant, même si la personne a déjà des enfants avec d'autres partenaires
**Impact:** Enfants inutiles créés, pollution du pedigree
**Sévérité:** 🔴 Élevé - **BUG FONCTIONNEL MAJEUR**

**Exemple:**
```
me (F) ─ partner1 (M)
        │
      child1

// Ajouter partner2 à "me" → crée child2 inutile
me (F) ─ partner1 (M)     me (F) ─ partner2 (M)
        │                         │
      child1                    child2 ← INUTILE!
```

#### ❌ P1.5: Pas de validation de l'existence de mother/father
**Ligne:** 209-210
**Problème:** Copie mother/father sans vérifier qu'ils existent dans le dataset
**Impact:** Références orphelines possibles
**Sévérité:** 🟡 Moyen

---

### Catégorie 2: Problèmes Fonctionnels

#### ❌ P2.1: Insertion enfant casse ordre siblings
**Ligne:** 235
**Code actuel:**
```javascript
let child_idx = Math.max(person_idx, partner_idx) + 1;
dataset.splice(child_idx, 0, child);
```
**Problème:** Si person/partner ont déjà des enfants après eux dans le dataset, le nouvel enfant sera inséré AVANT les siblings existants, cassant leur ordre.

**Exemple avant fix:**
```
Dataset: [father, mother, me, sibling1, sibling2]
Ajouter partner à "me" →
Dataset: [father, mother, partner, me, child, sibling1, sibling2]
                                    ^^^^ Inséré entre me et sibling1!
```
**Impact:** Ordre des enfants incorrect
**Sévérité:** 🟡 Moyen

#### ❌ P2.2: Pas de support twins pour enfant créé
**Ligne:** 227
**Problème:** L'enfant créé ne peut pas être défini comme jumeau (mztwin/dztwin)
**Impact:** Limitation fonctionnelle
**Sévérité:** 🟡 Faible

#### ❌ P2.3: noparents=true mais partner pourrait être sibling réel
**Ligne:** 212
**Problème:** Le partner a toujours noparents=true, mais si c'est un sibling de la personne (consanguinité), les lignes vers parents devraient être visibles
**Impact:** Représentation incorrecte cas consanguins
**Sévérité:** 🟢 Faible (cas rare)

---

### Catégorie 3: Problèmes UX/UI

#### ❌ P3.1: Pas de choix du sexe du partenaire
**Ligne:** 205
**Problème:** Le sexe du partenaire est automatiquement l'opposé. L'utilisateur ne peut pas choisir.
**Impact:** Pas de support couples same-sex, limitation UX
**Sévérité:** 🔴 Élevé - **LIMITATION MAJEURE**

#### ❌ P3.2: Pas de choix du sexe de l'enfant
**Ligne:** 227
**Problème:** Enfant toujours "M", pas de choix
**Impact:** UX limitée
**Sévérité:** 🟡 Moyen

#### ❌ P3.3: Enfant créé sans consentement
**Ligne:** 226-236
**Problème:** Un enfant est TOUJOURS créé, même si l'utilisateur veut juste un partenaire sans enfant
**Impact:** Données non désirées, pollution
**Sévérité:** 🔴 Élevé - **MAUVAISE UX**

#### ❌ P3.4: Pas de feedback pendant l'action
**Problème:** Aucun indicateur visuel (spinner, message) pendant l'ajout
**Impact:** Utilisateur ne sait pas si ça fonctionne
**Sévérité:** 🟡 Moyen

#### ❌ P3.5: Pas de confirmation de succès
**Problème:** Aucun message de confirmation après l'ajout
**Impact:** Utilisateur doit chercher visuellement le résultat
**Sévérité:** 🟢 Faible

#### ❌ P3.6: Widget toujours visible
**Problème:** Le widget "add partner" est visible même dans des contextes où ça n'a pas de sens (ex: certains workflows)
**Impact:** Encombrement UI
**Sévérité:** 🟢 Faible

#### ❌ P3.7: Pas de nom/display_name pour partenaire
**Ligne:** 205
**Problème:** Le partenaire est créé avec seulement un ID random, pas de display_name
**Impact:** Partner apparaît sans nom, mauvaise UX
**Sévérité:** 🟡 Moyen

---

## 📊 RÉSUMÉ

**Total problèmes:** 17
- 🔴 Critiques: 5
- 🟡 Moyens: 8
- 🟢 Faibles: 4

**Catégories:**
- Technique: 5 problèmes
- Fonctionnel: 3 problèmes
- UX/UI: 7 problèmes

---

## 🎯 CORRECTIONS À IMPLÉMENTER

### Priorité 1 (Critique) - À corriger immédiatement

#### ✅ C1: Corriger ordre d'assignation dataset
**Avant:**
```javascript
addpartner(opts, newdataset, d.data.name);
opts.dataset = newdataset;
```
**Après:**
```javascript
opts.dataset = newdataset;
addpartner(opts, newdataset, d.data.name);
```

#### ✅ C2: Ne créer enfant que si nécessaire
**Logique:**
1. Vérifier si personne a déjà des enfants
2. Si OUI: ne pas créer d'enfant
3. Si NON: créer un enfant pour lier le couple

**Code:**
```javascript
// Check if person already has children
let existing_children = utils.getAllChildren(dataset, tree_node.data);
if(existing_children.length === 0) {
    // Create child only if person has no children
    let child = {"name": utils.makeid(4), "sex": "M"};
    // ... rest of child creation
}
```

#### ✅ C3: Support sexe 'U' (unspecified)
**Code:**
```javascript
// Handle unspecified sex correctly
let partner_sex = 'U';  // Default to unspecified
if(tree_node.data.sex === 'F') {
    partner_sex = 'M';
} else if(tree_node.data.sex === 'M') {
    partner_sex = 'F';
}
// If tree_node.data.sex === 'U', partner_sex stays 'U'
let partner = {"name": utils.makeid(4), "sex": partner_sex};
```

#### ✅ C4: Rendre enfant optionnel (UX)
**Approche:** Modifier le widget pour demander à l'utilisateur

**Option A: Dialog avant création**
```javascript
if(confirm("Voulez-vous créer un enfant pour ce couple?")) {
    // create child
}
```

**Option B: Deux widgets séparés**
- "add partner" (sans enfant)
- "add partner with child"

**Recommandation:** Option A (simple, pas de changement UI majeur)

### Priorité 2 (Moyen) - À corriger dans version suivante

#### ✅ C5: Sexe enfant aléatoire
```javascript
let child_sex = Math.random() < 0.5 ? 'M' : 'F';
let child = {"name": utils.makeid(4), "sex": child_sex};
```

#### ✅ C6: Ajouter display_name au partner
```javascript
let partner = {
    "name": utils.makeid(4),
    "sex": partner_sex,
    "display_name": "Partner"  // Default display name
};
```

#### ✅ C7: Validation mother/father existent
```javascript
if(tree_node.data.mother) {
    let mother_exists = utils.getIdxByName(dataset, tree_node.data.mother) !== -1;
    if(mother_exists) {
        partner.mother = tree_node.data.mother;
    }
}
// Same for father
```

### Priorité 3 (Faible) - Nice to have

#### ✅ C8: Message de confirmation
```javascript
if(opts.DEBUG || opts.messages) {
    console.log("Partner added successfully");
}
```

#### ✅ C9: Support twins pour enfant
```javascript
// Check if person's other children are twins, offer to make this child a twin too
```

---

## 📝 PLAN D'ACTION

### Phase 1: Corrections critiques (maintenant)
1. ✅ Ordre dataset (C1)
2. ✅ Enfant conditionnel (C2)
3. ✅ Support sexe U (C3)
4. ✅ Enfant optionnel dialog (C4)

### Phase 2: Améliorations moyennes (version suivante)
5. ✅ Sexe enfant aléatoire (C5)
6. ✅ Display_name partner (C6)
7. ✅ Validation parents (C7)

### Phase 3: Polissage (futur)
8. ✅ Message confirmation (C8)
9. ✅ Support twins (C9)
10. Widget conditionnel (contexte)

---

## 🧪 TESTS À EFFECTUER

### Test T1: Partner sans enfants existants
1. Personne sans enfants
2. Cliquer "add partner"
3. ✅ Dialog demande si créer enfant
4. ✅ Accepter: partner + enfant créés
5. ✅ Refuser: seulement partner créé

### Test T2: Partner avec enfants existants
1. Personne avec enfants existants
2. Cliquer "add partner"
3. ✅ Dialog ne demande PAS si créer enfant (pas nécessaire)
4. ✅ Seulement partner créé
5. ✅ Enfants existants liés au couple

### Test T3: Sexe U (unspecified)
1. Personne avec sex='U'
2. Cliquer "add partner"
3. ✅ Partner aussi sex='U'
4. ✅ Pas d'erreur

### Test T4: Multiple partners
1. Personne avec 1 partner existant
2. Ajouter 2ème partner
3. ✅ 2 partners correctement positionnés
4. ✅ Pas d'enfant dupliqué

### Test T5: Dataset ordering
1. Personne avec siblings après elle
2. Ajouter partner
3. ✅ Siblings restent après
4. ✅ Order correct: person, partner, [child?], siblings

---

## 💡 RECOMMANDATIONS FUTURES

### R1: Refactoring addpartner
La fonction est devenue complexe. Considérer:
- Séparer logique création partner vs enfant
- Fonction `createPartner()`
- Fonction `linkCouple()` (crée enfant si nécessaire)

### R2: Widget amélioré
- Right-click menu pour options
- "Add partner (no child)"
- "Add partner (with child)"
- "Add same-sex partner"

### R3: Validation robuste
- Ajouter pre-conditions check
- Ajouter post-conditions check
- Logging détaillé en mode DEBUG

---

**Audit effectué par:** Claude Code
**Date:** 2025-02-18
**Statut:** 🔴 Corrections critiques nécessaires

---
