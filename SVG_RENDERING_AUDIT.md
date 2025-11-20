# 🎨 AUDIT COMPLET DU RENDU SVG - PedigreeJS v4.0.0-rc1

**Date:** 2025-11-19
**Fichier analysé:** `es/pedigree.js` (717 lignes)
**Scope:** 100% du code de rendu SVG

---

## 📊 RÉSUMÉ EXÉCUTIF

**Anomalies trouvées:** 27 issues identifiées
- 🔴 **CRITIQUES:** 3 (bugs potentiels)
- 🟡 **MOYENNES:** 12 (incohérences, maintenabilité)
- 🟢 **MINEURES:** 12 (optimisations, documentation)

---

## 🔴 ANOMALIES CRITIQUES

### CRITIQUE 1: Duplication de ligne dans get_bracket()
**Fichier:** `pedigree.js:565-566`
**Sévérité:** 🔴 CRITIQUE (bug visuel)

```javascript
return  "M" + (dx+indent) + "," + dy +
        "L" + dx + " " + dy +
        "L" + dx + " " + (dy + bracket_height) +
        "L" + dx + " " + (dy + bracket_height) +  // ❌ DUPLIQUÉ
        "L" + (dx+indent) + "," + (dy + bracket_height);
```

**Problème:** La ligne 565 et 566 sont identiques - dessine deux fois le même segment vertical.

**Impact:** Inefficacité, rendu potentiellement plus épais, confusion dans le SVG path.

**Solution:** Supprimer ligne 566:
```javascript
return  "M" + (dx+indent) + "," + dy +
        "L" + dx + " " + dy +
        "L" + dx + " " + (dy + bracket_height) +
        "L" + (dx+indent) + "," + (dy + bracket_height);
```

---

### CRITIQUE 2: Commentaire invalide (syntax potentielle)
**Fichier:** `pedigree.js:151`
**Sévérité:** 🔴 CRITIQUE (peut causer erreur parsing)

```javascript
// / get score at each depth used to adjust node separation
```

**Problème:** Double slash suivi d'espace slash `// /` - peut être interprété comme début de regex ou division.

**Solution:**
```javascript
// get score at each depth used to adjust node separation
```

---

### CRITIQUE 3: ClipPath size pour hidden nodes non documenté
**Fichier:** `pedigree.js:210-211`
**Sévérité:** 🟡 MOYENNE (comportement obscur)

```javascript
.attr("d", d3.symbol().size(function(d) {
    if (d.data.hidden)
        return opts.symbol_size * opts.symbol_size / 5;  // ❌ Pourquoi /5 ?
    return opts.symbol_size * opts.symbol_size;
})
```

**Problème:** Hidden nodes ont des clipPaths 5x plus petits sans explication.

**Impact:** Si un hidden node a des maladies, le pie chart sera mal clippé.

**Solution:** Ajouter commentaire explicatif OU utiliser une constante nommée:
```javascript
const HIDDEN_NODE_SIZE_FACTOR = 0.2;  // 1/5th size for hidden nodes
if (d.data.hidden)
    return opts.symbol_size * opts.symbol_size * HIDDEN_NODE_SIZE_FACTOR;
```

---

## 🟡 ANOMALIES MOYENNES

### MOYENNE 1: Pas de classes CSS sur les paths
**Fichier:** `pedigree.js:432, 322`
**Sévérité:** 🟡 MOYENNE (testabilité, styling)

**Problème:** Les links/paths SVG n'ont pas de classes CSS assignées, seulement utilisées pour data binding.

```javascript
// Ligne 424: sélection par classe mais jamais assignée
ped.selectAll(".link")
    .data(...)
    .enter()
    .insert("path", "g")  // ❌ Pas de .attr("class", "link")
```

**Impact:**
- Tests ne peuvent pas cibler `.ped_link` (cause failures)
- Difficile de styler avec CSS externe
- Debugging compliqué (pas de classes dans inspecteur)

**Solution:** Ajouter classes explicites:
```javascript
.insert("path", "g")
.attr("class", function(d) {
    let classes = ["link"];
    if(d.target.data.adopted_in) classes.push("adopted");
    if(d.target.data.mztwin) classes.push("mztwin");
    if(d.target.data.dztwin) classes.push("dztwin");
    return classes.join(" ");
})
```

---

### MOYENNE 2: Magic numbers non documentés
**Fichier:** `pedigree.js` (multiples lignes)
**Sévérité:** 🟡 MOYENNE (maintenabilité)

