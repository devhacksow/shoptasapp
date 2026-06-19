import { Router } from "express";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY, APP_URL } from "../config.js";
import { store } from "../store.js";
import { authRequired } from "../middleware/auth.js";
import { deliveryById, paymentById } from "../data/options.js";
import { sendOrderNotification } from "../services/mailer.js";

export const paymentsRouter = Router();

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

// Indique si le paiement Stripe est disponible
paymentsRouter.get("/config", (_req, res) => {
  res.json({ enabled: Boolean(stripe) });
});

// Crée une session Stripe Checkout et renvoie l'URL de paiement hébergée
paymentsRouter.post("/create-session", authRequired, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: "Paiement par carte non configuré." });
  }

  const { shipping, items, deliveryMethodId, paymentMethodId } = req.body ?? {};
  if (
    !shipping ||
    !shipping.fullName ||
    !shipping.address ||
    !shipping.city ||
    !shipping.zip
  ) {
    return res.status(400).json({ error: "Coordonnées de livraison incomplètes." });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Le panier est vide." });
  }
  const delivery = deliveryById(deliveryMethodId);
  if (!delivery) {
    return res.status(400).json({ error: "Mode de livraison invalide." });
  }
  // Type de paiement Stripe selon le choix (PayPal distinct ; carte inclut Apple/Google Pay).
  const paymentMethodTypes =
    paymentMethodId === "paypal" ? ["paypal"] : ["card"];
  const paymentLabel =
    paymentById(paymentMethodId)?.label || "Carte bancaire";

  const lines = items.map((it) => ({
    productId: it.productId,
    color: it.color ? String(it.color) : "",
    size: String(it.size),
    quantity: Number(it.quantity),
  }));

  let quote;
  try {
    quote = await store.quoteCart(lines);
  } catch (err) {
    return res.status(err.code || 400).json({ error: err.message });
  }

  // Construit les lignes Stripe à partir des montants vérifiés côté serveur.
  const lineItems = quote.resolved.map(({ product, variant, qty }) => ({
    quantity: qty,
    price_data: {
      currency: "eur",
      unit_amount: product.price_cents,
      product_data: {
        name: product.name,
        description: `${variant.color || ""} ${variant.size}`.trim(),
      },
    },
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: paymentMethodTypes,
      line_items: lineItems,
      customer_email: req.user.email,
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: delivery.priceCents, currency: "eur" },
            display_name: delivery.label,
          },
        },
      ],
      success_url: `${APP_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/?checkout=cancel`,
      metadata: { userId: req.user.id },
    });

    // Mémorise le panier pour finaliser la commande après paiement.
    await store.savePendingCheckout(session.id, req.user.id, {
      shipping: {
        fullName: String(shipping.fullName).trim(),
        address: String(shipping.address).trim(),
        city: String(shipping.city).trim(),
        zip: String(shipping.zip).trim(),
      },
      lines,
      delivery,
      payment: { id: paymentMethodId || "cb", label: paymentLabel },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe create-session:", err.message);
    // Message explicite si un moyen (ex. PayPal) n'est pas activé dans le Dashboard Stripe.
    res.status(502).json({
      error:
        err.message ||
        "Échec de la création du paiement. Vérifie que ce moyen est activé dans Stripe.",
    });
  }
});

// Confirme le paiement après redirection et crée la commande (idempotent)
paymentsRouter.post("/confirm", authRequired, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: "Paiement non configuré." });
  }
  const { sessionId } = req.body ?? {};
  if (!sessionId) {
    return res.status(400).json({ error: "Session manquante." });
  }

  const pending = await store.getPendingCheckout(sessionId);
  if (!pending || pending.userId !== req.user.id) {
    return res.status(404).json({ error: "Session de paiement introuvable." });
  }

  // Commande déjà finalisée (rechargement de page) → renvoie l'existante.
  if (pending.orderId) {
    return res.json({ order: await store.getOrderById(pending.orderId) });
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return res.status(502).json({ error: "Vérification du paiement impossible." });
  }

  if (session.payment_status !== "paid") {
    return res.status(402).json({ error: "Le paiement n'a pas été confirmé." });
  }

  try {
    const order = await store.checkout(
      req.user.id,
      pending.data.shipping,
      pending.data.lines,
      pending.data.delivery,
      pending.data.payment
    );
    await store.markPendingFinalized(sessionId, order.id);
    sendOrderNotification(order).catch(() => {});
    res.status(201).json({ order });
  } catch (err) {
    res.status(err.code || 500).json({ error: err.message || "Échec de la commande." });
  }
});
