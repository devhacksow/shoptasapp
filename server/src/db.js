import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { products as seedProducts } from "./data/catalog.js";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Répertoire de données : un disque persistant en production (DATA_DIR),
// sinon le dossier du serveur en local.
const DATA_DIR = process.env.DATA_DIR || join(__dirname, "..");
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}
const DB_PATH = process.env.DATABASE_PATH || join(DATA_DIR, "shop-v2.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// --- Schéma ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    username      TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user',
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    brand       TEXT NOT NULL,
    category_id TEXT NOT NULL,
    description TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    image_url   TEXT NOT NULL,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS variants (
    id         TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    color      TEXT NOT NULL DEFAULT '',
    size       TEXT NOT NULL,
    stock      INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id    TEXT NOT NULL,
    product_id TEXT NOT NULL,
    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS orders (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    total_cents     INTEGER NOT NULL,
    delivery_cents  INTEGER NOT NULL DEFAULT 0,
    delivery_method TEXT NOT NULL DEFAULT '',
    payment_method  TEXT NOT NULL DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'payée',
    full_name       TEXT NOT NULL,
    address         TEXT NOT NULL,
    city            TEXT NOT NULL,
    zip             TEXT NOT NULL,
    created_at      TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id               TEXT PRIMARY KEY,
    order_id         TEXT NOT NULL,
    product_id       TEXT,
    name             TEXT NOT NULL,
    color            TEXT NOT NULL DEFAULT '',
    size             TEXT NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    quantity         INTEGER NOT NULL,
    image_url        TEXT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS pending_checkouts (
    session_id TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    data       TEXT NOT NULL,
    order_id   TEXT,
    created_at TEXT NOT NULL
  );
`);

// --- Amorçage du catalogue si vide ---
const productCount = db.prepare("SELECT COUNT(*) AS n FROM products").get();
if (productCount.n === 0) {
  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, brand, category_id, description, price_cents, image_url, created_at)
    VALUES (@id, @name, @brand, @categoryId, @description, @priceCents, @imageUrl, @createdAt)
  `);
  const insertVariant = db.prepare(`
    INSERT INTO variants (id, product_id, color, size, stock) VALUES (?, ?, ?, ?, ?)
  `);
  const now = new Date().toISOString();
  const seedTx = db.transaction((rows) => {
    for (const p of rows) {
      insertProduct.run({
        id: p.id,
        name: p.name,
        brand: p.brand,
        categoryId: p.categoryId,
        description: p.description,
        priceCents: p.priceCents,
        imageUrl: p.imageUrl,
        createdAt: now,
      });
      for (const v of p.variants) {
        insertVariant.run(`v_${randomUUID()}`, p.id, v.color, v.size, v.stock);
      }
    }
  });
  seedTx(seedProducts);
  console.log(`Catalogue amorcé avec ${seedProducts.length} produits.`);
}

// --- Amorçage du compte administrateur ---
const adminExists = db
  .prepare("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1")
  .get();
if (!adminExists) {
  const existing = db
    .prepare("SELECT id FROM users WHERE lower(email) = lower(?)")
    .get(ADMIN_EMAIL);
  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  if (existing) {
    db.prepare("UPDATE users SET role = 'admin', password_hash = ? WHERE id = ?").run(
      passwordHash,
      existing.id
    );
  } else {
    db.prepare(
      `INSERT INTO users (id, email, username, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, 'admin', ?)`
    ).run(
      `u_${randomUUID()}`,
      ADMIN_EMAIL,
      "admin",
      passwordHash,
      new Date().toISOString()
    );
  }
  console.log(
    `Compte administrateur prêt → e-mail: ${ADMIN_EMAIL} / mot de passe: ${ADMIN_PASSWORD}`
  );
}
