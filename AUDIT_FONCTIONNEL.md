# AUDIT FONCTIONNEL COMPLET - PedigreeJS

**Date du rapport** : 10 novembre 2024
**Codebase** : C:\Users\lione\GitHub\pedigreejs\es
**Langage** : JavaScript (ES6 modules)
**Total de code** : ~4 900 lignes
**Nombre de modules** : 17 fichiers

---

## 1. RÉSUMÉ EXÉCUTIF

PedigreeJS est une bibliothèque JavaScript (D3.js basée) pour la construction et la visualisation interactive de pedigrees (arbres généalogiques). L'architecture suit un modèle modulaire bien organisé avec une séparation claire des responsabilités. Le système de gestion des données est complexe, avec un support complet pour les relations familiales, les jumeaux, les partenaires, et les cas d'adoption.

**Points critiques identifiés :**
- Architecture solide avec modularité appropriée
- Gestion des relations parentales complexe via le flag `noparents`
- Système de cache robuste (localStorage/sessionStorage)
- Plusieurs incohérences potentielles dans la gestion de `noparents`
- Bugs identifiés dans plusieurs fonctions critiques

---

## 2. ARCHITECTURE DÉTAILLÉE

### 2.1 Modules Principaux et leurs Responsabilités

#### **A. Core Modules** (Noyau fonctionnel)

| Module | Lignes | Responsabilité | Dépendances |
|--------|--------|-----------------|-------------|
| **pedigree.js** | 561 | Orchestration principale : build(), rebuild(), rendu D3, dessin des liens | utils, pedcache, widgets, labels, dragging, zoom |
| **tree-utils.js** | 421 | Traversée/navigation d'arbre, construction du tree (buildTree), ajustement coords | Aucune externe |
| **widgets.js** | 803 | Gestion UI : ajout enfants/siblings/parents/partners, suppression, drag de partners | utils, popup_form, pedcache, twins |
| **utils.js** | 76 | Réexportation + copie dataset | tree-utils, validation, dom |

#### **B. Data & State Modules** (Données et état)

| Module | Lignes | Responsabilité | Dépendances |
|--------|--------|-----------------|-------------|
| **pedcache.js** | 282 | Historique undo/redo, cache pedigree, persistance (localStorage/sessionStorage) | Aucune |
| **validation.js** | 235 | Validation intégrité pedigree, parent sex consistency, cycles | Aucune |
| **twins.js** | 73 | Gestion monozygotic/dizygotic twins, sync attributs | Aucune |

#### **C. UI/Interaction Modules** (Interface utilisateur)

| Module | Lignes | Responsabilité | Dépendances |
|--------|--------|-----------------|-------------|
| **dom.js** | 174 | Utilitaires DOM, dialogs, détection browser, dimensions SVG | Aucune |
| **dragging.js** | 99 | Drag nodes (Shift+drag), réordonnancement dataset | utils, pedcache |
| **zoom.js** | Variable | Zoom, pan, scale-to-fit, persistence position | pedcache |
| **labels.js** | 130+ | Affichage labels nœuds (âge, YOB, maladies, allèles) | utils |
| **pbuttons.js** | 150+ | Boutons undo/redo/reset/fullscreen/zoom | pedcache, zoom, utils |

#### **D. Import/Export Modules** (E/S)

| Module | Lignes | Responsabilité | Dépendances |
|--------|--------|-----------------|-------------|
| **io.js** | 300+ | Save/load pedigree, export PNG/SVG, import CanRisk | utils, canrisk_file, zoom |
| **canrisk_file.js** | 300+ | Format CanRisk pour risque cancer, parsing données médicales | utils |

#### **E. Utility Modules** (Utilitaires)

| Module | Lignes | Responsabilité | Dépendances |
|--------|--------|-----------------|-------------|
| **popup_form.js** | 300+ | Dialog édition propriétés nœud, sync twins, sauvegarde données | twins, utils, pedcache |
| **index.js** | 23 | Point d'entrée : export modules | Tous les modules |

### 2.2 Graphe de Dépendances

