import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, extname, join } from "node:path";
import { authRequired } from "../middleware/auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Dossier des uploads : disque persistant en production, sinon local.
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ||
  (process.env.DATA_DIR
    ? join(process.env.DATA_DIR, "uploads")
    : join(__dirname, "..", "..", "uploads"));

if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext)) {
      return cb(new Error("Format d'image non autorisé."));
    }
    cb(null, true);
  },
});

export const uploadsRouter = Router();

// Upload d'une image (authentifié) -> renvoie l'URL relative
uploadsRouter.post("/", authRequired, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier reçu." });
    }
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});
