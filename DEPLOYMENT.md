# Déploiement ShopTaSapp — Front Vercel + Back Render

Architecture : le **front** (React/Vite) va sur **Vercel**, le **back** (Express + SQLite + Stripe)
va sur **Render**. Les deux communiquent via HTTPS.

## 1. Pousser le code sur GitHub

Depuis la racine du projet :

```bash
git init                     # si ce n'est pas déjà un dépôt
git add .
git commit -m "ShopTaSapp e-commerce"
git branch -M main
git remote add origin https://github.com/<ton-compte>/<ton-repo>.git
git push -u origin main
```

> Les secrets ne sont PAS poussés : `server/.env`, la base `server/*.db`, les `uploads/`
> et `node_modules` sont ignorés par `.gitignore`.

## 2. Déployer le back-end sur Render

1. Sur https://render.com → **New + → Web Service** (ou **Blueprint** pour lire `render.yaml`).
2. Connecte ton dépôt GitHub.
3. Réglages (si créé à la main) :
   - **Root Directory** : `server`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Health Check Path** : `/api/health`
4. **Variables d'environnement** (onglet Environment) :
   | Clé | Valeur |
   |---|---|
   | `JWT_SECRET` | une longue chaîne aléatoire |
   | `ADMIN_EMAIL` | `admin@shoptasapp.com` |
   | `ADMIN_PASSWORD` | un mot de passe fort |
   | `GOOGLE_CLIENT_ID` | ton ID client Google OAuth |
   | `STRIPE_SECRET_KEY` | `sk_test_...` (ou `sk_live_...` en prod) |
   | `DATABASE_URL` | la connection string Neon PostgreSQL |
   | `CLOUDINARY_CLOUD_NAME` | ton cloud name Cloudinary |
   | `CLOUDINARY_API_KEY` | ta clé API Cloudinary |
   | `CLOUDINARY_API_SECRET` | ton secret API Cloudinary |
   | `APP_URL` | l'URL Vercel du front (ex. `https://shoptasapp.vercel.app`) |
   | `CORS_ORIGIN` | la même URL Vercel |
   | `SMTP_*` | (facultatif) pour les e-mails réels |
5. Déploie. Note l'URL publique, ex. `https://shoptasapp-api.onrender.com`.

> **Persistance** : les données sont dans **PostgreSQL (Neon)** et les images
> dans **Cloudinary** — rien n'est stocké sur le disque du serveur, donc le
> **plan gratuit Render convient** (aucune perte de données aux redéploiements).

## 3. Déployer le front sur Vercel

1. Sur https://vercel.com → **Add New → Project** → importe le dépôt GitHub.
2. **Root Directory** : la racine du dépôt (laisser par défaut).
3. Framework détecté : **Vite** (build `npm run build`, sortie `dist`).
4. **Variable d'environnement** :
   | Clé | Valeur |
   |---|---|
   | `VITE_API_BASE_URL` | `https://shoptasapp-api.onrender.com/api` |
5. Déploie. Note l'URL, ex. `https://shoptasapp.vercel.app`.

## 4. Relier les deux

1. Sur **Render**, mets `APP_URL` et `CORS_ORIGIN` = l'URL Vercel, puis redéploie.
2. Sur **Vercel**, vérifie `VITE_API_BASE_URL` = l'URL Render + `/api`, puis redéploie.

## 5. Configurer Google et Stripe pour le domaine de prod

- **Google Cloud Console → Identifiants → ID client OAuth** :
  - Ajoute l'URL Vercel dans **Origines JavaScript autorisées**.
  - Publie l'écran de consentement (passage en *In production*) pour ouvrir à tous.
- **Stripe** :
  - Les `success_url`/`cancel_url` utilisent `APP_URL` (déjà géré).
  - Pour encaisser réellement, passe en clés **live** (`sk_live_...`).
  - Recommandé en prod : ajouter un **webhook** Stripe pour fiabiliser la création
    de commande même si le client ferme l'onglet après paiement.

## 6. Vérifier

- Ouvre l'URL Vercel, crée un compte, ajoute au panier, paie avec la carte de test
  `4242 4242 4242 4242` → la commande doit apparaître dans « Mon compte ».
- `https://<render>/api/health` doit renvoyer `{"status":"ok"}`.

## Identifiants admin par défaut
- E-mail : `admin@shoptasapp.com`
- Mot de passe : celui défini dans `ADMIN_PASSWORD`.
