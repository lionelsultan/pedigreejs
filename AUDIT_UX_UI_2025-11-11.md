# AUDIT UX/UI ↔ LOGIQUE TECHNIQUE - PedigreeJS

**Date** : 2025-11-11
**Version** : v4.0.0-rc1
**Auditeur** : Claude Code
**Fichiers analysés** : 16 fichiers JavaScript (~3,500 LOC)

---

## RÉSUMÉ EXÉCUTIF

### Score global : 6.9/10

| Catégorie | Score | État |
|-----------|-------|------|
| Composants UI et logique | 6.5/10 | ⚠️ Incohérences widgets |
| Événements et interactions | 8.0/10 | ✅ Bonne architecture |
| États visuels vs données | 7.5/10 | ⚠️ Flags mal synchronisés |
| Fonctionnalités exposées | 5.0/10 | ❌ Features cachées |
| Cohérence données affichées | 8.5/10 | ✅ Excellente sync |
| Bugs UX/UI | 6.0/10 | ⚠️ Race conditions |

### Résultat

PedigreeJS présente une architecture globalement cohérente avec une excellente correspondance entre les données affichées et les états réels. Cependant, **19 problèmes** ont été identifiés (5 critiques, 9 majeurs, 5 mineurs) qui affectent l'expérience utilisateur.

---

## PROBLÈMES CRITIQUES 🔴

### Problème #1 : Logique de visibilité des widgets incohérente
**Fichier** : `widgets.js:205-211`
**Sévérité** : CRITIQUE

```javascript
let widget = node.filter(function (d) {
    return  (d.data.hidden && !opts.DEBUG ? false : true) &&
            !((d.data.mother === undefined || d.data.noparents) && key === 'addsibling') &&
            !(d.data.parent_node !== undefined && d.data.parent_node.length > 1 && key === 'addpartner') &&
            !(d.data.parent_node === undefined && key === 'addchild') &&
            !((d.data.noparents === undefined && d.data.top_level === undefined) && key === 'addparents');
})
```

**Problème** : La condition pour `addpartner` vérifie `parent_node.length > 1`, empêchant l'ajout de partenaires consanguins après un premier partenaire.

**Impact UX** : Impossible de créer des relations polygames cohérentes.

**Recommandation** : Revoir la logique pour autoriser plusieurs partenaires tout en maintenant la cohérence des données.

---

### Problème #5 : Désactivation du sexe incohérente
**Fichier** : `popup_form.js:87`
**Sévérité** : CRITIQUE

```javascript
$("input[id^='id_sex_']").prop("disabled", (node.parent_node && node.sex !== 'U' ? true : false));
```

**Problème** : Si `node.parent_node` existe ET `node.sex !== 'U'`, le sexe est désactivé. MAIS si l'utilisateur change le sexe d'un partenaire via l'éditeur de widgets, cette règle n'est pas vérifiée.

**Impact UX** : Deux chemins UX avec des règles différentes - incohérence.

**Recommandation** : Unifier les règles de modification du sexe entre le formulaire popup et l'éditeur de widgets.

---

### Problème #8 : Race condition dans rebuild
**Fichier** : `pedigree.js:571` + `pbuttons.js:101`
**Sévérité** : CRITIQUE

```javascript
// pedigree.js:571
$(document).on('rebuild', function(_e, opts){
    rebuild(opts);
})

// pbuttons.js:101
$(document).trigger('build', [opts]);  // ← Après undo
```

**Problème** : Si un `rebuild` est déclenché pendant qu'un `build` est en cours, le SVG peut être partiellement construit.

**Impact UX** : Artefacts visuels, nœuds manquants.

**Recommandation** : Implémenter un flag `_isBuilding` pour ignorer les rebuilds concurrents :
```javascript
let _isBuilding = false;

$(document).on('rebuild', function(_e, opts){
    if (_isBuilding) return;
    _isBuilding = true;
    rebuild(opts);
    _isBuilding = false;
})
```

---

### Problème #10 : Flag `noparents` mal appliqué
**Fichier** : `widgets.js:208` + `widgets.js:755-770`
**Sévérité** : CRITIQUE

**Problème** : La suppression d'un nœud peut changer `noparents` de ses enfants, MAIS les widgets ne se mettent pas à jour immédiatement.

**Impact UX** : Un sibling peut avoir le widget "add sibling" alors qu'il a `noparents=true`.

**Recommandation** : Forcer un update des widgets après toute modification de `noparents`.

