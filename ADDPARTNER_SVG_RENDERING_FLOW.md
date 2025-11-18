# Add Partner - Flux de Rendu SVG Complet

**Date:** 2025-02-18
**Objectif:** Documenter EXHAUSTIVEMENT le flux de rendu SVG pour addpartner

---

## 📊 ARCHITECTURE GLOBALE

```
addpartner()
    ↓
Creates: partner + child (with mother/father)
    ↓
Triggers: rebuild()
    ↓
Calls: buildTree()
    ↓
Calls: getChildren() ← REQUIRES mother.sex === 'F'
    ↓
Creates: partnerLinks array
    ↓
Calls: linkNodes()
    ↓
Creates: ptrLinkNodes (visual link objects)
    ↓
D3 SVG rendering draws partner lines
```

---

## 🔍 ÉTAPE PAR ÉTAPE

### ÉTAPE 1: addpartner() crée partner + child

**Fichier:** `es/widgets-add.js:198-269`

**Code critique:**
```javascript
// Create partner
let partner = {
    "name": utils.makeid(4),
    "sex": partner_sex,  // 'M' or 'F' (validated)
    "display_name": "Partner"
};

// Insert partner adjacent to person
dataset.splice(idx, 0, partner);

// CRITICAL: Create child to link couple
let child = {"name": utils.makeid(4), "sex": child_sex};
child.mother = (tree_node.data.sex === 'F' ? tree_node.data.name : partner.name);
child.father = (tree_node.data.sex === 'F' ? partner.name : tree_node.data.name);
dataset.splice(child_idx, 0, child);
```

**Garanties:**
- ✅ `partner.sex` est 'M' ou 'F' (jamais 'U')
- ✅ `child.mother` référence une personne avec sex='F'
- ✅ `child.father` référence une personne avec sex='M'
- ✅ Enfant TOUJOURS créé (pas conditionnel)

**Dataset résultant (exemple person F):**
```javascript
[
    {name: 'father', sex: 'M', top_level: true},
    {name: 'mother', sex: 'F', top_level: true},
    {name: 'partner1', sex: 'M', mother: 'mother', father: 'father', noparents: true},
    {name: 'me', sex: 'F', mother: 'mother', father: 'father'},
    {name: 'child1', sex: 'M', mother: 'me', father: 'partner1'}
]
```

---

### ÉTAPE 2: rebuild() déclenché

**Fichier:** `es/pedigree.js:657-662`

**Code:**
```javascript
export function rebuild(opts) {
    $("#"+opts.targetDiv).empty();
    pedcache.init_cache(opts);
    try {
        build(opts);
    } catch(e) {
        console.error(e);
        throw e;
    }
}
```

**Effet:** Vide le SVG et reconstruit tout depuis zéro

---

### ÉTAPE 3: build() prépare top_level nodes

**Fichier:** `es/pedigree.js:620-645`

**Code critique:**
```javascript
let top_level = [];
let top_level_seen = [];
for(let i=0;i<dataset.length;i++) {
    let node = dataset[i];
    if('top_level' in node && $.inArray(node.name, top_level_seen) === -1){
        top_level_seen.push(node.name);
        top_level.push(node);

        // CRITICAL: Find partners and add them to top_level
        let ptrs = utils.get_partners(dataset, node);
        for(let j=0; j<ptrs.length; j++){
            if($.inArray(ptrs[j], top_level_seen) === -1) {
                top_level_seen.push(ptrs[j]);
                top_level.push(utils.getNodeByName(dataset, ptrs[j]));
            }
        }
    }
}
```

**Effet:**
1. Pour chaque personne `top_level`
2. Appelle `get_partners(dataset, node)`
3. Ajoute tous les partners à `top_level` array
4. Cela garantit que partners apparaissent à la même profondeur visuelle

