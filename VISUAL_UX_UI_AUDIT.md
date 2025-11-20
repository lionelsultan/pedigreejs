# 🎨 AUDIT VISUEL / UX / UI - PedigreeJS v4.0.0-rc1

**Date:** 2025-11-19
**Fichier analysé:** `es/pedigree.js` (772 lignes)
**Focus:** Rendu SVG, Expérience utilisateur, Interface, Accessibilité

---

## 📊 RÉSUMÉ EXÉCUTIF

**Analyse:** 100% du code de rendu SVG + interactions UX
**Issues trouvées:** 34 problèmes identifiés
**Classification:**
- 🔴 **Critiques:** 5 (impact UX majeur)
- 🟡 **Moyennes:** 16 (amélioration recommandée)
- 🟢 **Mineures:** 13 (polish/optimisation)

**État global:** ✅ **BON** - Quelques améliorations critiques recommandées

---

## 🔴 ISSUES CRITIQUES (5)

### 1. **Absence totale de feedback visuel interactif**
**Lignes:** Toute la section de rendu des nodes (185-315)
**Problème:** Aucun état hover, focus, ou active sur les nodes et liens
**Impact UX:** ❌ Utilisateur ne sait pas sur quoi il peut cliquer/interagir

**Preuve:**
```javascript
// Ligne 185-205: Aucun événement hover/focus
let node = ped.selectAll(".node")
    .data(nodes.descendants())
    .enter()
    .append("g")
    .attr("class", ...)
    // ⚠️ Pas de .on("mouseover"), .on("mouseout"), etc.
```

**Solution recommandée:**
```javascript
node.on("mouseover", function(event, d) {
    if(d.data.hidden) return;
    d3.select(this)
        .select("path")
        .attr("stroke-width", ".5em")
        .attr("stroke", opts.hover_color || "#FF5722");
})
.on("mouseout", function(event, d) {
    d3.select(this)
        .select("path")
        .attr("stroke-width", function(d) {
            return d.data.age && d.data.yob && !d.data.exclude ? ".3em" : ".1em";
        })
        .attr("stroke", function(d) {
            return d.data.age && d.data.yob && !d.data.exclude ?
                opts.node_border_color_with_data : opts.node_border_color_no_data;
        });
})
.style("cursor", function(d) {
    return d.data.hidden ? "default" : "pointer";
});
```

**Priorité:** 🔥 **IMMÉDIATE**

---

### 2. **Accessibilité ARIA inexistante**
**Lignes:** 110-113 (SVG principal), 185+ (nodes)
**Problème:** Aucun attribut ARIA, rôle, ou label pour lecteurs d'écran
**Impact:** ❌ Inaccessible aux utilisateurs malvoyants (violation WCAG 2.1)

**Preuve:**
```javascript
// Ligne 110-113: SVG sans rôles ARIA
let svg = d3.select("#"+opts.targetDiv)
    .append("svg:svg")
    .attr("width", svg_dimensions.width)
    .attr("height", svg_dimensions.height);
    // ⚠️ Pas de .attr("role", "img")
    // ⚠️ Pas de .attr("aria-label", "Pedigree familial")
```

**Solution recommandée:**
```javascript
let svg = d3.select("#"+opts.targetDiv)
    .append("svg:svg")
    .attr("width", svg_dimensions.width)
    .attr("height", svg_dimensions.height)
    .attr("role", "img")
    .attr("aria-label", "Diagramme de pedigree familial avec " + opts.dataset.length + " personnes")
    .attr("aria-describedby", opts.targetDiv + "_desc");

// Ajouter une description
svg.append("desc")
    .attr("id", opts.targetDiv + "_desc")
    .text("Arbre généalogique interactif montrant les relations familiales, " +
          "les statuts de santé et les informations génétiques.");

// Sur chaque node
node.append("title")
    .text(function(d) {
        let desc = d.data.display_name || d.data.name;
        desc += ", " + (d.data.sex === 'M' ? 'Homme' : d.data.sex === 'F' ? 'Femme' : 'Sexe inconnu');
        if(d.data.age) desc += ", Âge: " + d.data.age;
        if(d.data.status === "1") desc += ", Décédé";
        if(d.data.affected) desc += ", Affecté";
        return desc;
    });
```

