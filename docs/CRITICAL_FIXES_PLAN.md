## Plan d'actions — Correctifs critiques PedigreeJS

### Historique des actions
- **2025-02-15** : extraction des helpers d’ajout (`addchild`, `addsibling`, `addparents`, `addpartner`) dans `es/widgets-add.js`.
- **2025-02-15** : extraction de `delete_node_dataset` et des auxiliaires vers `es/widgets-delete.js`.

### 1. Séparer les responsabilités du module `widgets`
- **Constat** : `es/widgets.js` concentre la logique UI, les mutations dataset et divers helpers (>800 LOC).
- **Actions** :
  1. Extraire les opérations “ajout” (enfant/fratrie/parents/partenaire) dans un sous-modules `widgets/add-person.js`.
  2. Déplacer la suppression (`delete_node_dataset`) et la logique ancêtres dans `widgets/delete.js`.
  3. Laisser `addWidgets` orchestrer l’UI et consommer ces helpers.
- **Livrable** : modules séparés, imports/exports mis à jour, lint/tests verts.

### 2. Couvrir les chemins UI critiques par des tests dédiés
- **Constat** : peu de specs ciblent les helpers `widgets`.
- **Actions** :
  1. Ajouter des tests Jasmine pour `addpartner`, `delete_node_dataset` (scénario simple), drag consanguin (logique dataset).
  2. Exploiter les nouveaux sous-modules pour isoler les fonctions.
- **Livrable** : suites `widgets_spec` enrichies, documentation des cas couverts.

### 3. Réduire le couplage global (`utils.roots` / événements)
- **Constat** : `utils.roots` et `$(document).trigger('rebuild')` sont utilisés partout.
- **Actions** :
  1. Introduire un “PedigreeRuntime” (ou service) qui encapsule root, dataset courant et émet des événements explicites.
  2. Mettre à jour les modules majeurs pour utiliser ce service.
- **Livrable** : API documentée, dépendances explicites, compatibilité assurée (wrapper temporaire).

### 4. Amorcer la dé-jQueryisation
- **Constat** : jQuery/jQuery UI restent omniprésents (dialogs, sélection DOM).
- **Actions** :
  1. Créer une couche d’abstraction (`ui/dialogs.js`, `dom/query.js`) permettant d’utiliser des Web APIs natives.
  2. Migrer progressivement les modules critiques (messages, widgets) vers ces helpers.
- **Livrable** : premières zones sans jQuery, documentation pour contributeurs.

### 5. Optimiser `pedcache`
- **Constat** : sérialisation complète à chaque action, stockage massif.
- **Actions** :
  1. Ajouter des métriques (taille moyenne, durée d’écriture).
  2. Étudier une stratégie “delta” ou compression (ex. LZ-string) avec garde-fous.
- **Livrable** : RFC technique + prototype optionnel, documentation des limites.

### 6. Documenter et durcir l’import CanRisk/BOADICEA
- **Constat** : parser complexe sans doc utilisateur ni validations fines.
- **Actions** :
  1. Rédiger un guide d’import (mapping colonnes / versions) dans `docs/`.
  2. Ajouter des validations explicites (nombre de colonnes, valeurs attendues) + tests.
- **Livrable** : documentation + specs, messages d’erreur détaillés.

### Ordonnancement
1. Séparer `widgets` + tests (dépendance forte aux autres actions).
2. Service runtime / événementiel.
3. Dé-jQueryisation progressive (sur la base du service).
4. Optimisations `pedcache` (après instrumentation).
5. Documentation / validations CanRisk (en parallèle).
