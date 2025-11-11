# PHASE 3 - PLAN D'ACTIONS UX/UI

**Date de création** : 2025-11-11
**Basé sur** : AUDIT_UX_UI_2025-11-11.md
**Objectif** : Corriger les incohérences UX/UI ↔ logique technique
**Durée estimée** : 6-8 heures
**Prérequis** : Phases 1 et 2 terminées

---

## RÉSUMÉ EXÉCUTIF

Suite à l'audit UX/UI qui a révélé un score de 6.9/10, cette Phase 3 vise à corriger :
- **5 problèmes critiques** (🔴) - Impact utilisateur majeur
- **9 problèmes majeurs** (⚠️) - Améliorations UX importantes
- **5 problèmes mineurs** (🟡) - Polish et optimisations

**Approche** : Corrections itératives par ordre de priorité, avec tests après chaque correction.

---

## PHASE 3.1 - CORRECTIONS CRITIQUES (Priorité HAUTE 🔴)

**Durée estimée** : 3-4 heures
**Objectif** : Corriger les 5 problèmes qui affectent la fiabilité de l'application

### Tâche 3.1.1 : Race condition dans rebuild (Problème #8)
**Fichiers** : `es/pedigree.js`, `es/pbuttons.js`
**Durée** : 45 min
**Complexité** : Moyenne

**Problème actuel** :
```javascript
// pedigree.js:571 - Pas de protection contre rebuilds concurrents
$(document).on('rebuild', function(_e, opts){
    rebuild(opts);
})
```

**Solution à implémenter** :
```javascript
// Ajouter au début de pedigree.js
let _isBuilding = false;

$(document).on('rebuild', function(_e, opts){
    if (_isBuilding) {
        if(opts.DEBUG) console.log('Rebuild ignored: build in progress');
        return;
    }
    _isBuilding = true;
    try {
        rebuild(opts);
    } finally {
        _isBuilding = false;
    }
})

// Même protection pour 'build'
$(document).on('build', function(_e, opts){
    if (_isBuilding) {
        if(opts.DEBUG) console.log('Build ignored: build in progress');
        return;
    }
    _isBuilding = true;
    try {
        build(opts);
    } finally {
        _isBuilding = false;
    }
})
```

**Tests à effectuer** :
1. Cliquer rapidement sur undo plusieurs fois
2. Survoler un nœud puis cliquer undo immédiatement
3. Double-clic sur widget puis undo rapide
4. Vérifier qu'aucun artefact visuel n'apparaît

**Critère de succès** : Aucun artefact visuel lors de manipulations rapides

---

### Tâche 3.1.2 : Feedback visuel pour clashes de liens (Problème #15)
**Fichiers** : `es/pedigree.js`
**Durée** : 1h
**Complexité** : Moyenne-Haute

**Problème actuel** :
```javascript
// pedigree.js:473-480 - Seulement un console.log
function check_ptr_links(opts, ptrLinkNodes){
    for(let a=0; a<ptrLinkNodes.length; a++) {
        let clash = check_ptr_link_clashes(opts, ptrLinkNodes[a]);
        if(clash)
            console.log("CLASH :: "+..., clash);  // ← Pas de feedback visuel !
    }
}
```

**Solution à implémenter** :
```javascript
// 1. Modifier check_ptr_links pour retourner les clashes
function check_ptr_links(opts, ptrLinkNodes){
    let clashes = [];
    for(let a=0; a<ptrLinkNodes.length; a++) {
        let clash = check_ptr_link_clashes(opts, ptrLinkNodes[a]);
        if(clash) {
            clashes.push({node: ptrLinkNodes[a], clash: clash});
            if(opts.DEBUG) console.log("CLASH :: ", clash);
        }
    }
    return clashes;
}

// 2. Dans build(), après création des partner lines
let clashes = check_ptr_links(opts, ptrLinkNodes);

// 3. Appliquer un style visuel aux liens qui clash
partner_lines.each(function(d) {
    let hasClash = clashes.some(c =>
        (c.node.mother.data.name === d.mother.data.name &&
         c.node.father.data.name === d.father.data.name)
    );

    if(hasClash) {
        d3.select(this)
            .attr('stroke', '#D5494A')  // Rouge
            .attr('stroke-width', 3)
            .attr('stroke-dasharray', '5,5')
            .append('title')
            .text('Avertissement : Ce lien croise d\'autres liens de partenaires');
    }
});

// 4. Ajouter un message d'avertissement global si clashes
if(clashes.length > 0 && !opts.DEBUG) {
    // Afficher un badge d'avertissement dans l'UI
    $('#'+opts.targetDiv).parent().prepend(
        '<div class="pedigree-warning" style="background:#FFF3CD;border:1px solid #FFC107;padding:8px;margin-bottom:8px;border-radius:4px;">' +
        '<strong>⚠️ Avertissement :</strong> ' + clashes.length +
        ' lien(s) de partenaires se croisent. Cela peut rendre le diagramme difficile à lire.' +
        '</div>'
    );
}
```