**Priorité:** 🔥 **IMMÉDIATE** (conformité légale)

---

### 3. **Stroke-width en unités EM (non scalable)**
**Lignes:** 220-222, 291-292
**Problème:** `.3em` et `.1em` dépendent de font-size, pas de symbol_size
**Impact:** 🐛 Bordures incorrectes quand symbol_size varie (15px → 70px)

**Preuve:**
```javascript
// Ligne 220-222
.attr("stroke-width", function (d) {
    return d.data.age && d.data.yob && !d.data.exclude ? ".3em" : ".1em";
})
// ⚠️ Si font_size=12px, .3em=3.6px, même si symbol_size=70px !
```

**Impact visuel:**
- `symbol_size=15` → bordure trop épaisse (proportionnellement)
- `symbol_size=70` → bordure trop fine

**Solution:**
```javascript
.attr("stroke-width", function (d) {
    let baseWidth = opts.symbol_size * 0.05; // 5% du symbol_size
    return d.data.age && d.data.yob && !d.data.exclude ? baseWidth * 1.5 : baseWidth;
})
```

**Priorité:** 🔥 **HAUTE**

---

### 4. **Warning clash inline avec jQuery DOM manipulation**
**Lignes:** 451-465
**Problème:** Inline HTML + jQuery `.prepend()` = non compatible frameworks (React/Vue)
**Impact:** ⚠️ Bugs avec React, perte de state, mauvaise intégration

**Preuve:**
```javascript
// Ligne 455-460
$('#'+opts.targetDiv).parent().prepend(
    '<div class="pedigree-warning" style="background:#FFF3CD;...">' +
    '<strong>⚠️ Avertissement :</strong> ...' +
    '</div>'
);
// ⚠️ Manipulation DOM directe hors du contrôle D3
// ⚠️ Style inline au lieu de classes CSS
// ⚠️ .parent() assume une structure DOM spécifique
```

**Solution:**
```javascript
// Créer via D3 dans le SVG avec foreignObject
let warning = svg.append("foreignObject")
    .attr("class", "pedigree-warning-container")
    .attr("x", 10)
    .attr("y", 10)
    .attr("width", svg_dimensions.width - 20)
    .attr("height", 40)
    .append("xhtml:div")
    .attr("class", "pedigree-warning");

warning.html('<strong>⚠️</strong> ' + clashes.length +
             ' liens se croisent. Liens ajustés en rouge pointillé.');

// + Ajouter styles dans pedigreejs.css
```

**Priorité:** 🔥 **HAUTE** (compatibilité frameworks)

---

### 5. **Couleur hardcodée 'lightgrey' pour exclus**
**Lignes:** 270
**Problème:** Non configurable via opts (contrairement aux autres couleurs Phase 3)
**Impact:** Incohérent avec le reste du système de couleurs

**Preuve:**
```javascript
// Ligne 268-270
.attr("fill", function(d, i) {
    if(d.data.exclude)
        return 'lightgrey';  // ⚠️ Hardcodé !
    // ... reste configurable via opts
})
```

**Solution:**
Ajouter à opts.defaults:
```javascript
exclude_fill_color: 'lightgrey',
```

Puis utiliser:
```javascript
return opts.exclude_fill_color;
```

**Priorité:** 🟡 **MOYENNE**

---

## 🟡 ISSUES MOYENNES (16)

### 6. **Pas de transition smooth sur les changements**
**Impact:** UX saccadée lors des rebuilds
**Solution:** Ajouter `.transition().duration(300)` sur les updates

