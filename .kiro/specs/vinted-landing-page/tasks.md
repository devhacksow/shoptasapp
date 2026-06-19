# Implementation Plan: Vinted Landing Page

## Overview

Le plan d'implémentation construit la landing page de façon incrémentale : d'abord l'échafaudage du projet React + TypeScript + Vite et les modèles de données typés, puis la couche de logique pure (testée par propriétés au plus près de son implémentation), ensuite les données de démonstration, le hook d'état, les composants de présentation, et enfin le câblage final dans l'application racine. Chaque étape s'appuie sur la précédente, sans code orphelin. Les sous-tâches de test sont marquées « * » (optionnelles).

## Tasks

- [ ] 1. Échafauder le projet et les fondations
  - [ ] 1.1 Initialiser le projet React + TypeScript + Vite
    - Créer la structure de dossiers : `src/domain/`, `src/state/`, `src/components/`, `src/data/`, `src/styles/`
    - Configurer Vite, TypeScript (mode strict) et Vitest + fast-check + Testing Library
    - Définir les variables CSS globales : `--breakpoint-md: 768px`, taille de police de base ≥ 14px
    - _Requirements: 8.6_

  - [ ] 1.2 Définir les modèles de données et types
    - Écrire les interfaces `Item`, `Category`, `FooterLinkGroup`, `SocialLink` dans `src/domain/types.ts`
    - Écrire le type discriminé `GridMode` et le type `SearchValidation`
    - _Requirements: 5.2, 4.1, 7.1, 7.2_

- [ ] 2. Implémenter la couche de logique pure (domain)
  - [ ] 2.1 Implémenter `searchItems`
    - Filtrer les items dont le titre ou la marque contient le terme (sous-chaîne, insensible à la casse) ; terme vide ou blanc → tous les items, ordre conservé
    - _Requirements: 2.2, 2.4_

  - [ ]* 2.2 Écrire le test de propriété pour `searchItems` (justesse/complétude)
    - **Property 1: Justesse et complétude de la recherche**
    - **Validates: Requirements 2.2**

  - [ ]* 2.3 Écrire le test de propriété pour `searchItems` (recherche blanche)
    - **Property 2: Une recherche vide ou blanche renvoie tous les items**
    - **Validates: Requirements 2.4**

  - [ ] 2.4 Implémenter `validateSearchTerm`
    - Renvoyer `tooLong` si longueur > 100, sinon `valid` avec terme normalisé
    - _Requirements: 2.5_

  - [ ]* 2.5 Écrire le test de propriété pour `validateSearchTerm`
    - **Property 3: Validation de la longueur du terme de recherche**
    - **Validates: Requirements 2.5**

  - [ ] 2.6 Implémenter `filterByCategory`
    - `categoryId` null → tous les items ; sinon items dont `categoryId` correspond
    - _Requirements: 4.2_

  - [ ]* 2.7 Écrire le test de propriété pour `filterByCategory`
    - **Property 5: Justesse et complétude du filtre par catégorie**
    - **Validates: Requirements 4.2**

  - [ ] 2.8 Implémenter `toggleCategory`
    - Renvoyer `null` si la catégorie cliquée est déjà active, sinon la catégorie cliquée
    - _Requirements: 4.4, 4.5_

  - [ ]* 2.9 Écrire le test de propriété pour `toggleCategory`
    - **Property 6: La bascule de catégorie garde au plus une catégorie active et réinitialise à la réactivation**
    - **Validates: Requirements 4.4, 4.5**

  - [ ] 2.10 Implémenter `formatPrice` et `copyrightYear`
    - `formatPrice` : centimes → chaîne d'affichage non vide (ex. "12,00 €")
    - `copyrightYear` : date → chaîne de 4 chiffres égale à l'année
    - _Requirements: 5.2, 7.3_

  - [ ]* 2.11 Écrire le test de propriété pour `copyrightYear`
    - **Property 8: Format de l'année de copyright**
    - **Validates: Requirements 7.3**

  - [ ]* 2.12 Écrire les tests unitaires pour `formatPrice`
    - Vérifier prix non vide, zéro, grandes valeurs
    - _Requirements: 5.2_