**Tests à effectuer** :
1. Créer un pedigree avec liens de partenaires qui se croisent
2. Vérifier que les liens sont affichés en rouge avec dasharray
3. Vérifier que le tooltip apparaît au survol
4. Vérifier que le message d'avertissement global s'affiche
5. Tester avec `DEBUG=true` et `DEBUG=false`

**Critère de succès** : Les clashes sont visuellement identifiables avec un message clair

---

### Tâche 3.1.3 : Débouncer les clics sur widgets (Problème #16)
**Fichiers** : `es/widgets.js`
**Durée** : 30 min
**Complexité** : Faible

**Problème actuel** :
```javascript
// widgets.js:107-131 - Pas de protection double-clic
d3.selectAll(".persontype").on("click", function () {
    // ... ajoute un nœud immédiatement
})
```

**Solution à implémenter** :
```javascript
// Ajouter au début de widgets.js
let _widgetClickInProgress = false;

// Dans la fonction qui setup les widgets (ligne ~107)
d3.selectAll(".persontype").on("click", function () {
    // Protection contre double-clic
    if (_widgetClickInProgress) {
        if(opts.DEBUG) console.log('Widget click ignored: action in progress');
        return;
    }
    _widgetClickInProgress = true;

    // Code existant...
    let newdataset = utils.copy_dataset(pedcache_current(opts));
    // ... reste du code

    $(document).trigger('rebuild', [opts]);
    d3.selectAll('.popup_selection').attr("opacity", 0);
    add_person = {};

    // Réactiver après un délai
    setTimeout(() => {
        _widgetClickInProgress = false;
    }, 300);
})
```

**Tests à effectuer** :
1. Double-clic rapide sur widget "add child"
2. Triple-clic très rapide sur widget "add sibling"
3. Vérifier qu'un seul nœud est ajouté
4. Vérifier que le widget se réactive après 300ms

**Critère de succès** : Impossible de créer des doublons par double-clic

---

### Tâche 3.1.4 : Logique addpartner incohérente (Problème #1)
**Fichiers** : `es/widgets.js`
**Durée** : 1h
**Complexité** : Haute

**Problème actuel** :
```javascript
// widgets.js:208 - Empêche l'ajout après 1 partenaire
!(d.data.parent_node !== undefined && d.data.parent_node.length > 1 && key === 'addpartner')
```

**Analyse nécessaire avant correction** :
1. Comprendre pourquoi `parent_node.length > 1` bloque les partenaires
2. Vérifier si c'est lié aux partenaires consanguins
3. Identifier les cas d'usage légitimes (polygamie, partenaires successifs)

**Solution proposée** :
```javascript
// Remplacer la condition par une vérification plus fine
function canAddPartner(node) {
    // Autoriser l'ajout de partenaire sauf si :
    // 1. Le nœud est un enfant sans parents définis (pas de sens d'ajouter un partenaire)
    // 2. Le nœud a déjà 3+ partenaires (limite raisonnable pour lisibilité)

    if(node.data.parent_node === undefined) {
        return false; // Pas encore dans l'arbre
    }

    // Compter le nombre de partenaires existants
    let partnerCount = 0;
    if(node.data.mother) {
        // Trouver tous les nœuds qui partagent ce parent
        // (logique à affiner selon la structure de données)
    }

    return partnerCount < 3; // Limite à 3 partenaires max
}

// Dans le filter
!(key === 'addpartner' && !canAddPartner(d))
```

