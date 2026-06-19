import { Router } from "express";
import { store } from "../store.js";
import { adminRequired } from "../middleware/auth.js";

export const adminRouter = Router();
adminRouter.use(adminRequired);

const VALID_CATEGORIES = new Set(store.categories.map((c) => c.id));
const STATUSES = ["payée", "en préparation", "expédiée", "livrée", "annulée"];

// Statistiques
adminRouter.get("/stats", (_req, res) => {
  res.json({ stats: store.stats() });
});

// Utilisateurs
adminRouter.get("/users", (_req, res) => {
  res.json({ users: store.listAllUsers() });
});

// Produits (liste complète)
adminRouter.get("/products", (_req, res) => {
  res.json({ products: store.listProducts({}) });
});

function validateProductBody(body) {
  const { name, categoryId, priceEuros, description, imageUrl, variants } = body ?? {};
  if (!name || !categoryId) {
    return { error: "Nom et catégorie sont requis." };
  }
  if (!VALID_CATEGORIES.has(categoryId)) {
    return { error: "Catégorie inconnue." };
  }
  const price = Number(priceEuros);
  if (!Number.isFinite(price) || price <= 0) {
    return { error: "Le prix doit être un nombre positif." };
  }
  if (!Array.isArray(variants) || variants.length === 0) {
    return { error: "Au moins une taille est requise." };
  }
  const cleanVariants = [];
  for (const v of variants) {
    if (!v || !v.size) return { error: "Taille invalide." };
    const stock = Number(v.stock);
    cleanVariants.push({
      size: String(v.size).trim(),
      stock: Number.isFinite(stock) && stock >= 0 ? Math.floor(stock) : 0,
    });
  }
  return {
    data: {
      name: String(name).trim(),
      categoryId,
      priceCents: Math.round(price * 100),
      description: description
        ? String(description).trim()
        : String(name).trim(),
      imageUrl:
        typeof imageUrl === "string" &&
        (imageUrl.startsWith("/uploads/") || imageUrl.startsWith("https://"))
          ? imageUrl
          : `https://picsum.photos/seed/${Date.now()}/500/600`,
      variants: cleanVariants,
    },
  };
}

// Créer un produit
adminRouter.post("/products", (req, res) => {
  const { error, data } = validateProductBody(req.body);
  if (error) return res.status(400).json({ error });
  res.status(201).json({ product: store.createProduct(data) });
});

// Modifier un produit
adminRouter.put("/products/:id", (req, res) => {
  const { error, data } = validateProductBody(req.body);
  if (error) return res.status(400).json({ error });
  const updated = store.updateProduct(req.params.id, data);
  if (!updated) return res.status(404).json({ error: "Produit introuvable." });
  res.json({ product: updated });
});

// Supprimer un produit
adminRouter.delete("/products/:id", (req, res) => {
  const ok = store.deleteProduct(req.params.id);
  if (!ok) return res.status(404).json({ error: "Produit introuvable." });
  res.json({ deleted: true });
});

// Commandes
adminRouter.get("/orders", (_req, res) => {
  res.json({ orders: store.listAllOrders() });
});

// Mettre à jour le statut d'une commande
adminRouter.patch("/orders/:id/status", (req, res) => {
  const { status } = req.body ?? {};
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: "Statut invalide." });
  }
  const order = store.setOrderStatus(req.params.id, status);
  if (!order) return res.status(404).json({ error: "Commande introuvable." });
  res.json({ order });
});

// Statuts disponibles
adminRouter.get("/order-statuses", (_req, res) => {
  res.json({ statuses: STATUSES });
});