**Occurrences:**
```javascript
// Ligne 157: Séparation nodes
.separation(function(a, b) {
    return a.parent === b.parent || a.data.hidden || b.data.hidden ? 1.2 : 2.2;  // Pourquoi 1.2 et 2.2 ?
})

// Ligne 188: Bordure symbole
.size(function(_d) { return (opts.symbol_size * opts.symbol_size) + 2; })  // Pourquoi +2 ?

// Ligne 257-258: Brackets position
let dx = -(opts.symbol_size * 0.66);  // Pourquoi 0.66 ?
let dy = -(opts.symbol_size * 0.64);  // Pourquoi 0.64 ?

// Ligne 276-279: Dead status diagonal
.attr("x1", function(_d, _i) {return -0.6*opts.symbol_size;})  // Pourquoi 0.6 ?
.attr("y1", function(_d, _i) {return 0.6*opts.symbol_size;})

// Ligne 374: Consanguinity offset
let cshift = 3;  // Pourquoi 3 px ?

// Ligne 534-537: Proband arrow position
probandNode.x-(opts.symbol_size/0.7)  // Pourquoi /0.7 ?
probandNode.y+(opts.symbol_size/1.4)  // Pourquoi /1.4 ?
```

**Solution:** Extraire en constantes nommées au début du fichier:
```javascript
const RENDERING_CONSTANTS = {
    NODE_SEPARATION_SAME_PARENT: 1.2,
    NODE_SEPARATION_DIFFERENT: 2.2,
    SYMBOL_BORDER_EXTRA: 2,
    BRACKET_X_OFFSET_FACTOR: 0.66,
    BRACKET_Y_OFFSET_FACTOR: 0.64,
    DEAD_LINE_SIZE_FACTOR: 0.6,
    CONSANGUINITY_LINE_OFFSET: 3,
    PROBAND_ARROW_X_DIVISOR: 0.7,
    PROBAND_ARROW_Y_DIVISOR: 1.4
};
```

---

### MOYENNE 3: Couleurs hardcodées
**Fichier:** `pedigree.js` (multiples lignes)
**Sévérité:** 🟡 MOYENNE (customization limitée)

**Occurrences:**
```javascript
// Ligne 110: Background stroke
.attr("stroke", "darkgrey")  // ❌ Devrait être opts.border_color

// Ligne 194: Node border
.attr("stroke", function (d) {
    return d.data.age && d.data.yob && !d.data.exclude ? "#303030" : "grey";  // ❌ Hardcodé
})

// Ligne 247: Affected color
if(d.data.affected)
    return 'darkgrey';  // ❌ Devrait être configurable

// Ligne 275, 324, 442: Stroke black
.attr("stroke", "black")  // OK pour défaut, mais pas configurable

// Ligne 398-399: Clash feedback
.attr('stroke', '#D5494A')  // Rouge - devrait être opts.clash_color
```

**Solution:** Ajouter options configurables:
```javascript
// Dans defaults (ligne 49)
border_color: "darkgrey",
node_border_color: "#303030",
node_border_color_light: "grey",
affected_color: "darkgrey",
clash_color: "#D5494A",
link_color: "black"
```

---

### MOYENNE 4: Twins horizontal bar rendering inconsistency
**Fichier:** `pedigree.js:478-484`
**Sévérité:** 🟡 MOYENNE (logique complexe, bug potentiel)

```javascript
if(xmin === d.target.x && d.target.data.mztwin) {
    // horizontal bar for mztwins
    let xx = (xmid + d.target.x)/2;
    let yy = (ymid + (d.target.y-(opts.symbol_size/2)))/2;
    xhbar = "M" + xx + "," + yy +
            "L" + (xmid + (xmid-xx)) + " " + yy;  // ❌ Calcul cryptique
}
```

**Problème:**
- Condition `xmin === d.target.x` fragile (float comparison)
- Calcul `xmid + (xmid-xx)` = `2*xmid - xx` non documenté
- Pas clair pourquoi seulement si `xmin === d.target.x`

**Solution:** Documenter ou simplifier:
```javascript
// Only draw MZ twin bar for leftmost twin to avoid duplication
if(xmin === d.target.x && d.target.data.mztwin) {
    let barX = (xmid + d.target.x) / 2;  // Midpoint between twin and center
    let barY = (ymid + (d.target.y - (opts.symbol_size/2))) / 2;
    let barEndX = 2 * xmid - barX;  // Mirror position on other side
    xhbar = "M" + barX + "," + barY + "L" + barEndX + " " + barY;
}
```