**CRITICAL:** Si `get_partners()` retourne [] (pas d'enfants partagés), le partner n'est PAS ajouté à top_level → mauvais positionnement!

---

### ÉTAPE 4: get_partners() détecte partners via enfants

**Fichier:** `es/tree-utils.js:115-125`

**Code:**
```javascript
export function get_partners(dataset, anode) {
    let ptrs = [];
    for(let i=0; i<dataset.length; i++) {
        let bnode = dataset[i];
        if(anode.name === bnode.mother && $.inArray(bnode.father, ptrs) === -1)
            ptrs.push(bnode.father);
        else if(anode.name === bnode.father && $.inArray(bnode.mother, ptrs) === -1)
            ptrs.push(bnode.mother);
    }
    return ptrs;
}
```

**Logique:**
1. Pour chaque personne dans dataset
2. Si cette personne a `anode` comme mother → ajoute father aux partners
3. Si cette personne a `anode` comme father → ajoute mother aux partners
4. Retourne array de noms de partners

**Exemple avec notre dataset:**
```javascript
get_partners(dataset, {name: 'me'})
// Trouve: child1 avec mother='me', father='partner1'
// Retourne: ['partner1']
```

**CRITICAL:** Sans enfant, retourne `[]` → aucun partner détecté!

---

### ÉTAPE 5: buildTree() crée partnerLinks

**Fichier:** `es/tree-utils.js:453-472`

**Code critique:**
```javascript
export function buildTree(opts, person, root, partnerLinks, id) {
    if (typeof person.children === typeof undefined)
        person.children = getChildren(opts.dataset, person);

    if (typeof partnerLinks === typeof undefined) {
        partnerLinks = [];
        id = 1;
    }

    let nodes = flatten(root);
    let partners = [];

    $.each(person.children, function(_i, child) {
        $.each(opts.dataset, function(_j, p) {
            if (((child.name === p.mother) || (child.name === p.father)) && child.id === undefined) {
                let m = getNodeByName(nodes, p.mother);
                let f = getNodeByName(nodes, p.father);
                m = (m !== undefined? m : getNodeByName(opts.dataset, p.mother));
                f = (f !== undefined? f : getNodeByName(opts.dataset, p.father));
                if(!contains_parent(partners, m, f))
                    partners.push({ 'mother': m, 'father': f });
            }
        });
    });
    // ... continues building tree recursively
}
```

**Logique:**
1. Appelle `getChildren(opts.dataset, person)` pour obtenir enfants
2. Pour chaque enfant, trouve mother et father nodes
3. Crée objets partner `{mother: m, father: f}`
4. Ajoute à `partners` array

**CRITICAL:** Dépend de `getChildren()` pour trouver les enfants!

---

### ÉTAPE 6: getChildren() trouve les enfants

**Fichier:** `es/tree-utils.js:137-151`

**Code:**
```javascript
export function getChildren(dataset, mother, father) {
    let children = [];
    let names = [];

    // CRITICAL: Vérification STRICTE mother.sex === 'F'
    if(mother.sex === 'F')
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

**CRITICAL:**
- Ligne 140: `if(mother.sex === 'F')` - vérification STRICTE
- Si `mother.sex !== 'F'`, retourne `[]` (vide)
- C'est pourquoi sex='U' casse TOUT le système

**Exemple avec notre dataset:**
```javascript
let me = {name: 'me', sex: 'F'};
getChildren(dataset, me);
// Trouve: child1 avec mother='me'
// Retourne: [{name: 'child1', sex: 'M', mother: 'me', father: 'partner1'}]
```

**Si me.sex === 'U':**
```javascript
let me = {name: 'me', sex: 'U'};
getChildren(dataset, me);
// Condition if(mother.sex === 'F') est FALSE
// Retourne: [] ← VIDE!
```

---

### ÉTAPE 7: linkNodes() crée visual links

**Fichier:** `es/tree-utils.js:241-254`

**Code:**
```javascript
export function linkNodes(flattenNodes, partners) {
    let links = [];
    for(let i=0; i< partners.length; i++) {
        let motherName = partners[i].mother?.data?.name || partners[i].mother?.name;
        let fatherName = partners[i].father?.data?.name || partners[i].father?.name;
        if(!motherName || !fatherName)
            continue;
        let motherNode = getNodeByName(flattenNodes, motherName);
        let fatherNode = getNodeByName(flattenNodes, fatherName);
        if(motherNode && fatherNode)
            links.push({'mother': motherNode, 'father': fatherNode});
    }
    return links;
}
```

**Effet:**
- Transforme `partners` array en `ptrLinkNodes` avec coordonnées SVG
- Chaque lien contient les nodes visuels pour mother et father

**Exemple:**
```javascript
linkNodes(flattenNodes, partners);
// Retourne:
[
    {
        mother: {data: {name: 'me'}, x: 100, y: 50},
        father: {data: {name: 'partner1'}, x: 150, y: 50}
    }
]
```

---

### ÉTAPE 8: D3 SVG rendering

**Fichier:** `es/pedigree.js:318-350`

**Code:**
```javascript
let ptrLinkNodes = utils.linkNodes(flattenNodes, partners);
let clashes = check_ptr_links(opts, ptrLinkNodes);

partners = ped.selectAll(".partner")
    .data(ptrLinkNodes)
    .enter()
        .insert("path", "g")
        .attr("fill", "none")
        .attr("stroke", opts.link_color || "#000")
        .attr("stroke-width", 1.5)
        .attr("shape-rendering", "auto")
        .attr("d", function(d, _i) {
            // ... calculate path between mother and father nodes
            let path = "";
            if(clash) {
                // curved line to avoid overlaps
            } else {
                // straight line
                path = "M" + x1 + "," + dy + "L" + x2 + "," + dy;
            }
            return path;
        });
```

**Effet:**
- Crée une ligne SVG (`<path>`) pour chaque lien dans `ptrLinkNodes`
- Calcule le chemin entre coordonnées mother et father
- Dessine la ligne de partner visuelle

---

## 🚨 POINTS CRITIQUES POUR ADDPARTNER

### 1. TOUJOURS créer un enfant

**Sans enfant:**
```
addpartner() creates partner only (NO child)
    ↓
get_partners(dataset, person) → [] (no shared children)
    ↓
Partner NOT added to top_level
    ↓
buildTree() has no children → no partner links created
    ↓
linkNodes() receives empty partners array
    ↓
No SVG line drawn
    ↓
VISUAL BUG: Partner appears detached
```

**Avec enfant (CORRECT):**
```
addpartner() creates partner + child
    ↓
get_partners(dataset, person) → ['partner1']
    ↓
Partner added to top_level
    ↓
buildTree() finds child via getChildren()
    ↓
Creates partnerLinks with {mother, father}
    ↓
linkNodes() creates ptrLinkNodes
    ↓
SVG line drawn correctly
    ↓
✅ Visual rendering CORRECT
```

### 2. child.mother DOIT avoir sex='F'

**Si child.mother a sex='U':**
```
buildTree() calls getChildren(dataset, mother)
    ↓
getChildren() checks if(mother.sex === 'F')
    ↓
mother.sex === 'U' → FALSE
    ↓
Returns [] (empty)
    ↓
buildTree() has no children → no partner links
    ↓
CASCADE FAILURE
```

**Si child.mother a sex='F' (CORRECT):**
```
buildTree() calls getChildren(dataset, mother)
    ↓
getChildren() checks if(mother.sex === 'F')
    ↓
mother.sex === 'F' → TRUE
    ↓
Finds children correctly
    ↓
buildTree() creates partner links
    ↓
✅ Rendering works
```

### 3. Convention male-left, female-right

**Impact sur insertion index:**
```javascript
// Person sex='F'
idx = person_index; // Insert male partner BEFORE female
splice(idx, 0, partner);
// Result: [... partner(M), person(F) ...]

// Person sex='M'
idx = person_index + 1; // Insert female partner AFTER male
splice(idx, 0, partner);
// Result: [... person(M), partner(F) ...]
```

**Pourquoi important:**
- Ordre dataset affecte ordre visuel (left-to-right)
- Convention cohérente assure rendu prévisible

---

## ✅ VALIDATIONS DANS ADDPARTNER

### Validation 1: Sex='U' bloqué (ligne 208-213)

```javascript
if(tree_node.data.sex === 'U' || !tree_node.data.sex) {
    throw utils.create_err(
        'Cannot add partner: person has unspecified sex. ' +
        'Please edit the person and set sex to M or F before adding a partner.'
    );
}
```

**Effet:**
- ✅ Empêche creation partner avec sex='U'
- ✅ Garantit partner_sex est 'M' ou 'F'
- ✅ Garantit child.mother a sex='F'
- ✅ Garantit getChildren() fonctionnera

### Validation 2: Enfant TOUJOURS créé (ligne 250-264)

```javascript
// CRITICAL: ALWAYS create a child to link the couple
let child = {"name": utils.makeid(4), "sex": child_sex};
child.mother = (tree_node.data.sex === 'F' ? tree_node.data.name : partner.name);
child.father = (tree_node.data.sex === 'F' ? partner.name : tree_node.data.name);
dataset.splice(child_idx, 0, child);
```

**Effet:**
- ✅ Garantit get_partners() trouvera le partner
- ✅ Garantit buildTree() créera partner link
- ✅ Garantit rendu SVG correct

### Validation 3: Parents copiés seulement si existent (ligne 229-234)

```javascript
if(tree_node.data.mother && utils.getIdxByName(dataset, tree_node.data.mother) !== -1) {
    partner.mother = tree_node.data.mother;
}
```

**Effet:**
- ✅ Évite références orphelines
- ✅ Partner a même profondeur que person

---

## 📊 FLUX COMPLET (SUCCÈS)

```
USER: Clicks "Add Partner" on person 'me' (sex='F')
    ↓
widgets.js: Calls addpartner(opts, dataset, 'me')
    ↓
widgets-add.js: Validates sex !== 'U' ✓
    ↓
widgets-add.js: Creates partner (sex='M')
    ↓
widgets-add.js: Inserts partner at idx=2 (before 'me')
    ↓
Dataset: [father, mother, partner1(M), me(F)]
    ↓
widgets-add.js: Creates child (mother='me', father='partner1')
    ↓
Dataset: [father, mother, partner1(M), me(F), child1(M)]
    ↓
widgets.js: Triggers rebuild()
    ↓
pedigree.js: Calls build()
    ↓
pedigree.js: get_partners(dataset, 'me') → ['partner1'] ✓
    ↓
pedigree.js: Adds 'partner1' to top_level ✓
    ↓
pedigree.js: Calls buildTree()
    ↓
tree-utils.js: getChildren(dataset, me) → [child1] ✓
    ↓
tree-utils.js: Creates partnerLinks = [{mother: me, father: partner1}] ✓
    ↓
tree-utils.js: linkNodes() creates ptrLinkNodes ✓
    ↓
pedigree.js: D3 renders SVG path between me and partner1 ✓
    ↓
✅ VISUAL RENDERING CORRECT
```

---

## 🔴 FLUX ÉCHEC (si sex='U' permis)

```
USER: Clicks "Add Partner" on person 'me' (sex='U')
    ↓
widgets-add.js: ❌ NO VALIDATION (hypothetical)
    ↓
widgets-add.js: Creates partner (sex='U') ← BUG
    ↓
widgets-add.js: Creates child (mother='partner1'(U), father='me'(U)) ← BUG
    ↓
Dataset: [father, mother, partner1(U), me(U), child1]
    ↓
pedigree.js: Calls buildTree()
    ↓
tree-utils.js: getChildren(dataset, partner1)
    ↓
tree-utils.js: if(partner1.sex === 'F') → FALSE ← FAILS!
    ↓
tree-utils.js: Returns [] (empty)
    ↓
tree-utils.js: NO partnerLinks created
    ↓
pedigree.js: get_partners(dataset, 'me') → [] ← EMPTY!
    ↓
pedigree.js: 'partner1' NOT added to top_level
    ↓
pedigree.js: linkNodes() receives empty partners array
    ↓
pedigree.js: NO SVG line drawn
    ↓
❌ VISUAL BUG: Partner appears detached with no line
```

---

## ✅ CONCLUSION

### Pourquoi notre fix fonctionne:

1. ✅ **Bloque sex='U'** → Garantit partner_sex est 'M' ou 'F'
2. ✅ **TOUJOURS crée enfant** → Garantit get_partners() trouve le partner
3. ✅ **mother.sex === 'F'** → Garantit getChildren() fonctionne
4. ✅ **Ordre correct** → Garantit convention male-left, female-right
5. ✅ **Parents validés** → Évite références orphelines

### Architecture requirement compris:

**PedigreeJS détecte partners via ENFANTS PARTAGÉS, pas via attributs directs**

Cela signifie:
- Chaque couple DOIT avoir au moins un enfant
- Sans enfant, pas de detection partner
- Sans detection, pas de lien visuel
- Résultat: Partner détaché

**Notre implémentation respecte cette architecture.**

---

**Statut:** 🟢 **ARCHITECTURE VALIDÉE - RENDU SVG GARANTI CORRECT**
