# 🔍 AUDIT FONCTIONNEL COMPLET - PedigreeJS v4.0.0-rc1

**Date:** 19 novembre 2025
**Objectif:** Vérifier toutes les fonctionnalités après récupération fichiers GitHub
**Méthode:** Tests manuels + automatisés pour chaque feature

---

## 📋 INVENTAIRE COMPLET DES FONCTIONNALITÉS

### 🏗️ **GROUPE 1: CORE - Construction & Rendu** (CRITIQUE)

#### 1.1 Build & Rebuild
- [ ] `pedigreejs.build(opts)` - Construction initiale pedigree
- [ ] `pedigreejs.rebuild(opts)` - Reconstruction complète
- [ ] Protection race conditions (pas de rebuild concurrent)
- [ ] Rendu SVG avec dimensions correctes
- [ ] Arbre D3.js avec hiérarchie correcte
- [ ] Background avec border-radius
- [ ] Mode DEBUG (indicateur visuel orange)

#### 1.2 Options de configuration
- [ ] `targetDiv` - ID div cible
- [ ] `width`, `height` - Dimensions SVG
- [ ] `symbol_size` - Taille symboles
- [ ] `dataset` - Données pedigree
- [ ] `edit` - Mode édition activé/désactivé
- [ ] `diseases` - Configuration maladies
- [ ] `validate` - Validation activée/désactivée
- [ ] `DEBUG` - Mode debug
- [ ] `zoomIn`, `zoomOut` - Limites zoom
- [ ] `zoomSrc` - Sources zoom (wheel, button)
- [ ] `dragNode` - Drag nodes activé
- [ ] `store_type` - Type stockage (local/session/array)

---

### ➕ **GROUPE 2: CRUD - Ajout/Suppression Membres** (CRITIQUE)

#### 2.1 Add Child
- [ ] Widget "Add Child" visible sur parents
- [ ] Popup sélection sexe (Carré=M, Cercle=F, Losange=U)
- [ ] Enfant créé avec parents corrects (mother/father)
- [ ] Enfant positionné correctement dans dataset
- [ ] Twins (MZ/DZ) supportés
- [ ] Rebuild automatique après ajout

#### 2.2 Add Sibling
- [ ] Widget "Add Sibling" visible (sauf si top_level/noparents)
- [ ] Popup sélection sexe
- [ ] Sibling partage mêmes parents (mother/father)
- [ ] Twins supportés
- [ ] Positionnement gauche/droite configurable

#### 2.3 Add Parents
- [ ] Widget "Add Parents" visible (sauf si parents existent)
- [ ] Création paire mère+père automatique
- [ ] Parents assignés correctement (mother=F, father=M)
- [ ] Gestion depth=1 (top_level → noparents pour autres)
- [ ] Gestion depth>1 (insertion correcte dans hiérarchie)

#### 2.4 Add Partner  🆕 (BUGFIXES 2025-11-19)
- [ ] Widget "Add Partner" toujours visible (multiple partners OK)
- [ ] Sexe partner auto-détecté (opposé par défaut)
- [ ] Sexe partner configurable via `config.partner_sex`
- [ ] Enfant créé par défaut (`create_child: true`)
- [ ] Enfant optionnel via `config.create_child: false`
- [ ] Sexe enfant configurable via `config.child_sex` (default: 'U')
- [ ] Index enfant correct (bugfix: utilise `partner.name + 1`)
- [ ] Positionnement partner cohérent (F left, M right)
- [ ] Validation same-sex avec warning (DEBUG mode)
- [ ] Support Unknown sex ('U')
- [ ] Backwards compatible (ancienne API fonctionne)

#### 2.5 Delete Node
- [ ] Widget "Delete" visible
- [ ] Confirmation dialog si split pedigree
- [ ] Suppression cascade (partners orphelins, ancêtres)
- [ ] Twins vérifiés (checkTwins)
- [ ] Validation post-delete (unconnected check)
- [ ] Rebuild automatique

---