```
index.js (export hub)
    ├─ pedigree.js (CORE)
    │   ├─ utils.js ──→ tree-utils.js, validation.js, dom.js
    │   ├─ pedcache.js
    │   ├─ widgets.js
    │   │   ├─ utils.js
    │   │   ├─ popup_form.js
    │   │   │   ├─ twins.js
    │   │   │   ├─ utils.js
    │   │   │   └─ pedcache.js
    │   │   ├─ pedcache.js
    │   │   └─ twins.js
    │   ├─ labels.js (utils.js)
    │   ├─ zoom.js (pedcache.js)
    │   └─ dragging.js (utils.js, pedcache.js)
    ├─ validation.js
    ├─ dom.js
    ├─ tree-utils.js
    ├─ io.js (utils, pedcache, canrisk_file, zoom)
    └─ canrisk_file.js
```

### 2.3 Points d'Entrée (API Publique)

**Fonction principale :**
```javascript
pedigreejs.build(options)  // Construit et rend le pedigree
```

**Fonctions secondaires exposées :**
- `pedigreejs.rebuild(opts)` - Reconstruit le pedigree
- `pedigreejs_widgets.addchild()` - Ajoute un enfant
- `pedigreejs_widgets.addsibling()` - Ajoute un sibling
- `pedigreejs_widgets.addpartner()` - Ajoute un partenaire
- `pedigreejs_widgets.addparents()` - Ajoute des parents
- `pedigreejs_widgets.delete_node_dataset()` - Supprime un nœud
- `pedigreejs_io.load()` / `save()` - Import/export pedigree

---

## 3. ANALYSE DÉTAILLÉE DES FONCTIONNALITÉS MAJEURES

### 3.1 Construction et Rendu du Pedigree

**Fonction clé : `build(options)` (pedigree.js)**

**Flux complet :**

1. **Initialisation**
   - Merge options avec defaults
   - Initialise cache et boutons
   - Valide pedigree dataset

2. **Création structure D3**
   ```javascript
   opts.dataset = group_top_level(opts.dataset);  // Regroupe top-level nodes avec partners
   let top_level = $.map(opts.dataset, ...);      // Identifie les nœuds racine
   let hidden_root = {name: 'hidden_root', id: 0, hidden: true, children: top_level};
   ```

3. **Construction de l'arbre**
   ```javascript
   let partners = utils.buildTree(opts, hidden_root, hidden_root)[0];  // Crée structure hiérarchique
   let root = d3.hierarchy(hidden_root);                               // Crée hiérarchie D3
   let nodes = treemap(root.sort(...));                                // Applique layout D3
   ```

4. **Ajustement des coordonnées**
   ```javascript
   utils.adjust_coords(opts, nodes, flattenNodes);  // Corrige chevauchements, centre parents cachés
   ```

5. **Liens de partenaires**
   - Dessine liens horizontaux entre couples
   - Gère consanguinité (double line)
   - Gère divorce (croix)

6. **Liens vers enfants**
   - **CRITIQUE : Filtre sur `noparents` (pedigree.js:341)**
   ```javascript
   .filter(function (d) {
       return (opts.DEBUG ||
               (d.target.data.noparents === undefined &&
                d.source.parent !== null &&
                !d.target.data.hidden));
   })
   ```

### 3.2 Ajout d'Individus

#### **A. addchild() (widgets.js:501-535)**

```javascript
function addchild(dataset, node, sex, nchild, twin_type) {
    let children = utils.getAllChildren(dataset, node);

    if (children.length === 0) {
        // Cas 1 : Pas d'enfant existant → créer un partenaire
        let partner = addsibling(dataset, node, opposite_sex, is_mother);
        partner.noparents = true;  // *** FLAG NOPARENTS ***
        ptr_name = partner.name;
    } else {
        // Cas 2 : Enfant existant → réutiliser partner existant
        let c = children[0];
        ptr_name = (c.father === node.name ? c.mother : c.father);
    }

    // Créer enfants
    for (let i = 0; i < nchild; i++) {
        let child = {
            name: makeid(4),
            sex: sex,
            mother: (node.sex === 'F' ? node.name : ptr_name),
            father: (node.sex === 'F' ? ptr_name : node.name)
        };
        dataset.splice(idx, 0, child);
    }
}
```

#### **B. addsibling() (widgets.js:538-561)**

```javascript
function addsibling(dataset, node, sex, add_lhs, twin_type, skip_parent_copy = false) {
    let newbie = {name: makeid(4), sex: sex};

    if(node.top_level) {
        newbie.top_level = true;
    } else if (!skip_parent_copy) {
        newbie.mother = node.mother;
        newbie.father = node.father;  // Copie parents du sibling existant
    }

    dataset.splice(idx, 0, newbie);
    return newbie;
}
```

