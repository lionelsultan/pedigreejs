# Audit de code complet - PedigreeJS

## 2. Vue d'ensemble de l'architecture

### Structure modulaire ES2015

- **Architecture modulaire** : Le projet utilise ES2015 modules avec 14 modules spécialisés dans `/es/`
- **Point d'entrée** : `es/index.js` agrège et exporte tous les modules via des namespace exports
- **Taille codebase** : ~4 500 lignes de JavaScript réparties sur 14 fichiers

### Organisation des modules

```text
es/
├── pedigree.js (560 LOC)     # Module principal - logique de base du pedigree
├── widgets.js (802 LOC)      # Interface utilisateur et widgets
├── utils.js (775 LOC)        # Utilitaires génériques
├── io.js (663 LOC)           # Import/export de données
├── canrisk_file.js (417 LOC) # Gestion des fichiers CanRisk
├── popup_form.js (307 LOC)   # Formulaires modaux
├── pedcache.js (220 LOC)     # Système de cache des données
├── pbuttons.js (197 LOC)     # Boutons et contrôles
├── zoom.js (150 LOC)         # Gestion du zoom et pan
├── labels.js (124 LOC)       # Étiquetage
├── extras.js (106 LOC)       # Fonctionnalités supplémentaires
├── dragging.js (98 LOC)      # Interactions drag & drop
├── twins.js (72 LOC)         # Gestion des jumeaux
└── index.js (18 LOC)         # Point d'entrée
```

### Pipeline de build

- **Bundler** : Rollup.js avec configuration dual output (normal + minifié)
- **Format de sortie** : IIFE (Immediately Invoked Function Expression) pour compatibilité navigateur
- **Transpilation** : Babel avec preset-env pour compatibilité ES5
- **Build artifacts** : `build/pedigreejs.v4.0.0-rc1.js` (155KB) + version minifiée (75KB)

## 3. Stack technique et dépendances

### Dépendances runtime principales

- **D3.js v7.9.0** : Manipulation DOM et visualisation (CDN)
- **jQuery 3.3.1 + jQuery UI 1.12.1** : Manipulation DOM et interface (CDN)
- **FontAwesome 6.2.1** : Iconographie (CDN)

### Dépendances de développement

```text
Build Tools :
- rollup@4.53.1                 # Bundler principal
- @rollup/plugin-babel@6.1.0    # Transpilation ES6→ES5
- @rollup/plugin-terser@0.4.4   # Minification
- rollup-plugin-postcss@4.0.2   # Traitement CSS

Code Quality :
- @babel/core@7.28.5            # Transpilateur JavaScript
- rollup-plugin-eslint@7.0.0    # Linting
- @babel/eslint-parser@7.28.5   # Parser ESLint pour Babel

Testing :
- jasmine-browser-runner@3.0.0  # Runner de tests navigateur
- jasmine-core@5.12.1           # Framework de test
```

### Configuration et tooling

- **ESLint** : Configuration `eslint:recommended` avec règles personnalisées strictes
- **Babel** : Preset `@babel/env` pour compatibilité navigateurs
- **Browserslist** : Configuration "defaults" (>0.5%, last 2 versions, Firefox ESR, not dead)
- **Versioning** : v4.0.0-rc1 (Release Candidate)

### Architecture de déploiement

- **Distribution** : Bundle IIFE standalone sans dépendances externes bundlées
- **Stratégie CDN** : Dépendances majeures (D3, jQuery, FontAwesome) chargées via CDN
- **Assets** : CSS extrait séparément via PostCSS
- **Source maps** : Disponibles pour debugging (263KB)

## 4. Qualité du code et structure interne

### Lisibilité et structure

#### Organisation modulaire
- **Points forts** : Architecture modulaire cohérente avec séparation claire des responsabilités
- **Nommage** : Convention cohérente avec préfixes explicites (`pedigree_`, `pedcache_`, etc.)
- **Modules core** : Distinction nette entre logique métier (`pedigree.js`), interface (`widgets.js`), utilitaires (`utils.js`) et I/O (`io.js`)

#### Complexité cyclomatique
- **Risque élevé** : `widgets.js` (802 LOC) contient des fonctions très longues avec logique complexe
  - Fonction `addWidgets` : >100 lignes avec gestion événementielle dense
  - Logique d'ajout de personnes : imbrication profonde (7+ niveaux)