- [ ] 3. Créer le jeu de données de démonstration
  - [ ] 3.1 Écrire les données de catégories et d'items de démonstration
    - Fournir entre 5 et 20 catégories à libellé non vide (≤ 40 caractères) et visuel non vide
    - Fournir au moins 8 items à champs non vides ; chaque catégorie affichée référencée par au moins un item ; au moins une catégorie sans item (pour R4.3)
    - _Requirements: 4.1, 5.1_

  - [ ]* 3.2 Écrire le test de propriété sur les invariants des catégories
    - **Property 4: Invariants du jeu de catégories**
    - **Validates: Requirements 4.1**

- [ ] 4. Checkpoint - logique pure et données
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implémenter la couche d'état
  - [ ] 5.1 Implémenter le hook `useLandingState`
    - Centraliser `searchTerm`, `activeCategory`, `visibleItems`, `searchError`
    - Exposer `submitSearch`, `selectCategory`, `resetFilters` en composant `validateSearchTerm`, `searchItems`, `filterByCategory`, `toggleCategory`
    - Dériver `GridMode` pour la grille (items / few / empty / noResults)
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 4.2, 4.3, 4.5, 5.6, 5.7_

  - [ ]* 5.2 Écrire les tests unitaires pour `useLandingState`
    - Recherche sans résultat conserve le terme (R2.3), catégorie vide (R4.3), réactivation réinitialise (R4.5), modes peu/aucun item (R5.6, R5.7)
    - _Requirements: 2.3, 4.3, 4.5, 5.6, 5.7_

- [ ] 6. Implémenter les utilitaires de défilement
  - [ ] 6.1 Implémenter `scrollToTop` et `scrollToSellCta`
    - Défilement fluide vers le haut ; vers la cible `Sell_CTA` ; renvoyer `false` si cible introuvable
    - _Requirements: 1.6, 3.4, 3.5_

  - [ ]* 6.2 Écrire les tests unitaires pour les utilitaires de défilement
    - Cible présente vs absente, retour `false` quand introuvable
    - _Requirements: 1.6, 3.4, 3.5_

- [ ] 7. Implémenter les composants de présentation des articles
  - [ ] 7.1 Implémenter `ItemCard`
    - Afficher image (avec fallback `onError`), titre, marque, taille, prix formaté ; effet de survol CSS
    - _Requirements: 5.2, 5.5, 5.8_

  - [ ]* 7.2 Écrire le test de propriété pour `ItemCard`
    - **Property 7: Complétude du rendu d'une Item_Card**
    - **Validates: Requirements 5.2**

  - [ ]* 7.3 Écrire les tests unitaires/snapshot pour `ItemCard`
    - Fallback d'image (R5.8), effet de survol (R5.5)
    - _Requirements: 5.5, 5.8_

  - [ ] 7.4 Implémenter `ListingGrid`
    - Sélectionner l'affichage selon `GridMode` (cartes, « peu d'articles », « aucun article », « aucun article trouvé »)
    - Disposition responsive : 1 colonne < 768 px, ≥ 3 colonnes ≥ 768 px
    - _Requirements: 5.1, 5.3, 5.4, 5.6, 5.7, 2.3, 4.3_

  - [ ]* 7.5 Écrire les tests de mise en page pour `ListingGrid`
    - Colonnes responsives (R5.3, R5.4), messages d'état (R2.3, R4.3, R5.6, R5.7)
    - _Requirements: 5.3, 5.4, 2.3, 4.3, 5.6, 5.7_