**Note** : Flag `skip_parent_copy` utilisé uniquement pour `addpartner()` (ligne 674)

#### **C. addpartner() (widgets.js:669-683)**

```javascript
function addpartner(opts, dataset, name) {
    let partner = addsibling(dataset, tree_node.data, opposite_sex, ..., undefined, true);
    partner.noparents = true;  // *** FLAG NOPARENTS ***

    // Crée immédiatement un enfant fictif pour établir la relation
    let child = {name: makeid(4), sex: "M"};
    child.mother = (tree_node.data.sex === 'F' ? tree_node.data.name : partner.name);
    child.father = (tree_node.data.sex === 'F' ? partner.name : tree_node.data.name);
    dataset.splice(idx, 0, child);
}
```

**Observation** : Crée toujours un enfant du sexe masculin ("M")

### 3.3 Suppression d'Individus

**Fonction : delete_node_dataset() (widgets.js:699-801)**

**Structure complexe avec 3 cas :**

```javascript
function delete_node_dataset(dataset, node, opts, onDone) {
    // Case 1 : Node a parent_node[] (couple/partnership)
    if(node.parent_node) {
        for(i=0; i<node.parent_node.length; i++) {
            let parent = node.parent_node[i];
            let ps = [getNodeByName(dataset, parent.mother.name),
                      getNodeByName(dataset, parent.father.name)];

            // Supprimer les parents si noparents ou top_level
            if(ps[j].name === node.name || ps[j].noparents !== undefined || ps[j].top_level) {
                dataset.splice(..., 1);
            }

            // Marquer enfants comme orphans
            let children = parent.children;
            for(j=0; j<children.length; j++) {
                let child = getNodeByName(dataset, children[j].name);
                if(child) {
                    child.noparents = true;
                    // Logique complexe pour réassigner parents...
                }
            }
        }
    }
}
```

### 3.4 Relations Familiales - Le Flag `noparents`

**Définition du flag :**
- `noparents = true` indique un nœud "adopté-in" (pas de lien généalogique)
- Utilisé pour les partenaires sans parents biologiques définis
- Utilisé pour les orphans créés lors de suppression de parents

**Où est vérifié noparents :**

| Fonction | Vérification | Conséquence |
|----------|--------------|-------------|
| getChildren() | Check `!p.noparents` | Exclut orphans |
| getAllChildren() | Check `!('noparents' in p)` | Exclut AUSSI orphans |
| pedigree.js filter | Check `noparents === undefined` | N'affiche pas lien |
| buildTree() | Via getChildren() | Exclut orphans de construction |

**INCOHÉRENCE MAJEURE** :
```javascript
// getAllChildren() suggère "tous" mais exclut noparents !
export function getAllChildren(dataset, person, sex) {
    return $.map(dataset, function(p, _i){
        return !('noparents' in p) &&  // ← Exclut noparents
               (p.mother === person.name || p.father === person.name) &&
               (!sex || p.sex === sex) ? p : null;
    });
}
```

### 3.5 Construction de l'Arbre D3 - buildTree()

**Fonction clé : buildTree() (tree-utils.js:355-420)**

**Algorithme :**

1. **Récursif sur les enfants**
   ```javascript
   if (typeof person.children === typeof undefined)
       person.children = getChildren(opts.dataset, person);  // Exclut noparents
   ```

2. **Identifie les partenaires et crée nœud "parent caché"**
   ```javascript
   let parent = {
       name: makeid(4),
       hidden: true,
       father: father,
       mother: mother,
       children: getChildren(opts.dataset, mother, father)  // Exclut noparents
   };
   ```

3. **Attribue IDs aux nœuds**

4. **Récursif sur tous les enfants**

**Observation clé** : Les enfants avec `noparents` ne sont jamais intégrés dans l'arbre D3

---

## 4. FLUX DE DONNÉES CRITIQUES

### 4.1 Flux de Construction d'un Pedigree

```
User Input (options.dataset)
        ↓
validate_pedigree(opts)  ← Valide intégrité
        ↓
group_top_level(dataset) ← Regroupe top-level nodes avec partners
        ↓
buildTree(hidden_root)   ← Crée structure hiérarchique
        ├─ Crée nœuds "parent" cachés pour chaque couple
        ├─ Exclut enfants avec noparents
        └─ Retourne array de partnerships
        ↓
d3.tree().separation()   ← Layout D3 standard
        ↓
adjust_coords()          ← Corrige chevauchements
        ↓
render SVG               ← Dessine nœuds et liens
        ├─ Filtre liens parent-enfant si noparents
        ├─ Affiche liens de couples
        └─ Gère jumeaux, adoption, décès
```