**⚠️ ATTENTION** : Cette tâche nécessite une analyse approfondie de la logique de `parent_node`. Recommandation : commencer par des tests exploratoires pour comprendre le comportement actuel.

**Tests à effectuer** :
1. Créer un nœud avec 1 partenaire → vérifier que widget "addpartner" est visible
2. Créer un nœud avec 2 partenaires → vérifier que widget "addpartner" est visible
3. Créer un partenaire consanguin → vérifier que widget fonctionne
4. Tester avec différentes structures de pedigree complexes

**Critère de succès** : Possibilité d'ajouter plusieurs partenaires sans bloquer à 1

---

### Tâche 3.1.5 : Unifier règles de sexe (Problème #5)
**Fichiers** : `es/popup_form.js`, `es/widgets.js`
**Durée** : 45 min
**Complexité** : Moyenne

**Problème actuel** :
- `popup_form.js:87` : Désactive le sexe si `node.parent_node && node.sex !== 'U'`
- `widgets.js` : Permet de changer le sexe via le popup de sélection

**Solution à implémenter** :
```javascript
// 1. Créer une fonction partagée dans validation.js
export function canChangeSex(node, dataset) {
    // Ne peut pas changer le sexe si :
    // 1. Le nœud a des enfants (mère/père défini pour d'autres)
    // 2. Le nœud est référencé comme mother/father ailleurs

    if(!node || !dataset) return true;

    // Vérifier si ce nœud est parent
    let isParent = dataset.some(p =>
        p.mother === node.name || p.father === node.name
    );

    if(isParent && node.sex !== 'U') {
        return false; // Ne peut pas changer si déjà parent
    }

    // Autoriser le changement dans les autres cas
    return true;
}

// 2. Utiliser dans popup_form.js
import {canChangeSex} from './validation.js';

// Ligne 87 - remplacer par
let dataset = pedcache.current(opts);
let canChange = canChangeSex(node, dataset);
$("input[id^='id_sex_']").prop("disabled", !canChange);

// 3. Utiliser dans widgets.js lors de l'affichage du popup de sexe
// Ligne ~95 - ajouter une vérification
if(!canChangeSex(add_person.node.datum().data, opts.dataset)) {
    // Afficher un message explicatif
    console.warn('Cannot change sex: node is already a parent');
    return; // Ne pas afficher le popup
}
```

**Tests à effectuer** :
1. Créer un nœud sans enfants → vérifier que sexe modifiable (popup + formulaire)
2. Créer un nœud avec enfants → vérifier que sexe non modifiable (popup + formulaire)
3. Créer un partenaire → vérifier cohérence
4. Vérifier que le message d'erreur est clair

**Critère de succès** : Règles cohérentes entre popup et formulaire, avec feedback clair

---

## PHASE 3.2 - AMÉLIORATIONS UX (Priorité MOYENNE ⚠️)

**Durée estimée** : 2-3 heures
**Objectif** : Améliorer l'expérience utilisateur sans casser la fonctionnalité existante

### Tâche 3.2.1 : Réactivation automatique champs pathologie (Problèmes #6 et #18)
**Fichiers** : `es/popup_form.js`
**Durée** : 30 min
**Complexité** : Faible

**Solution** :
```javascript
// popup_form.js - Ajouter après le setup du formulaire

// Listener sur le champ diagnosis_age
$('#id_breast_cancer_diagnosis_age').on('change input', function() {
    let age = $(this).val();
    let hasAge = age && age.trim() !== '';

    // Réactiver les champs pathologie si un âge est saisi
    $("select[id$='_bc_pathology']").prop("disabled", !hasAge);

    if(hasAge) {
        // Ajouter un effet visuel pour indiquer que c'est maintenant actif
        $("select[id$='_bc_pathology']").addClass('newly-enabled');
        setTimeout(() => {
            $("select[id$='_bc_pathology']").removeClass('newly-enabled');
        }, 1000);
    }
});

// CSS à ajouter
// .newly-enabled { background-color: #D4EDDA !important; transition: background-color 1s; }
```

