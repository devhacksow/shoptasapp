import nodemailer from "nodemailer";
import { SMTP, ADMIN_EMAIL } from "../config.js";

let transporter = null;
if (SMTP.host && SMTP.user) {
  transporter = nodemailer.createTransport({
    host: SMTP.host,
    port: SMTP.port,
    secure: SMTP.port === 465,
    auth: { user: SMTP.user, pass: SMTP.pass },
  });
  console.log(`E-mails : SMTP configuré (${SMTP.host}).`);
} else {
  console.log(
    "E-mails : SMTP non configuré — les messages seront affichés dans la console."
  );
}

const euros = (cents) => (cents / 100).toFixed(2) + " €";

/** Notifie l'administrateur d'une nouvelle commande. */
export async function sendOrderNotification(order) {
  const lines = order.items
    .map(
      (it) =>
        `  - ${it.quantity} × ${it.name} (${it.color || "—"} / ${it.size}) — ${euros(
          it.unitPriceCents * it.quantity
        )}`
    )
    .join("\n");

  const subject = `Nouvelle commande ${order.id} — ${euros(order.totalCents)}`;
  const text = [
    `Nouvelle commande reçue sur ShopTaSapp.`,
    ``,
    `Numéro de commande : ${order.id}`,
    `Date : ${new Date(order.createdAt).toLocaleString("fr-FR")}`,
    `Client : ${order.shipping.fullName}`,
    `Livraison : ${order.deliveryMethod} — ${order.shipping.address}, ${order.shipping.zip} ${order.shipping.city}`,
    `Paiement : ${order.paymentMethod}`,
    ``,
    `Articles :`,
    lines,
    ``,
    `Sous-total articles : ${euros(order.totalCents - order.deliveryCents)}`,
    `Frais de livraison : ${euros(order.deliveryCents)}`,
    `TOTAL : ${euros(order.totalCents)}`,
  ].join("\n");

  if (!transporter) {
    console.log("\n========== E-MAIL ADMIN (simulé) ==========");
    console.log(`À : ${ADMIN_EMAIL}`);
    console.log(`Objet : ${subject}`);
    console.log(text);
    console.log("===========================================\n");
    return;
  }

  try {
    await transporter.sendMail({
      from: SMTP.from,
      to: ADMIN_EMAIL,
      subject,
      text,
    });
    console.log(`E-mail de commande ${order.id} envoyé à ${ADMIN_EMAIL}.`);
  } catch (err) {
    console.error("Échec de l'envoi de l'e-mail :", err.message);
  }
}