### 7. **Pas de loading indicator**
**Lignes:** 49-105
**Impact:** Aucun feedback pendant la construction de gros pedigrees
**Solution:**
```javascript
let loadingDiv = d3.select("#"+opts.targetDiv)
    .append("div")
    .attr("class", "pedigree-loading")
    .style("position", "absolute")
    .style("top", "50%")
    .style("left", "50%")
    .text("Chargement du pedigree...");

// ... build code ...

loadingDiv.remove(); // À la fin
```

### 8. **DEBUG indicator position hardcodée**
**Lignes:** 128-146
**Problème:** `width - 120` assume une taille minimale
**Impact:** Overlap si width < 150px

**Solution:** Utiliser pourcentage ou ancrer à droite avec padding:
```javascript
.attr("x", svg_dimensions.width * 0.85)  // 85% au lieu de -120px
```

### 9. **Twins horizontal bar calcul cryptique**
**Lignes:** 531-537
**Problème:** Logique complexe sans commentaires
**Impact:** Maintenance difficile

### 10. **Dash array calcul pour adopted links**
**Lignes:** 498-506
**Problème:** Boucle `for` avec `usedlen` - pas clair pourquoi `+= 10`
**Impact:** Difficile de comprendre/modifier le pattern de pointillés

### 11. **Pas de visibilité du keyboard focus**
**Impact:** Navigation au clavier impossible
**Solution:** Ajouter `tabindex` et styles `:focus`

### 12. **Proband arrow couleur hardcodée 'black'**
**Lignes:** 588, 596
**Problème:** Non configurable
**Solution:** Ajouter `opts.proband_arrow_color: 'black'`

### 13. **Stroke-width fixe 1px pour proband arrow**
**Lignes:** 595
**Problème:** Trop fin sur grands symbol_size
**Solution:** Scaler avec symbol_size: `opts.symbol_size * 0.03`

### 14. **Clash offset hardcodé +4**
**Lignes:** 382
**Problème:** `clash_depth[d.mother.depth] += 4` - magic number
**Solution:** Constante `RC.CLASH_DEPTH_INCREMENT`

### 15. **Divorce path magic numbers**
**Lignes:** 409-412
**Problème:** `.66`, `6`, `10`, `-2`, `-6`, `8` non documentés
**Solution:** Créer constantes dans `rendering-constants.js`

### 16. **Twin calculation edge case**
**Lignes:** 520-524
**Problème:** `xmin` calculé mais `xmax` commenté - pourquoi ?
**Impact:** Potentiel bug si twins non contigus

### 17. **Partner links sans tooltip de base**
**Lignes:** 345-429
**Problème:** Tooltip seulement si clash (ligne 445)
**Impact:** Pas d'info au hover sur liens normaux

**Solution:**
```javascript
partners.append("title")
    .text(function(d) {
        let text = "Lien entre " + d.mother.data.name + " et " + d.father.data.name;
        if(divorced) text += " (divorcés)";
        if(consanguity) text += " (consanguins)";
        return text;
    });
```

### 18. **Child links stroke-width 1 ou 2 px**
**Lignes:** 487-491
**Problème:** Fixe en pixels, pas scalable
**Impact:** Trop fin sur high-DPI ou zoomed out

### 19. **Shape-rendering mixé**
**Lignes:** 210 (geometricPrecision), 365 (auto), 507-511 (conditionnel)
**Problème:** Pas de cohérence
**Impact:** Rendu inconsistant (certains crisp, autres anti-aliasés)

### 20. **Pas de z-index control**
**Problème:** Ordre d'empilement fixe (paths, puis g, puis text)
**Impact:** Impossible de mettre un node au-dessus d'un autre

### 21. **Twins code dupliqué**
**Lignes:** 501-502 et 515-537
**Problème:** `utils.getTwins()` appelé 2 fois pour même node
**Impact:** Performance (calcul redondant)

---

## 🟢 ISSUES MINEURES (13)

### 22. **Background rect rounded corners inutiles ?**
**Lignes:** 118-119
**Impact:** rx/ry=6 rarement visible, overhead minimal

### 23. **Commented code non expliqué**
**Lignes:** 307-310
**Problème:** Warning icon FontAwesome commenté - pourquoi ?