---

### MOYENNE 5: Adopted brackets dessinés deux fois
**Fichier:** `pedigree.js:253-269`
**Sévérité:** 🟡 MOYENNE (inefficacité mineure)

```javascript
node.filter(function (d) {return !d.data.hidden && (d.data.adopted_in || d.data.adopted_out);})
    .append("path")
    .attr("d", function(_d) {
        let dx = -(opts.symbol_size * 0.66);
        let dy = -(opts.symbol_size * 0.64);
        let indent = opts.symbol_size/4;
        return get_bracket(dx, dy, indent, opts)+get_bracket(-dx, dy, -indent, opts);
    })
```

**Problème:** `get_bracket()` appelé deux fois dans une concaténation de string. Pas grave mais:
- Recalcul du même `bracket_height` deux fois
- Moins lisible

**Solution:** Appel unique avec path complet:
```javascript
// Dans get_bracket, ajouter option pour bracket pair
function get_bracket_pair(opts) {
    let bracket_height = opts.symbol_size * 1.3;
    let dx = -(opts.symbol_size * 0.66);
    let dy = -(opts.symbol_size * 0.64);
    let indent = opts.symbol_size/4;

    // Left bracket
    let left = "M" + (dx+indent) + "," + dy + ...
    // Right bracket
    let right = "M" + (-dx-indent) + "," + dy + ...

    return left + right;
}
```

---

### MOYENNE 6: Divorce path dessiné même si clash
**Fichier:** `pedigree.js:365-369`
**Sévérité:** 🟡 MOYENNE (bug visuel potentiel)

```javascript
let divorce_path = "";
if(divorced && !clash)  // ❌ Si clash ET divorced, divorce_path pas dessiné
    divorce_path = "M" + (x1+((x2-x1)*.66)+6) + "," + (dy1-6) +
                   "L"+  (x1+((x2-x1)*.66)-6) + "," + (dy1+6) +
                   "M" + (x1+((x2-x1)*.66)+10) + "," + (dy1-6) +
                   "L"+  (x1+((x2-x1)*.66)-2)  + "," + (dy1+6);
```

**Problème:** Si un couple est divorcé ET il y a un clash, les slashes de divorce ne sont pas dessinés.

**Impact:** Perte d'information importante (statut divorced).

**Solution:** Ajuster position divorce_path pour clashes:
```javascript
if(divorced) {
    let divorce_y = clash ? (dy1 - clash_depth[d.mother.depth]) : dy1;
    divorce_path = "M" + (x1+((x2-x1)*.66)+6) + "," + (divorce_y-6) + ...
}
```

---

### MOYENNE 7: Partner lines ne gèrent pas les sexes inconnus/identiques visuellement
**Fichier:** `pedigree.js:326-384`
**Sévérité:** 🟡 MOYENNE (clarté visuelle)

**Problème:** Les liens de partenaires sont identiques qu'il s'agisse de:
- Couples hétérosexuels (M-F)
- Couples same-sex (M-M, F-F)
- Couples avec sexe inconnu (U-M, U-F, U-U)

**Impact:** Pas de distinction visuelle pour les cas modernes (same-sex families) ou les données incomplètes.

**Solution:** Ajouter option pour différencier visuellement:
```javascript
// Exemple: couleur différente pour same-sex
let partner_color = "#000";
if(d.mother.data.sex === d.father.data.sex && d.mother.data.sex !== 'U') {
    partner_color = opts.same_sex_partner_color || "#9C27B0";  // Violet
}
```

---

### MOYENNE 8: ClipPath créés pour tous les nodes même sans maladies
**Fichier:** `pedigree.js:204-217`
**Sévérité:** 🟢 MINEURE (performance)

```javascript
node.filter(function (d) {return !(d.data.hidden && !opts.DEBUG);})
    .append("clipPath")  // ❌ Créé pour TOUS les nodes visibles
    .attr("id", function (d) {return opts.targetDiv + "_clip_" + d.data.name;})
```

**Problème:** ClipPaths créés pour tous les nodes, même ceux sans maladies (pas de pie charts).

**Impact:**
- DOM SVG plus lourd (100 personnes = 100 clipPaths inutiles si pas de maladies)
- Performance minimale mais additive

**Solution:** Filter seulement nodes avec maladies:
```javascript
node.filter(function (d) {
    if(d.data.hidden && !opts.DEBUG) return false;
    // Only create clipPath if node has diseases/affected status
    return d.data.affected || opts.diseases.some(disease =>
        utils.prefixInObj(disease.type, d.data)
    );
})
```