- **Risque moyen** : `utils.js` (775 LOC) avec fonctions de validation complexes
  - `validate_pedigree` : 90+ lignes avec conditions multiples

### Couplage et cohésion

#### Interdépendances
- **Couplage fort** entre modules core :
  ```javascript
  widgets.js → utils.js + popup_form.js + pedcache.js + twins.js
  pedigree.js → utils.js + pbuttons.js + pedcache.js + io.js + widgets.js
  ```
- **Import circulaire potentiel** : `utils.js` et `pedcache.js` s'importent mutuellement

#### Cohésion interne
- **Bonne cohésion** : Modules spécialisés (`zoom.js`, `twins.js`, `dragging.js`)
- **Cohésion faible** : `utils.js` mélange validation, manipulation DOM et calculs mathématiques

### Duplication et dette technique

#### Code dupliqué identifié
- **Manipulation DOM** : Patterns répétitifs de création/modification d'éléments SVG
- **Gestion d'événements** : Code similaire pour click handlers dans `widgets.js` et `pbuttons.js`
- **Validation** : Logiques de vérification redondantes entre modules

#### Dette technique
- **TODOs identifiés** :
  - `pedcache.js:98` : "TODO :: array cache" - implémentation cache incomplète
  - `pedcache.js:206` : "TODO" non documenté
- **Code commenté** : Plusieurs lignes de debug commentées
- **Magic numbers** : Nombreuses constantes non nommées (facteurs de zoom, tailles)

### Documentation et commentaires

#### État actuel
- **Header license** : Présent sur tous les fichiers (GPL-3.0)
- **Commentaires inline** : 336 commentaires mais qualité variable
- **Documentation fonctionnelle** : Absente (pas de JSDoc)

#### Problèmes identifiés
- **Debug artifacts** : `console.log` commentés mais présents
- **Commentaires obsolètes** : Références à d'anciennes API
- **Manque d'explication** : Algorithmes complexes non documentés

## 5. Tests et robustesse

### Organisation des tests

#### Structure actuelle
- **Test unique** : Un seul fichier `spec/javascripts/pedigree_spec.js` (685 lignes)
- **Runner** : Jasmine Browser Runner configuré via `jasmine-browser.json`
- **Environnement** : Tests headless Firefox avec dépendances CDN
- **Couverture** : Tests principalement d'intégration focalisés sur les opérations CRUD

#### Types de tests présents
- **Tests de structure SVG** : Vérification de création, dimensions, éléments graphiques
- **Tests de validation** : Contrôle cohérence parents/enfants, noms uniques, sexes
- **Tests d'opérations** : Ajout/suppression enfants, siblings, partners
- **Tests d'import/export** : Formats BWA v4, CanRisk v2, Linkage
- **Tests utilitaires** : Cache, détection overlaps, connexité du pedigree

### Couverture et robustesse

#### Zones couvertes
- **Validation des données** : Tests robustes sur cohérence familiale
- **Opérations de base** : CRUD sur personnes avec vérifications géométriques
- **Formats d'import** : Support 3 formats avec tests de parsing
- **Système de cache** : Fonctionnement localStorage et array cache

#### Zones non couvertes (Risque élevé)
- **Modules spécialisés** : `zoom.js`, `dragging.js`, `twins.js` non testés
- **Interface utilisateur** : Aucun test des widgets, popups, événements
- **Gestion erreurs réseau** : Import de fichiers malformés ou corrompus
- **Performance** : Aucun test sur grands pedigrees (>100 personnes)
- **Compatibilité navigateur** : Tests uniquement Firefox headless

#### Cas d'usage critiques absents

| Fonctionnalité | Risque | Impact |
|----------------|--------|--------|
| Grands pedigrees | Élevé | Performance dégradée |
| Événements drag & drop | Élevé | Interface cassée |
| Zoom/pan complexes | Moyen | UX détériorée |
| Fichiers JSON malformés | Élevé | Crash application |

### Gestion des erreurs et validation

#### Points forts
- **Validation stricte** : Tests complets sur cohérence des relations familiales
- **Assertions robustes** : Vérification systématique des exceptions attendues
- **Nettoyage** : `afterEach()` proper avec clearing des caches et DOM

#### Faiblesses identifiées
- **Erreurs silencieuses** : Pas de tests sur `console.warn` ou erreurs non-bloquantes
- **Résilience UI** : Aucune couverture des états d'erreur interface
- **Validation formats** : Tests limités aux cas nominaux d'import