### 🎨 **GROUPE 3: RENDU SVG - Symboles & Liens** (IMPORTANT)

#### 3.1 Symboles personnes
- [ ] **Homme (M):** Carré (d3.symbolSquare)
- [ ] **Femme (F):** Cercle (d3.symbolCircle)
- [ ] **Inconnu (U):** Losange (carré rotated 45°)
- [ ] **Fausse couche:** Triangle (d3.symbolTriangle)
- [ ] **Bordure épaisse** si âge ET yob présents
- [ ] **Pointillés** si `exclude: true`
- [ ] **Hidden nodes** (debug mode uniquement)

#### 3.2 ClipPath pour maladies 🆕 (BUGFIX 2025-11-19)
- [ ] ClipPath IDs préfixés avec `targetDiv` (ex: `pedigree_a_clip_person123`)
- [ ] Pas de collision multi-pedigree sur même page
- [ ] Pie charts clippés correctement
- [ ] Références `clip-path` correctes (`url(#targetDiv_clip_id)`)

#### 3.3 Pie charts maladies
- [ ] Secteurs colorés selon `opts.diseases`
- [ ] `affected: true` → gris foncé si pas de cancer spécifique
- [ ] Multi-disease support (plusieurs secteurs)
- [ ] `exclude: true` → lightgrey

#### 3.4 Liens partenaires
- [ ] Ligne horizontale entre partners
- [ ] **Consanguinité:** Double ligne (3px offset)
- [ ] **Divorce:** Double slashes
- [ ] **Clash detection** avec routing autour obstacles
- [ ] **Feedback visuel** liens qui s'entrecroisent (rouge pointillé) - Phase 3.1.2

#### 3.5 Liens vers enfants
- [ ] Ligne verticale parents → enfant
- [ ] **Adoption:** Ligne pointillée (dashed)
- [ ] **Twins MZ:** Barre horizontale connectant twins
- [ ] **Twins DZ:** Ligne en V
- [ ] **Parents différents niveaux:** Ajustement vertical

#### 3.6 Adopted brackets 🆕 (BUGFIX 2025-11-19)
- [ ] Brackets [ ] autour enfants `noparents: true`
- [ ] Scaling adaptatif (`bracket_height = symbol_size * 1.3`)
- [ ] Correct sur toutes tailles (15px - 80px)

#### 3.7 Labels
- [ ] Display name affiché
- [ ] Âge (age)
- [ ] Année naissance (yob)
- [ ] Alleles génétiques
- [ ] Attributs custom configurables

---

### 🖱️ **GROUPE 4: INTERACTIONS UI - Widgets & Events** (IMPORTANT)

#### 4.1 Widgets interactifs
- [ ] Widgets apparaissent au hover (opacity 0 → 1)
- [ ] Widgets disparaissent au mouseout
- [ ] Rectangle gris 20% opacity au hover
- [ ] Tooltips (title) sur widgets
- [ ] FontAwesome icons corrects
- [ ] Protection double-clics (Phase 3.1.3 - `_widgetClickInProgress`)

#### 4.2 Drag & Drop nodes
- [ ] **Shift + Drag** pour réordonner nodes
- [ ] Rectangle rouge pendant drag
- [ ] Position finale correcte dans dataset
- [ ] Partner déplacé avec node si applicable
- [ ] Rebuild automatique après drop

#### 4.3 Drag-to-Partner (Consanguins)
- [ ] **Shift + Hover** autre node → cursor crosshair
- [ ] Ligne noire pointillée pendant drag
- [ ] **Shift + Hover consanguin:** Ligne rouge (Phase 3.2.2)
- [ ] Relâcher crée lien partner (avec child)

#### 4.4 Popup édition
- [ ] Click Settings widget → Dialog modal
- [ ] Formulaire avec tous champs (name, sex, age, yob, etc.)
- [ ] **Sex change:** Disabled si déjà parent (Phase 3.1.5 - `canChangeSex()`)
- [ ] **Sex change:** Toujours permis si sex='U'
- [ ] Validation `validate_age_yob()` sur save
- [ ] Rebuild après save

