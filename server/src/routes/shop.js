import { Router } from "express";
import { store } from "../store.js";
import { authRequired } from "../middleware/auth.js";
import { deliveryMethods, paymentMethods, deliveryById, paymentById } from "../data/options.js";
import { sendOrderNotification } from "../services/mailer.js";

export const shopRouter = Router();

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

// Catégories
shopRouter.get("/categories", (_req, res) => {
  res.json({ categories: store.categories });
});

// Options de livraison et de paiement
shopRouter.get("/options", (_req, res) => {
  res.json({ deliveryMethods, paymentMethods });
});

// Catalogue avec filtres : ?q=&category=&sort=&minPrice=&maxPrice= (prix en euros)
shopRouter.get("/products", (req, res) => {
  const { q, category, sort, minPrice, maxPrice } = req.query;
  const min = num(minPrice);
  const max = num(maxPrice);
  const products = store.listProducts({
    q: typeof q === "string" ? q : undefined,
    category: typeof category === "string" ? category : undefined,
    sort: typeof sort === "string" ? sort : undefined,
    minPrice: min != null ? min * 100 : undefined,
    maxPrice: max != null ? max * 100 : undefined,
  });
  res.json({ products, total: products.length });
});

// Détail d'un produit
shopRouter.get("/products/:id", (req, res) => {
  const product = store.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Produit introuvable." });
  }
  res.json({ product });
});

// --- Favoris (wishlist) ---
shopRouter.post("/products/:id/favorite", authRequired, (req, res) => {
  const product = store.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Produit introuvable." });
  }
  const favorites = store.toggleFavorite(req.user.id, product.id);
  res.json({ favorites });
});

shopRouter.get("/me/favorites", authRequired, (req, res) => {
  res.json({ products: store.listFavoriteProducts(req.user.id) });
});

// --- Commandes ---
shopRouter.get("/me/orders", authRequired, (req, res) => {
  res.json({ orders: store.listOrdersByUser(req.user.id) });
});

// Passage de commande (panier -> commande)
shopRouter.post("/checkout", authRequired, async (req, res) => {
  const { shipping, items, deliveryMethodId, paymentMethodId } = req.body ?? {};

  if (
    !shipping ||
    !shipping.fullName ||
    !shipping.address ||
    !shipping.city ||
    !shipping.zip
  ) {
    return res
      .status(400)
      .json({ error: "Coordonnées de livraison incomplètes." });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Le panier est vide." });
  }
  for (const it of items) {
    if (!it.productId || !it.size || !Number.isFinite(Number(it.quantity))) {
      return res.status(400).json({ error: "Article de panier invalide." });
    }
  }

  const delivery = deliveryById(deliveryMethodId);
  if (!delivery) {
    return res.status(400).json({ error: "Mode de livraison invalide." });
  }
  const payment = paymentById(paymentMethodId);
  if (!payment) {
    return res.status(400).json({ error: "Mode de paiement invalide." });
  }

  try {
    const order = store.checkout(
      req.user.id,
      {
        fullName: String(shipping.fullName).trim(),
        address: String(shipping.address).trim(),
        city: String(shipping.city).trim(),
        zip: String(shipping.zip).trim(),
      },
      items.map((it) => ({
        productId: it.productId,
        color: it.color ? String(it.color) : "",
        size: String(it.size),
        quantity: Number(it.quantity),
      })),
      delivery,
      payment
    );

    // Notifie l'administrateur (asynchrone, sans bloquer la réponse).
    sendOrderNotification(order).catch(() => {});

    res.status(201).json({ order });
  } catch (err) {
    const code = err && err.code ? err.code : 500;
    res.status(code).json({ error: err.message || "Échec de la commande." });
  }
});
