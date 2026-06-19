# Requirements Document

## Introduction

Cette fonctionnalité consiste à créer une landing page de type Vinted : une marketplace de vente et d'achat d'articles d'occasion (vêtements, accessoires, etc.). La page doit refléter l'identité visuelle et l'expérience de Vinted, avec un en-tête de navigation contenant une recherche, une section hero mettant en avant la proposition de valeur, une exploration par catégories, une grille de listings d'articles, un appel à l'action pour vendre, et un pied de page. La landing page est responsive et fonctionne comme une vitrine statique côté front-end (les données d'articles sont des données de démonstration), sans back-end ni authentification dans ce périmètre.

## Glossary

- **Landing_Page** : La page web unique présentant la marketplace de seconde main au visiteur.
- **Navigation_Bar** : La barre de navigation fixée en haut de la Landing_Page contenant le logo, la recherche, et les actions principales.
- **Search_Component** : Le champ de recherche permettant de saisir un terme pour filtrer les articles affichés.
- **Hero_Section** : La section principale en haut de page présentant la proposition de valeur et un appel à l'action.
- **Category_Section** : La section affichant la liste des catégories d'articles navigables.
- **Listing_Grid** : La grille affichant les cartes d'articles (Item_Card) proposés à la vente.
- **Item_Card** : Une carte individuelle représentant un article, affichant image, titre, marque, taille et prix.
- **Item** : Un article de démonstration comportant un identifiant, un titre, une marque, une taille, un prix, et une image.
- **Sell_CTA** : La section d'appel à l'action invitant le visiteur à mettre un article en vente.
- **Footer** : Le pied de page contenant les liens secondaires, informations légales et liens sociaux.
- **Visitor** : Une personne consultant la Landing_Page sans être authentifiée.
- **Viewport** : La zone d'affichage du navigateur, dont la largeur détermine la mise en page responsive.

## Requirements

### Requirement 1: Barre de navigation

**User Story:** En tant que Visitor, je veux une barre de navigation claire en haut de la page, afin d'accéder rapidement aux actions principales de la marketplace.

#### Acceptance Criteria

1. WHEN la Landing_Page est chargée, THE Navigation_Bar SHALL afficher le logo de la marketplace en haut du Viewport.
2. WHEN la Landing_Page est chargée, THE Navigation_Bar SHALL afficher le Search_Component.
3. WHEN la Landing_Page est chargée, THE Navigation_Bar SHALL afficher un bouton libellé "Vends tes articles".
4. WHEN la Landing_Page est chargée, THE Navigation_Bar SHALL afficher un bouton libellé "S'inscrire / Se connecter".
5. WHILE le Visitor fait défiler la Landing_Page verticalement, THE Navigation_Bar SHALL rester fixée en haut du Viewport et demeurer entièrement visible (aucune partie masquée).
6. WHEN le Visitor active le logo de la marketplace, THE Landing_Page SHALL défiler jusqu'à la position verticale 0 (haut de page) en 1 seconde ou moins.

### Requirement 2: Recherche d'articles

**User Story:** En tant que Visitor, je veux rechercher des articles par mot-clé, afin de trouver les produits qui m'intéressent.

#### Acceptance Criteria

1. WHILE le champ de recherche du Search_Component ne contient aucun caractère, THE Search_Component SHALL afficher un texte indicatif "Rechercher des articles".
2. WHEN le Visitor saisit un terme de recherche d'une longueur comprise entre 1 et 100 caractères et soumet la recherche, THE Listing_Grid SHALL afficher en moins de 2 secondes uniquement les Item dont le titre ou la marque contient le terme saisi en tant que sous-chaîne, sans tenir compte de la casse.
3. IF aucun Item ne correspond au terme de recherche soumis, THEN THE Listing_Grid SHALL afficher un message "Aucun article trouvé" tout en conservant le terme saisi dans le Search_Component.
4. WHEN le Visitor soumet une recherche dont le champ est vide ou ne contient que des caractères d'espacement, THE Listing_Grid SHALL afficher l'ensemble des Item disponibles.
5. IF le terme de recherche soumis dépasse 100 caractères, THEN THE Search_Component SHALL empêcher la soumission, conserver le texte saisi et afficher un message indiquant que la longueur maximale autorisée de 100 caractères est dépassée.

