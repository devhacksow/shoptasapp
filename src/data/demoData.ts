import type { FooterLinkGroup, SocialLink } from "../domain/types";

/** Groupes de liens du pied de page. */
export const footerGroups: FooterLinkGroup[] = [
  {
    label: "À propos",
    links: [
      { label: "Notre histoire", href: "#about" },
      { label: "Boutiques", href: "#stores" },
      { label: "Carrières", href: "#careers" },
    ],
  },
  {
    label: "Aide",
    links: [
      { label: "Livraison & retours", href: "#shipping" },
      { label: "Guide des tailles", href: "#sizes" },
      { label: "Nous contacter", href: "#contact" },
    ],
  },
  {
    label: "Mentions légales",
    links: [
      { label: "Conditions générales", href: "#terms" },
      { label: "Confidentialité", href: "#privacy" },
      { label: "Cookies", href: "#cookies" },
    ],
  },
];

/** Liens vers les réseaux sociaux. */
export const socialLinks: SocialLink[] = [
  { platform: "Instagram", href: "#instagram" },
  { platform: "Facebook", href: "#facebook" },
  { platform: "TikTok", href: "#tiktok" },
  { platform: "Pinterest", href: "#pinterest" },
];
