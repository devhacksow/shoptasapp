import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { JWT_SECRET, TOKEN_TTL, GOOGLE_CLIENT_ID } from "../config.js";
import { store } from "../store.js";
import { authRequired } from "../middleware/auth.js";

export const authRouter = Router();

const googleClient = GOOGLE_CLIENT_ID
  ? new OAuth2Client(GOOGLE_CLIENT_ID)
  : null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role || "user",
    favorites: [...user.favorites],
  };
}

function signToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// Inscription
authRouter.post("/register", async (req, res) => {
  const { email, username, password } = req.body ?? {};

  if (!email || !username || !password) {
    return res
      .status(400)
      .json({ error: "E-mail, nom d'utilisateur et mot de passe requis." });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Adresse e-mail invalide." });
  }
  if (String(password).length < 6) {
    return res
      .status(400)
      .json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
  }
  if (store.findUserByEmail(email)) {
    return res.status(409).json({ error: "Cet e-mail est déjà utilisé." });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = store.createUser({ email, username, passwordHash });
  const token = signToken(user);

  res.status(201).json({ token, user: publicUser(user) });
});

// Connexion
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "E-mail et mot de passe requis." });
  }

  const user = store.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "Identifiants incorrects." });
  }
  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Identifiants incorrects." });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

// Profil de l'utilisateur connecté
authRouter.get("/me", authRequired, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// Indique si la connexion Google est disponible (et fournit le client ID public)
authRouter.get("/google/config", (_req, res) => {
  res.json({ enabled: Boolean(googleClient), clientId: GOOGLE_CLIENT_ID });
});

// Connexion via un jeton d'identité Google (Google Identity Services)
authRouter.post("/google", async (req, res) => {
  if (!googleClient) {
    return res
      .status(503)
      .json({ error: "Connexion Google non configurée sur le serveur." });
  }
  const { credential } = req.body ?? {};
  if (!credential) {
    return res.status(400).json({ error: "Jeton Google manquant." });
  }
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(400).json({ error: "Compte Google sans e-mail." });
    }
    const username =
      payload.name || payload.email.split("@")[0] || "Utilisateur Google";
    const user = store.findOrCreateOAuthUser({
      email: payload.email,
      username,
    });
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch {
    return res.status(401).json({ error: "Jeton Google invalide." });
  }
});