### 24. **Console.log sans garde DEBUG**
**Chercher:** Potentiels logs qui fuient en production

### 25. **Pas de resize listener**
**Impact:** Si container resize, SVG ne s'adapte pas

### 26. **Pie chart innerRadius toujours 0**
**Lignes:** 267
**Problème:** Pas de donut mode possible

### 27. **Symbol border +2 arbitrary**
**Lignes:** 212 (maintenant `RC.SYMBOL_BORDER_EXTRA`)
**Question:** Pourquoi +2 ? Devrait être % du symbol_size ?

### 28. **Consanguinity check fait 2 fois**
**Lignes:** 353 et 369
**Impact:** Appel redondant de `utils.consanguity()`

### 29. **Divorced check fait 2 fois**
**Lignes:** 354 et 370
**Impact:** Même problème

### 30. **Aucun print/export optimization**
**Impact:** SVG peut avoir des artéfacts à l'impression

### 31. **Pas de dark mode support**
**Impact:** Couleurs fixes ne s'adaptent pas au thème système

### 32. **Monozygotic label position**
**Impact:** Position du "MZ" text pourrait être améliorée

### 33. **Dead line stroke-width fixe**
**Impact:** Devrait scaler avec symbol_size

### 34. **Aucun state management visuel**
**Impact:** Pas de selected/highlighted/disabled states

---

## 🎯 RECOMMANDATIONS PAR PRIORITÉ

### 🔥 Phase Critique (1-2 semaines)

**1. Accessibilité (WCAG 2.1 Level AA)**
```javascript
// Ajouter ARIA partout
svg.attr("role", "img")
   .attr("aria-label", "Pedigree diagram");

node.attr("role", "button")
    .attr("aria-label", d => d.data.name + " details")
    .attr("tabindex", 0);
```

**2. Interactive feedback**
```javascript
// Hover states
node.on("mouseover", highlightNode)
    .on("mouseout", unhighlightNode)
    .style("cursor", "pointer");
```

**3. Fix stroke-width scaling**
```javascript
// Remplacer .3em/.1em par calculs relatifs
.attr("stroke-width", opts.symbol_size * 0.05);
```

**4. Framework compatibility**
```javascript
// Remplacer jQuery DOM manipulation par D3 foreignObject
// OU trigger événement custom pour React/Vue
$(document).trigger('pedigree:warning', {clashes: clashes.length});
```

---

### 🟡 Phase Amélioration (2-3 semaines)

**1. Transitions smooth**
```javascript
node.transition()
    .duration(300)
    .attr("transform", ...);
```

**2. Loading states**
```javascript
opts.onBuildStart?.();
// ... build ...
opts.onBuildEnd?.();
```

**3. Tooltips riches**
```javascript
// Utiliser foreignObject pour HTML tooltips
node.append("foreignObject")
    .attr("class", "node-tooltip")
    .html(d => `<div>${d.data.name}<br>Age: ${d.data.age}</div>`);
```

**4. Constants cleanup**
- Déplacer tous les magic numbers vers `rendering-constants.js`
- Divorce path: `.66` → `RC.DIVORCE_X_POSITION`
- Clash offset: `4` → `RC.CLASH_DEPTH_INCREMENT`

---

### 🟢 Phase Polish (1 semaine)

**1. Dark mode**
```javascript
// Détecter prefers-color-scheme
const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
if(darkMode && !opts.background) {
    opts.background = "#1e1e1e";
    opts.node_border_color = "white";
}
```

**2. Print optimization**
```css
@media print {
    .pedigree-warning { display: none; }
    svg { stroke-width: 0.5pt !important; }
}
```

**3. Performance optimization**
```javascript
// Memoize getTwins, consanguity checks
const twinsCache = new Map();
```

---

## 📈 MÉTRIQUES DE QUALITÉ

