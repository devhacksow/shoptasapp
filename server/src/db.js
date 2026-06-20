import pg from "pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { products as seedProducts } from "./data/catalog.js";
import { ADMIN_EMAIL, ADMIN_PASSWORD, DATABASE_URL } from "./config.js";

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL manquant. Renseigne la connexion PostgreSQL (Neon) dans server/.env."
  );
}

const { Pool } = pg;

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/** Raccourci de requête. */
export const q = (text, params) => pool.query(text, params);

/** Crée le schéma et amorce les données si nécessaire. */
export async function initDb() {
  await q(`
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
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      color      TEXT NOT NULL DEFAULT '',
      size       TEXT NOT NULL,
      stock      INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS favorites (
      user_id    TEXT NOT NULL REFERENCES users(id),
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS orders (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL REFERENCES users(id),
      total_cents     INTEGER NOT NULL,
      delivery_cents  INTEGER NOT NULL DEFAULT 0,
      delivery_method TEXT NOT NULL DEFAULT '',
      payment_method  TEXT NOT NULL DEFAULT '',
      status          TEXT NOT NULL DEFAULT 'payée',
      full_name       TEXT NOT NULL,
      address         TEXT NOT NULL,
      city            TEXT NOT NULL,
      zip             TEXT NOT NULL,
      created_at      TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id               TEXT PRIMARY KEY,
      order_id         TEXT NOT NULL REFERENCES orders(id),
      product_id       TEXT,
      name             TEXT NOT NULL,
      color            TEXT NOT NULL DEFAULT '',
      size             TEXT NOT NULL,
      unit_price_cents INTEGER NOT NULL,
      quantity         INTEGER NOT NULL,
      image_url        TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pending_checkouts (
      session_id TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      data       TEXT NOT NULL,
      order_id   TEXT,
      created_at TEXT NOT NULL
    );
  `);

  await seedCatalog();
  await refreshSeedImages();
  await seedAdmin();
}

// Met à jour les images des produits de démo encore en picsum vers les visuels
// correspondant à la description (sans toucher aux images modifiées par l'admin).
async function refreshSeedImages() {
  for (const p of seedProducts) {
    await q(
      "UPDATE products SET image_url = $1 WHERE id = $2 AND image_url LIKE '%picsum%'",
      [p.imageUrl, p.id]
    );
  }
}

async function seedCatalog() {
  const { rows } = await q("SELECT COUNT(*)::int AS n FROM products");
  if (rows[0].n > 0) return;

  const now = new Date().toISOString();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const p of seedProducts) {
      await client.query(
        `INSERT INTO products (id, name, brand, category_id, description, price_cents, image_url, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [p.id, p.name, p.brand, p.categoryId, p.description, p.priceCents, p.imageUrl, now]
      );
      for (const v of p.variants) {
        await client.query(
          "INSERT INTO variants (id, product_id, color, size, stock) VALUES ($1,$2,$3,$4,$5)",
          [`v_${randomUUID()}`, p.id, v.color, v.size, v.stock]
        );
      }
    }
    await client.query("COMMIT");
    console.log(`Catalogue amorcé avec ${seedProducts.length} produits.`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function seedAdmin() {
  const { rows } = await q("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1");
  if (rows.length > 0) return;

  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  const existing = await q("SELECT id FROM users WHERE lower(email) = lower($1)", [
    ADMIN_EMAIL,
  ]);
  if (existing.rows.length > 0) {
    await q("UPDATE users SET role='admin', password_hash=$1 WHERE id=$2", [
      passwordHash,
      existing.rows[0].id,
    ]);
  } else {
    await q(
      `INSERT INTO users (id, email, username, password_hash, role, created_at)
       VALUES ($1,$2,$3,$4,'admin',$5)`,
      [`u_${randomUUID()}`, ADMIN_EMAIL, "admin", passwordHash, new Date().toISOString()]
    );
  }
  console.log(
    `Compte administrateur prêt → e-mail: ${ADMIN_EMAIL} / mot de passe: ${ADMIN_PASSWORD}`
  );
}