### Requirement 3: Section Hero

**User Story:** En tant que Visitor, je veux une section hero accrocheuse, afin de comprendre immédiatement la proposition de valeur de la marketplace.

#### Acceptance Criteria

1. WHEN la Landing_Page finit de charger, THE Hero_Section SHALL afficher un titre présentant la proposition de valeur de la marketplace, d'une longueur comprise entre 1 et 80 caractères.
2. WHEN la Landing_Page finit de charger, THE Hero_Section SHALL afficher un sous-titre d'une longueur comprise entre 1 et 160 caractères et un unique bouton d'appel à l'action principal.
3. WHEN la Landing_Page finit de charger, THE Hero_Section SHALL être entièrement visible sans défilement (au-dessus de la ligne de flottaison) sur des hauteurs de fenêtre d'affichage comprises entre 600 et 1080 pixels.
4. WHEN le Visitor active le bouton d'appel à l'action principal de la Hero_Section, THE Landing_Page SHALL faire défiler de manière fluide jusqu'à ce que la Sell_CTA soit visible, en moins de 1000 millisecondes.
5. IF la Sell_CTA est absente ou introuvable au moment de l'activation du bouton d'appel à l'action principal, THEN THE Landing_Page SHALL conserver la position de défilement courante et afficher une indication visuelle signalant que la cible est indisponible.

### Requirement 4: Navigation par catégories

**User Story:** En tant que Visitor, je veux explorer les articles par catégorie, afin de parcourir plus facilement les types de produits disponibles.

#### Acceptance Criteria

1. WHEN le Visitor ouvre la page d'accueil, THE Category_Section SHALL afficher entre cinq et vingt catégories d'articles, chacune comportant un libellé textuel non vide d'au plus 40 caractères et au moins une représentation visuelle (icône ou image) non vide.
2. WHEN le Visitor active une catégorie de la Category_Section, THE Listing_Grid SHALL afficher en moins de 2 secondes uniquement les Item appartenant à la catégorie sélectionnée.
3. IF la catégorie sélectionnée ne contient aucun Item, THEN THE Listing_Grid SHALL afficher un message indiquant l'absence d'Item pour cette catégorie et SHALL conserver la Category_Section visible.
4. WHILE une catégorie est sélectionnée, THE Category_Section SHALL indiquer visuellement comme active une seule et unique catégorie, distincte des catégories non sélectionnées.
5. WHEN le Visitor active à nouveau la catégorie déjà sélectionnée, THE Listing_Grid SHALL afficher en moins de 2 secondes l'ensemble des Item disponibles.

### Requirement 5: Grille de listings d'articles

**User Story:** En tant que Visitor, je veux voir une grille d'articles disponibles, afin de découvrir les produits proposés à la vente.

#### Acceptance Criteria

