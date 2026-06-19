import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { store } from "../store.js";

/** Extrait le token Bearer et attache l'utilisateur à req.user si valide. */
export async function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Authentification requise." });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await store.findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable." });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
}

/** Exige un utilisateur authentifié ayant le rôle administrateur. */
export function adminRequired(req, res, next) {
  authRequired(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Accès réservé à l'administrateur." });
    }
    next();
  });
}