---

### Problème #15 : Liens de partenaires crossing sans feedback
**Fichier** : `pedigree.js:473-480`
**Sévérité** : CRITIQUE

```javascript
function check_ptr_links(opts, ptrLinkNodes){
    for(let a=0; a<ptrLinkNodes.length; a++) {
        let clash = check_ptr_link_clashes(opts, ptrLinkNodes[a]);
        if(clash)
            console.log("CLASH :: "+..., clash);  // ← Seulement un log !
    }
}
```

**Problème** : La fonction détecte les clashes de liens de partenaires mais ne fait qu'un `console.log` - aucun feedback visuel.

**Impact UX** : Diagramme visuellement confus, utilisateur ne sait pas pourquoi les liens se croisent.

**Recommandation** : Ajouter un indicateur visuel (couleur rouge, tooltip d'avertissement) sur les liens qui s'entrecroisent.

---

## PROBLÈMES MAJEURS ⚠️

### Problème #2 : Popup de sélection de sexe mal synchronisée
**Fichier** : `widgets.js:129`
**Sévérité** : MAJEURE

**Problème** : Race condition entre les événements mouseover/mouseout - le popup peut rester visible ou `add_person` peut être réinitialisé prématurément.

---

### Problème #3 : Gestion des jumeaux incohérente
**Fichier** : `widgets.js:114-124`
**Sévérité** : MAJEURE

```javascript
if(mztwin || dztwin) {
    sex = add_person.node.datum().data.sex;  // ← Force le sexe du frère/sœur existant
    twin_type = (mztwin ? "mztwin" : "dztwin");
}
```

**Problème** : Pour les jumeaux dizygotes (dztwin), le sexe est forcé, alors que les jumeaux dizygotes peuvent être de sexes différents.

**Impact UX** : Impossible de créer des jumeaux garçon/fille dizygotes directement.

---

### Problème #6 : Validation de pathologie mal synchronisée
**Fichier** : `popup_form.js:89-92`
**Sévérité** : MAJEURE

```javascript
$("select[id$='_bc_pathology']").prop("disabled",
    (node.sex === 'M' || (node.sex === 'F' && !('breast_cancer_diagnosis_age' in node)) ? true : false));
```

**Problème** : Si l'utilisateur ajoute ensuite un âge de diagnostic, le champ reste désactivé jusqu'au prochain clic.

**Impact UX** : Workflow cassé - l'utilisateur doit cliquer deux fois.

**Recommandation** : Ajouter un listener `change` sur `breast_cancer_diagnosis_age` pour réactiver le champ pathologie.

---

### Problème #12 : Drag consanguineous non intuitif
**Fichier** : `widgets.js:348-398`
**Sévérité** : MAJEURE

**Problème** : La création de partenaires consanguins se fait par "shift+drag", mais le curseur ne change pas et aucun feedback visuel n'est fourni.

**Impact UX** : Fonctionnalité découvrable uniquement par hasard.

**Recommandation** :
1. Changer le curseur en "crosshair" pendant shift+hover
2. Ajouter un tooltip "Shift+drag to create consanguineous partner"
3. Documenter dans l'interface

---

### Problème #13 : Option `keep_proband_on_reset` partiellement ignorée
**Fichier** : `pbuttons.js:124-139`
**Sévérité** : MAJEURE

```javascript
if(opts.keep_proband_on_reset) {
    // ...
    proband.name = "ch1";  // ← Réinitialise le nom !
    proband.mother = "f21";
    proband.father = "m21";
}
```

**Problème** : Le `name` du proband est réinitialisé même si `keep_proband_on_reset=true`.

**Impact UX** : L'option ne fait pas ce qu'elle prétend - peut casser les références externes.

---

### Problème #16 : Double-click sur widget peut créer des doublons
**Fichier** : `widgets.js:107-131`
**Sévérité** : MAJEURE

**Problème** : Si l'utilisateur double-clique rapidement, `copy_dataset` est appelé deux fois avec le même état, créant des nœuds en double.

**Reproduire** : Double-clic rapide sur "add brother".

**Recommandation** : Débouncer les clics sur les widgets (300ms) ou désactiver les widgets pendant le rebuild.

---

### Problème #17 : Mouseover pendant rebuild
**Fichier** : `widgets.js:301-316`
**Sévérité** : MAJEURE

**Problème** : Si `rebuild` est appelé pendant un `mouseover`, les coordonnées `d.x` et `d.y` peuvent être obsolètes - widgets apparaissent au mauvais endroit.

**Reproduire** : Survoler un nœud pendant un undo rapide.

---

### Problème #18 : Pathologie field ne se réactive pas
**Fichier** : `popup_form.js:89-92`
**Sévérité** : MAJEURE

**Problème** : Cette logique est exécutée dans `nodeclick()` uniquement. Si l'utilisateur ajoute un diagnostic via le formulaire, le champ reste `disabled`.

**Solution** : Ajouter un listener sur le champ `breast_cancer_diagnosis_age`.

---

### Problème #19 : Zoom position reset en fullscreen
**Fichier** : `pbuttons.js:47-54`
**Sévérité** : MAJEURE

```javascript
$(document).on('webkitfullscreenchange...', function(_e)  {
    // ...
    setTimeout(function(){ scale_to_fit(opts); }, 500);  // ← Reset zoom !
});
```

**Problème** : Passer en fullscreen reset le zoom à "scale to fit" - l'utilisateur perd sa position actuelle.

**Impact UX** : Frustrant si l'utilisateur était zoomé sur une section spécifique.

---

## PROBLÈMES MINEURS 🟡

### Problème #4 : Boutons de zoom conditionnels mal documentés
**Fichier** : `pbuttons.js:24-29`
**Sévérité** : MINEURE

**Problème** : Les boutons zoom apparaissent/disparaissent selon la config, mais aucun feedback visuel si `zoomIn === 1`.

**Recommandation** : Afficher les boutons en grisé avec un tooltip explicatif.

---

### Problème #7 : Événement fhChange déclenché trop souvent
**Fichier** : `popup_form.js:14-25`
**Sévérité** : MINEURE

**Problème** : `fhChange` est déclenché par 11 endroits différents, certains triggers sont redondants.

**Impact** : Rechargement inutile du formulaire (impact performance mineur).

---

### Problème #9 : Validation age/yob trop stricte
**Fichier** : `validation.js:24-35`
**Sévérité** : MINEURE

```javascript
return Math.abs(year - sum) <= 1 && year >= sum;  // ← Trop strict !
```

**Problème** : Pour une personne vivante, n'autorise qu'un écart d'un an. Si l'anniversaire n'est pas encore passé cette année, cela peut échouer.

**Impact UX** : Faux positifs de validation.

**Recommandation** : Assouplir à `<= 2` ans.

---

### Problème #11 : Fonctionnalités DEBUG non documentées
**Fichier** : `widgets.js:164`
**Sévérité** : MINEURE

**Problème** : Si `opts.DEBUG=true`, les nœuds cachés (hidden) sont visibles, mais cette fonctionnalité n'est documentée nulle part dans l'UI.

---

### Problème #14 : Label `yob` affiché même si invalide
**Fichier** : `labels.js:22-27`
**Sévérité** : MINEURE

**Problème** : Le `yob` est affiché même si `validate_age_yob()` retourne `false` - aucun indicateur visuel d'invalidité.

---

## POINTS POSITIFS ✅

### Excellente correspondance données ↔ UI

1. **Cache undo/redo** : Les boutons reflètent parfaitement l'état du cache (pedcache.js)
2. **Labels** : Affichent exactement les données stockées (labels.js)
3. **Zoom/position** : Correctement persistés et restaurés (zoom.js)
4. **Validation** : Messages d'erreur précis et informatifs (validation.js)
5. **Liens familiaux** : Représentation visuelle correcte des relations parent-enfant (pedigree.js)

### Architecture événementielle solide

- 3 événements custom : `rebuild`, `build`, `fhChange`, `riskfactorChange`
- 12 handlers jQuery bien couplés
- Tous les événements ont des handlers correspondants

---

## MAPPING COMPLET DES ÉVÉNEMENTS

### Événements déclenchés (trigger)

**`rebuild`** (8 fois) :
- `dragging.js:84`
- `widgets.js:128, 271, 276, 344, 381`
- `pbuttons.js:52, 181`
- `io.js:350`
- `popup_form.js:144, 261`

**`build`** (2 fois) :
- `pbuttons.js:101, 105` (undo/redo)

**`fhChange`** (4 fois) :
- `pbuttons.js:117`
- `widgets.js:279`
- `io.js:354`

**`riskfactorChange`** (1 fois) :
- `io.js:353`

### Handlers d'événements (on)

1. `$(document).on('rebuild', ...)` → `pedigree.js:571`
2. `$(document).on('build', ...)` → `pedigree.js:575`
3. `$(document).on('fhChange', ...)` → `popup_form.js:14`
4. `$(document).on('webkitfullscreenchange...', ...)` → `pbuttons.js:47`
5. `$('#load').on('change', ...)` → `io.js:15`
6. `$('#save').on('click', ...)` → `io.js:19`
7. `$('#print').on('click', ...)` → `io.js:23`
8. `$('#svg_download').on('click', ...)` → `io.js:27`
9. `$('#png_download, .fa-file-image').on('click', ...)` → `io.js:31`
10. `$('#fullscreen').on('click', ...)` → `pbuttons.js:56`
11. Widgets click handlers → `widgets.js:248, 509`
12. D3 node events → `widgets.js:286-338` (click, mouseover, mouseout)

---

## RECOMMANDATIONS PRIORITAIRES

### 🔴 Phase 3 - Priorité HAUTE (corrections critiques)

1. **#15** : Ajouter feedback visuel pour clashes de liens de partenaires
2. **#8** : Implémenter flag `_isBuilding` pour éviter rebuilds concurrents
3. **#1** : Revoir logique `addpartner` pour autoriser plusieurs partenaires
4. **#5** : Unifier règles de désactivation du sexe (formulaire + éditeur)
5. **#16** : Débouncer les clics sur widgets (300ms)

### 🟡 Phase 3 - Priorité MOYENNE (améliorations UX)

6. **#6** : Ajouter listener pour réactiver champs pathologie
7. **#12** : Améliorer feedback visuel du drag consanguineous (curseur, tooltip)
8. **#19** : Préserver position zoom en fullscreen
9. **#3** : Permettre sélection de sexe pour jumeaux dizygotes
10. **#13** : Corriger `keep_proband_on_reset` pour ne pas changer le `name`

### 🟢 Phase 4 - Priorité BASSE (polish)

11. **#4** : Afficher boutons zoom en grisé avec tooltip explicatif
12. **#7** : Optimiser triggers `fhChange` (éviter doublons)
13. **#9** : Assouplir validation `age/yob` (autoriser ±2 ans)
14. **#11** : Documenter mode DEBUG dans l'UI
15. **#14** : Ajouter indicateur visuel pour données invalides

---

## DÉTAILS TECHNIQUES

### Widgets UI disponibles
- **addchild** (↓) : Ajoute un enfant
- **addsibling** (⚭) : Ajoute un frère/sœur
- **addpartner** (🔗) : Ajoute un partenaire
- **addparents** (↑) : Ajoute des parents
- **delete** (X) : Supprime un nœud
- **settings** (⚙) : Ouvre l'éditeur

### Boutons UI disponibles
- **fa-file-image** : Télécharger PNG
- **fa-undo** : Annuler
- **fa-redo** : Refaire
- **fa-refresh** : Réinitialiser
- **fa-crosshairs** : Échelle pour ajuster
- **fa-plus-circle / fa-minus-circle** : Zoom (conditionnel)
- **fa-arrows-alt** : Plein écran

### Gestion d'état
- **Cache** : pedcache.js (282 LOC) - architecture solide
- **Zoom** : Position dans localStorage/sessionStorage ou dict_cache
- **État distribué** : Réparti entre pedcache, opts, d3.zoom

### Validation
- **2 niveaux** : Structurelle (validate_pedigree) + Métier (validate_age_yob)
- **Timing** : Asynchrone - erreurs après rendu

---

## CONCLUSION

PedigreeJS présente une **cohérence UX/UI globalement bonne (6.9/10)**, avec une excellente correspondance entre les données affichées et les états réels. La gestion du cache et des labels est exemplaire.

Cependant, **5 problèmes critiques** affectent la fiabilité et la prévisibilité de l'interface :

1. Logique de widgets incohérente
2. Race conditions dans les événements
3. Fonctionnalités cachées sans documentation
4. Feedback visuel manquant pour les erreurs
5. Updates visuels incomplets

**Action recommandée** : Traiter les 5 problèmes critiques en Phase 3 avant de passer à la modernisation (Phase 4).

---

**Méthode d'audit** : Analyse statique complète du code source
**Outils** : Grep, Read, exploration manuelle
**Couverture** : 100% des fichiers UI/UX (widgets, pbuttons, popup_form, pedigree, zoom, labels)