## 6. Performance et UX technique

### Architecture et points sensibles

#### Modules critiques pour la performance
- **`pedigree.js`** : Calculs géométriques complexes pour layout (560 LOC)
  - Algorithme de positionnement avec boucles imbriquées
  - Recalcul complet à chaque rebuild via `$(document).trigger('rebuild')`
- **`widgets.js`** : Gestion événementielle dense (802 LOC)
  - 258 manipulations DOM D3 identifiées
  - Logique d'ajout de personnes avec complexité O(n²)
- **`utils.js`** : Fonctions utilitaires sollicitées par tous les modules

#### Patterns de performance problématiques
- **Rebuild complet** : Événement `rebuild` déclenche re-rendu intégral du SVG
- **Boucles imbriquées** : Détection d'overlaps et calculs de positions
- **Manipulation DOM synchrone** : 258 opérations D3 sans batching

### Rendu et interactions

#### Stratégie de rendu actuelle
- **Re-rendu complet** : Chaque modification déclenche `pedigreejs.rebuild()`
- **Pas de virtualisation** : Tous les nœuds rendus simultanément
- **SVG direct** : Manipulation DOM directe sans couche d'abstraction

#### Gestion du zoom et pan
- **D3 zoom behaviors** : Implémentation native D3 dans `zoom.js`
- **Performance acceptable** : Transform CSS via `d3.zoomIdentity`
- **Cache position** : Sauvegarde état zoom dans `pedcache.js`
- **Limitation** : Recalcul `getBBox()` à chaque zoom pour bounds

#### Interactions utilisateur
- **Délais artificiels** : `setTimeout(500ms)` pour `scale_to_fit`
- **Pas de debouncing** : Actions immédiates sans lissage
- **Zoom en continu** : `setInterval(50ms)` pour boutons zoom maintenu

### Gestion mémoire et cache

#### Système de cache `pedcache.js`
- **Cache effectif** : localStorage pour persistance dataset
- **Implémentation partielle** : TODO ligne 98 sur array cache non résolu
- **Invalidation** : Mécanisme `clear()` présent
- **Limitation** : Cache de 500 entrées max (magic number)

#### Risques de fuite mémoire
- **Variables globales** : `utils.roots`, `dragging`, `last_mouseover`
- **Event listeners** : Pas de cleanup explicite visible
- **Objets D3** : Sélections potentiellement retenues
- **LocalStorage** : Croissance non bornée du cache

### Performance perçue (UX technique)

#### Fluidité interface
- **Responsive** : Zoom et pan fluides via transforms CSS
- **Blocages identifiés** :
  - Rebuild complet lors d'ajout/suppression (700ms transition)
  - Calcul bounds via `getBBox()` synchrone
  - Validation complète dataset à chaque modification

#### Mécanismes asynchrones limités
- **Timeouts présents** : 5 `setTimeout` identifiés pour spacing
- **Pas de web workers** : Calculs lourds sur thread principal
- **Pas de lazy loading** : Rendu immédiat de tous éléments

## 7. Sécurité et sûreté côté front

### Gestion des entrées utilisateur

#### Validation des données
- **Validation stricte** : Contrôle cohérence des relations familiales
- **Sanitisation** : Pas de sanitisation explicite des inputs utilisateur
- **Format de données** : Support de multiples formats d'import avec parsing basique

#### Risques identifiés
- **Injection potentielle** : Manipulation DOM directe sans échappement
- **XSS** : Données utilisateur insérées dans le DOM via D3 sans validation
- **Parsing non sécurisé** : Import de fichiers sans validation approfondie

### Gestion des fichiers

#### Import/export
- **Formats supportés** : BWA v4, CanRisk v2, Linkage
- **Validation limitée** : Parsing basique sans contrôles de sécurité
- **Taille de fichier** : Pas de limitation visible sur la taille des imports

### Client-side storage

#### LocalStorage
- **Cache système** : Utilisation de localStorage pour persistance
- **Pas de chiffrement** : Données stockées en clair
- **Gestion quotas** : Limitation à 500 entrées mais pas de gestion d'espace

## 8. Maintenabilité et extensibilité

### Points d'extension