**Tests** :
1. Cliquer sur un nœud féminin sans diagnostic → champs pathologie disabled
2. Saisir un âge de diagnostic → champs pathologie s'activent automatiquement
3. Effacer l'âge → champs pathologie se désactivent
4. Vérifier l'effet visuel de transition

**Critère de succès** : Workflow fluide sans double-clic requis

---

### Tâche 3.2.2 : Feedback visuel drag consanguineous (Problème #12)
**Fichiers** : `es/widgets.js`, `css/pedigreejs.css`
**Durée** : 45 min
**Complexité** : Moyenne

**Solution** :
```javascript
// widgets.js - Dans la fonction de drag (ligne ~348)

// 1. Ajouter un handler pour shift key
let isShiftPressed = false;

d3.select('body').on('keydown', function(e) {
    if(e.shiftKey && !isShiftPressed) {
        isShiftPressed = true;
        // Changer le curseur pour tous les nœuds
        d3.selectAll('.node').style('cursor', 'crosshair');

        // Afficher un tooltip global
        $('#'+opts.targetDiv).append(
            '<div id="shift-tooltip" style="position:absolute;top:10px;right:10px;' +
            'background:#17A2B8;color:white;padding:8px;border-radius:4px;z-index:9999;">' +
            '⚡ Shift activé : Glissez pour créer un partenaire consanguin' +
            '</div>'
        );
    }
});

d3.select('body').on('keyup', function(e) {
    if(!e.shiftKey && isShiftPressed) {
        isShiftPressed = false;
        d3.selectAll('.node').style('cursor', 'pointer');
        $('#shift-tooltip').remove();
    }
});

// 2. Lors du drag, afficher une ligne de prévisualisation
// (durant le drag avec shift)
```

**Tests** :
1. Appuyer sur Shift → curseur change en crosshair + tooltip apparaît
2. Relâcher Shift → curseur revient à pointer + tooltip disparaît
3. Shift+drag d'un nœud → ligne de prévisualisation visible
4. Compléter le drag → partenaire consanguin créé

**Critère de succès** : Fonctionnalité découvrable et intuitive

---

### Tâche 3.2.3 : Préserver zoom en fullscreen (Problème #19)
**Fichiers** : `es/pbuttons.js`, `es/zoom.js`
**Durée** : 45 min
**Complexité** : Moyenne

**Solution** :
```javascript
// pbuttons.js:47-54 - Modifier l'handler fullscreen

$(document).on('webkitfullscreenchange...', function(_e)  {
    let local_dataset = pedcache.current(opts);
    opts.dataset = local_dataset;

    // Sauvegarder la position/zoom actuel AVANT le rebuild
    let currentTransform = d3.zoomTransform(d3.select('#'+opts.targetDiv+' svg').node());
    let savedPosition = {
        x: currentTransform.x,
        y: currentTransform.y,
        k: currentTransform.k
    };

    $(document).trigger('rebuild', [opts]);

    // Restaurer la position APRÈS le rebuild (au lieu de scale_to_fit)
    setTimeout(function(){
        // Vérifier si on a une position sauvegardée
        if(savedPosition && savedPosition.k !== 1) {
            // Restaurer la position sauvegardée
            let svg = d3.select('#'+opts.targetDiv+' svg');
            let zm = d3.zoom();
            let transform = d3.zoomIdentity
                .translate(savedPosition.x, savedPosition.y)
                .scale(savedPosition.k);
            svg.call(zm.transform, transform);
        } else {
            // Sinon, scale to fit (comportement par défaut)
            scale_to_fit(opts);
        }
    }, 500);
});
```

**Tests** :
1. Zoomer sur une section du pedigree
2. Passer en fullscreen → position préservée
3. Sortir du fullscreen → position toujours préservée
4. Tester avec différents niveaux de zoom

**Critère de succès** : Position/zoom préservés en fullscreen

---

### Tâche 3.2.4 : Sélection sexe pour jumeaux dizygotes (Problème #3)
**Fichiers** : `es/widgets.js`
**Durée** : 45 min
**Complexité** : Moyenne

