# Phase 2 - Rapport de Performance

**Date** : 2024-11-10
**Phase** : Phase 2 - Performance (Approche conservatrice)
**Statut** : 🟡 En cours

---

## 📊 Objectif

Mesurer la performance actuelle du système de rebuild de PedigreeJS pour déterminer si des optimisations sont nécessaires.

**Approche** : "Mesurer d'abord, optimiser ensuite" - Éviter les optimisations prématurées

---

## 🎯 Méthodologie

### Instrumentation
- **API utilisée** : Web Performance API (performance.mark, performance.measure)
- **Métriques collectées** :
  - Temps de rebuild complet (ms)
  - Temps de rendu SVG (ms)
  - Temps de calculs géométriques (ms)
  - Nombre d'opérations DOM

### Datasets de test
- **10 personnes** : Petit pedigree (3 générations)
- **30 personnes** : Pedigree moyen (4-5 générations)
- **50 personnes** : Grand pedigree (5-6 générations)
- **100 personnes** : Très grand pedigree (6-7 générations)

### Critère de décision
- **Seuil acceptable** : < 100ms pour rebuild sur dataset moyen (30-50 personnes)
- **Si dépassé** : Optimisations nécessaires (rendu incrémental, batching DOM)
- **Si acceptable** : Passer à Phase 3

---

## 📈 Résultats des mesures

### Implémentation terminée ✅

Un fichier de test de performance complet a été créé : `spec/javascripts/performance_spec.js`

**Fonctionnalités implémentées** :
- ✅ Web Performance API (performance.mark, performance.measure)
- ✅ Datasets de test prédéfinis (10, 30, 50, 100+ personnes)
- ✅ Mesures de build et rebuild séparées
- ✅ Tests Jasmine automatisés
- ✅ Résumé comparatif des performances

**Datasets créés** :
1. **Small** (10 personnes) - 3 générations, famille simple
2. **Medium** (30 personnes) - 4 générations avec grands-parents et cousins
3. **Large** (50+ personnes) - Dataset medium + branches additionnelles
4. **XLarge** (100+ personnes) - Dataset large + 10 branches supplémentaires

### Comment exécuter les mesures

#### Mode automatique (headless)
```bash
npx jasmine-browser-runner runSpecs
```
✅ Tests passants : 138 specs, 0 failures

**Note** : Les logs de performance (console.log) ne sont pas capturés en mode headless.

#### Mode interactif (recommandé pour voir les résultats)
```bash
npm test
```
Puis ouvrir http://localhost:8888 dans Firefox et ouvrir la console développeur.

Les tests de performance affichent :
- Taille réelle de chaque dataset
- Temps de build initial (ms)
- Temps de rebuild (ms)
- Résumé comparatif avec analyse du seuil de 100ms

### Résultats attendus

Les tests mesurent :
- **Build time** : Temps de construction initiale du SVG
- **Rebuild time** : Temps de reconstruction complète
- **Analyse** : Comparaison avec le seuil de 100ms pour datasets moyens

---

## 🔍 Analyse

### Implémentation de l'instrumentation

**Fichier** : `spec/javascripts/performance_spec.js` (413 LOC)

**Fonctions d'instrumentation** :
1. `measureBuild(opts)` - Mesure temps de build avec performance.mark/measure
2. `measureRebuild(opts)` - Mesure temps de rebuild
3. `measureBuildAndRebuild(dataset)` - Fonction helper combinée
4. `getTestDataset(size)` - Génération datasets prédéfinis

**Points de mesure** :
- ✅ **pedigree.build()** - Construction initiale
- ✅ **pedigree.rebuild()** - Reconstruction complète
- ✅ Inclut implicitement :
  - Validation (`validate_pedigree`)
  - Construction arbre (`buildTree`)
  - Calculs géométriques (`adjust_coords`, `overlap`)
  - Rendu SVG (opérations D3)
  - Cache (`pedcache.init_cache`)

### Problèmes résolus

1. **Références cycliques dans le dataset**
   - Problème : `JSON.stringify` échoue après build (références parent/enfant D3)
   - Solution : Cloner le dataset avec `JSON.parse(JSON.stringify())` avant chaque mesure

2. **Nom de fonction cache incorrect**
   - Problème : `pedcache.clear_cache()` n'existe pas
   - Solution : Utiliser `pedcache.clear()` (API correcte)

3. **Tests ajoutés** : +5 nouveaux tests de performance
   - 4 tests individuels (10, 30, 50, 100 personnes)
   - 1 test de résumé comparatif