#### Facilité d'ajout de fonctionnalités
- **Symboles et attributs** : **Moyenne**
  - Structure `opts.diseases` permet l'ajout de nouveaux cancers
  - Configuration `opts.labels` extensible pour nouveaux champs
  - Limitation : logique de rendu codée en dur dans `pedigree.js`

- **Widgets et formulaires** : **Faible**
  - Interface HTML codée en dur dans `widgets.js` et `popup_form.js`
  - Pas d'abstraction pour créer de nouveaux contrôles
  - Événements étroitement couplés à la structure DOM existante

#### Interopérabilité framework
- **Intégration moderne** : **Faible**
  - Bundle IIFE difficilement intégrable dans React/Vue/Angular
  - Manipulation DOM directe incompatible avec Virtual DOM
  - State global via `utils.roots` problématique en environnement modularisé

### Risque de régression

#### Couplage critique
- **Risque élevé** : Modifications dans `utils.js` affectent 8+ modules
- **Effets de bord** : Variables globales multiples
- **Événements jQuery** : Gestion événementielle dispersée sans central dispatcher

#### Points de fragilité

| Module | Risque | Impact | Cause |
|--------|--------|--------|--------|
| `widgets.js` | Élevé | Interface complète | Logique UI monolithique |
| `utils.js` | Élevé | Fonctionnalités core | Hub de dépendances |
| `pedigree.js` | Moyen | Rendu SVG | Calculs géométriques complexes |

### Documentation technique

#### Lisibilité pour développeur tiers
- **Évaluation** : **Moyenne**
- **Points positifs** :
  - Structure modulaire claire
  - Exemples dans `/docs/` (12 fichiers HTML)
  - Configuration via objet `opts` bien documentée

- **Lacunes** :
  - APIs publiques non documentées
  - Callbacks et hooks non spécifiés
  - Absence de diagrammes d'architecture

#### État de la documentation
- **Documentation utilisateur** : Forte (nombreux exemples)
- **Documentation développeur** : **Faible**
  - Pas de guide d'architecture
  - APIs non formalisées
  - Processus de contribution non documenté

## Recommandations consolidées

### P1 - Priorité critique (Architecture et robustesse)

- **P1.1** Découpler les modules - `utils.js`, `widgets.js`, `pedigree.js` - Créer interfaces claires
- **P1.2** Tests des modules manquants - `zoom.js`, `dragging.js`, `twins.js` - Couvrir fonctionnalités critiques
- **P1.3** Éliminer le state global - Tous modules - Encapsuler dans classes ou modules state
- **P1.4** Rendu incrémental - `pedigree.js` - Remplacer rebuild complet par updates partiels
- **P1.5** Tests d'interface - `widgets.js` - Couvrir événements widgets et interactions

### P2 - Priorité amélioration (Qualité et performance)

- **P2.1** Scinder `utils.js` - `utils.js` - Créer modules thématiques (`validation.js`, `dom.js`, `math.js`)
- **P2.2** Abstraire manipulation DOM - `pedigree.js`, `widgets.js` - Créer couche d'abstraction rendu
- **P2.3** Batching DOM - Tous modules - Grouper opérations D3 avec `requestAnimationFrame`
- **P2.4** Tests de performance - Infrastructure - Implémenter benchmarks sur pedigrees 100+ personnes
- **P2.5** Virtualisation - `pedigree.js` - Implémenter windowing pour grands pedigrees

### P3 - Priorité opportunité (Modernisation et extensibilité)

- **P3.1** Build ES modules - Configuration - Ajouter output ESM pour intégration moderne
- **P3.2** TypeScript interfaces - Tous modules - Définir types pour améliorer DX
- **P3.3** Système de plugins - Architecture - Permettre ajout widgets custom
- **P3.4** Configuration externalisée - Configuration - Déplacer symboles, couleurs vers fichiers config
- **P3.5** Progressive rendering - `pedigree.js` - Affichage par niveaux de génération

## 9. Synthèse finale

PedigreeJS présente une architecture modulaire solide avec une séparation claire des responsabilités, mais souffre d'un couplage fort entre modules core et d'une dette technique modérée. La couverture de tests est limitée aux fonctionnalités de base, laissant les interactions UI et la performance non testées. Les enjeux critiques concernent la scalabilité (rendu complet à chaque modification), la maintenabilité (couplage `utils.js`) et l'extensibilité (widgets codés en dur). Les priorités immédiates sont le découplage architectural, l'extension des tests et l'optimisation du rendu pour grands pedigrees.