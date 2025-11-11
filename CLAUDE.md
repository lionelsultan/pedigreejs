# CLAUDE.md

Ce fichier fournit des directives à Claude Code (claude.ai/code) pour travailler avec le code de ce dépôt.

## Vue d'ensemble du projet

PedigreeJS est une bibliothèque JavaScript pour construire et afficher des pedigrees familiaux (arbres généalogiques) dans les navigateurs web. Le projet utilise des modules ES2015 avec D3.js v7.9.0 pour la visualisation SVG et a fait l'objet d'un refactoring significatif pour améliorer sa maintenabilité et ses performances.

**Statistiques clés :**
- 17 modules ES2015 (~4 900 lignes de code)
- Suite de tests : 150 specs, 0 échecs (Jasmine)
- Performance : 4-31ms pour des pedigrees de 10-100 personnes (excellent)
- Licence : GPL-3.0-or-later

## Commandes de développement

### Build et tests
```bash
npm install                    # Installer les dépendances (Rollup, Jasmine, PostCSS)
npm run build                  # Build bundle IIFE + version minifiée avec sourcemaps
npm run build-es               # Build version modules ES
npm test                       # Lancer les tests Jasmine (ouvre le navigateur à localhost:8888)
npm run server                 # Prévisualiser la démo à http://localhost:8001
```

### Exécuter des tests spécifiques
```bash
# Les tests s'exécutent dans le navigateur via jasmine-browser-runner
# Naviguer vers http://localhost:8888 après avoir lancé npm test
# Les fichiers de specs sont dans spec/javascripts/*_spec.js
```

### Maintenance
```bash
npm run browserlist            # Mettre à jour la base de données browserslist
npm run check-updates          # Vérifier les dépendances obsolètes
npm run update                 # Mettre à jour les dépendances (ncu -u)
```

## Vue d'ensemble de l'architecture

### Organisation des modules

Tous les modules sources sont dans le répertoire `es/`. Le point d'entrée est `es/index.js` qui ré-exporte tous les modules.

**Modules principaux :**
- `pedigree.js` (560 LOC) - Logique principale build/rebuild, mise en page de l'arbre
- `widgets.js` (802 LOC) - Composants UI interactifs (nœuds de personnes, lignes de partenaires)
- `io.js` - Fonctionnalité import/export (formats PED, GEDCOM, CanRisk)
- `popup_form.js` - Formulaire interactif pour éditer les données d'une personne

**Modules utilitaires (refactoring Phase 1) :**
- `validation.js` (234 LOC) - Validation des données de pedigree (relations, champs requis)
- `dom.js` (173 LOC) - Manipulation DOM, dialogues, dimensions SVG
- `tree-utils.js` (420 LOC) - Navigation dans l'arbre, construction, géométrie
- `utils.js` (75 LOC) - Couche fine de ré-export pour rétrocompatibilité

**Modules spécialisés :**
- `zoom.js` - Contrôles de zoom et transformations
- `dragging.js` - Positionnement des nœuds par glisser-déposer
- `twins.js` - Rendu des jumeaux/naissances multiples
- `pedcache.js` - Cache undo/redo avec éviction LRU (localStorage + fallback array)
- `pbuttons.js` - Boutons UI (undo/redo/fullscreen)
- `labels.js` - Labels d'attributs de personne
- `canrisk_file.js` - Gestion du format de fichier CanRisk
- `extras.js` - Utilitaires additionnels

### Système de build

**Configuration Rollup :**
- Entrée : `es/index.js`
- Sortie : Bundle IIFE (`build/pedigreejs.v4.0.0-rc1.js`)
- Plugins : Babel (transpilation ES5), ESLint (linting), PostCSS (extraction/minification CSS), Terser (minification)
- Source maps : Générées pour le bundle minifié
- Build du site : `rollup.site.config.js` pour le CSS frontend

### Architecture des tests

**Jasmine Browser Runner :**
- Config : `spec/support/jasmine-browser.json`
- Runner : Firefox headless
- Dépendances chargées depuis CDN : D3.js, jQuery, jQuery UI
- Source : `build/pedigreejs*.js` (teste le bundle compilé, pas les modules sources)
- Fichiers de specs : `spec/javascripts/*_spec.js`

**Couverture des tests :**
- `pedigree_spec.js` - Opérations CRUD de base, validation, rebuild
- `validation_spec.js` - Module validation (100% de couverture, 25 specs)
- `dom_spec.js` - Utilitaires DOM (100% de couverture, 22 specs)
- `tree-utils_spec.js` - Navigation dans l'arbre (100% de couverture, 33 specs)
- `pedcache_spec.js` - Opérations de cache (12 specs)
- `performance_spec.js` - Benchmarks de performance (4 datasets)

## Patterns architecturaux critiques

### Système de rebuild piloté par événements

Toute l'UI utilise la diffusion d'événements jQuery pour les changements d'état :