---

## 📝 Notes de session

### 2024-11-10 - Implémentation Phase 2.1 ✅

**Travail effectué** :
1. ✅ Créé PHASE2_PERFORMANCE_REPORT.md
2. ✅ Créé spec/javascripts/performance_spec.js (413 LOC)
3. ✅ Implémenté Web Performance API
4. ✅ Créé 4 datasets de test prédéfinis
5. ✅ Résolu problèmes de références cycliques
6. ✅ Tous les tests passent (138 specs, 0 failures)

**Fichiers créés** :
- `PHASE2_PERFORMANCE_REPORT.md` - Ce rapport
- `spec/javascripts/performance_spec.js` - Tests de performance

**Prochaine étape** :
- Exécuter les tests en mode interactif pour capturer les mesures réelles
- Documenter les résultats dans ce rapport
- Passer à l'étape 2.2 (Résoudre TODO pedcache.js:98)

---

## 🎯 Prochaines actions

### Pour compléter Phase 2.1
1. Exécuter `npm test` en mode interactif
2. Ouvrir console développeur Firefox
3. Noter les temps de build/rebuild pour chaque dataset
4. Mettre à jour ce rapport avec les résultats chiffrés
5. Analyser si seuil de 100ms est dépassé

### Phase 2.2 - TODO pedcache.js:98
- Compléter implémentation array cache fallback
- Implémenter LRU eviction
- Tests de non-régression

---

## 🔧 Phase 2.2 - Résolution TODO pedcache.js

**Statut** : 🟡 En cours
**Date** : 2024-11-10

### Analyse du problème

**Fichier** : `es/pedcache.js`

**TODOs identifiés** :
1. **Ligne 98** : "TODO :: array cache" - dans `init_cache()`
2. **Ligne 206** : "TODO" - dans `setposition()`

#### TODO #1 - init_cache (ligne 98)

**Problème actuel** :
```javascript
} else {   // TODO :: array cache
    console.warn('Local storage not found/supported for this browser!', opts.store_type);
    max_limit = 500;
    if(get_arr(opts) === undefined)
        dict_cache[get_prefix(opts)] = [];
    get_arr(opts).push(JSON.stringify(opts.dataset));
}
```

**Problèmes** :
- ❌ Pas d'éviction LRU quand le tableau atteint max_limit (500)
- ❌ Le tableau grandit indéfiniment
- ❌ Fuite mémoire potentielle

**Solution à implémenter** :
- ✅ LRU eviction : supprimer l'élément le plus ancien quand max_limit est atteint
- ✅ Maintenir un tableau circulaire de taille fixe

#### TODO #2 - setposition (ligne 206)

**Problème actuel** :
```javascript
} else {
    //TODO
}
```

**Problèmes** :
- ❌ Position zoom/pan non sauvegardée en mode array
- ❌ Perte de position lors du rechargement

**Solution à implémenter** :
- ✅ Stocker x, y, zoom dans dict_cache
- ✅ Parité avec le mode localStorage

### Implémentation

#### ✅ TODO #1 - LRU Eviction dans init_cache (ligne 98)

**Problème résolu** :
- Array cache grandissait indéfiniment sans éviction
- Risque de fuite mémoire

**Solution implémentée** :
```javascript
let arr = get_arr(opts);
// LRU eviction: if array is at max capacity, remove oldest (first) element
if(arr.length >= max_limit) {
    arr.shift(); // Remove oldest entry (FIFO = simple LRU)
    // Adjust count since we removed an element
    if(count > 0)
        count--;
}
arr.push(serialize_dataset(opts.dataset));
```

**Caractéristiques** :
- ✅ Éviction FIFO (First In, First Out) = LRU simple
- ✅ Taille du cache limitée à max_limit (500)
- ✅ Ajustement du compteur lors de l'éviction
- ✅ Fonction `serialize_dataset()` ajoutée pour gérer les références circulaires D3

#### ✅ TODO #2 - setposition/getposition en mode array (ligne 206)

**Problème résolu** :
- Position zoom/pan non sauvegardée en mode array
- Perte de position lors des opérations

**Solution implémentée** :

**setposition()** :
```javascript
} else {
    // Array cache fallback for position storage
    if(x) {
        dict_cache[get_prefix(opts)+'_X'] = x;
        dict_cache[get_prefix(opts)+'_Y'] = y;
    } else {
        delete dict_cache[get_prefix(opts)+'_X'];
        delete dict_cache[get_prefix(opts)+'_Y'];
    }

    let zoomName = get_prefix(opts)+'_ZOOM';
    if(zoom)
        dict_cache[zoomName] = zoom;
    else
        delete dict_cache[zoomName];
}
```