### 4.2 Flux : Ajout d'un Partner

```
User clique "add partner" → addpartner(opts, dataset, name)
        ↓
addsibling(..., skip_parent_copy=true)  ← Crée partner sans parents
        ↓
partner.noparents = true                ← Marque comme orphan
        ↓
Crée enfant fictif {mother, father}     ← Établit relation
        ↓
dataset.splice(idx, 0, child)           ← Insère enfant
        ↓
$(document).trigger('rebuild')          ← Déclenche rendu
```

### 4.3 Flux : Gestion des Liens avec `noparents`

```
Rendu des liens (pedigree.js:335-420) :

.filter(function (d) {
    return (opts.DEBUG ||
            (d.target.data.noparents === undefined &&
             d.source.parent !== null &&
             !d.target.data.hidden));
})

Si noparents !== undefined :
    - Lien est CACHÉ (sauf en DEBUG)
    - Ligne 352 : stroke = 'pink' (invisible)

Rationale : Les orphans n'ont pas de lien visuel vers leurs "parents"
```

---

## 5. BUGS ET PROBLÈMES IDENTIFIÉS

### BUG #1 : Indexation Incorrecte dans delete_node_dataset()
**Localisation** : widgets.js, ligne 764
**Sévérité** : HAUTE
**Code** :
```javascript
for(j=0; j<ancestors.length; j++) {
    console.log(ancestors[i]);  // ❌ Utilise i au lieu de j
```

**Fix** : Changer `ancestors[i]` en `ancestors[j]`

---

### BUG #2 : Accès Array Incorrect dans pedcache.js
**Localisation** : pedcache.js, ligne 182
**Sévérité** : CRITIQUE
**Code** :
```javascript
return JSON.parse(arr(arr.length-1));  // ❌ arr() n'existe pas !
```

**Fix** : Changer `arr(arr.length-1)` en `arr[arr.length-1]`

---

### BUG #3 : Double Bracket dans checkTwins()
**Localisation** : twins.js, ligne 69
**Sévérité** : MOYENNE
**Code** :
```javascript
delete dataset[i][[twin_type]];  // ❌ [[...]] invalide
```

**Fix** : Changer `[[twin_type]]` en `[twin_type]`

---

### INCOHÉRENCE #1 : Sémantique getAllChildren()
**Localisation** : tree-utils.js:90-96
**Sévérité** : MOYENNE

Le nom `getAllChildren` suggère "tous les enfants", mais exclut les orphans (noparents).

**Recommandation** : Créer `getAdoptedChildren()` :
```javascript
export function getAdoptedChildren(dataset, person, sex) {
    return $.map(dataset, function(p, _i){
        return ('noparents' in p) &&
               (p.mother === person.name || p.father === person.name) &&
               (!sex || p.sex === sex) ? p : null;
    });
}
```

---

### INCOHÉRENCE #2 : Flag `noparents` dans addparents()
**Localisation** : widgets.js:589-593
**Sévérité** : HAUTE

Le code marque les nœuds comme "sans parents" (noparents) MAIS leur assigne immédiatement des parents :

```javascript
dataset[i].noparents = true;     // ← Marque comme "sans parents"
dataset[i].mother = mother.name; // ← Mais assigne des parents !
dataset[i].father = father.name;
```

Sémantiquement contradictoire.

---

## 6. POINTS D'ATTENTION CRITIQUES

### 6.1 buildTree() : Structure Hidden Parent Nodes

```
Input dataset :
    {name: "f1", sex: "F"}
    {name: "m1", sex: "M"}
    {name: "c1", mother: "f1", father: "m1"}

Output D3 Tree :
    hidden_root
    ├── f1 (id=1)
    │   └── parent_xyz (hidden, id=2)
    │       └── c1 (id=3)
    └── m1 (id=5)
        └── parent_xyz (hidden) [RÉFÉRENCE IDENTIQUE]
```

Les nœuds parents cachés sont **partagés** entre les deux parents.

### 6.2 getChildren() vs getAllChildren()