```javascript
$(document).trigger('rebuild');  // Déclenche un rebuild complet du pedigree
$(document).trigger('fhChange', [opts]);  // Notifie les listeners de changements
```

**Important :** La plupart des interactions utilisateur déclenchent un rebuild complet via `pedigreejs.rebuild()`. C'est voulu et performant (4-31ms pour des datasets typiques). N'essayez pas d'optimiser avec du rendu incrémental sauf si le profiling montre des problèmes de performance réels.

### Système de cache (pedcache.js)

Implémente undo/redo via stockage de snapshots :

- **Primaire :** localStorage (quand disponible)
- **Fallback :** Array en mémoire avec éviction LRU (max 500 entrées)
- **Sérialisation :** `serialize_dataset()` custom gère les références circulaires D3
- **API :** `current(opts)`, `add(opts)`, `undo(opts)`, `redo(opts)`

**Stockage des positions :**
Les modes localStorage et array supportent tous deux les données de position via :
- Paramètre `store_type='position'`
- Mode array : `current_position`, `nstore_position()`, `add_position()`

### Validation des données (validation.js)

Validation stricte des relations de pedigree :

- Validation du genre des parents (mère=féminin, père=masculin)
- Détection des relations circulaires
- Champs requis (nom, sexe)
- Contraintes de noms uniques
- Logique âge/année de naissance

**Important :** La validation est activée par défaut (`opts.validate = true`). Désactiver uniquement pour des sources de données de confiance.

### La variable globale `utils.roots`

**État actuel :** `utils.roots` est un objet partagé mappant les IDs `targetDiv` vers les racines de hiérarchie D3. Utilisé dans 5 modules.

**Pourquoi elle existe :** Plusieurs pedigrees peuvent être rendus sur la même page, chacun a besoin d'un état indépendant.

**Note de refactoring :** Volontairement laissé tel quel pendant le refactoring Phase 1 en raison de sa complexité. Si refactoring, considérer une classe PedigreeRegistry ou une Map au scope module.

### Le flag `noparents`

**Correction de bug visuel critique (2024-11-10) :**

Le flag `noparents: true` sur les nœuds de personne est VISUEL uniquement - il cache les lignes de connexion parentes mais préserve les propriétés `mother`/`father` dans la structure de données.

Lors du parcours des enfants :
- `getChildren()` - **Doit exclure** les nœuds `noparents` (rendu visuel)
- `getAllChildren()` - **Peut inclure** les nœuds `noparents` (opérations sur données)

**Exemple de tree-utils.js:81 :**
```javascript
if($.inArray(p.name, names) === -1 && !p.noparents) {
    // Inclure seulement les nœuds sans flag noparents
}
```

## Conventions de code

### Règles de style (.eslintrc.js)

