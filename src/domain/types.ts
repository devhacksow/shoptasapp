/** Modèles de données de la boutique e-commerce. */

/** Une déclinaison (couleur + taille) d'un produit avec son stock. */
export interface Variant {
  id: string;
  color: string;
  size: string;
  stock: number;
}

/** Un produit vendu par la boutique. */
export interface Product {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  variants: Variant[];
  colors: string[];
  totalStock: number;
  inStock: boolean;
}

/** Une catégorie (rayon) du catalogue. */
export interface Category {
  id: string;
  label: string;
  visual: string;
}

/** Un groupe de liens du pied de page. */
export interface FooterLinkGroup {
  label: "À propos" | "Aide" | "Mentions légales";
  links: { label: string; href: string }[];
}

/** Un lien vers un réseau social. */
export interface SocialLink {
  platform: string;
  href: string;
}

/** Critère de tri du catalogue. */
export type SortKey = "relevance" | "priceAsc" | "priceDesc" | "nameAsc";

/** Une ligne du panier. */
export interface CartLine {
  productId: string;
  name: string;
  color: string;
  size: string;
  priceCents: number;
  quantity: number;
  imageUrl: string;
  maxStock: number;
}

/** Un mode de livraison. */
export interface DeliveryMethod {
  id: string;
  label: string;
  priceCents: number;
  delay: string;
}

/** Un mode de paiement. */
export interface PaymentMethod {
  id: string;
  label: string;
}

/** État d'affichage de la grille. */
export type GridMode =
  | { kind: "items" }
  | { kind: "empty" }
  | { kind: "noResults" };
