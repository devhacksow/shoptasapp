// Configuration du serveur. En production, les secrets DOIVENT provenir de
// variables d'environnement et ne jamais être commités.
export const PORT = process.env.PORT || 3001;
export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
export const TOKEN_TTL = "7d";

// Compte administrateur amorcé au démarrage.
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@shoptasapp.com";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin1234";

// Configuration SMTP pour les e-mails (facultative — sinon repli console).
export const SMTP = {
  host: process.env.SMTP_HOST || "",
  port: Number(process.env.SMTP_PORT || 587),
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  from: process.env.MAIL_FROM || "ShopTaSapp <no-reply@shoptasapp.com>",
};

// Identifiant client Google OAuth (facultatif — connexion Google désactivée si absent).
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

// Stripe (paiements réels). Sans clé, le paiement Stripe est désactivé.
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
// URL du front pour les redirections après paiement.
export const APP_URL = process.env.APP_URL || "http://localhost:5173";