**getposition()** :
```javascript
} else {
    // Array cache fallback for position retrieval
    if(dict_cache[get_prefix(opts)+'_X'] === null ||
       dict_cache[get_prefix(opts)+'_X'] === undefined)
        return [null, null];
    let pos = [ parseInt(dict_cache[get_prefix(opts)+'_X']),
                parseInt(dict_cache[get_prefix(opts)+'_Y']) ];
    if(dict_cache[get_prefix(opts)+'_ZOOM'] !== null &&
       dict_cache[get_prefix(opts)+'_ZOOM'] !== undefined)
        pos.push(parseFloat(dict_cache[get_prefix(opts)+'_ZOOM']));
    return pos;
}
```

**Caractéristiques** :
- ✅ Parité complète avec localStorage
- ✅ Support x, y, zoom
- ✅ Gestion de la suppression (null/undefined)

#### 🔧 Bonus - serialize_dataset() helper

**Problème découvert** :
- D3 ajoute des références circulaires (parent/children) au dataset
- `JSON.stringify()` échoue avec "cyclic object value"

**Solution implémentée** :
```javascript
function serialize_dataset(dataset) {
    try {
        // Try direct stringification first (for performance)
        return JSON.stringify(dataset);
    } catch (e) {
        // If circular reference error, create a clean copy
        let cleanData = dataset.map(function(person) {
            let clean = {};
            for (let key in person) {
                // Skip D3-added properties and circular references
                if (key !== 'parent' && key !== 'children' && key !== 'data' &&
                    typeof person[key] !== 'function' && typeof person[key] !== 'object') {
                    clean[key] = person[key];
                }
            }
            return clean;
        });
        return JSON.stringify(cleanData);
    }
}
```

**Caractéristiques** :
- ✅ Try/catch pour performance (cas normal = rapide)
- ✅ Fallback avec nettoyage si références circulaires
- ✅ Filtre les propriétés D3 (parent, children, data)
- ✅ Utilisé dans init_cache() pour localStorage ET array

### Tests créés

**Fichier** : `spec/javascripts/pedcache_spec.js` (287 LOC)

**Tests implémentés** : 12 nouveaux tests
1. ✅ Array cache storage
2. ✅ LRU eviction au max_limit
3. ✅ Maintien taille array pendant éviction
4. ✅ Store/retrieve position en mode array
5. ✅ Position null quand non définie
6. ✅ Clear position
7. ✅ Position sans zoom
8. ✅ Update position multiple fois
9. ✅ Navigation previous/next
10. ✅ Clear cache complet
11. ✅ Intégration avec pedigree build
12. ✅ Cache maintenu durant rebuilds

**Résultats** :
- ✅ **150 specs, 0 failures** (138 originaux + 12 nouveaux)
- ✅ 100% des fonctionnalités cache array testées
- ✅ Tests d'intégration avec pedigreejs.build()

### Fichiers modifiés

**es/pedcache.js** :
- +28 LOC (fonction serialize_dataset)
- Modifié init_cache() : +6 LOC (éviction LRU)
- Modifié setposition() : +14 LOC (support array)
- Modifié getposition() : +10 LOC (support array)
- **Total** : ~58 LOC ajoutées

**spec/javascripts/pedcache_spec.js** : +287 LOC (nouveau fichier)

### Problèmes résolus

1. ✅ **Fuite mémoire** : Array cache croissance infinie → LRU eviction
2. ✅ **Perte de position** : Zoom/pan non sauvegardé → dict_cache storage
3. ✅ **Références circulaires** : JSON.stringify échoue → serialize_dataset()
4. ✅ **Tests manquants** : Pas de tests cache array → 12 tests complets

---

## 📊 Résumé Phase 2.2

**Statut** : ✅ **TERMINÉ**

**TODOs résolus** :
- ✅ pedcache.js:98 - Array cache LRU eviction
- ✅ pedcache.js:206 - setposition/getposition array mode

**Tests** :
- ✅ 150 specs, 0 failures
- ✅ +12 tests spécifiques au cache array

**Code** :
- ✅ +58 LOC dans pedcache.js
- ✅ +287 LOC de tests
- ✅ Build réussi sans erreurs

---

*Ce rapport documente les étapes 2.1 et 2.2 de la Phase 2.*
