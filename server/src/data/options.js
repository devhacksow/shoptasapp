// Modes de livraison et de paiement proposés au checkout.

export const deliveryMethods = [
  {
    id: "colissimo",
    label: "Colissimo — livraison à domicile",
    priceCents: 490,
    delay: "2 à 3 jours ouvrés",
  },
  {
    id: "mondial_relay",
    label: "Mondial Relay — point relais",
    priceCents: 350,
    delay: "3 à 5 jours ouvrés",
  },
  {
    id: "chronopost",
    label: "Chronopost — express 24h",
    priceCents: 990,
    delay: "Livraison en 24h",
  },
  {
    id: "retrait",
    label: "Retrait en boutique",
    priceCents: 0,
    delay: "Disponible sous 2h",
  },
];

export const paymentMethods = [
  { id: "cb", label: "Carte bancaire" },
  { id: "paypal", label: "PayPal" },
  { id: "applepay", label: "Apple Pay" },
  { id: "virement", label: "Virement bancaire" },
];

export const deliveryById = (id) => deliveryMethods.find((d) => d.id === id);
export const paymentById = (id) => paymentMethods.find((p) => p.id === id);