- [ ] 8. Implémenter les composants de navigation et de recherche
  - [ ] 8.1 Implémenter `SearchComponent`
    - Champ avec placeholder « Rechercher des articles », affichage d'erreur de longueur, soumission
    - _Requirements: 2.1, 2.5_

  - [ ] 8.2 Implémenter `NavigationBar`
    - Logo, recherche, boutons « Vends tes articles » et « S'inscrire / Se connecter », position fixe
    - Menu compact (burger) < 768 px avec bascule ouvert/fermé ; navigation étendue ≥ 768 px
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 8.1, 8.4, 8.5_

  - [ ]* 8.3 Écrire le test de propriété pour la bascule du menu compact
    - **Property 9: La bascule du menu compact est involutive**
    - **Validates: Requirements 8.5**

  - [ ]* 8.4 Écrire les tests unitaires/mise en page pour la navigation
    - Libellés des boutons (R1.3, R1.4), placeholder (R2.1), barre fixe (R1.5), menu compact vs étendu (R8.1, R8.4)
    - _Requirements: 1.3, 1.4, 2.1, 1.5, 8.1, 8.4_

- [ ] 9. Implémenter les sections hero, vente et pied de page
  - [ ] 9.1 Implémenter `HeroSection`
    - Titre (1–80), sous-titre (1–160), CTA principal unique déclenchant `scrollToSellCta` ; indication visuelle si cible absente
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 9.2 Implémenter `SellCTA`
    - Titre (1–80), 2 à 5 étapes ordonnées, bouton « Commence à vendre » redirigeant vers le parcours de vente
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 9.3 Implémenter `CategorySection`
    - Liste des catégories avec indication visuelle d'une seule catégorie active
    - _Requirements: 4.1, 4.4_

  - [ ] 9.4 Implémenter `Footer`
    - Groupes « À propos », « Aide », « Mentions légales » ; 1 à 6 liens sociaux ; copyright via `copyrightYear` ; message d'erreur si ressource indisponible
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 9.5 Écrire les tests unitaires pour hero, vente et footer
    - Titres/sous-titres (R3.1, R3.2, R6.1), étapes (R6.3), redirection (R6.4), groupes/liens footer (R7.1, R7.2, R7.4), ressource indisponible (R7.5)
    - _Requirements: 3.1, 3.2, 6.1, 6.3, 6.4, 7.1, 7.2, 7.4, 7.5_

- [ ] 10. Câbler l'application et la mise en page responsive
  - [ ] 10.1 Assembler l'application racine
    - Composer `App` : charger les données de démonstration, instancier `useLandingState`, brancher tous les composants et les utilitaires de défilement
    - Connecter recherche, sélection de catégorie et grille de bout en bout
    - _Requirements: 1.1, 2.2, 3.4, 4.2, 5.1, 6.4, 7.3_

  - [ ] 10.2 Finaliser la mise en page responsive globale
    - Absence de défilement horizontal entre 320 et 1920 px ; `max-width: 100%` des images ; police ≥ 14 px
    - _Requirements: 8.2, 8.3, 8.6_

  - [ ]* 10.3 Écrire les tests de mise en page responsive globaux
    - Pas de défilement horizontal (R8.2), contrainte largeur images (R8.3), taille de police (R8.6)
    - _Requirements: 8.2, 8.3, 8.6_

- [ ] 11. Checkpoint final - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Les tâches marquées « * » sont optionnelles (tests) et peuvent être ignorées pour un MVP plus rapide.
- Chaque tâche référence des critères d'acceptation spécifiques pour la traçabilité.
- Les tests de propriétés (fast-check, `numRuns: 100`) valident les 9 propriétés de correction de la logique pure ; ils sont placés au plus près de leur implémentation.
- Les critères purement présentation/CSS (responsive, survol, barre fixe) sont validés par des tests de mise en page et de snapshot, pas par des tests de propriétés.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "2.4", "2.6", "2.8", "2.10", "3.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.5", "2.7", "2.9", "2.11", "2.12", "3.2", "5.1", "6.1"] },
    { "id": 4, "tasks": ["5.2", "6.2", "7.1", "8.1", "9.1", "9.2", "9.3", "9.4"] },
    { "id": 5, "tasks": ["7.2", "7.3", "7.4", "8.2", "9.5"] },
    { "id": 6, "tasks": ["7.5", "8.3", "8.4", "10.1"] },
    { "id": 7, "tasks": ["10.2"] },
    { "id": 8, "tasks": ["10.3"] }
  ]
}
```