**Solution** :
```javascript
// widgets.js:114-124 - Modifier la logique pour dztwin

if(mztwin || dztwin) {
    twin_type = (mztwin ? "mztwin" : "dztwin");

    // Pour les jumeaux monozygotes : forcer le même sexe
    if(mztwin) {
        sex = add_person.node.datum().data.sex;
    }
    // Pour les jumeaux dizygotes : permettre la sélection
    else if(dztwin) {
        sex = d3.select(this).classed("fa-square") ? 'M' : 'F';
        // Le popup de sélection est déjà affiché, l'utilisateur choisit
    }
} else {
    sex = d3.select(this).classed("fa-square") ? 'M' : ...;
}

// Ajouter un message explicatif dans le popup pour dztwin
if(dztwin) {
    d3.select('.popup_selection')
        .append('text')
        .attr('x', 0)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#666')
        .attr('font-size', '11px')
        .text('Jumeaux dizygotes : choisissez le sexe');
}
```

**Tests** :
1. Créer des jumeaux monozygotes → sexe automatiquement identique
2. Créer des jumeaux dizygotes → popup de sélection s'affiche
3. Créer jumeaux dizygotes garçon/fille → vérifier la création
4. Vérifier le rendu visuel des jumeaux dizygotes mixtes

**Critère de succès** : Jumeaux dizygotes de sexes différents possibles

---

### Tâche 3.2.5 : Corriger keep_proband_on_reset (Problème #13)
**Fichiers** : `es/pbuttons.js`
**Durée** : 15 min
**Complexité** : Faible

**Solution** :
```javascript
// pbuttons.js:124-139 - Ne pas réinitialiser le name

if(opts.keep_proband_on_reset) {
    let local_dataset = pedcache.current(opts);
    let newdataset =  copy_dataset(local_dataset);
    proband = newdataset[getProbandIndex(newdataset)];

    // ❌ SUPPRIMER : proband.name = "ch1";
    // ✅ GARDER le nom original

    // Créer nouveaux parents avec noms génériques
    proband.mother = "mother_" + Date.now();  // Nom unique
    proband.father = "father_" + Date.now();

    // Reste du code...
}
```

**Tests** :
1. Créer un pedigree avec proband nommé "Jean"
2. Reset avec `keep_proband_on_reset=true`
3. Vérifier que le proband s'appelle toujours "Jean"
4. Vérifier que les parents ont des noms uniques

**Critère de succès** : Nom du proband préservé lors du reset

---

## PHASE 3.3 - POLISH ET OPTIMISATIONS (Priorité BASSE 🟡)

**Durée estimée** : 1-2 heures
**Objectif** : Améliorations cosmétiques et optimisations mineures

### Tâche 3.3.1 : Boutons zoom avec tooltip (Problème #4)
**Durée** : 15 min

### Tâche 3.3.2 : Optimiser triggers fhChange (Problème #7)
**Durée** : 30 min

### Tâche 3.3.3 : Assouplir validation age/yob (Problème #9)
**Durée** : 15 min

### Tâche 3.3.4 : Documenter mode DEBUG (Problème #11)
**Durée** : 15 min

### Tâche 3.3.5 : Indicateur visuel données invalides (Problème #14)
**Durée** : 30 min

---

## STRATÉGIE D'EXÉCUTION

### Ordre recommandé

**Semaine 1 - Corrections critiques** :
1. ✅ Tâche 3.1.1 (Race condition) - **PRIORITÉ #1**
2. ✅ Tâche 3.1.3 (Débounce widgets) - **PRIORITÉ #2**
3. ✅ Tâche 3.1.5 (Unifier règles sexe) - **PRIORITÉ #3**
4. ⚠️ Tâche 3.1.2 (Feedback clashes) - **PRIORITÉ #4**
5. ⚠️ Tâche 3.1.4 (Logique addpartner) - **PRIORITÉ #5** (nécessite analyse)

**Semaine 2 - Améliorations UX** :
6. Tâche 3.2.1 (Pathologie auto-enable)
7. Tâche 3.2.5 (keep_proband_on_reset)
8. Tâche 3.2.4 (Jumeaux dizygotes)
9. Tâche 3.2.3 (Préserver zoom)
10. Tâche 3.2.2 (Feedback drag)

**Semaine 3 - Polish (optionnel)** :
11-15. Tâches 3.3.x selon temps disponible

