# Classes CSS - PedigreeJS SVG

**Version:** v4.0.0-rc1
**Date:** 2025-11-19

## Vue d'Ensemble

Tous les éléments SVG du pedigree ont des classes CSS pour faciliter le styling, les tests et l'accessibilité.

---

## 🔷 Nodes (Personnes)

### Classes de Base

**`.node`** - Tous les groupes de personnes (élément `<g>`)

### Classes par Genre

- **`.male`** - Homme (`sex='M'`)
- **`.female`** - Femme (`sex='F'`)
- **`.unknown-sex`** - Sexe inconnu (`sex='U'` ou absent)

### Classes d'État

- **`.proband`** - Personne centrale du pedigree (`proband=true`)
- **`.hidden`** - Node caché (structure interne, visible seulement en DEBUG)
- **`.affected`** - Affecté par maladie générique (`affected=true`)
- **`.adopted`** - Adopté (`adopted_in=true` ou `adopted_out=true`)
- **`.deceased`** - Décédé (`status='1'` ou `status=1`)

### Exemples d'Utilisation

```javascript
// Sélectionner tous les hommes
let males = $('.node.male');

// Sélectionner le proband
let proband = $('.node.proband');

// Sélectionner tous les décédés
let deceased = $('.node.deceased');

// Sélectionner les femmes affectées
let affectedFemales = $('.node.female.affected');
```

---

## 🔗 Links Enfants (Parent → Enfant)

### Classes de Base

- **`.link`** - Tous les liens (classe générique D3)
- **`.child-link`** - Lien parent vers enfant

### Classes Spécifiques

- **`.adopted-link`** - Lien d'adoption (ligne pointillée)
- **`.mz-twin-link`** - Lien jumeaux monozygotes (avec barre horizontale)
- **`.dz-twin-link`** - Lien jumeaux dizygotes (ligne en V)
- **`.debug-link`** - Lien debug (noparents, hidden)

### Exemples d'Utilisation

```javascript
// Sélectionner tous les liens enfants
let childLinks = $('.child-link');

// Sélectionner les liens d'adoption
let adoptedLinks = $('.adopted-link');

// Sélectionner les liens de jumeaux MZ
let mzTwinLinks = $('.mz-twin-link');

// Compter les enfants adoptés
let adoptedCount = $('.adopted-link').length;
```

---

## 💑 Links Partenaires (Couples)

### Classes de Base

- **`.partner`** - Tous les liens partenaires (classe générique D3)
- **`.partner-link`** - Lien entre partenaires

### Classes Spécifiques

- **`.consanguineous`** - Lien consanguin (double ligne)
- **`.divorced`** - Couple divorcé (double slash)
- **`.same-sex`** - Couple same-sex (même sexe, ni M-F ni U)

### Exemples d'Utilisation

```javascript
// Sélectionner tous les liens partenaires
let partnerLinks = $('.partner-link');

// Sélectionner les liens consanguins
let consanguineousLinks = $('.consanguineous');

// Sélectionner les couples divorcés
let divorcedLinks = $('.divorced');

// Sélectionner les couples same-sex
let sameSexLinks = $('.same-sex');

// Compter les divorces
let divorceCount = $('.divorced').length;
```

---

## 🎨 Styling CSS Personnalisé

### Exemple 1: Thème Coloré

```css
/* Homme en bleu, femme en rose */
.node.male path {
    stroke: #2196F3;
}

.node.female path {
    stroke: #E91E63;
}

/* Proband en gras */
.node.proband path {
    stroke-width: 3px;
}

/* Décédés en gris semi-transparent */
.node.deceased path {
    opacity: 0.5;
    stroke: #666;
}
```

### Exemple 2: Liens Personnalisés

```css
/* Couples same-sex en violet */
.partner-link.same-sex {
    stroke: #9C27B0;
    stroke-width: 2px;
}

/* Liens consanguins en rouge */
.partner-link.consanguineous {
    stroke: #D32F2F;
}

/* Adoptions en pointillé bleu */
.child-link.adopted-link {
    stroke: #1976D2;
    stroke-dasharray: 5, 5;
}
```

### Exemple 3: Hover Effects

```css
/* Highlight au survol */
.node:hover path {
    stroke-width: 3px;
    stroke: #FF5722;
    cursor: pointer;
}

/* Highlight liens au survol */
.partner-link:hover,
.child-link:hover {
    stroke-width: 3px;
    stroke: #FF9800;
    cursor: pointer;
}
```

---

## 🧪 Tests Automatisés

### Jasmine/Jest Examples

