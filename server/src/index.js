import "dotenv/config";
import express from "express";
import cors from "cors";
import { PORT } from "./config.js";
import { initDb } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { shopRouter } from "./routes/shop.js";
import { adminRouter } from "./routes/admin.js";
import { paymentsRouter } from "./routes/payments.js";
import { uploadsRouter, UPLOAD_DIR } from "./routes/uploads.js";

const app = express();

// CORS : ouvert en dev ; en prod, restreint à CORS_ORIGIN si défini
// (séparer plusieurs domaines par des virgules).
const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors(corsOrigins.length ? { origin: corsOrigins } : undefined));
app.use(express.json());

// Sert les images uploadées en statique
app.use("/uploads", express.static(UPLOAD_DIR));

// Journalisation simple des requêtes
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api", shopRouter);

// 404 JSON
app.use((_req, res) => {
  res.status(404).json({ error: "Ressource introuvable." });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API ShopTaSapp démarrée sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Échec de l'initialisation de la base :", err.message);
    process.exit(1);
  });