### Protocole de test après chaque tâche

1. **Build** : `npm run build` → doit réussir sans erreur
2. **Lint** : Vérifier que ESLint ne remonte pas d'erreurs
3. **Tests unitaires** : `npm test` → tous les tests passent (150 specs)
4. **Tests manuels** : Suivre la section "Tests à effectuer" de chaque tâche
5. **Régression** : Tester les fonctionnalités adjacentes
6. **Commit** : Un commit par tâche avec message descriptif

### Gestion des risques

**Si une tâche bloque** :
- Documenter le blocage dans SESSION_CONTEXT.md
- Passer à la tâche suivante
- Revenir après consultation/recherche

**Si les tests échouent** :
- Rollback du code
- Analyser la cause
- Ajuster la solution
- Retester

**Si une correction casse autre chose** :
- Identifier les dépendances non prévues
- Ajuster le plan
- Possiblement fusionner plusieurs tâches

---

## MÉTRIQUES DE SUCCÈS

### Objectifs quantitatifs

| Métrique | Avant | Cible | Mesure |
|----------|-------|-------|--------|
| Score UX/UI global | 6.9/10 | 8.5/10 | Ré-audit après Phase 3 |
| Problèmes critiques | 5 | 0 | Tous corrigés |
| Problèmes majeurs | 9 | ≤3 | Au moins 6 corrigés |
| Tests passants | 150 | 150+ | Aucune régression |
| Race conditions | Oui | Non | Tests stress |

### Objectifs qualitatifs

- ✅ Interactions utilisateur fluides et prévisibles
- ✅ Feedback visuel clair pour toutes les actions
- ✅ Aucun comportement surprenant ou incohérent
- ✅ Messages d'erreur informatifs et actionnables
- ✅ Fonctionnalités avancées documentées et accessibles

---

## LIVRABLES ATTENDUS

### Code
- [ ] Fichiers modifiés : `pedigree.js`, `widgets.js`, `popup_form.js`, `pbuttons.js`, `zoom.js`, `validation.js`
- [ ] Tests additionnels si nécessaire
- [ ] Build réussi sans erreurs
- [ ] Tous les tests passent

### Documentation
- [ ] Mise à jour de SESSION_CONTEXT.md avec les modifications effectuées
- [ ] Mise à jour de PLAN_ACTIONS.md (marquer Phase 3 comme terminée)
- [ ] Création de PHASE3_COMPLETION_REPORT.md avec :
  - Liste des corrections effectuées
  - Tests de validation
  - Captures d'écran avant/après
  - Nouveau score UX/UI
  - Problèmes reportés à Phase 4

### Commits Git
- [ ] Commits atomiques par tâche
- [ ] Messages descriptifs en français
- [ ] Branches feature si modifications importantes

---

## ANNEXE : COMMANDES UTILES

### Développement
```bash
# Workflow standard pour chaque tâche
npm run build          # Build + lint
npm test              # Tests complets
npm run server        # Prévisualiser

# Debug
grep -r "functionName" es/
grep -r "TODO\|FIXME" es/

# Vérifier imports circulaires
npx madge --circular es/
```

### Tests stress (race conditions)
```bash
# Ouvrir la console navigateur et exécuter
for(let i=0; i<10; i++) {
    setTimeout(() => $(document).trigger('rebuild', [opts]), i*50);
}
```

### Mesure performance
```javascript
// Dans la console
performance.mark('start');
$(document).trigger('rebuild', [opts]);
setTimeout(() => {
    performance.mark('end');
    performance.measure('rebuild', 'start', 'end');
    console.log(performance.getEntriesByName('rebuild')[0].duration);
}, 1000);
```

---

## NOTES

- **Phase 3.1** (corrections critiques) est **bloquante** pour la suite
- **Phase 3.2** peut être faite en parallèle par plusieurs développeurs
- **Phase 3.3** est optionnelle et peut être reportée à Phase 4
- Prévoir des **revues de code** après Phase 3.1 et 3.2
- Documenter tous les **choix techniques** dans SESSION_CONTEXT.md

---

**Prêt à commencer ?** Commencez par la Tâche 3.1.1 (Race condition) - c'est la plus critique et la plus simple.
