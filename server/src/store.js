// Couche d'accès aux données e-commerce, adossée à SQLite.
import { randomUUID } from "node:crypto";
import { db } from "./db.js";
import { categories } from "./data/catalog.js";

function variantsOf(productId) {
  return db
    .prepare(
      "SELECT id, color, size, stock FROM variants WHERE product_id = ? ORDER BY rowid"
    )
    .all(productId)
    .map((v) => ({ id: v.id, color: v.color, size: v.size, stock: v.stock }));
}

function rowToProduct(row) {
  if (!row) return undefined;
  const variants = variantsOf(row.id);
  const totalStock = variants.reduce((s, v) => s + v.stock, 0);
  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    categoryId: row.category_id,
    description: row.description,
    priceCents: row.price_cents,
    imageUrl: row.image_url,
    variants,
    colors,
    totalStock,
    inStock: totalStock > 0,
  };
}

function rowToUser(row) {
  if (!row) return undefined;
  const favRows = db
    .prepare("SELECT product_id FROM favorites WHERE user_id = ?")
    .all(row.id);
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role || "user",
    favorites: new Set(favRows.map((r) => r.product_id)),
    createdAt: row.created_at,
  };
}

export const store = {
  categories,

  // --- Utilisateurs ---
  findUserByEmail(email) {
    const row = db
      .prepare("SELECT * FROM users WHERE lower(email) = lower(?)")
      .get(email);
    return rowToUser(row);
  },

  findUserById(id) {
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    return rowToUser(row);
  },

  createUser({ email, username, passwordHash }) {
    const id = `u_${randomUUID()}`;
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO users (id, email, username, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, email, username, passwordHash, createdAt);
    return this.findUserById(id);
  },

  // Crée ou récupère un utilisateur authentifié via Google (sans mot de passe utilisable)
  findOrCreateOAuthUser({ email, username }) {
    const existing = this.findUserByEmail(email);
    if (existing) return existing;
    return this.createUser({
      email,
      username,
      passwordHash: `oauth_${randomUUID()}`,
    });
  },

  // --- Produits ---
  listProducts({ q, category, sort, minPrice, maxPrice } = {}) {
    const clauses = [];
    const params = [];
    if (category) {
      clauses.push("category_id = ?");
      params.push(category);
    }
    if (q && q.trim()) {
      clauses.push("lower(name) LIKE ?");
      params.push(`%${q.trim().toLowerCase()}%`);
    }
    if (Number.isFinite(minPrice)) {
      clauses.push("price_cents >= ?");
      params.push(Math.round(minPrice));
    }
    if (Number.isFinite(maxPrice)) {
      clauses.push("price_cents <= ?");
      params.push(Math.round(maxPrice));
    }
    let sql = "SELECT * FROM products";
    if (clauses.length) sql += " WHERE " + clauses.join(" AND ");
    switch (sort) {
      case "priceAsc":
        sql += " ORDER BY price_cents ASC";
        break;
      case "priceDesc":
        sql += " ORDER BY price_cents DESC";
        break;
      case "nameAsc":
        sql += " ORDER BY name ASC";
        break;
      default:
        sql += " ORDER BY created_at DESC, id ASC";
        break;
    }
    return db.prepare(sql).all(...params).map(rowToProduct);
  },

  getProductById(id) {
    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    return rowToProduct(row);
  },

  createProduct(data) {
    const id = `p_${randomUUID()}`;
    const createdAt = new Date().toISOString();
    const tx = db.transaction(() => {
      db.prepare(
        `INSERT INTO products (id, name, brand, category_id, description, price_cents, image_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        data.name,
        data.brand || "ShopTaSapp",
        data.categoryId,
        data.description,
        data.priceCents,
        data.imageUrl,
        createdAt
      );
      for (const v of data.variants) {
        db.prepare(
          "INSERT INTO variants (id, product_id, color, size, stock) VALUES (?, ?, ?, ?, ?)"
        ).run(`v_${randomUUID()}`, id, v.color || "", v.size, v.stock);
      }
    });
    tx();
    return this.getProductById(id);
  },

  updateProduct(id, data) {
    const existing = this.getProductById(id);
    if (!existing) return undefined;
    const tx = db.transaction(() => {
      db.prepare(
        `UPDATE products SET name = ?, category_id = ?, description = ?, price_cents = ?, image_url = ?
         WHERE id = ?`
      ).run(
        data.name,
        data.categoryId,
        data.description,
        data.priceCents,
        data.imageUrl,
        id
      );
      if (Array.isArray(data.variants)) {
        db.prepare("DELETE FROM variants WHERE product_id = ?").run(id);
        for (const v of data.variants) {
          db.prepare(
            "INSERT INTO variants (id, product_id, color, size, stock) VALUES (?, ?, ?, ?, ?)"
          ).run(`v_${randomUUID()}`, id, v.color || "", v.size, v.stock);
        }
      }
    });
    tx();
    return this.getProductById(id);
  },

  deleteProduct(id) {
    const info = db.prepare("DELETE FROM products WHERE id = ?").run(id);
    return info.changes > 0;
  },

  // --- Favoris (wishlist) ---
  toggleFavorite(userId, productId) {
    const exists = db
      .prepare("SELECT 1 FROM favorites WHERE user_id = ? AND product_id = ?")
      .get(userId, productId);
    if (exists) {
      db.prepare(
        "DELETE FROM favorites WHERE user_id = ? AND product_id = ?"
      ).run(userId, productId);
    } else {
      db.prepare(
        "INSERT INTO favorites (user_id, product_id) VALUES (?, ?)"
      ).run(userId, productId);
    }
    return db
      .prepare("SELECT product_id FROM favorites WHERE user_id = ?")
      .all(userId)
      .map((r) => r.product_id);
  },

  listFavoriteProducts(userId) {
    return db
      .prepare(
        `SELECT p.* FROM products p
         JOIN favorites f ON f.product_id = p.id
         WHERE f.user_id = ?
         ORDER BY p.created_at DESC`
      )
      .all(userId)
      .map(rowToProduct);
  },

  // --- Checkout / commandes ---
  // Calcule le montant et valide le stock SANS créer de commande (pour Stripe).
  quoteCart(lines) {
    let itemsCents = 0;
    const resolved = [];
    for (const line of lines) {
      const product = db
        .prepare("SELECT * FROM products WHERE id = ?")
        .get(line.productId);
      if (!product) throw { code: 400, message: "Produit introuvable." };
      const variant = db
        .prepare(
          "SELECT * FROM variants WHERE product_id = ? AND size = ? AND color = ?"
        )
        .get(line.productId, line.size, line.color || "");
      if (!variant)
        throw { code: 400, message: `Déclinaison indisponible pour ${product.name}.` };
      const qty = Math.max(1, Math.floor(line.quantity));
      if (variant.stock < qty)
        throw {
          code: 409,
          message: `Stock insuffisant pour ${product.name} (${variant.color} / ${line.size}).`,
        };
      itemsCents += product.price_cents * qty;
      resolved.push({ product, variant, qty });
    }
    return { itemsCents, resolved };
  },

  // --- Paniers en attente de paiement Stripe ---
  savePendingCheckout(sessionId, userId, data) {
    db.prepare(
      `INSERT OR REPLACE INTO pending_checkouts (session_id, user_id, data, order_id, created_at)
       VALUES (?, ?, ?, NULL, ?)`
    ).run(sessionId, userId, JSON.stringify(data), new Date().toISOString());
  },

  getPendingCheckout(sessionId) {
    const row = db
      .prepare("SELECT * FROM pending_checkouts WHERE session_id = ?")
      .get(sessionId);
    if (!row) return undefined;
    return {
      sessionId: row.session_id,
      userId: row.user_id,
      data: JSON.parse(row.data),
      orderId: row.order_id,
    };
  },

  markPendingFinalized(sessionId, orderId) {
    db.prepare(
      "UPDATE pending_checkouts SET order_id = ? WHERE session_id = ?"
    ).run(orderId, sessionId);
  },

  // lines: [{ productId, color, size, quantity }]
  checkout(userId, shipping, lines, delivery, payment) {
    return db.transaction(() => {
      let total = 0;
      const resolved = [];

      for (const line of lines) {
        const product = db
          .prepare("SELECT * FROM products WHERE id = ?")
          .get(line.productId);
        if (!product) {
          throw { code: 400, message: `Produit introuvable.` };
        }
        const variant = db
          .prepare(
            "SELECT * FROM variants WHERE product_id = ? AND size = ? AND color = ?"
          )
          .get(line.productId, line.size, line.color || "");
        if (!variant) {
          throw {
            code: 400,
            message: `Déclinaison indisponible pour ${product.name}.`,
          };
        }
        const qty = Math.max(1, Math.floor(line.quantity));
        if (variant.stock < qty) {
          throw {
            code: 409,
            message: `Stock insuffisant pour ${product.name} (${variant.color} / ${line.size}).`,
          };
        }
        total += product.price_cents * qty;
        resolved.push({ product, variant, qty });
      }

      const grandTotal = total + (delivery?.priceCents || 0);
      const orderId = `o_${randomUUID()}`;
      const createdAt = new Date().toISOString();
      db.prepare(
        `INSERT INTO orders (id, user_id, total_cents, delivery_cents, delivery_method, payment_method, status, full_name, address, city, zip, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'payée', ?, ?, ?, ?, ?)`
      ).run(
        orderId,
        userId,
        grandTotal,
        delivery?.priceCents || 0,
        delivery?.label || "",
        payment?.label || "",
        shipping.fullName,
        shipping.address,
        shipping.city,
        shipping.zip,
        createdAt
      );

      for (const { product, variant, qty } of resolved) {
        db.prepare(
          `INSERT INTO order_items (id, order_id, product_id, name, color, size, unit_price_cents, quantity, image_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          `oi_${randomUUID()}`,
          orderId,
          product.id,
          product.name,
          variant.color,
          variant.size,
          product.price_cents,
          qty,
          product.image_url
        );
        db.prepare("UPDATE variants SET stock = stock - ? WHERE id = ?").run(
          qty,
          variant.id
        );
      }

      return this.getOrderById(orderId);
    })();
  },

  getOrderById(id) {
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!order) return undefined;
    const items = db
      .prepare("SELECT * FROM order_items WHERE order_id = ?")
      .all(id)
      .map((it) => ({
        productId: it.product_id,
        name: it.name,
        color: it.color,
        size: it.size,
        unitPriceCents: it.unit_price_cents,
        quantity: it.quantity,
        imageUrl: it.image_url,
      }));
    return {
      id: order.id,
      totalCents: order.total_cents,
      deliveryCents: order.delivery_cents,
      deliveryMethod: order.delivery_method,
      paymentMethod: order.payment_method,
      status: order.status,
      shipping: {
        fullName: order.full_name,
        address: order.address,
        city: order.city,
        zip: order.zip,
      },
      createdAt: order.created_at,
      items,
    };
  },

  listOrdersByUser(userId) {
    return db
      .prepare("SELECT id FROM orders WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId)
      .map((r) => this.getOrderById(r.id));
  },

  setOrderStatus(orderId, status) {
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, orderId);
    return this.getOrderById(orderId);
  },

  // --- Administration ---
  listAllUsers() {
    return db
      .prepare(
        `SELECT u.id, u.email, u.username, u.role, u.created_at,
                (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders_count
         FROM users u ORDER BY u.created_at DESC`
      )
      .all();
  },

  listAllOrders() {
    const rows = db
      .prepare(
        `SELECT o.id, o.total_cents, o.status, o.created_at, u.username AS buyer
         FROM orders o JOIN users u ON u.id = o.user_id
         ORDER BY o.created_at DESC`
      )
      .all();
    return rows.map((r) => ({
      id: r.id,
      buyer: r.buyer,
      totalCents: r.total_cents,
      status: r.status,
      createdAt: r.created_at,
      itemCount: db
        .prepare("SELECT COALESCE(SUM(quantity),0) AS n FROM order_items WHERE order_id = ?")
        .get(r.id).n,
    }));
  },

  stats() {
    const users = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
    const products = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
    const orders = db.prepare("SELECT COUNT(*) AS n FROM orders").get().n;
    const revenue =
      db.prepare("SELECT COALESCE(SUM(total_cents),0) AS s FROM orders").get().s ||
      0;
    const lowStock = db
      .prepare(
        `SELECT COUNT(*) AS n FROM (
           SELECT product_id, SUM(stock) AS s FROM variants GROUP BY product_id HAVING s <= 3
         )`
      )
      .get().n;
    return { users, products, orders, revenueCents: revenue, lowStock };
  },
};
