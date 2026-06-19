// Couche d'accès aux données e-commerce, adossée à PostgreSQL (asynchrone).
import { randomUUID } from "node:crypto";
import { pool, q } from "./db.js";
import { categories } from "./data/catalog.js";

function buildProduct(row, variants) {
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

async function variantsFor(productIds) {
  if (productIds.length === 0) return new Map();
  const { rows } = await q(
    "SELECT id, product_id, color, size, stock FROM variants WHERE product_id = ANY($1) ORDER BY id",
    [productIds]
  );
  const map = new Map();
  for (const v of rows) {
    if (!map.has(v.product_id)) map.set(v.product_id, []);
    map.get(v.product_id).push({
      id: v.id,
      color: v.color,
      size: v.size,
      stock: v.stock,
    });
  }
  return map;
}

async function buildUser(row) {
  if (!row) return undefined;
  const { rows } = await q(
    "SELECT product_id FROM favorites WHERE user_id = $1",
    [row.id]
  );
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role || "user",
    favorites: new Set(rows.map((r) => r.product_id)),
    createdAt: row.created_at,
  };
}

export const store = {
  categories,

  // --- Utilisateurs ---
  async findUserByEmail(email) {
    const { rows } = await q("SELECT * FROM users WHERE lower(email) = lower($1)", [
      email,
    ]);
    return buildUser(rows[0]);
  },

  async findUserById(id) {
    const { rows } = await q("SELECT * FROM users WHERE id = $1", [id]);
    return buildUser(rows[0]);
  },

  async createUser({ email, username, passwordHash }) {
    const id = `u_${randomUUID()}`;
    await q(
      `INSERT INTO users (id, email, username, password_hash, created_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [id, email, username, passwordHash, new Date().toISOString()]
    );
    return this.findUserById(id);
  },

  async findOrCreateOAuthUser({ email, username }) {
    const existing = await this.findUserByEmail(email);
    if (existing) return existing;
    return this.createUser({
      email,
      username,
      passwordHash: `oauth_${randomUUID()}`,
    });
  },

  // --- Produits ---
  async listProducts({ q: term, category, sort, minPrice, maxPrice } = {}) {
    const clauses = [];
    const params = [];
    let i = 1;
    if (category) {
      clauses.push(`category_id = $${i++}`);
      params.push(category);
    }
    if (term && term.trim()) {
      clauses.push(`name ILIKE $${i++}`);
      params.push(`%${term.trim()}%`);
    }
    if (Number.isFinite(minPrice)) {
      clauses.push(`price_cents >= $${i++}`);
      params.push(Math.round(minPrice));
    }
    if (Number.isFinite(maxPrice)) {
      clauses.push(`price_cents <= $${i++}`);
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
    const { rows } = await q(sql, params);
    const vmap = await variantsFor(rows.map((r) => r.id));
    return rows.map((r) => buildProduct(r, vmap.get(r.id) || []));
  },

  async getProductById(id) {
    const { rows } = await q("SELECT * FROM products WHERE id = $1", [id]);
    if (!rows[0]) return undefined;
    const vmap = await variantsFor([id]);
    return buildProduct(rows[0], vmap.get(id) || []);
  },

  async createProduct(data) {
    const id = `p_${randomUUID()}`;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO products (id, name, brand, category_id, description, price_cents, image_url, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          id,
          data.name,
          data.brand || "ShopTaSapp",
          data.categoryId,
          data.description,
          data.priceCents,
          data.imageUrl,
          new Date().toISOString(),
        ]
      );
      for (const v of data.variants) {
        await client.query(
          "INSERT INTO variants (id, product_id, color, size, stock) VALUES ($1,$2,$3,$4,$5)",
          [`v_${randomUUID()}`, id, v.color || "", v.size, v.stock]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    return this.getProductById(id);
  },

  async updateProduct(id, data) {
    const existing = await this.getProductById(id);
    if (!existing) return undefined;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE products SET name=$1, category_id=$2, description=$3, price_cents=$4, image_url=$5 WHERE id=$6`,
        [data.name, data.categoryId, data.description, data.priceCents, data.imageUrl, id]
      );
      if (Array.isArray(data.variants)) {
        await client.query("DELETE FROM variants WHERE product_id = $1", [id]);
        for (const v of data.variants) {
          await client.query(
            "INSERT INTO variants (id, product_id, color, size, stock) VALUES ($1,$2,$3,$4,$5)",
            [`v_${randomUUID()}`, id, v.color || "", v.size, v.stock]
          );
        }
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    return this.getProductById(id);
  },

  async deleteProduct(id) {
    const res = await q("DELETE FROM products WHERE id = $1", [id]);
    return res.rowCount > 0;
  },

  // --- Favoris ---
  async toggleFavorite(userId, productId) {
    const { rows } = await q(
      "SELECT 1 FROM favorites WHERE user_id=$1 AND product_id=$2",
      [userId, productId]
    );
    if (rows.length) {
      await q("DELETE FROM favorites WHERE user_id=$1 AND product_id=$2", [
        userId,
        productId,
      ]);
    } else {
      await q("INSERT INTO favorites (user_id, product_id) VALUES ($1,$2)", [
        userId,
        productId,
      ]);
    }
    const fav = await q("SELECT product_id FROM favorites WHERE user_id=$1", [
      userId,
    ]);
    return fav.rows.map((r) => r.product_id);
  },

  async listFavoriteProducts(userId) {
    const { rows } = await q(
      `SELECT p.* FROM products p
       JOIN favorites f ON f.product_id = p.id
       WHERE f.user_id = $1 ORDER BY p.created_at DESC`,
      [userId]
    );
    const vmap = await variantsFor(rows.map((r) => r.id));
    return rows.map((r) => buildProduct(r, vmap.get(r.id) || []));
  },

  // --- Checkout / commandes ---
  // Calcule le montant et valide le stock SANS créer de commande.
  async quoteCart(lines) {
    let itemsCents = 0;
    const resolved = [];
    for (const line of lines) {
      const pr = await q("SELECT * FROM products WHERE id = $1", [line.productId]);
      const product = pr.rows[0];
      if (!product) throw { code: 400, message: "Produit introuvable." };
      const vr = await q(
        "SELECT * FROM variants WHERE product_id=$1 AND size=$2 AND color=$3",
        [line.productId, line.size, line.color || ""]
      );
      const variant = vr.rows[0];
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
  async savePendingCheckout(sessionId, userId, data) {
    await q(
      `INSERT INTO pending_checkouts (session_id, user_id, data, order_id, created_at)
       VALUES ($1,$2,$3,NULL,$4)
       ON CONFLICT (session_id) DO UPDATE SET data = EXCLUDED.data`,
      [sessionId, userId, JSON.stringify(data), new Date().toISOString()]
    );
  },

  async getPendingCheckout(sessionId) {
    const { rows } = await q(
      "SELECT * FROM pending_checkouts WHERE session_id = $1",
      [sessionId]
    );
    if (!rows[0]) return undefined;
    return {
      sessionId: rows[0].session_id,
      userId: rows[0].user_id,
      data: JSON.parse(rows[0].data),
      orderId: rows[0].order_id,
    };
  },

  async markPendingFinalized(sessionId, orderId) {
    await q("UPDATE pending_checkouts SET order_id=$1 WHERE session_id=$2", [
      orderId,
      sessionId,
    ]);
  },

  // lines: [{ productId, color, size, quantity }]
  async checkout(userId, shipping, lines, delivery, payment) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      let itemsCents = 0;
      const resolved = [];
      for (const line of lines) {
        const pr = await client.query("SELECT * FROM products WHERE id=$1", [
          line.productId,
        ]);
        const product = pr.rows[0];
        if (!product) throw { code: 400, message: "Produit introuvable." };
        const vr = await client.query(
          "SELECT * FROM variants WHERE product_id=$1 AND size=$2 AND color=$3 FOR UPDATE",
          [line.productId, line.size, line.color || ""]
        );
        const variant = vr.rows[0];
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

      const grandTotal = itemsCents + (delivery?.priceCents || 0);
      const orderId = `o_${randomUUID()}`;
      await client.query(
        `INSERT INTO orders (id, user_id, total_cents, delivery_cents, delivery_method, payment_method, status, full_name, address, city, zip, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,'payée',$7,$8,$9,$10,$11)`,
        [
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
          new Date().toISOString(),
        ]
      );
      for (const { product, variant, qty } of resolved) {
        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, name, color, size, unit_price_cents, quantity, image_url)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            `oi_${randomUUID()}`,
            orderId,
            product.id,
            product.name,
            variant.color,
            variant.size,
            product.price_cents,
            qty,
            product.image_url,
          ]
        );
        await client.query("UPDATE variants SET stock = stock - $1 WHERE id = $2", [
          qty,
          variant.id,
        ]);
      }
      await client.query("COMMIT");
      return this.getOrderById(orderId);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  },

  async getOrderById(id) {
    const or = await q("SELECT * FROM orders WHERE id = $1", [id]);
    const order = or.rows[0];
    if (!order) return undefined;
    const it = await q("SELECT * FROM order_items WHERE order_id = $1", [id]);
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
      items: it.rows.map((r) => ({
        productId: r.product_id,
        name: r.name,
        color: r.color,
        size: r.size,
        unitPriceCents: r.unit_price_cents,
        quantity: r.quantity,
        imageUrl: r.image_url,
      })),
    };
  },

  async listOrdersByUser(userId) {
    const { rows } = await q(
      "SELECT id FROM orders WHERE user_id=$1 ORDER BY created_at DESC",
      [userId]
    );
    const orders = [];
    for (const r of rows) orders.push(await this.getOrderById(r.id));
    return orders;
  },

  async setOrderStatus(orderId, status) {
    await q("UPDATE orders SET status=$1 WHERE id=$2", [status, orderId]);
    return this.getOrderById(orderId);
  },

  // --- Administration ---
  async listAllUsers() {
    const { rows } = await q(
      `SELECT u.id, u.email, u.username, u.role, u.created_at,
              (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id) AS orders_count
       FROM users u ORDER BY u.created_at DESC`
    );
    return rows;
  },

  async listAllOrders() {
    const { rows } = await q(
      `SELECT o.id, o.total_cents, o.status, o.created_at, u.username AS buyer,
              (SELECT COALESCE(SUM(quantity),0)::int FROM order_items oi WHERE oi.order_id = o.id) AS item_count
       FROM orders o JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC`
    );
    return rows.map((r) => ({
      id: r.id,
      buyer: r.buyer,
      totalCents: r.total_cents,
      status: r.status,
      createdAt: r.created_at,
      itemCount: r.item_count,
    }));
  },

  async stats() {
    const users = (await q("SELECT COUNT(*)::int AS n FROM users")).rows[0].n;
    const products = (await q("SELECT COUNT(*)::int AS n FROM products")).rows[0].n;
    const orders = (await q("SELECT COUNT(*)::int AS n FROM orders")).rows[0].n;
    const revenue =
      (await q("SELECT COALESCE(SUM(total_cents),0)::int AS s FROM orders")).rows[0].s ||
      0;
    const lowStock = (
      await q(
        `SELECT COUNT(*)::int AS n FROM (
           SELECT product_id, SUM(stock) AS s FROM variants GROUP BY product_id HAVING SUM(stock) <= 3
         ) t`
      )
    ).rows[0].n;
    return { users, products, orders, revenueCents: revenue, lowStock };
  },
};
