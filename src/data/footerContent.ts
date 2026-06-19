/** Contenu des pages d'information accessibles depuis le pied de page. */

export interface InfoPage {
  title: string;
  paragraphs: string[];
}

export const footerContent: Record<string, InfoPage> = {
  "#about": {
    title: "Notre histoire",
    paragraphs: [
      "ShopTaSapp est née d'une idée simple : proposer un vestiaire masculin de qualité, intemporel et accessible, sans céder à la surconsommation.",
      "Nos collections sont pensées pour durer, avec des matières sélectionnées avec soin et des coupes étudiées pour tous les jours.",
      "Basée en France, l'équipe ShopTaSapp réunit des passionnés de mode et de service client, déterminés à offrir une expérience d'achat simple et agréable.",
    ],
  },
  "#stores": {
    title: "Nos boutiques",
    paragraphs: [
      "Retrouvez ShopTaSapp dans nos boutiques de Paris, Lyon, Bordeaux et Lille, du lundi au samedi de 10h à 19h.",
      "Le retrait en boutique de vos commandes en ligne est disponible gratuitement, généralement sous 2 heures.",
    ],
  },
  "#careers": {
    title: "Carrières",
    paragraphs: [
      "Envie de rejoindre l'aventure ShopTaSapp ? Nous recrutons régulièrement en boutique, en logistique et au siège.",
      "Envoyez votre candidature à recrutement@shoptasapp.com — nous étudions chaque profil avec attention.",
    ],
  },
  "#shipping": {
    title: "Livraison & retours",
    paragraphs: [
      "Nous proposons plusieurs modes de livraison : Colissimo à domicile, Mondial Relay en point relais, Chronopost express 24h et le retrait gratuit en boutique.",
      "Les frais varient selon le mode choisi et sont affichés au moment du paiement. La livraison est offerte en retrait boutique.",
      "Vous disposez de 30 jours pour retourner un article non porté. Les retours sont gratuits depuis un point relais.",
    ],
  },
  "#sizes": {
    title: "Guide des tailles",
    paragraphs: [
      "Nos vêtements taillent normalement. En cas de doute entre deux tailles, nous recommandons de choisir la taille supérieure pour plus de confort.",
      "Hauts : S (36-38), M (40-42), L (44-46), XL (48-50), XXL (52-54).",
      "Chaussures : pointures européennes du 40 au 45. Les ceintures sont indiquées en centimètres de tour de taille.",
    ],
  },
  "#contact": {
    title: "Nous contacter",
    paragraphs: [
      "Notre service client est disponible du lundi au vendredi de 9h à 18h.",
      "Par e-mail : support@shoptasapp.com — réponse sous 24h ouvrées.",
      "Par téléphone : 01 23 45 67 89 (appel non surtaxé).",
    ],
  },
  "#terms": {
    title: "Conditions générales de vente",
    paragraphs: [
      "Les présentes conditions régissent les ventes réalisées sur ShopTaSapp. Toute commande implique l'acceptation pleine et entière de ces conditions.",
      "Les prix sont indiqués en euros toutes taxes comprises. ShopTaSapp se réserve le droit de modifier ses prix à tout moment, les articles étant facturés sur la base des tarifs en vigueur au moment de la commande.",
      "Le paiement est exigible à la commande. Les produits demeurent la propriété de ShopTaSapp jusqu'au paiement intégral.",
    ],
  },
  "#privacy": {
    title: "Politique de confidentialité",
    paragraphs: [
      "ShopTaSapp s'engage à protéger vos données personnelles, traitées conformément au RGPD.",
      "Les informations collectées (nom, e-mail, adresse de livraison) servent uniquement au traitement de vos commandes et à l'amélioration de nos services.",
      "Vous disposez d'un droit d'accès, de rectification et de suppression de vos données en écrivant à privacy@shoptasapp.com.",
    ],
  },
  "#cookies": {
    title: "Gestion des cookies",
    paragraphs: [
      "Nous utilisons des cookies essentiels au fonctionnement du site (panier, session) ainsi que des cookies de mesure d'audience anonymisés.",
      "Vous pouvez configurer vos préférences à tout moment depuis votre navigateur. Le refus des cookies non essentiels n'affecte pas votre navigation.",
    ],
  },
};