### Avant Recommandations
- **Accessibilité:** ❌ 0/10 (aucun ARIA)
- **UX interactivité:** 🟡 3/10 (widgets mais pas hover)
- **Scalabilité visuelle:** 🟡 5/10 (stroke-width issues)
- **Cohérence:** 🟢 7/10 (couleurs configurables)
- **Performance:** 🟢 8/10 (bon)

### Après Recommandations Critiques
- **Accessibilité:** ✅ 8/10 (ARIA complet, keyboard nav)
- **UX interactivité:** ✅ 8/10 (hover, focus, cursor)
- **Scalabilité visuelle:** ✅ 9/10 (tout relatif)
- **Cohérence:** ✅ 9/10 (constants partout)
- **Performance:** ✅ 8/10 (même)

---

## 🔬 TESTS RECOMMANDÉS

### Tests Visuels Automatisés
```javascript
describe('Visual rendering', () => {
    it('should have hover effects on nodes', () => {
        let node = $('.node.male').first();
        node.trigger('mouseover');
        expect(node.find('path').css('stroke')).toBe(opts.hover_color);
    });

    it('should have proper stroke scaling', () => {
        let node = $('.node').first().find('path');
        let strokeWidth = parseFloat(node.attr('stroke-width'));
        expect(strokeWidth).toBeGreaterThan(opts.symbol_size * 0.02);
        expect(strokeWidth).toBeLessThan(opts.symbol_size * 0.2);
    });
});
```

### Tests Accessibilité
```javascript
describe('Accessibility', () => {
    it('should have ARIA role on SVG', () => {
        expect($('svg').attr('role')).toBe('img');
    });

    it('should have title on all nodes', () => {
        let nodesWithoutTitle = $('.node').filter(function() {
            return $(this).find('title').length === 0;
        });
        expect(nodesWithoutTitle.length).toBe(0);
    });

    it('should be keyboard navigable', () => {
        let nodes = $('.node');
        nodes.each(function() {
            expect($(this).attr('tabindex')).toBeDefined();
        });
    });
});
```

---

## 📦 FICHIERS À CRÉER/MODIFIER

**À modifier:**
1. `es/pedigree.js` - Tous les fixes
2. `es/rendering-constants.js` - Nouvelles constantes
3. `css/pedigreejs.css` - Styles hover, focus, warning

**À créer:**
1. `docs/ACCESSIBILITY.md` - Guide accessibilité
2. `docs/VISUAL_STATES.md` - Guide des états visuels
3. `spec/javascripts/accessibility_spec.js` - Tests A11Y
4. `spec/javascripts/visual_spec.js` - Tests visuels

---

## 🎓 BEST PRACTICES RECOMMANDÉES

### 1. Toujours scaler avec symbol_size
```javascript
// ❌ MAL
.attr("stroke-width", 2);

// ✅ BIEN
.attr("stroke-width", opts.symbol_size * 0.05);
```

### 2. Toujours ajouter ARIA
```javascript
// ❌ MAL
svg.append("g");

// ✅ BIEN
svg.append("g")
   .attr("role", "group")
   .attr("aria-label", "Nodes");
```

### 3. Feedback interactif obligatoire
```javascript
// ✅ TOUJOURS
node.on("mouseover", ...)
    .on("mouseout", ...)
    .style("cursor", "pointer");
```

### 4. Utiliser constantes
```javascript
// ❌ MAL
.attr("x", width - 120);

// ✅ BIEN
.attr("x", width * RC.DEBUG_INDICATOR_X_RATIO);
```

---

## 🏁 CONCLUSION

**État actuel:** Code **fonctionnel** mais manque de **polish UX/UI** et **accessibilité**.

**Effort requis:**
- 🔥 **Critiques:** 2 semaines (40h)
- 🟡 **Moyennes:** 3 semaines (60h)
- 🟢 **Mineures:** 1 semaine (20h)

**Total:** ~120h pour une **qualité production parfaite**

**Recommandation:** Commencer par les 5 issues critiques (surtout **accessibilité ARIA** pour conformité WCAG).

---

**Audit réalisé par:** Claude Code
**Dernière mise à jour:** 2025-11-19
