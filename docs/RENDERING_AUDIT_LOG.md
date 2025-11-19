# Rendu Graphique · Journal de suivi (2025-XX-XX)

Ce document récapitule les corrections appliquées au pipeline graphique de PedigreeJS afin de garantir un rendu SVG cohérent, accessible et exportable.

## 1. Infrastructure SVG

- **Identification des formes** : ajout de la classe `.person-shape` sur les paths D3 afin que les thèmes puissent cibler précisément la forme sans écraser les bordures pilotées par les données (`es/pedigree.js`).
- **Attributs data-*** : nettoyage systématique des attributs `data-*` associés aux maladies et à l’état (`data-affected`, `data-pancreatic-cancer`, etc.) pour éviter les artefacts lors d’une suppression de valeur.
- **ClipPath sûrs** : génération d’identifiants sanitizés et uniques pour les `clipPath`, garantissant l’import/export de plusieurs pedigrees sur la même page sans collisions.

## 2. Constantes de rendu prises en compte

- `HIDDEN_NODE_SIZE_FACTOR`, `TWIN_BAR_LENGTH_DIVISOR`, `PIE_*` et `CHILD_LINK_FORK_OFFSET` influencent désormais réellement les paths D3.
- Les labels utilisent `LABEL_FONT_SIZE`, `LABEL_Y_OFFSET_FACTOR` et `MZ_LABEL_FONT_SIZE`; un indicateur « MZ » est tracé pour les jumeaux monozygotes.

## 3. Effets visuels & interactions

- Survols : uniquement un drop shadow (plus de scale) afin d’éviter les jitters lors des rebuilds/déplacements.
- `enhancePersonNodes` nettoie ses listeners avant réattachement et n’applique les dégradés qu’aux `.person-shape`, en laissant les couleurs de bordure définies dans `pedigree.js`.
- Particules et gradients sont injectés une seule fois par canvas, puis réappliqués après chaque rebuild.

## 4. Avertissements & accessibilité

- Le bandeau signalant les clashes partenaires est rendu en pur SVG et repositionné automatiquement via `init_zoom`, ce qui le maintient lisible lors des zooms/pans et dans les exports.

## 5. Export SVG/PNG

- L’export PNG sérialise un clone du SVG avec styles inline et indique explicitement les échecs liés au CORS/tainted canvas.
- Les exports restent ainsi fidèles aux couleurs appliquées par la feuille de style active (y compris thèmes custom).

## 6. Styles de secours

- `critical-fixes.css` est désormais opt-in (`body.critical-fixes`) pour ne pas écraser la charte graphique par défaut lorsqu’il n’est pas nécessaire.

## 7. Tests

- Chaque rafale de corrections est validée via `npm run build`. Un contrôle manuel du rendu (hover, warning, export PNG) est recommandé à chaque intégration majeure.

---

Pour toute investigation complémentaire (nouveau thème, mode contrasté, support multi-pedigree), ajouter l’entrée correspondante à ce journal afin de conserver l’historique des décisions et des impacts sur le rendu.