---

### MOYENNE 9: Proband arrow dimensions cassées pour petits symbol_size
**Fichier:** `pedigree.js:534-537`
**Sévérité:** 🟡 MOYENNE (robustesse)

```javascript
ped.append("line")
    .attr("x1", probandNode.x-(opts.symbol_size/0.7))  // = symbol_size * 1.43
    .attr("y1", probandNode.y+(opts.symbol_size/1.4))  // = symbol_size * 0.71
```

**Problème:** Pour `symbol_size=15` (minimum):
- x1 offset = 21px (plus grand que le symbole!)
- Flèche va être mal positionnée

**Solution:** Utiliser des facteurs plus robustes:
```javascript
const ARROW_X_OFFSET = Math.max(opts.symbol_size * 1.2, 25);
const ARROW_Y_OFFSET = opts.symbol_size * 0.8;

ped.append("line")
    .attr("x1", probandNode.x - ARROW_X_OFFSET)
    .attr("y1", probandNode.y + ARROW_Y_OFFSET)
```

---

### MOYENNE 10: Clash detection ne vérifie pas les liens children
**Fichier:** `pedigree.js:616-622`
**Sévérité:** 🟡 MOYENNE (faux négatifs)

```javascript
// identify clashes with other nodes at the same depth
let clash = $.map(flattenNodes, function(bnode, _i){
    return !bnode.data.hidden &&
            bnode.data.name !== mother.data.name &&  bnode.data.name !== father.data.name &&
            bnode.y === dy && bnode.x > x1 && bnode.x < x2 ? bnode.x : null;
});
```

**Problème:** Vérifie seulement les collisions avec les NODES, pas avec les liens verticaux vers les enfants.

**Impact:** Un lien horizontal de partenaire peut croiser un lien vertical parent-enfant sans détection.

**Solution:** Ajouter vérification des liens verticaux:
```javascript
// Check also for vertical child links that cross the partner line
let childLinkClashes = $.map(flattenNodes, function(bnode, _i){
    if(bnode.data.mother && bnode.data.father) {
        let motherNode = utils.getNodeByName(flattenNodes, bnode.data.mother);
        let fatherNode = utils.getNodeByName(flattenNodes, bnode.data.father);
        if(motherNode && fatherNode) {
            // Check if child link crosses this partner line
            let childX = bnode.x;
            let parentY = (motherNode.y + fatherNode.y) / 2;
            if(childX > x1 && childX < x2 && Math.abs(parentY - dy) < 5) {
                return childX;
            }
        }
    }
    return null;
});
```

---

### MOYENNE 11: Warning div ajouté au parent sans cleanup proper
**Fichier:** `pedigree.js:409-416`
**Sévérité:** 🟢 MINEURE (DOM pollution)

```javascript
$('#'+opts.targetDiv).parent().find('.pedigree-warning').remove();
$('#'+opts.targetDiv).parent().prepend(
    '<div class="pedigree-warning" style="...">' + ...
);
```

**Problème:**
- Si multiple rebuilds rapides, peut créer duplicates avant cleanup
- Le warning est ajouté au parent, mais si parent contient autres éléments, peut causer conflits

**Solution:** Utiliser un conteneur dédié:
```javascript
// Créer conteneur warning si n'existe pas
if($('#'+opts.targetDiv).prev('.pedigree-warning-container').length === 0) {
    $('#'+opts.targetDiv).before('<div class="pedigree-warning-container"></div>');
}

$('#'+opts.targetDiv).prev('.pedigree-warning-container')
    .html('<div class="pedigree-warning" style="...">...</div>');
```

---

### MOYENNE 12: Twins link path ne gère pas les cas edge
**Fichier:** `pedigree.js:460-492`
**Sévérité:** 🟡 MOYENNE (robustesse)

**Problèmes:**
1. Ligne 466: Variable `xmax` calculée mais jamais utilisée
2. Pas de gestion si `twins.length === 0`
3. Calcul `xmid` peut être NaN si division par 0

```javascript
if(twins.length >= 1) {  // ❌ Devrait être > 0 (pas >= 1)
    let twinx = 0;
    let xmin = d.target.x;
    //let xmax = d.target.x;  // ❌ UNUSED VARIABLE
    for(let t=0; t<twins.length; t++) {
        let thisx = utils.getNodeByName(flattenNodes, twins[t].name).x;
        if(xmin > thisx) xmin = thisx;
        //if(xmax < thisx) xmax = thisx;  // ❌ UNUSED
        twinx += thisx;
    }

    let xmid = ((d.target.x + twinx) / (twins.length+1));  // ❌ Si twins.length=0 → /1 mais twins vide
```

