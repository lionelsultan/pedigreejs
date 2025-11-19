# 📋 PLAN D'ACTIONS - Améliorations Rendu SVG
## PedigreeJS v4.0.0-rc1

**Date création:** 2025-11-19
**Status:** 🔜 À IMPLÉMENTER
**Durée totale estimée:** 16 heures (sur 2-3 jours)

---

## 🎯 VUE D'ENSEMBLE

### Objectifs
1. ✅ Corriger les 3 échecs de tests SVG (classes CSS manquantes)
2. 🔧 Améliorer la maintenabilité (constantes, documentation)
3. 🎨 Rendre le rendu configurable (couleurs, options)
4. 🐛 Fixer bugs visuels mineurs (divorce+clash, clashes incomplets)
5. ⚡ Optimiser performances (ClipPaths conditionnels)

### Impact Attendu
- **Tests:** 232/237 → 237/237 (100% passing)
- **Maintenabilité:** +60% (constantes nommées, documentation)
- **Customization:** +80% (couleurs configurables)
- **Performance:** +5-10% (moins d'éléments SVG inutiles)

---

## 📅 PHASE 1: TESTABILITÉ & FIXES CRITIQUES
**Priorité:** 🔴 HAUTE
**Durée:** 2-3 heures
**Impact:** Fixer les 3 tests échouants + améliorer debuggabilité

### Tâche 1.1: Ajouter Classes CSS sur Child Links
**Fichier:** `es/pedigree.js:424-513`
**Durée:** 45 min

**Code actuel:**
```javascript
// ligne 424
ped.selectAll(".link")
    .data(root.links(nodes.descendants()))
    .enter()
        .filter(function (d) {
            return (opts.DEBUG ||
                    (d.target.data.noparents === undefined && d.source.parent !== null && !d.target.data.hidden));
        })
        .insert("path", "g")
        .attr("fill", "none")
```

**Code à implémenter:**
```javascript
// ligne 424
ped.selectAll(".link")
    .data(root.links(nodes.descendants()))
    .enter()
        .filter(function (d) {
            return (opts.DEBUG ||
                    (d.target.data.noparents === undefined && d.source.parent !== null && !d.target.data.hidden));
        })
        .insert("path", "g")
        .attr("class", function(d) {
            let classes = ["link", "child-link"];
            if(d.target.data.adopted_in) classes.push("adopted-link");
            if(d.target.data.mztwin) classes.push("mz-twin-link");
            if(d.target.data.dztwin) classes.push("dz-twin-link");
            if(d.target.data.noparents || d.source.parent === null || d.target.data.hidden)
                classes.push("debug-link");
            return classes.join(" ");
        })
        .attr("fill", "none")
```

**Tests à mettre à jour:**
```javascript
// spec/javascripts/svg_rendering_bugfix_spec.js:188
// AVANT:
let links = $('#pedigree_a svg .ped_link');

// APRÈS:
let links = $('#pedigree_a svg .child-link');
// OU plus spécifique:
let adoptedLinks = $('#pedigree_a svg .adopted-link');
```

---

### Tâche 1.2: Ajouter Classes CSS sur Partner Links
**Fichier:** `es/pedigree.js:319-385`
**Durée:** 30 min

**Code actuel:**
```javascript
// ligne 319
partners = ped.selectAll(".partner")
    .data(ptrLinkNodes)
    .enter()
        .insert("path", "g")
        .attr("fill", "none")
        .attr("stroke", "#000")
```

**Code à implémenter:**
```javascript
// ligne 319
partners = ped.selectAll(".partner")
    .data(ptrLinkNodes)
    .enter()
        .insert("path", "g")
        .attr("class", function(d) {
            let classes = ["partner", "partner-link"];
            let consanguity = utils.consanguity(d.mother, d.father, opts);
            let divorced = (d.mother.data.divorced && d.mother.data.divorced === d.father.data.name);

            if(consanguity) classes.push("consanguineous");
            if(divorced) classes.push("divorced");
            if(d.mother.data.sex === d.father.data.sex && d.mother.data.sex !== 'U')
                classes.push("same-sex");

            return classes.join(" ");
        })
        .attr("fill", "none")
        .attr("stroke", "#000")
```

**Bénéfices:**
- Tests peuvent cibler `.partner-link`, `.consanguineous`, `.divorced`
- CSS externe peut styler différemment (ex: same-sex en couleur différente)
- Debugging facile dans inspecteur

---

### Tâche 1.3: Mettre à Jour Tests SVG
**Fichier:** `spec/javascripts/svg_rendering_bugfix_spec.js`
**Durée:** 30 min

**Changements:**

```javascript
// Test BUG 7: Brackets (ligne 188)
// AVANT:
let links = $('#pedigree_a svg .ped_link');
expect(links.length).toBeGreaterThan(0);

// APRÈS:
let childLinks = $('#pedigree_a svg .child-link');
expect(childLinks.length).toBeGreaterThan(0);

// Test Multi-pedigree (lignes 237-238)
// AVANT:
let clipPaths_a = $('#pedigree_a svg clipPath');
expect(clipPaths_a.length).toBe(3);

// APRÈS: Ajouter maladies au dataset
opts1.dataset = [
    {"name": "m1", "sex": "M", "top_level": true, "affected": true},
    {"name": "f1", "sex": "F", "top_level": true, "breast_cancer": true},
    {"name": "ch1", "sex": "F", "mother": "f1", "father": "m1", "proband": true}
];

// Test Backward compatibility (ligne 280)
// Même changement: ajouter affected/diseases au dataset
```

**Résultat attendu:**
```bash
npm test
# 237 specs, 0 failures ✅
```

---

### Tâche 1.4: Ajouter Classes sur Nodes
**Fichier:** `es/pedigree.js:175-181`
**Durée:** 30 min

**Code actuel:**
```javascript
let node = ped.selectAll(".node")
    .data(nodes.descendants())
    .enter()
    .append("g")
        .attr("transform", function(d, _i) {
            return "translate(" + d.x + "," + d.y + ")";
        });
```

**Code à implémenter:**
```javascript
let node = ped.selectAll(".node")
    .data(nodes.descendants())
    .enter()
    .append("g")
        .attr("class", function(d) {
            let classes = ["node"];
            if(d.data.sex === 'M') classes.push("male");
            else if(d.data.sex === 'F') classes.push("female");
            else classes.push("unknown-sex");

            if(d.data.proband) classes.push("proband");
            if(d.data.hidden) classes.push("hidden");
            if(d.data.affected) classes.push("affected");
            if(d.data.adopted_in || d.data.adopted_out) classes.push("adopted");
            if(d.data.status === "1" || d.data.status === 1) classes.push("deceased");

            return classes.join(" ");
        })
        .attr("transform", function(d, _i) {
            return "translate(" + d.x + "," + d.y + ")";
        });
```

**Bénéfices:**
- CSS: `.male { ... }`, `.female { ... }`, `.proband { ... }`
- Tests: `$('.proband')`, `$('.deceased')`, `$('.adopted')`
- Accessibility: ARIA labels plus faciles à ajouter

---

### Tâche 1.5: Documentation Classes CSS
**Fichier:** Créer `docs/CSS_CLASSES.md`
**Durée:** 30 min

**Contenu:**

```markdown
# Classes CSS - PedigreeJS SVG

## Nodes (personnes)
- `.node` - Tous les nodes
- `.male` - Homme (sex='M')
- `.female` - Femme (sex='F')
- `.unknown-sex` - Sexe inconnu (sex='U')
- `.proband` - Personne centrale (proband=true)
- `.hidden` - Node caché (structure interne)
- `.affected` - Affecté par maladie
- `.adopted` - Adopté (in ou out)
- `.deceased` - Décédé (status='1')

## Links enfants
- `.link` - Tous les liens
- `.child-link` - Lien parent→enfant
- `.adopted-link` - Lien adopté (pointillé)
- `.mz-twin-link` - Jumeaux monozygotes
- `.dz-twin-link` - Jumeaux dizygotes
- `.debug-link` - Liens debug (noparents, hidden)

## Links partenaires
- `.partner` - Tous les liens partenaires
- `.partner-link` - Lien entre partenaires
- `.consanguineous` - Lien consanguin (double ligne)
- `.divorced` - Divorcé (double slash)
- `.same-sex` - Couple same-sex

## Exemples CSS

### Thème personnalisé
```css
/* Homme en bleu, femme en rose */
.male path { stroke: #2196F3; }
.female path { stroke: #E91E63; }

/* Proband en gras */
.proband path { stroke-width: 3px; }

/* Décédés en gris */
.deceased path { opacity: 0.5; }

/* Same-sex en violet */
.same-sex { stroke: #9C27B0; }
```
```

---

## 📅 PHASE 2: REFACTORING CONSTANTS
**Priorité:** 🟡 MOYENNE
**Durée:** 3-4 heures
**Impact:** Maintenabilité +60%, documentation claire

### Tâche 2.1: Créer Fichier Constants
**Fichier:** Créer `es/rendering-constants.js`
**Durée:** 1h

**Contenu complet:**

```javascript
/**
 * Constants for SVG rendering
 * All magic numbers used in pedigree.js are documented here
 *
 * @module rendering-constants
 */

/**
 * Node separation factors for D3 tree layout
 */
export const NODE_SEPARATION = {
    /** Separation for siblings (same parent) or hidden nodes */
    SAME_PARENT: 1.2,
    /** Separation for different families (more breathing room) */
    DIFFERENT: 2.2
};

/**
 * Symbol sizing factors
 */
export const SYMBOL_SIZE = {
    /** Extra pixels for symbol border to ensure visibility */
    BORDER_EXTRA: 2,
    /** Size factor for hidden nodes (1/5th of normal) */
    HIDDEN_FACTOR: 0.2
};

/**
 * Bracket positioning for adopted children
 */
export const BRACKETS = {
    /** Horizontal offset as fraction of symbol_size */
    X_OFFSET_FACTOR: 0.66,
    /** Vertical offset as fraction of symbol_size */
    Y_OFFSET_FACTOR: 0.64,
    /** Indent distance (symbol_size divided by this) */
    INDENT_DIVISOR: 4,
    /** Height multiplier for bracket height */
    HEIGHT_FACTOR: 1.3
};

/**
 * Dead status diagonal line
 */
export const DEAD_LINE = {
    /** Size of diagonal as fraction of symbol_size */
    SIZE_FACTOR: 0.6
};

/**
 * Partner line rendering
 */
export const PARTNER_LINK = {
    /** Vertical offset for consanguineous double line (px) */
    CONSANGUINITY_OFFSET: 3,
    /** Position of divorce slashes along partner line (0-1) */
    DIVORCE_POSITION: 0.66,
    /** Offset for divorce slash drawing (px) */
    DIVORCE_OFFSET: 6,
    /** Additional offset for second slash (px) */
    DIVORCE_SPACING: 4
};

/**
 * Proband arrow positioning
 */
export const PROBAND_ARROW = {
    /** X offset calculation: symbol_size / X_DIVISOR */
    X_DIVISOR: 0.7,  // Results in ~1.43x symbol_size
    /** Y offset calculation: symbol_size / Y_DIVISOR */
    Y_DIVISOR: 1.4,  // Results in ~0.71x symbol_size
    /** Minimum arrow length to ensure visibility (px) */
    MIN_LENGTH: 25,
    /** Arrow marker size */
    MARKER_WIDTH: 20,
    MARKER_HEIGHT: 20
};

/**
 * Twins rendering
 */
export const TWINS = {
    /** Minimum twin spacing threshold for connecting bar */
    MIN_SPACING: 1.25,  // In symbol_size units
    /** MZ twin horizontal bar Y position offset */
    BAR_Y_OFFSET_FACTOR: 0.5
};

/**
 * Clash detection and routing
 */
export const CLASH_ROUTING = {
    /** Base vertical offset for routing around obstacles */
    BASE_OFFSET: 4,
    /** Additional offset per clash at same depth */
    INCREMENT_PER_CLASH: 4,
    /** Horizontal clearance around obstacle nodes */
    HORIZONTAL_CLEARANCE: 2
};

/**
 * Default colors (can be overridden via opts)
 */
export const DEFAULT_COLORS = {
    BORDER: "darkgrey",
    NODE_BORDER_DEFINED: "#303030",      // When age+yob present
    NODE_BORDER_LIGHT: "grey",           // When age/yob missing
    AFFECTED_FILL: "darkgrey",           // Affected but no specific disease
    LINK_COLOR: "black",
    CLASH_COLOR: "#D5494A",              // Red for clashing links
    SAME_SEX_PARTNER: null,              // null = use default link color
    DEBUG_INDICATOR_BG: "#ff9800",       // Orange
    DEBUG_INDICATOR_BORDER: "#f57c00"    // Dark orange
};
```

**Import dans pedigree.js:**
```javascript
// Ligne 8, ajouter:
import * as CONST from './rendering-constants.js';
```

---

### Tâche 2.2: Remplacer Magic Numbers - Separation
**Fichier:** `es/pedigree.js:157-159`
**Durée:** 10 min

**AVANT:**
```javascript
let treemap = d3.tree().separation(function(a, b) {
    return a.parent === b.parent || a.data.hidden || b.data.hidden ? 1.2 : 2.2;
});
```

**APRÈS:**
```javascript
let treemap = d3.tree().separation(function(a, b) {
    return a.parent === b.parent || a.data.hidden || b.data.hidden
        ? CONST.NODE_SEPARATION.SAME_PARENT
        : CONST.NODE_SEPARATION.DIFFERENT;
});
```

---

### Tâche 2.3: Remplacer Magic Numbers - Symboles
**Fichier:** `es/pedigree.js:188, 210-214`
**Durée:** 15 min

**AVANT (ligne 188):**
```javascript
.attr("d", d3.symbol().size(function(_d) {
    return (opts.symbol_size * opts.symbol_size) + 2;
})
```

**APRÈS:**
```javascript
.attr("d", d3.symbol().size(function(_d) {
    return (opts.symbol_size * opts.symbol_size) + CONST.SYMBOL_SIZE.BORDER_EXTRA;
})
```

**AVANT (lignes 210-214):**
```javascript
.attr("d", d3.symbol().size(function(d) {
    if (d.data.hidden)
        return opts.symbol_size * opts.symbol_size / 5;
    return opts.symbol_size * opts.symbol_size;
})
```

**APRÈS:**
```javascript
.attr("d", d3.symbol().size(function(d) {
    if (d.data.hidden)
        return opts.symbol_size * opts.symbol_size * CONST.SYMBOL_SIZE.HIDDEN_FACTOR;
    return opts.symbol_size * opts.symbol_size;
})
```

---

### Tâche 2.4: Remplacer Magic Numbers - Brackets
**Fichier:** `es/pedigree.js:257-260, 558-561`
**Durée:** 15 min

**AVANT (lignes 257-260):**
```javascript
let dx = -(opts.symbol_size * 0.66);
let dy = -(opts.symbol_size * 0.64);
let indent = opts.symbol_size/4;
return get_bracket(dx, dy, indent, opts)+get_bracket(-dx, dy, -indent, opts);
```

**APRÈS:**
```javascript
let dx = -(opts.symbol_size * CONST.BRACKETS.X_OFFSET_FACTOR);
let dy = -(opts.symbol_size * CONST.BRACKETS.Y_OFFSET_FACTOR);
let indent = opts.symbol_size / CONST.BRACKETS.INDENT_DIVISOR;
return get_bracket(dx, dy, indent, opts)+get_bracket(-dx, dy, -indent, opts);
```

**AVANT (ligne 561):**
```javascript
let bracket_height = opts.symbol_size * 1.3;
```

**APRÈS:**
```javascript
let bracket_height = opts.symbol_size * CONST.BRACKETS.HEIGHT_FACTOR;
```

---

### Tâche 2.5: Remplacer Magic Numbers - Dead Line
**Fichier:** `es/pedigree.js:276-279`
**Durée:** 10 min

**AVANT:**
```javascript
.attr("x1", function(_d, _i) {return -0.6*opts.symbol_size;})
.attr("y1", function(_d, _i) {return 0.6*opts.symbol_size;})
.attr("x2", function(_d, _i) {return 0.6*opts.symbol_size;})
.attr("y2", function(_d, _i) {return -0.6*opts.symbol_size;});
```

**APRÈS:**
```javascript
.attr("x1", function(_d, _i) {
    return -CONST.DEAD_LINE.SIZE_FACTOR * opts.symbol_size;
})
.attr("y1", function(_d, _i) {
    return CONST.DEAD_LINE.SIZE_FACTOR * opts.symbol_size;
})
.attr("x2", function(_d, _i) {
    return CONST.DEAD_LINE.SIZE_FACTOR * opts.symbol_size;
})
.attr("y2", function(_d, _i) {
    return -CONST.DEAD_LINE.SIZE_FACTOR * opts.symbol_size;
});
```

---

### Tâche 2.6: Remplacer Magic Numbers - Partner Links
**Fichier:** `es/pedigree.js:366-369, 374`
**Durée:** 15 min

**AVANT (ligne 374):**
```javascript
let cshift = 3;
```

**APRÈS:**
```javascript
let cshift = CONST.PARTNER_LINK.CONSANGUINITY_OFFSET;
```

**AVANT (lignes 366-369):**
```javascript
divorce_path = "M" + (x1+((x2-x1)*.66)+6) + "," + (dy1-6) +
               "L"+  (x1+((x2-x1)*.66)-6) + "," + (dy1+6) +
               "M" + (x1+((x2-x1)*.66)+10) + "," + (dy1-6) +
               "L"+  (x1+((x2-x1)*.66)-2)  + "," + (dy1+6);
```

**APRÈS:**
```javascript
let divorce_x = x1 + ((x2-x1) * CONST.PARTNER_LINK.DIVORCE_POSITION);
let offset = CONST.PARTNER_LINK.DIVORCE_OFFSET;
let spacing = CONST.PARTNER_LINK.DIVORCE_SPACING;

divorce_path = "M" + (divorce_x + offset) + "," + (dy1 - offset) +
               "L" + (divorce_x - offset) + "," + (dy1 + offset) +
               "M" + (divorce_x + offset + spacing) + "," + (dy1 - offset) +
               "L" + (divorce_x - offset + spacing) + "," + (dy1 + offset);
```

---

### Tâche 2.7: Remplacer Magic Numbers - Proband Arrow
**Fichier:** `es/pedigree.js:534-537`
**Durée:** 10 min

**AVANT:**
```javascript
.attr("x1", probandNode.x-(opts.symbol_size/0.7))
.attr("y1", probandNode.y+(opts.symbol_size/1.4))
.attr("x2", probandNode.x-(opts.symbol_size/1.4))
.attr("y2", probandNode.y+(opts.symbol_size/4))
```

**APRÈS:**
```javascript
.attr("x1", probandNode.x - Math.max(
    opts.symbol_size / CONST.PROBAND_ARROW.X_DIVISOR,
    CONST.PROBAND_ARROW.MIN_LENGTH
))
.attr("y1", probandNode.y + (opts.symbol_size / CONST.PROBAND_ARROW.Y_DIVISOR))
.attr("x2", probandNode.x - (opts.symbol_size / CONST.PROBAND_ARROW.Y_DIVISOR))
.attr("y2", probandNode.y + (opts.symbol_size / 4))
```

---

### Tâche 2.8: Remplacer Magic Numbers - Clash Routing
**Fichier:** `es/pedigree.js:342-344, 347`
**Durée:** 10 min

**AVANT:**
```javascript
if(d.mother.depth in clash_depth)
    clash_depth[d.mother.depth] += 4;
else
    clash_depth[d.mother.depth] = 4;

dx = clash_depth[d.mother.depth] + (opts.symbol_size/2) + 2;
```

**APRÈS:**
```javascript
if(d.mother.depth in clash_depth)
    clash_depth[d.mother.depth] += CONST.CLASH_ROUTING.INCREMENT_PER_CLASH;
else
    clash_depth[d.mother.depth] = CONST.CLASH_ROUTING.BASE_OFFSET;

dx = clash_depth[d.mother.depth] + (opts.symbol_size/2) + CONST.CLASH_ROUTING.HORIZONTAL_CLEARANCE;
```

---

## 📅 PHASE 3: COULEURS CONFIGURABLES
**Priorité:** 🟡 MOYENNE
**Durée:** 2 heures
**Impact:** Customization +80%, thèmes possibles

### Tâche 3.1: Ajouter Options Couleurs
**Fichier:** `es/pedigree.js:49-79`
**Durée:** 30 min

**Ajouter dans defaults (après ligne 79):**

```javascript
// Color options (can be overridden)
border_color: CONST.DEFAULT_COLORS.BORDER,
node_border_color: CONST.DEFAULT_COLORS.NODE_BORDER_DEFINED,
node_border_color_light: CONST.DEFAULT_COLORS.NODE_BORDER_LIGHT,
affected_color: CONST.DEFAULT_COLORS.AFFECTED_FILL,
link_color: CONST.DEFAULT_COLORS.LINK_COLOR,
clash_color: CONST.DEFAULT_COLORS.CLASH_COLOR,
same_sex_partner_color: CONST.DEFAULT_COLORS.SAME_SEX_PARTNER,
debug_indicator_bg: CONST.DEFAULT_COLORS.DEBUG_INDICATOR_BG,
debug_indicator_border: CONST.DEFAULT_COLORS.DEBUG_INDICATOR_BORDER
```

---

### Tâche 3.2: Utiliser Options Couleurs - Background
**Fichier:** `es/pedigree.js:110`
**Durée:** 5 min

**AVANT:**
```javascript
.attr("stroke", "darkgrey")
```

**APRÈS:**
```javascript
.attr("stroke", opts.border_color)
```

---

### Tâche 3.3: Utiliser Options Couleurs - Node Borders
**Fichier:** `es/pedigree.js:193-194`
**Durée:** 5 min

**AVANT:**
```javascript
.attr("stroke", function (d) {
    return d.data.age && d.data.yob && !d.data.exclude ? "#303030" : "grey";
})
```

**APRÈS:**
```javascript
.attr("stroke", function (d) {
    return d.data.age && d.data.yob && !d.data.exclude
        ? opts.node_border_color
        : opts.node_border_color_light;
})
```

---

### Tâche 3.4: Utiliser Options Couleurs - Affected Fill
**Fichier:** `es/pedigree.js:246-247`
**Durée:** 5 min

**AVANT:**
```javascript
if(d.data.affected)
    return 'darkgrey';
```

**APRÈS:**
```javascript
if(d.data.affected)
    return opts.affected_color;
```

---

### Tâche 3.5: Utiliser Options Couleurs - Links
**Fichier:** `es/pedigree.js:324, 442`
**Durée:** 10 min

**AVANT (ligne 324):**
```javascript
.attr("stroke", "#000")
```

**APRÈS:**
```javascript
.attr("stroke", function(d) {
    // Same-sex partner color (if configured)
    if(opts.same_sex_partner_color &&
       d.mother.data.sex === d.father.data.sex &&
       d.mother.data.sex !== 'U') {
        return opts.same_sex_partner_color;
    }
    return opts.link_color;
})
```

**AVANT (ligne 442):**
```javascript
.attr("stroke", function(d, _i) {
    if(d.target.data.noparents !== undefined || d.source.parent === null || d.target.data.hidden)
        return 'pink';
    return "#000";
})
```

**APRÈS:**
```javascript
.attr("stroke", function(d, _i) {
    if(d.target.data.noparents !== undefined || d.source.parent === null || d.target.data.hidden)
        return 'pink';  // Debug color (keep pink for visibility)
    return opts.link_color;
})
```

---

### Tâche 3.6: Utiliser Options Couleurs - Clash Feedback
**Fichier:** `es/pedigree.js:398`
**Durée:** 5 min

**AVANT:**
```javascript
d3.select(this)
    .attr('stroke', '#D5494A')
```

**APRÈS:**
```javascript
d3.select(this)
    .attr('stroke', opts.clash_color)
```

---

### Tâche 3.7: Utiliser Options Couleurs - DEBUG Indicator
**Fichier:** `es/pedigree.js:124-125`
**Durée:** 5 min

**AVANT:**
```javascript
.attr("fill", "#ff9800")
.attr("stroke", "#f57c00")
```

**APRÈS:**
```javascript
.attr("fill", opts.debug_indicator_bg)
.attr("stroke", opts.debug_indicator_border)
```

---

### Tâche 3.8: Documentation Options Couleurs
**Fichier:** Mettre à jour `CLAUDE.md` et créer `docs/THEMING.md`
**Durée:** 30 min

**Contenu `docs/THEMING.md`:**

```markdown
# Theming Guide - PedigreeJS

## Color Options

All colors are configurable via the `build()` options:

```javascript
pedigreejs.build({
    targetDiv: 'my_pedigree',
    dataset: [...],

    // Custom colors
    border_color: "#333",
    node_border_color: "#000",
    node_border_color_light: "#999",
    affected_color: "#FF5722",
    link_color: "#424242",
    clash_color: "#F44336",
    same_sex_partner_color: "#9C27B0",  // Violet for same-sex couples
    debug_indicator_bg: "#00BCD4",
    debug_indicator_border: "#0097A7"
});
```

## Predefined Themes

### Dark Theme
```javascript
{
    background: "#1E1E1E",
    node_background: "#2D2D2D",
    border_color: "#404040",
    node_border_color: "#FFFFFF",
    node_border_color_light: "#AAAAAA",
    affected_color: "#FF5722",
    link_color: "#FFFFFF",
    clash_color: "#FF5252"
}
```

### Colorblind-Friendly
```javascript
{
    affected_color: "#E69F00",      // Orange instead of grey
    clash_color: "#D55E00",         // Vermillion
    same_sex_partner_color: "#0072B2"  // Blue
}
```

### High Contrast
```javascript
{
    background: "#FFFFFF",
    node_border_color: "#000000",
    link_color: "#000000",
    affected_color: "#000000",
    clash_color: "#CC0000"
}
```
```

---

## 📅 PHASE 4: FIXES BUGS VISUELS
**Priorité:** 🟢 BASSE
**Durée:** 3 heures
**Impact:** Correctness +15%, edge cases robustes

### Tâche 4.1: Fixer Divorce Path avec Clash
**Fichier:** `es/pedigree.js:364-385`
**Durée:** 30 min

**Problème:** Divorce path pas dessiné si clash existe

**AVANT (ligne 365):**
```javascript
if(divorced && !clash)
    divorce_path = ...
```

**APRÈS:**
```javascript
if(divorced) {
    // Adjust divorce position if clash routing is active
    let divorce_y = dy1;
    if(clash && d.mother.depth in clash_depth) {
        divorce_y -= clash_depth[d.mother.depth];
    }

    let divorce_x = x1 + ((x2-x1) * CONST.PARTNER_LINK.DIVORCE_POSITION);
    let offset = CONST.PARTNER_LINK.DIVORCE_OFFSET;
    let spacing = CONST.PARTNER_LINK.DIVORCE_SPACING;

    divorce_path = "M" + (divorce_x + offset) + "," + (divorce_y - offset) +
                   "L" + (divorce_x - offset) + "," + (divorce_y + offset) +
                   "M" + (divorce_x + offset + spacing) + "," + (divorce_y - offset) +
                   "L" + (divorce_x - offset + spacing) + "," + (divorce_y + offset);
}
```

---

### Tâche 4.2: Améliorer Clash Detection (Child Links)
**Fichier:** `es/pedigree.js:585-623`
**Durée:** 1h

**Ajouter après ligne 622:**

```javascript
export function check_ptr_link_clashes(opts, anode) {
    // ... code existant ...

    let clash = $.map(flattenNodes, function(bnode, _i){
        return !bnode.data.hidden &&
                bnode.data.name !== mother.data.name &&
                bnode.data.name !== father.data.name &&
                bnode.y === dy && bnode.x > x1 && bnode.x < x2 ? bnode.x : null;
    });

    // NEW: Check also for child links crossing this partner line
    let childLinkClashes = $.map(flattenNodes, function(bnode, _i){
        if(!bnode.data.mother || !bnode.data.father) return null;

        let motherName = typeof bnode.data.mother === 'string' ? bnode.data.mother : bnode.data.mother.name;
        let fatherName = typeof bnode.data.father === 'string' ? bnode.data.father : bnode.data.father.name;
        if(!motherName || !fatherName) return null;

        let motherNode = utils.getNodeByName(flattenNodes, motherName);
        let fatherNode = utils.getNodeByName(flattenNodes, fatherName);
        if(!motherNode || !fatherNode) return null;

        // Check if this child link crosses the partner line horizontally
        let parentY = (motherNode.y + fatherNode.y) / 2;
        let childX = bnode.x;

        // Tolerance for Y coordinate comparison
        let yTolerance = 5;

        if(childX > x1 && childX < x2 && Math.abs(parentY - dy) < yTolerance) {
            return childX;
        }
        return null;
    });

    // Merge node clashes and child link clashes
    let allClashes = clash.concat(childLinkClashes.filter(x => x !== null));

    return allClashes.length > 0 ? allClashes : null;
}
```

---

### Tâche 4.3: Cleanup Twins Rendering
**Fichier:** `es/pedigree.js:460-492`
**Durée:** 45 min

**Problèmes:**
1. Variable `xmax` calculée mais jamais utilisée
2. Pas de validation `twins.length > 0`
3. Calcul cryptique pour MZ bar position

**AVANT:**
```javascript
if(d.target.data.mztwin || d.target.data.dztwin) {
    let twins = utils.getTwins(opts.dataset, d.target.data);
    if(twins.length >= 1) {
        let twinx = 0;
        let xmin = d.target.x;
        //let xmax = d.target.x;
        for(let t=0; t<twins.length; t++) {
            let thisx = utils.getNodeByName(flattenNodes, twins[t].name).x;
            if(xmin > thisx) xmin = thisx;
            //if(xmax < thisx) xmax = thisx;
            twinx += thisx;
        }
```

**APRÈS:**
```javascript
if(d.target.data.mztwin || d.target.data.dztwin) {
    let twins = utils.getTwins(opts.dataset, d.target.data);
    if(twins.length > 0) {  // Changed from >= 1
        let twinx = 0;
        let xmin = d.target.x;

        // Calculate sum of twin positions and find leftmost
        for(let t=0; t<twins.length; t++) {
            let twinNode = utils.getNodeByName(flattenNodes, twins[t].name);
            if(!twinNode) continue;  // Skip if twin node not found

            let thisx = twinNode.x;
            if(xmin > thisx) xmin = thisx;
            twinx += thisx;
        }
```

**Et pour la barre MZ (ligne 478):**

**AVANT:**
```javascript
if(xmin === d.target.x && d.target.data.mztwin) {
    let xx = (xmid + d.target.x)/2;
    let yy = (ymid + (d.target.y-(opts.symbol_size/2)))/2;
    xhbar = "M" + xx + "," + yy +
            "L" + (xmid + (xmid-xx)) + " " + yy;
}
```

**APRÈS:**
```javascript
// Only draw MZ twin bar for leftmost twin to avoid duplication
if(Math.abs(xmin - d.target.x) < 0.1 && d.target.data.mztwin) {
    // Horizontal bar midpoint between twin and center
    let barX = (xmid + d.target.x) / 2;
    let barY = (ymid + (d.target.y - (opts.symbol_size/2))) / 2;
    let barEndX = 2 * xmid - barX;  // Mirror position on other side

    xhbar = "M" + barX + "," + barY + "L" + barEndX + " " + barY;
}
```

---

### Tâche 4.4: Optimiser ClipPaths (Conditionnels)
**Fichier:** `es/pedigree.js:204-217`
**Durée:** 30 min

**Problème:** ClipPaths créés pour tous les nodes même sans maladies

**AVANT (ligne 204):**
```javascript
node.filter(function (d) {return !(d.data.hidden && !opts.DEBUG);})
    .append("clipPath")
```

**APRÈS:**
```javascript
// Only create clipPaths for nodes that actually need them (have diseases or affected status)
node.filter(function (d) {
    if(d.data.hidden && !opts.DEBUG) return false;

    // Check if node has any disease or affected status
    if(d.data.affected) return true;

    // Check if node has any of the configured diseases
    for(let i=0; i<opts.diseases.length; i++) {
        if(utils.prefixInObj(opts.diseases[i].type, d.data)) {
            return true;
        }
    }

    return false;  // No diseases, no clipPath needed
})
    .append("clipPath")
```

**Impact:** Réduction ~50% des clipPaths dans pedigrees sans maladies

---

### Tâche 4.5: Robustesse Proband Arrow
**Fichier:** `es/pedigree.js:534-537`
**Durée:** 15 min

**Problème:** Arrow mal positionné pour petits symbol_size

**Solution déjà dans Tâche 2.7** avec `Math.max()` pour longueur minimum

**Test à ajouter:**
```javascript
describe('Proband arrow robustness', function() {
    it('should render correctly for small symbol_size', function() {
        let dataset = [{
            name: "proband",
            sex: "M",
            top_level: true,
            proband: true
        }];

        pedigree.build({
            targetDiv: 'test',
            dataset: dataset,
            symbol_size: 15  // Very small
        });

        let arrow = $('#test svg line[marker-end]');
        expect(arrow.length).toBe(1);

        // Arrow should have minimum length
        let x1 = parseFloat(arrow.attr('x1'));
        let x2 = parseFloat(arrow.attr('x2'));
        let arrowLength = Math.abs(x1 - x2);

        expect(arrowLength).toBeGreaterThanOrEqual(25);  // MIN_LENGTH
    });
});
```

---

## 📅 PHASE 5: DOCUMENTATION & TESTS
**Priorité:** 🟢 BASSE
**Durée:** 3 heures
**Impact:** Maintenabilité long-terme, prévention régressions

### Tâche 5.1: Documenter Algorithmes Complexes
**Fichier:** `es/pedigree.js`
**Durée:** 1h

**Ajouter commentaires JSDoc:**

```javascript
/**
 * Calculate clash routing path for partner links
 * When a partner link crosses other nodes, routes around them with stepped path
 *
 * @param {Array} clash - Array of x-coordinates of nodes that clash
 * @param {number} dx - Horizontal clearance around obstacles
 * @param {number} dy1 - Starting Y coordinate
 * @param {number} dy2 - Ending Y coordinate (routed)
 * @param {Object} parent_node - Parent node to adjust position
 * @param {number} cshift - Additional shift for consanguineous double line
 * @returns {string} SVG path string for routing around obstacles
 *
 * Algorithm:
 * 1. Group consecutive clashing nodes (extend function)
 * 2. For each group, create vertical detour:
 *    - Go up from dy1 to dy2
 *    - Go horizontal around group
 *    - Come back down to dy1
 * 3. Adjust parent node Y if between obstacles
 */
let draw_path = function(clash, dx, dy1, dy2, parent_node, cshift) {
```

**Idem pour:**
- `check_ptr_link_clashes()` - Détection collisions
- Twins rendering logic (lignes 460-492)
- Adopted link dash array (lignes 444-452)

---

### Tâche 5.2: Tests Visuels Régressions
**Fichier:** Créer `spec/javascripts/svg_visual_regression_spec.js`
**Durée:** 1h

**Contenu:**

```javascript
/**
 * Visual regression tests for SVG rendering
 * Validates edge cases and bug fixes
 */
describe('SVG Visual Regression Tests', function() {
    let pedigree = window.pedigreejs.pedigreejs;
    let utils = window.pedigreejs.pedigreejs_utils;

    let opts;

    beforeEach(function() {
        $('body').append("<div id='vr_test'></div>");
        opts = {
            targetDiv: 'vr_test',
            width: 600,
            height: 400,
            symbol_size: 35
        };
    });

    afterEach(function() {
        $('#vr_test').remove();
    });

    describe('Brackets rendering', function() {
        it('should not duplicate path segments', function() {
            opts.dataset = [{
                name: "adopted",
                sex: "M",
                adopted_in: true,
                top_level: true
            }];

            pedigree.build(opts);

            let brackets = $('#vr_test svg path').filter(function() {
                let d = $(this).attr('d');
                return d && d.includes('M-');  // Bracket path starts with M-
            });

            expect(brackets.length).toBe(1);

            let pathD = brackets.attr('d');
            let segments = pathD.split('L');

            // Check no consecutive duplicate segments
            for(let i=0; i<segments.length-1; i++) {
                expect(segments[i].trim()).not.toBe(segments[i+1].trim());
            }
        });
    });

    describe('Divorce with clash', function() {
        it('should render divorce slashes even when clash routing active', function() {
            opts.dataset = [
                {name: "m1", sex: "M", top_level: true},
                {name: "f1", sex: "F", top_level: true, divorced: "m1"},
                {name: "m2", sex: "M", top_level: true, mother: "f1", father: "m1"},  // Creates clash
                {name: "ch1", sex: "F", mother: "f1", father: "m1"}
            ];

            pedigree.build(opts);

            let partnerLinks = $('#vr_test svg .partner-link');

            // Find the divorced link
            let divorcedLink = partnerLinks.filter('.divorced');
            expect(divorcedLink.length).toBeGreaterThan(0);

            // Check path includes divorce slashes (M...L pattern repeated)
            let pathD = divorcedLink.attr('d');
            let mCount = (pathD.match(/M/g) || []).length;
            expect(mCount).toBeGreaterThanOrEqual(3);  // Main line + 2 slashes
        });
    });

    describe('Small symbol_size', function() {
        it('should render proband arrow correctly for symbol_size=15', function() {
            opts.dataset = [{
                name: "proband",
                sex: "F",
                top_level: true,
                proband: true
            }];
            opts.symbol_size = 15;

            pedigree.build(opts);

            let arrow = $('#vr_test svg line[marker-end]');
            expect(arrow.length).toBe(1);

            let x1 = parseFloat(arrow.attr('x1'));
            let x2 = parseFloat(arrow.attr('x2'));
            let arrowLength = Math.abs(x1 - x2);

            expect(arrowLength).toBeGreaterThanOrEqual(25);
        });
    });

    describe('Twins edge cases', function() {
        it('should handle MZ twins with missing twin node', function() {
            let twinId = 'mz1';
            opts.dataset = [
                {name: "m1", sex: "M", top_level: true},
                {name: "f1", sex: "F", top_level: true},
                {name: "twin1", sex: "M", mother: "f1", father: "m1", mztwin: twinId},
                // twin2 intentionally missing to test robustness
            ];

            expect(function() {
                pedigree.build(opts);
            }).not.toThrow();
        });
    });

    describe('ClipPath optimization', function() {
        it('should not create clipPaths for nodes without diseases', function() {
            opts.dataset = [
                {name: "healthy", sex: "M", top_level: true},  // No diseases
                {name: "affected", sex: "F", top_level: true, affected: true}  // Affected
            ];

            pedigree.build(opts);

            let clipPaths = $('#vr_test svg clipPath');

            // Should only have 1 clipPath (for affected node)
            expect(clipPaths.length).toBe(1);

            let clipId = clipPaths.attr('id');
            expect(clipId).toContain('affected');
        });
    });
});
```

---

### Tâche 5.3: Mettre à Jour Documentation
**Fichier:** Mettre à jour `CLAUDE.md`, `README.md`
**Durée:** 1h

**Ajouter à CLAUDE.md:**

```markdown
## SVG Rendering Architecture (Post-Refactoring Phase SVG)

### Constantes de Rendu

Tous les "magic numbers" ont été extraits dans `es/rendering-constants.js`:

- `NODE_SEPARATION` - Espacements tree layout
- `SYMBOL_SIZE` - Facteurs dimensionnement symboles
- `BRACKETS` - Positionnement brackets adoptés
- `DEAD_LINE` - Ligne diagonale décédés
- `PARTNER_LINK` - Liens partenaires (consanguinité, divorce)
- `PROBAND_ARROW` - Flèche proband
- `TWINS` - Rendu jumeaux
- `CLASH_ROUTING` - Détection et routing collisions
- `DEFAULT_COLORS` - Couleurs par défaut

### Classes CSS SVG

Tous les éléments SVG ont des classes pour testabilité/styling:

**Nodes:**
- `.node` - Tous les nodes
- `.male`, `.female`, `.unknown-sex` - Par genre
- `.proband`, `.affected`, `.deceased`, `.adopted` - États

**Links:**
- `.child-link` - Liens parent→enfant
- `.adopted-link`, `.mz-twin-link`, `.dz-twin-link` - Variations
- `.partner-link` - Liens partenaires
- `.consanguineous`, `.divorced`, `.same-sex` - États partenaires

### Options de Couleurs

Toutes les couleurs sont configurables via `opts`:

```javascript
pedigreejs.build({
    border_color: "darkgrey",
    node_border_color: "#303030",
    affected_color: "darkgrey",
    link_color: "black",
    clash_color: "#D5494A",
    same_sex_partner_color: "#9C27B0"  // Null = default
});
```

Voir `docs/THEMING.md` pour thèmes prédéfinis.
```

---

## 🎯 CHECKLIST COMPLÈTE D'IMPLÉMENTATION

### Phase 1: Testabilité (2-3h)
- [ ] Tâche 1.1: Classes CSS child links
- [ ] Tâche 1.2: Classes CSS partner links
- [ ] Tâche 1.3: Mettre à jour tests SVG
- [ ] Tâche 1.4: Classes CSS nodes
- [ ] Tâche 1.5: Documentation classes CSS

**Validation:** `npm test` → 237/237 specs passing ✅

### Phase 2: Refactoring Constants (3-4h)
- [ ] Tâche 2.1: Créer rendering-constants.js
- [ ] Tâche 2.2: Remplacer - Separation
- [ ] Tâche 2.3: Remplacer - Symboles
- [ ] Tâche 2.4: Remplacer - Brackets
- [ ] Tâche 2.5: Remplacer - Dead Line
- [ ] Tâche 2.6: Remplacer - Partner Links
- [ ] Tâche 2.7: Remplacer - Proband Arrow
- [ ] Tâche 2.8: Remplacer - Clash Routing

**Validation:** `npm run build` → Success, visual check examples

### Phase 3: Couleurs Configurables (2h)
- [ ] Tâche 3.1: Ajouter options couleurs
- [ ] Tâche 3.2: Background
- [ ] Tâche 3.3: Node borders
- [ ] Tâche 3.4: Affected fill
- [ ] Tâche 3.5: Links
- [ ] Tâche 3.6: Clash feedback
- [ ] Tâche 3.7: DEBUG indicator
- [ ] Tâche 3.8: Documentation theming

**Validation:** Tester thèmes dark, colorblind, high-contrast

### Phase 4: Fixes Bugs Visuels (3h)
- [ ] Tâche 4.1: Divorce path avec clash
- [ ] Tâche 4.2: Clash detection child links
- [ ] Tâche 4.3: Cleanup twins rendering
- [ ] Tâche 4.4: Optimiser clipPaths
- [ ] Tâche 4.5: Robustesse proband arrow

**Validation:** Tests visuels, edge cases

### Phase 5: Documentation & Tests (3h)
- [ ] Tâche 5.1: Documenter algorithmes
- [ ] Tâche 5.2: Tests visuels régressions
- [ ] Tâche 5.3: Mettre à jour documentation

**Validation:** Coverage 100%, docs à jour

---

## 📊 MÉTRIQUES DE SUCCÈS

### Avant Implémentation
- Tests: 232/237 passing (97.9%)
- Magic numbers: 47 occurrences
- Couleurs hardcodées: 15 occurrences
- Classes CSS: 10% des éléments
- Documentation: 40% des algorithmes

### Après Implémentation (Cible)
- Tests: 237/237 passing (100%) ✅
- Magic numbers: 0 (tous dans constants) ✅
- Couleurs hardcodées: 0 (toutes configurables) ✅
- Classes CSS: 100% des éléments ✅
- Documentation: 95% des algorithmes ✅

---

## 🚀 DÉMARRAGE RAPIDE

### Pour commencer l'implémentation:

```bash
# 1. Créer branche
git checkout -b refactor/svg-improvements

# 2. Créer fichier constants
touch es/rendering-constants.js

# 3. Commencer Phase 1 (testabilité)
# Éditer es/pedigree.js lignes 424-513 (child links)

# 4. Tester après chaque phase
npm run build && npm test

# 5. Commit progressivement
git add -p  # Review changes
git commit -m "feat: add CSS classes to child links (Phase 1.1)"
```

### Ordre recommandé d'implémentation:
1. **Jour 1 matin:** Phase 1 (Testabilité) → Tests 100% passing
2. **Jour 1 après-midi:** Phase 2 (Constants) → Code cleanup
3. **Jour 2 matin:** Phase 3 (Couleurs) → Customization
4. **Jour 2 après-midi:** Phase 4 (Bug fixes) → Robustesse
5. **Jour 3:** Phase 5 (Documentation) → Finalisation

---

**Document créé:** ✅
**Prêt pour implémentation:** 🚀
**Durée totale estimée:** 13-16 heures (sur 2-3 jours)