#### 4.5 Zoom & Pan
- [ ] Zoom molette souris (si `zoomSrc` includes 'wheel')
- [ ] Zoom boutons +/- (si `zoomSrc` includes 'button')
- [ ] Limites zoom (`zoomIn`, `zoomOut`)
- [ ] Pan (drag background)
- [ ] Position/zoom persistés dans cache (pedcache)
- [ ] "Fit to screen" button
- [ ] Fullscreen mode

---

### 💾 **GROUPE 5: IMPORT/EXPORT - Formats Fichiers** (MOYEN)

#### 5.1 Import
- [ ] **PED format** (BOADICEA import v4.0)
- [ ] **GEDCOM format**
- [ ] **CanRisk format** (v2.0)
- [ ] **JSON** (dataset brut)
- [ ] Load from file input
- [ ] Parsing correct des champs
- [ ] Validation après import

#### 5.2 Export
- [ ] **Save as PED**
- [ ] **Save as GEDCOM**
- [ ] **Save as CanRisk**
- [ ] **Save as JSON**
- [ ] **Download SVG**
- [ ] **Download PNG**
- [ ] **Print** (window.print avec styles)
- [ ] Noms fichiers avec timestamp

---

### ↩️ **GROUPE 6: UNDO/REDO - Pedcache** (MOYEN)

#### 6.1 Cache storage
- [ ] **localStorage** (primary, si disponible)
- [ ] **sessionStorage** (si `store_type='session'`)
- [ ] **Array fallback** (si pas de storage browser)
- [ ] LRU eviction (max 500 entries en array mode)
- [ ] Sérialisation correcte (pas de refs circulaires)
- [ ] Clés préfixées par `targetDiv` (namespace)

#### 6.2 Undo/Redo operations
- [ ] Bouton Undo visible (si `#fullscreen` existe)
- [ ] Bouton Redo visible
- [ ] Undo restaure état précédent
- [ ] Redo restaure état suivant
- [ ] Historique max 25 états (localStorage)
- [ ] Historique max 500 états (array)
- [ ] Position/zoom restaurés avec undo/redo

#### 6.3 Cache operations
- [ ] `pedcache.current(opts)` - État actuel
- [ ] `pedcache.add(opts)` - Ajouter état
- [ ] `pedcache.undo(opts)` - Retour arrière
- [ ] `pedcache.redo(opts)` - Aller avant
- [ ] `pedcache.clear(opts)` - Effacer historique
- [ ] `pedcache.nstore(opts)` - Nombre états stockés

---

### ✅ **GROUPE 7: VALIDATION - Cohérence Données** (IMPORTANT)

#### 7.1 Validation pedigree
- [ ] **Sexe parents:** mother='F', father='M' (strict)
- [ ] **Parents existent:** mother/father dans dataset
- [ ] **IndivID uniques:** Pas de doublons `name`
- [ ] **Un seul FamilyID:** Pas de familles multiples
- [ ] **Relations circulaires:** Warning unconnected nodes
- [ ] Validation custom function supportée (`opts.validate`)

#### 7.2 Validation âge/yob
- [ ] `validate_age_yob(age, yob, status)` - Cohérence
- [ ] Décédé (status='1'): `year >= age + yob`
- [ ] Vivant (status='0'): `|year - (age+yob)| <= 1`
- [ ] Appelée dans popup form

#### 7.3 Sex change rules (Phase 3.1.5)
- [ ] `canChangeSex(node, dataset)` - Règles unifiées
- [ ] Toujours permis si sex='U'
- [ ] **Interdit** si déjà parent (mother/father) ET sex défini (M/F)
- [ ] Permis si pas parent
- [ ] UI reflète ces règles (disabled input)

---

### 🧬 **GROUPE 8: TWINS - Jumeaux** (MOYEN)

#### 8.1 Monozygotic twins (MZ)
- [ ] Flag `mztwin` avec ID unique
- [ ] Barre horizontale connectant twins
- [ ] Symboles adjacents automatiquement (tri)
- [ ] `getTwins()` retourne tous twins MZ d'une personne