1. WHEN la Landing_Page termine son chargement initial et qu'au moins huit Item sont disponibles, THE Listing_Grid SHALL afficher au minimum huit Item_Card dans un délai de 3 secondes.
2. WHEN une Item_Card est affichée, THE Item_Card SHALL afficher l'image, le titre, la marque, la taille et le prix de l'Item correspondant, chacun renseigné avec une valeur non vide.
3. WHILE le Viewport a une largeur inférieure à 768 pixels, THE Listing_Grid SHALL afficher les Item_Card sur une seule colonne.
4. WHILE le Viewport a une largeur supérieure ou égale à 768 pixels, THE Listing_Grid SHALL afficher les Item_Card sur au moins trois colonnes.
5. WHEN le Visitor survole une Item_Card, THE Item_Card SHALL afficher un changement d'état visuel (par exemple élévation ou bordure de mise en évidence) par rapport à son état au repos dans un délai de 200 millisecondes.
6. IF moins de huit Item sont disponibles au chargement initial de la Landing_Page, THEN THE Listing_Grid SHALL afficher une Item_Card pour chaque Item disponible et un message indiquant le nombre limité d'articles.
7. IF aucun Item n'est disponible au chargement initial de la Landing_Page, THEN THE Listing_Grid SHALL afficher un message indiquant l'absence d'articles, sans afficher d'Item_Card.
8. IF l'image d'un Item est indisponible, THEN THE Item_Card SHALL afficher une image de remplacement à la place de l'image manquante.

### Requirement 6: Appel à l'action pour vendre

**User Story:** En tant que Visitor, je veux un appel à l'action pour vendre mes articles, afin de pouvoir commencer à mettre des produits en vente.

#### Acceptance Criteria

1. WHEN le Visitor consulte la page contenant le Sell_CTA, THE Sell_CTA SHALL afficher un titre de 1 à 80 caractères décrivant l'action de mise en vente.
2. WHEN le Visitor consulte la page contenant le Sell_CTA, THE Sell_CTA SHALL afficher un bouton portant le libellé "Commence à vendre".
3. WHEN le Visitor consulte la page contenant le Sell_CTA, THE Sell_CTA SHALL afficher un texte décrivant entre 2 et 5 étapes ordonnées pour mettre un article en vente.
4. WHEN le Visitor sélectionne le bouton "Commence à vendre", THE Sell_CTA SHALL rediriger le Visitor vers le parcours de mise en vente.

### Requirement 7: Pied de page

**User Story:** En tant que Visitor, je veux un pied de page complet, afin d'accéder aux informations secondaires et aux liens utiles.

#### Acceptance Criteria

1. THE Footer SHALL afficher trois groupes de liens distincts libellés respectivement "À propos", "Aide" et "Mentions légales".
2. THE Footer SHALL afficher entre 1 et 6 liens vers des réseaux sociaux.
3. THE Footer SHALL afficher une mention de copyright contenant l'année courante du système au format à quatre chiffres (AAAA).
4. WHEN un Visitor sélectionne un lien du Footer, THE Footer SHALL afficher la page de destination associée à ce lien.
5. IF un lien du Footer pointe vers une ressource indisponible, THEN THE Footer SHALL afficher un message d'erreur indiquant que la ressource est inaccessible et conserver l'affichage du pied de page.

### Requirement 8: Affichage responsive

**User Story:** En tant que Visitor utilisant un appareil mobile ou un ordinateur, je veux une page adaptée à mon écran, afin de naviguer confortablement quelle que soit la taille de Viewport.

#### Acceptance Criteria

1. WHILE le Viewport a une largeur inférieure à 768 pixels, THE Navigation_Bar SHALL afficher un unique bouton menu donnant accès à un menu compact regroupant les actions de navigation.
2. THE Landing_Page SHALL afficher l'ensemble de son contenu sans défilement horizontal pour toute largeur de Viewport comprise entre 320 et 1920 pixels.
3. THE Landing_Page SHALL contraindre la largeur de chaque image à une valeur inférieure ou égale à la largeur du Viewport.
4. WHILE le Viewport a une largeur supérieure ou égale à 768 pixels, THE Navigation_Bar SHALL afficher ses actions de navigation sous forme étendue sans bouton menu compact.
5. WHEN le Visitor active le bouton menu compact, THE Navigation_Bar SHALL basculer l'affichage du menu compact entre l'état ouvert et l'état fermé.
6. THE Landing_Page SHALL afficher tout texte avec une taille de police d'au moins 14 pixels pour toute largeur de Viewport comprise entre 320 et 1920 pixels.