**Solution:** Cleanup et validation:
```javascript
if(twins.length > 0) {
    let twinx = 0;
    let xmin = d.target.x;

    for(let t=0; t<twins.length; t++) {
        let twinNode = utils.getNodeByName(flattenNodes, twins[t].name);
        if(!twinNode) continue;  // Skip if twin not found

        let thisx = twinNode.x;
        if(xmin > thisx) xmin = thisx;
        twinx += thisx;
    }

    let xmid = (d.target.x + twinx) / (twins.length + 1);
```

---

## 🟢 ANOMALIES MINEURES

### MINEURE 1: Commentaire "warning" commenté sans explication
**Fichier:** `pedigree.js:281-284`

```javascript
/*
 * let warn = node.filter(function (d) { return (!d.data.age || !d.data.yob) && !d.data.hidden; }).append("text") .attr('font-family', 'FontAwesome')
 * .attr("x", ".25em") .attr("y", -(0.4 * opts.symbol_size), -(0.2 * opts.symbol_size)) .html("\uf071"); warn.append("svg:title").text("incomplete");
 */
```

**Problème:** Code commenté pour afficher icône warning sur nodes incomplets (pas d'âge ou yob).

**Impact:** Feature disabled sans documentation pourquoi.

**Solution:** Soit supprimer, soit documenter la raison:
```javascript
// DISABLED: Warning icons on incomplete nodes (clutters UI, see issue #123)
// TODO: Re-enable with opt-in flag opts.showIncompleteWarnings
```

---

### MINEURE 2: DEBUG indicator position hardcodée
**Fichier:** `pedigree.js:119-136`

```javascript
svg.append("rect")
    .attr("x", svg_dimensions.width - 120)  // ❌ Hardcodé
    .attr("y", 5)
    .attr("width", 110)
    .attr("height", 25)
```

**Problème:** Si `width < 120`, l'indicateur sera hors écran.

**Solution:** Position relative ou min check:
```javascript
.attr("x", Math.max(svg_dimensions.width - 120, 10))
```

---

### MINEURE 3: Stroke-dasharray calculation cryptique pour adopted links
**Fichier:** `pedigree.js:444-452`

```javascript
.attr("stroke-dasharray", function(d, _i) {
    if(!d.target.data.adopted_in) return null;
    let dash_len = Math.abs(d.source.y-((d.source.y + d.target.y) / 2));
    let dash_array = [dash_len, 0, Math.abs(d.source.x-d.target.x), 0];
    let twins = utils.getTwins(opts.dataset, d.target.data);
    if(twins.length >= 1) dash_len = dash_len * 3;
    for(let usedlen = 0; usedlen < dash_len; usedlen += 10)
        $.merge(dash_array, [5, 5]);
    return dash_array;
})
```

**Problème:** Logique très complexe sans commentaires expliquant l'algorithme.

**Solution:** Ajouter documentation:
```javascript
// Adopted links use custom dash pattern:
// - First segment solid (from parent to midpoint)
// - Horizontal segment solid
// - Remaining vertical dashed (5px dash, 5px gap)
// - For twins, triple the dashed segment length
```

---

### MINEURE 4: Pie arc innerRadius toujours 0
**Fichier:** `pedigree.js:241`

```javascript
.attr("d", d3.arc().innerRadius(0).outerRadius(opts.symbol_size))
```

**Problème:** Toujours un "pie chart" plein. Si on voulait un "donut chart", impossible.

**Solution:** Rendre configurable:
```javascript
.attr("d", d3.arc()
    .innerRadius(opts.disease_inner_radius || 0)
    .outerRadius(opts.symbol_size))
```

---

### MINEURE 5: Separation function ne documente pas pourquoi 1.2 vs 2.2
**Fichier:** `pedigree.js:157-159`

```javascript
let treemap = d3.tree().separation(function(a, b) {
    return a.parent === b.parent || a.data.hidden || b.data.hidden ? 1.2 : 2.2;
});
```

**Solution:** Ajouter commentaire:
```javascript
// Separation between nodes:
// - 1.2x for siblings (same parent) or hidden nodes (compact)
// - 2.2x for different families (breathing room)
let treemap = d3.tree().separation(function(a, b) {
    return a.parent === b.parent || a.data.hidden || b.data.hidden ? 1.2 : 2.2;
});
```

---

### MINEURE 6: Race condition protection mais pas dans rebuild()
**Fichier:** `pedigree.js:667-682`

```javascript
export function rebuild(opts) {
    $("#"+opts.targetDiv).empty();
    pedcache.init_cache(opts);
    try {
        build(opts);  // ❌ Appelle build() directement, bypass _isBuilding
    } catch(e) {
        console.error(e);
        throw e;
    }
```

**Problème:** `rebuild()` appelle `build()` directement, mais les event handlers (ligne 684, 701) ont la protection `_isBuilding`.

**Impact:** Si on appelle `rebuild(opts)` directement (pas via event), pas de protection race condition.

**Solution:** Ajouter protection dans rebuild():
```javascript
export function rebuild(opts) {
    if(_isBuilding) {
        console.warn('Rebuild ignored: build in progress');
        return;
    }

    _isBuilding = true;
    try {
        $("#"+opts.targetDiv).empty();
        pedcache.init_cache(opts);
        build(opts);
    } finally {
        _isBuilding = false;
    }
}
```

---

### MINEURE 7-12: Autres optimisations mineures

**7. Node border size +2 non justifié (ligne 188)**
```javascript
.size(function(_d) { return (opts.symbol_size * opts.symbol_size) + 2; })
// Pourquoi +2 ? Commentaire manquant
```

**8. Divorce path magic numbers (ligne 366-369)**
```javascript
"M" + (x1+((x2-x1)*.66)+6) + "," + (dy1-6)  // Pourquoi .66, +6, -6 ?
```

**9. Adopted bracket indent non documenté (ligne 259)**
```javascript
let indent = opts.symbol_size/4;  // Pourquoi /4 ?
```

**10. Dead status line 0.6 factor (ligne 276)**
```javascript
.attr("x1", function(_d, _i) {return -0.6*opts.symbol_size;})  // Pourquoi 0.6 ?
```

**11. Parent link adjustment threshold (ligne 501)**
```javascript
if(ma && pa && ma.depth !== pa.depth) {  // OK mais pourquoi depth et pas y ?
```

**12. Twins horizontal bar Y position (ligne 481)**
```javascript
let yy = (ymid + (d.target.y-(opts.symbol_size/2)))/2;  // Calcul complexe
```

---

## 📋 RÉCAPITULATIF PAR PRIORITÉ

### 🔴 À Corriger Immédiatement (3)
1. ✅ **Duplication ligne bracket** (pedigree.js:566)
2. ✅ **Commentaire syntax** (pedigree.js:151)
3. ⚠️ **ClipPath hidden size** (documenter ou fixer)

### 🟡 À Corriger Bientôt (12)
4. Classes CSS sur paths (testabilité)
5. Magic numbers → constantes
6. Couleurs hardcodées → options
7. Twins rendering cleanup
8. Adopted brackets inefficacité
9. Divorce path avec clash
10. Same-sex couples distinction
11. ClipPath performance
12. Proband arrow robustesse
13. Clash detection incomplete
14. Warning div cleanup
15. Twins edge cases

### 🟢 Nice to Have (12)
16-27. Documentation, commentaires, optimisations mineures

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Phase 1: Correctifs Critiques (1h)
- [ ] Supprimer ligne dupliquée bracket (566)
- [ ] Fixer commentaire (151)
- [ ] Documenter ClipPath hidden size (211)

### Phase 2: Améliorations Moyennes (4h)
- [ ] Ajouter classes CSS sur tous les paths
- [ ] Extraire magic numbers en constantes
- [ ] Rendre couleurs configurables
- [ ] Fixer divorce path avec clash
- [ ] Cleanup twins rendering

### Phase 3: Refactoring (8h)
- [ ] Créer fichier `rendering-constants.js`
- [ ] Documenter tous les algorithmes complexes
- [ ] Tests visuels pour edge cases
- [ ] Performance optimization (ClipPaths conditionnels)

---

## 📊 MÉTRIQUES

**Lignes de code SVG:** ~550/717 (77%)
**Fonctions de rendu:** 3 (build, get_bracket, check_ptr_link_clashes)
**Éléments SVG créés:**
- 1 background rect
- 1 diagram group
- N nodes (symbols + clipPaths + pie charts + brackets + dead line)
- M partner links
- P child links
- 1 proband arrow
- Twins decorations

**Complexité cyclomatique estimée:** Élevée (nombreuses conditions imbriquées)

---

**Audit complété:** ✅
**Fichier généré:** SVG_RENDERING_AUDIT.md