#### 8.2 Dizygotic twins (DZ)
- [ ] Flag `dztwin` avec ID unique
- [ ] Ligne en V connectant twins
- [ ] Symboles adjacents
- [ ] `getTwins()` retourne tous twins DZ

#### 8.3 Twins operations
- [ ] `getUniqueTwinID()` - Génère ID unique
- [ ] `setMzTwin()` - Assigne twins MZ
- [ ] `checkTwins()` - Nettoyage twins orphelins après delete

---

### 🎯 **GROUPE 9: EDGE CASES - Cas Spéciaux** (FAIBLE)

#### 9.1 Noparents flag
- [ ] `noparents: true` - Cache lignes parents (visuel seulement)
- [ ] `mother`/`father` préservés dans données
- [ ] `getChildren()` EXCLUT noparents
- [ ] `getAllChildren()` INCLUT noparents
- [ ] Brackets [ ] affichés autour adopted

#### 9.2 Hidden nodes
- [ ] `hidden: true` - Invisible (sauf DEBUG mode)
- [ ] `hidden_root` - Racine virtuelle arbre D3
- [ ] Utilisés pour structure arbre uniquement

#### 9.3 Top level
- [ ] `top_level: true` - Racines du pedigree
- [ ] Groupés par couples (partners)
- [ ] Conversion `top_level` → `noparents` si add parents

#### 9.4 Multiple pedigrees
- [ ] Plusieurs pedigrees sur même page HTML
- [ ] `targetDiv` unique pour chaque
- [ ] ClipPath IDs uniques (prefix targetDiv) 🆕
- [ ] Cache séparé par `btn_target`
- [ ] Pas d'interférence entre pedigrees

---

## 🧪 PLAN DE TESTS

### Phase 1: Tests Automatisés (npm test)
```bash
npm run build
npm test
```
**Attendu:** ~195 specs, 0 échecs

### Phase 2: Tests Manuels (exemples HTML)
- [ ] Example 1 (diabetes, session storage)
- [ ] Example 2 (cancer, local storage)
- [ ] Example 3 (twins)
- [ ] Example 4 (import/export)
- [ ] Example 5 (multiple diseases)
- [ ] Example 6 (large pedigree)
- [ ] Example 7 (GEDCOM)
- [ ] Example 8 (CanRisk)
- [ ] Example 9 (custom attributes)

### Phase 3: Tests Régression (bugfixes récents)
- [ ] addpartner() - index enfant correct (femmes)
- [ ] addpartner() - child_sex configurable
- [ ] addpartner() - create_child optional
- [ ] addpartner() - validation sexe
- [ ] addpartner() - positionnement cohérent
- [ ] ClipPath IDs - multi-pedigree sans collision
- [ ] Brackets adopted - scaling correct

### Phase 4: Tests Performance
- [ ] 10 personnes: < 10ms rebuild
- [ ] 50 personnes: < 30ms rebuild
- [ ] 100 personnes: < 100ms rebuild

---

## 📊 CHECKLIST COMPLÈTE

**Total features:** ~120+ fonctionnalités à tester

### Priorités
- 🔴 **CRITIQUE (P0):** 35 features - CORE, CRUD, Rendu SVG basique
- 🟡 **IMPORTANT (P1):** 40 features - UI interactions, Validation
- 🟢 **MOYEN (P2):** 30 features - Import/Export, Undo/Redo
- ⚪ **FAIBLE (P3):** 15 features - Edge cases, Twins

---

## 🎯 MÉTHODOLOGIE

1. **Build & Tests auto** - Vérifier compilation et tests Jasmine
2. **Tests manuels** - Ouvrir chaque example, tester interactions
3. **Tests régression** - Vérifier bugfixes récents
4. **Tests performance** - Mesurer temps rebuild
5. **Rapport final** - Compiler résultats dans ce document

---

**Status:** 🔄 EN COURS
**Dernière mise à jour:** 2025-11-19