- **Tabulations :** Tabulations dures (pas d'espaces) - voir fichiers existants
- **Points-virgules :** Requis en fin d'instruction
- **Guillemets :** Guillemets simples pour les chaînes (sauf JSON)
- **Paramètres inutilisés :** Préfixer avec underscore (`_i`, `_opts`) pour contourner le lint
- **Égalité :** Égalité intelligente (`==` pour vérifications null/undefined, `===` sinon)
- **Longueur de ligne :** Pas de limite stricte, mais garder lisible

### Conventions de fichiers et de nommage

- **Fichiers :** kebab-case (`tree-utils.js`, `popup_form.js`)
- **Exports :** Fonctions en camelCase (`buildTree`, `getChildren`)
- **Constantes :** SCREAMING_SNAKE_CASE pour les constantes partagées
- **Privé :** Préfixer avec underscore si non exporté

### Patterns d'import

Tous les modules utilisent les imports ES2015 :

```javascript
import * as utils from './utils.js';        // Import complet du module
import {addWidgets} from './widgets.js';    // Import nommé
```

**Important :**
- Toujours inclure l'extension `.js` dans les imports relatifs
- Utiliser `* as moduleName` pour les modules avec beaucoup d'exports
- CSS importé via le point d'entrée : `import '../css/pedigreejs.css'`

### Patterns D3.js

La codebase utilise D3.js v7 (syntaxe module moderne) :

```javascript
import * as d3 from 'd3';  // Dans les sources, chargé depuis CDN dans les tests

let svg = d3.select("#targetDiv").append("svg:svg");
let root = d3.hierarchy(hidden_root);
```

**Note de performance :** Éviter les appels `getBBox()` dans les boucles (coûteux). Mettre en cache la géométrie quand possible.

## Travailler avec la codebase

### Avant d'effectuer des modifications

1. **Lire la documentation de contexte :**
   - `AUDIT_PEDIGREEJS.md` - Résultats de l'audit technique
   - `PLAN_ACTIONS.md` - Feuille de route d'amélioration
   - `SESSION_CONTEXT.md` - Historique détaillé des sessions
   - `PHASE1_AUDIT_REPORT.md` / `PHASE2_PERFORMANCE_REPORT.md` - Rapports d'achèvement de phases

2. **Comprendre le module :**
   - Vérifier les imports/exports dans `es/index.js`
   - Chercher les tests existants dans `spec/javascripts/`
   - Rechercher les TODOs/FIXMEs dans le module

3. **Lancer les tests de référence :**
   ```bash
   npm run build && npm test
   ```

### Ajouter de nouvelles fonctionnalités

1. **Placement du module :**
   - Interactions UI → `widgets.js` ou module dédié
   - Validation de données → `validation.js`
   - Manipulation DOM → `dom.js`
   - Opérations sur l'arbre → `tree-utils.js`

2. **Toujours écrire des tests :**
   - Créer `{module}_spec.js` dans `spec/javascripts/`
   - Tester le chemin nominal + cas limites
   - Ajouter un test de régression pour les corrections de bugs
   - Viser 100% de couverture des nouvelles fonctions

3. **Exporter depuis index.js :**
   ```javascript
   export * as pedigreejs_yourmodule from './yourmodule.js';
   ```

4. **Préserver la rétrocompatibilité :**
   - Les APIs publiques ne peuvent pas casser l'usage existant
   - Si refactoring d'exports, ajouter des ré-exports dans `utils.js`

### Meilleures pratiques de tests

**Structure de test :**
```javascript
describe('ModuleName', function() {
    beforeEach(function() {
        // Configuration
    });

    it('should do something specific', function() {
        // Arrange (Préparer)
        // Act (Agir)
        // Assert (Vérifier)
        expect(result).toBe(expected);
    });
});
```

**Tests DOM :**
- Créer les éléments fixture dans `beforeEach`
- Nettoyer dans `afterEach` pour éviter la pollution des tests
- Utiliser jQuery pour la manipulation DOM (déjà chargé)

**Tests de performance :**
- Utiliser l'API Web Performance (`performance.mark`, `performance.measure`)
- Tester avec des datasets réalistes (10, 30, 50, 100 personnes)
- Seuil : <100ms pour les opérations interactives

### Conseils de débogage

**Activer les logs verbeux :**
```javascript
let opts = {
    DEBUG: true,    // Activer la sortie de debug
    VERBOSE: true   // Afficher les options et l'état
};
pedigreejs.build(opts);
```

**Problèmes courants :**
- **Imports circulaires :** Lancer `npx madge --circular es/` après refactoring
- **Échecs de tests :** Vérifier que le build existe (`build/pedigreejs*.js`)
- **Gestion d'événements :** Chercher les paires `$(document).trigger()` et `.on()`
- **Problèmes de cache :** Effacer localStorage si données obsolètes

**Trouver les usages :**
```bash
grep -r "functionName" es/              # Trouver les appels de fonction
grep -r "from.*\./" es/                 # Trouver tous les imports
grep -r "TODO\|FIXME" es/               # Trouver le travail en attente
```

## Contraintes et décisions connues

### Compatibilité navigateurs

- Cible : Navigateurs modernes (voir `browserslist` dans package.json)
- Legacy : Du code de compatibilité IE encore présent
- D3.js v7, jQuery 3.3.1 chargés depuis CDN

### Caractéristiques de performance

**Actuelles (mesurées en Phase 2) :**
- 10 personnes : 4ms
- 30 personnes : 7ms
- 50 personnes : 25ms
- 100 personnes : 31ms

**Toutes bien en dessous du seuil de 100ms.** Ne pas optimiser davantage sans profiling montrant des problèmes réels.

### Stabilité de l'API

L'API publique (`pedigreejs.build()`, `pedigreejs.rebuild()`) doit rester stable. Le refactoring interne est acceptable, mais :

- Les signatures de fonction ne peuvent pas changer
- Les options par défaut doivent être préservées
- Les noms d'événements doivent être préservés

### Dette technique acceptée

Ces éléments ont été consciemment différés pendant le refactoring :

1. **utils.roots global :** Complexe à refactorer, faible priorité
2. **Rebuild complet aux changements :** Performant, rendu incrémental non justifié
3. **Dépendance jQuery :** Profondément intégrée, migration serait un gros effort
4. **Format de bundle IIFE :** Requis pour les patterns d'utilisation actuels

## Standards de documentation

Lors de l'ajout de code significatif :

- **Commentaires inline :** Expliquer le "pourquoi", pas le "quoi"
- **En-têtes JSDoc :** Pour les fonctions exportées (voir feuille de route Phase 3)
- **Mettre à jour CLAUDE.md :** Si les patterns architecturaux changent
- **Créer des notes de session :** Documenter les décisions dans SESSION_CONTEXT.md

## Ressources associées

- **Démo/Exemples :** Répertoire `docs/` (example1.html jusqu'à example9.html)
- **Publication :** Carver T, et al. Bioinformatics, Volume 34, Issue 6, 15 Mars 2018
- **Page d'accueil :** https://lionelsultan.github.io/pedigreejs/
- **Projet original :** University of Cambridge (GPL-3.0-or-later)