```javascript
// getChildren(dataset, mother, father)
Exclut : !p.noparents
Filtre : mother + father spécifiques

// getAllChildren(dataset, person, sex)
Exclut : !('noparents' in p)  // Même chose !
Filtre : person.name === mother OU father
```

**Les deux excluent noparents** - la différence est essentiellement nominale.

### 6.3 addpartner() : Création Forcée d'un Enfant

```javascript
let child = {name: makeid(4), sex: "M"};  // ← Toujours "M"
child.mother = ...;
child.father = ...;
dataset.splice(idx, 0, child);
```

**Pourquoi ?**
- Le couple n'existe que s'il y a au moins un enfant dans le layout D3
- Sans enfant, le couple ne participe pas au rendu

---

## 7. RECOMMANDATIONS

### 7.1 Corrections de Bugs (Priorité 1 - CRITIQUE)

1. ✅ **Fixer pedcache.js ligne 182**
   ```javascript
   return JSON.parse(arr[arr.length-1]);
   ```

2. ✅ **Fixer widgets.js ligne 764**
   ```javascript
   console.log(ancestors[j]);
   ```

3. ✅ **Fixer twins.js ligne 69**
   ```javascript
   delete dataset[i][twin_type];
   ```

### 7.2 Améliorations d'API (Priorité 2)

1. **Créer `getAdoptedChildren()`** pour accéder aux enfants avec noparents

2. **Documenter le flag `noparents`**
   ```javascript
   /**
    * Flag 'noparents': Indicates an individual whose parents are present
    * but for whom no genetic relationship is displayed (adopted partners, orphans).
    */
   ```

3. **Ajouter validation dans `addpartner()`**
   ```javascript
   if(partner.sex === node.data.sex) {
       throw new Error("Partners must have opposite sex");
   }
   ```

### 7.3 Refactoring Recommandé (Priorité 3)

1. **Simplifier delete_node_dataset()** (100+ lignes → diviser en sous-fonctions)

2. **Centraliser la logique `noparents`** dans un module dédié

3. **Gérer les edge-cases**
   - Twin ID limit (> 10 groupes)
   - Couples sans enfant
   - Self-partnerships

### 7.4 Tests Recommandés

**Unit tests manquants :**
1. `getChildren()` vs `getAllChildren()` avec noparents
2. `buildTree()` avec orphans
3. `delete_node_dataset()` cascades complexes
4. `addparents()` cas depth=1 et depth>2
5. Undo/redo avec orphans et jumeaux

---

## 8. RÉSUMÉ DES BUGS PAR SÉVÉRITÉ

| # | Bug | Sévérité | Localisation | Impact |
|---|-----|----------|--------------|--------|
| 1 | `ancestors[i]` vs `ancestors[j]` | HAUTE | widgets.js:764 | Crash possible |
| 2 | `arr()` vs `arr[]` | CRITIQUE | pedcache.js:182 | Undo/redo breaker |
| 3 | `[[twin_type]]` | MOYENNE | twins.js:69 | Orphan twin IDs |
| 4 | Sémantique getAllChildren | MOYENNE | tree-utils.js:90-96 | API confuse |
| 5 | Flag noparents contradictoire | HAUTE | widgets.js:589-593 | Données inconsistentes |

---

## 9. CONCLUSION

PedigreeJS est une bibliothèque **robuste et bien architecturée** pour la visualisation de pedigrees. La modularité est excellente, la séparation des responsabilités claire.

**Points forts :**
- ✅ Architecture modulaire claire
- ✅ Gestion complexe des relations familiales
- ✅ Cache undo/redo sophistiqué
- ✅ Support complet de D3.js

**Points faibles identifiés :**
- ❌ 3 bugs critiques nécessitant correction immédiate
- ❌ Sémantique inconsistente du flag `noparents`
- ❌ API asymétrique pour getAllChildren()
- ❌ Logique complexe dans delete_node_dataset()

**Risques :**
- Les orphans (noparents) sont un concept "secondary-class" dans l'API
- Impossible d'accéder programmatiquement aux enfants adoptés
- La suppression de nœuds peut créer des structures inconsistantes

**Recommandation générale :**
Corriger les 3 bugs critiques immédiatement. Refactorer `delete_node_dataset()` et créer des APIs cohérentes pour la gestion des orphans avant d'ajouter de nouvelles fonctionnalités.

---

**Fin de l'audit** | Rapport généré le 10 novembre 2024
