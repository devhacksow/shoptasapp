import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, extname, join } from "node:path";
import { authRequired } from "../middleware/auth.js";
import { CLOUDINARY } from "../config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Dossier des uploads (repli local si Cloudinary non configuré).
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ||
  (process.env.DATA_DIR
    ? join(process.env.DATA_DIR, "uploads")
    : join(__dirname, "..", "..", "uploads"));

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

// Cloudinary actif seulement si les trois identifiants sont présents.
const cloudinaryEnabled = Boolean(
  CLOUDINARY.cloudName && CLOUDINARY.apiKey && CLOUDINARY.apiSecret
);
if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: CLOUDINARY.cloudName,
    api_key: CLOUDINARY.apiKey,
    api_secret: CLOUDINARY.apiSecret,
  });
  console.log("Uploads : Cloudinary activé.");
} else {
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log("Uploads : stockage disque local (Cloudinary non configuré).");
}

export const uploadsRouter = Router();

// --- Mode Cloudinary : stockage en mémoire puis envoi au cloud ---
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    cb(ALLOWED.has(ext) ? null : new Error("Format d'image non autorisé."), ALLOWED.has(ext));
  },
});

// --- Mode disque : stockage local ---
const diskUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) =>
      cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    cb(ALLOWED.has(ext) ? null : new Error("Format d'image non autorisé."), ALLOWED.has(ext));
  },
});

uploadsRouter.post("/", authRequired, (req, res) => {
  const handler = cloudinaryEnabled ? memoryUpload : diskUpload;
  handler.single("image")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu." });

    if (!cloudinaryEnabled) {
      return res.status(201).json({ url: `/uploads/${req.file.filename}` });
    }

    // Envoi du buffer vers Cloudinary
    try {
      const url = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "shoptasapp", resource_type: "image" },
          (error, result) => (error ? reject(error) : resolve(result.secure_url))
        );
        stream.end(req.file.buffer);
      });
      res.status(201).json({ url });
    } catch {
      res.status(502).json({ error: "Échec de l'upload vers Cloudinary." });
    }
  });
});