```javascript
describe('SVG Classes', function() {
    it('should assign gender classes correctly', function() {
        let dataset = [
            {name: "dad", sex: "M"},
            {name: "mom", sex: "F"},
            {name: "child", sex: "U", mother: "mom", father: "dad"}
        ];

        pedigreejs.build({targetDiv: 'test', dataset: dataset});

        expect($('.node.male').length).toBe(1);
        expect($('.node.female').length).toBe(1);
        expect($('.node.unknown-sex').length).toBe(1);
    });

    it('should mark proband correctly', function() {
        let dataset = [
            {name: "person", sex: "F", top_level: true, proband: true}
        ];

        pedigreejs.build({targetDiv: 'test', dataset: dataset});

        expect($('.node.proband').length).toBe(1);
        expect($('.node.proband.female').length).toBe(1);
    });

    it('should identify adopted links', function() {
        let dataset = [
            {name: "parent", sex: "M", top_level: true},
            {name: "child", sex: "F", father: "parent", adopted_in: true}
        ];

        pedigreejs.build({targetDiv: 'test', dataset: dataset});

        expect($('.adopted-link').length).toBe(1);
    });
});
```

---

## 📊 Référence Complète des Classes

| Classe | Type | Description | Attribut Dataset |
|--------|------|-------------|------------------|
| `.node` | Node | Tous les nodes | - |
| `.male` | Node | Homme | `sex='M'` |
| `.female` | Node | Femme | `sex='F'` |
| `.unknown-sex` | Node | Sexe inconnu | `sex='U'` ou absent |
| `.proband` | Node | Proband | `proband=true` |
| `.hidden` | Node | Node caché | `hidden=true` |
| `.affected` | Node | Affecté | `affected=true` |
| `.adopted` | Node | Adopté | `adopted_in=true` ou `adopted_out=true` |
| `.deceased` | Node | Décédé | `status='1'` ou `status=1` |
| `.link` | Link | Tous les liens | - |
| `.child-link` | Link | Lien parent-enfant | - |
| `.adopted-link` | Link | Adoption | `adopted_in=true` |
| `.mz-twin-link` | Link | Jumeaux MZ | `mztwin='id'` |
| `.dz-twin-link` | Link | Jumeaux DZ | `dztwin='id'` |
| `.debug-link` | Link | Debug | `noparents=true` ou `hidden=true` |
| `.partner` | Link | Tous partenaires | - |
| `.partner-link` | Link | Lien partenaire | - |
| `.consanguineous` | Link | Consanguin | Détecté par arbre |
| `.divorced` | Link | Divorcé | `divorced='partner_name'` |
| `.same-sex` | Link | Couple same-sex | `sex1 === sex2` (ni U) |

---

## 🔍 Combinaisons Utiles

### Sélecteurs Complexes

```javascript
// Femmes décédées et affectées
$('.node.female.deceased.affected')

// Hommes adoptés
$('.node.male.adopted')

// Liens entre couples divorcés ET consanguins
$('.partner-link.divorced.consanguineous')

// Jumeaux MZ ou DZ
$('.mz-twin-link, .dz-twin-link')

// Toutes les personnes vivantes (pas .deceased)
$('.node:not(.deceased)')
```

### Statistiques du Pedigree

```javascript
// Compter hommes vs femmes
let maleCount = $('.node.male').length;
let femaleCount = $('.node.female').length;

// Taux d'affection
let total = $('.node:not(.hidden)').length;
let affected = $('.node.affected').length;
let affectedRate = (affected / total) * 100;

// Nombre de divorces
let divorces = $('.partner-link.divorced').length;

// Nombre d'adoptions
let adoptions = $('.adopted-link').length;
```

---

## ⚠️ Notes Importantes

### Performance

Les classes sont assignées au moment du build. Si vous changez les données et rebuildez, les classes seront mises à jour automatiquement.

### Compatibilité

Classes disponibles depuis PedigreeJS v4.0.0-rc1. Les versions antérieures n'ont pas de classes CSS sur les éléments SVG.

### Multiples Pedigrees

Les classes sont les mêmes pour tous les pedigrees sur une page. Utilisez le sélecteur parent pour cibler un pedigree spécifique:

```javascript
// Sélectionner nodes dans pedigree_a uniquement
$('#pedigree_a .node.male')

// Sélectionner links dans pedigree_b uniquement
$('#pedigree_b .child-link')
```

---

## 🆕 Changements par Version

### v4.0.0-rc1 (2025-11-19)
- ✅ Ajout initial de toutes les classes CSS
- ✅ Support `.male`, `.female`, `.unknown-sex`
- ✅ Support `.proband`, `.affected`, `.deceased`, `.adopted`
- ✅ Support `.child-link`, `.partner-link`
- ✅ Support `.adopted-link`, `.mz-twin-link`, `.dz-twin-link`
- ✅ Support `.consanguineous`, `.divorced`, `.same-sex`

---

**Maintenu par:** PedigreeJS Team
**Dernière mise à jour:** 2025-11-19
