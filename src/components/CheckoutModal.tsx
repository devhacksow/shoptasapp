import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError, type Order } from "../api/client";
import type { CartLine, DeliveryMethod, PaymentMethod } from "../domain/types";
import { formatPrice } from "../domain/logic";
import {
  detectBrand,
  formatCardNumber,
  formatExpiry,
  luhnValid,
  validCvc,
  validExpiry,
} from "../domain/payment";
import styles from "./CheckoutModal.module.css";

interface CheckoutModalProps {
  open: boolean;
  lines: CartLine[];
  totalCents: number;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}

export function CheckoutModal({
  open,
  lines,
  totalCents,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [deliveryId, setDeliveryId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  // Détails de paiement (simulés)
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [paypalConnected, setPaypalConnected] = useState(false);
  const [applePayReady, setApplePayReady] = useState(false);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPaypalConnected(false);
    setApplePayReady(false);
    setError(null);
    api.paymentsConfig().then((c) => setStripeEnabled(c.enabled)).catch(() => {});
    api
      .getOptions()
      .then((o) => {
        setDeliveryMethods(o.deliveryMethods);
        setPaymentMethods(o.paymentMethods);
        setDeliveryId((prev) => prev || o.deliveryMethods[0]?.id || "");
        setPaymentId((prev) => prev || o.paymentMethods[0]?.id || "");
      })
      .catch(() => {});
  }, [open]);

  // Réinitialise l'autorisation simulée quand on change de moyen de paiement.
  useEffect(() => {
    setPaypalConnected(false);
    setApplePayReady(false);
  }, [paymentId]);

  if (!open) return null;

  const delivery = deliveryMethods.find((d) => d.id === deliveryId);
  const deliveryCents = delivery?.priceCents ?? 0;
  const grandTotal = totalCents + deliveryCents;
  const cardBrand = detectBrand(cardNumber);

  const useStripeForCard = stripeEnabled && paymentId === "cb";
  // Carte, PayPal et Apple Pay passent par Stripe ; le virement reste manuel.
  const useStripeOnline =
    stripeEnabled && ["cb", "paypal", "applepay"].includes(paymentId);

  // Valide les détails du moyen de paiement sélectionné (simulation hors Stripe).
  const validatePayment = (): string | null => {
    if (useStripeOnline) return null; // Stripe gère la saisie
    if (paymentId === "cb") {
      if (!cardName.trim()) return "Indique le nom du titulaire de la carte.";
      if (!luhnValid(cardNumber)) return "Numéro de carte invalide.";
      if (!validExpiry(cardExpiry)) return "Date d'expiration invalide ou dépassée.";
      if (!validCvc(cardCvc, cardBrand)) return "Code de sécurité (CVC) invalide.";
    } else if (paymentId === "paypal") {
      if (!paypalConnected) return "Connecte-toi à PayPal pour continuer.";
    } else if (paymentId === "applepay") {
      if (!applePayReady) return "Autorise le paiement Apple Pay pour continuer.";
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const paymentError = validatePayment();
    if (paymentError) {
      setError(paymentError);
      return;
    }

    const shipping = {
      fullName: fullName.trim(),
      address: address.trim(),
      city: city.trim(),
      zip: zip.trim(),
    };
    const orderItems = lines.map((l) => ({
      productId: l.productId,
      color: l.color,
      size: l.size,
      quantity: l.quantity,
    }));

    setSubmitting(true);
    try {
      // Paiement en ligne réel via Stripe → redirection vers la page sécurisée.
      if (useStripeOnline) {
        const { url } = await api.createStripeSession({
          shipping,
          items: orderItems,
          deliveryMethodId: deliveryId,
          paymentMethodId: paymentId,
        });
        window.location.href = url;
        return;
      }

      // Virement (et repli si Stripe désactivé) → création directe de la commande.
      const order = await api.checkout({
        shipping,
        items: orderItems,
        deliveryMethodId: deliveryId,
        paymentMethodId: paymentId,
      });
      onSuccess(order);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Échec de la commande.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Commande"
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.close} onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        <h2 className={styles.title}>Finaliser ma commande</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Livraison</legend>
            <label className={styles.label}>
              Nom complet
              <input
                className={styles.input}
                value={fullName}
                required
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Adresse
              <input
                className={styles.input}
                value={address}
                required
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>
            <div className={styles.row}>
              <label className={styles.label}>
                Ville
                <input
                  className={styles.input}
                  value={city}
                  required
                  onChange={(e) => setCity(e.target.value)}
                />
              </label>
              <label className={styles.label}>
                Code postal
                <input
                  className={styles.input}
                  value={zip}
                  required
                  onChange={(e) => setZip(e.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Mode de livraison</legend>
            {deliveryMethods.map((d) => (
              <label key={d.id} className={styles.option}>
                <input
                  type="radio"
                  name="delivery"
                  checked={deliveryId === d.id}
                  onChange={() => setDeliveryId(d.id)}
                />
                <span className={styles.optionMain}>
                  <span>{d.label}</span>
                  <span className={styles.optionMeta}>{d.delay}</span>
                </span>
                <span className={styles.optionPrice}>
                  {d.priceCents === 0 ? "Gratuit" : formatPrice(d.priceCents)}
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Paiement</legend>
            <div className={styles.payGrid}>
              {paymentMethods.map((p) => (
                <label
                  key={p.id}
                  className={`${styles.payOption} ${
                    paymentId === p.id ? styles.payActive : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentId === p.id}
                    onChange={() => setPaymentId(p.id)}
                  />
                  {p.label}
                </label>
              ))}
            </div>

            {paymentId === "cb" && useStripeForCard && (
              <div className={styles.payDetails}>
                <p className={styles.stripeNote}>
                  🔒 Paiement sécurisé par Stripe. Tu seras redirigé vers la page
                  de paiement pour saisir ta carte, puis ramené à la boutique.
                </p>
                <p className={styles.transferNote}>
                  Carte de test : 4242 4242 4242 4242, date future, CVC au choix.
                </p>
              </div>
            )}

            {paymentId === "cb" && !useStripeForCard && (
              <div className={styles.payDetails}>
                <label className={styles.label}>
                  Nom du titulaire
                  <input
                    className={styles.input}
                    value={cardName}
                    placeholder="Tel qu'inscrit sur la carte"
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </label>
                <label className={styles.label}>
                  Numéro de carte
                  <div className={styles.cardNumberWrap}>
                    <input
                      className={styles.input}
                      value={cardNumber}
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      onChange={(e) =>
                        setCardNumber(formatCardNumber(e.target.value))
                      }
                    />
                    {cardNumber.length >= 2 && (
                      <span className={styles.brand}>{cardBrand}</span>
                    )}
                  </div>
                </label>
                <div className={styles.row}>
                  <label className={styles.label}>
                    Expiration
                    <input
                      className={styles.input}
                      value={cardExpiry}
                      inputMode="numeric"
                      placeholder="MM/AA"
                      onChange={(e) =>
                        setCardExpiry(formatExpiry(e.target.value))
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    CVC
                    <input
                      className={styles.input}
                      value={cardCvc}
                      inputMode="numeric"
                      placeholder="123"
                      maxLength={4}
                      onChange={(e) =>
                        setCardCvc(e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </label>
                </div>
              </div>
            )}

            {paymentId === "paypal" && (
              <div className={styles.payDetails}>
                {stripeEnabled ? (
                  <p className={styles.stripeNote}>
                    🔒 Tu seras redirigé vers Stripe pour régler avec ton compte
                    PayPal en toute sécurité.
                  </p>
                ) : paypalConnected ? (
                  <p className={styles.paypalOk}>
                    ✓ Connecté à PayPal — prêt à payer.
                  </p>
                ) : (
                  <button
                    type="button"
                    className={styles.paypalBtn}
                    onClick={() => setPaypalConnected(true)}
                  >
                    Se connecter à PayPal
                  </button>
                )}
              </div>
            )}

            {paymentId === "applepay" && (
              <div className={styles.payDetails}>
                {stripeEnabled ? (
                  <p className={styles.stripeNote}>
                    🔒 Tu seras redirigé vers Stripe ; Apple Pay s'affiche sur
                    Safari et les appareils compatibles.
                  </p>
                ) : applePayReady ? (
                  <p className={styles.paypalOk}>✓ Apple Pay autorisé.</p>
                ) : (
                  <button
                    type="button"
                    className={styles.applePayBtn}
                    onClick={() => setApplePayReady(true)}
                  >
                     Payer avec Apple Pay
                  </button>
                )}
              </div>
            )}

            {paymentId === "virement" && (
              <div className={styles.payDetails}>
                <p className={styles.transferNote}>
                  Effectue un virement du montant total vers :
                </p>
                <div className={styles.iban}>
                  <div>
                    <strong>Bénéficiaire :</strong> ShopTaSapp SAS
                  </div>
                  <div>
                    <strong>IBAN :</strong> FR76 3000 4000 0312 3456 7890 143
                  </div>
                  <div>
                    <strong>BIC :</strong> BNPAFRPPXXX
                  </div>
                </div>
                <p className={styles.transferNote}>
                  Ta commande sera préparée à réception du virement (référence :
                  ton nom).
                </p>
              </div>
            )}
          </fieldset>

          <div className={styles.summary}>
            <div className={styles.sumLine}>
              <span>Articles</span>
              <span>{formatPrice(totalCents)}</span>
            </div>
            <div className={styles.sumLine}>
              <span>Livraison</span>
              <span>
                {deliveryCents === 0 ? "Gratuit" : formatPrice(deliveryCents)}
              </span>
            </div>
            <div className={styles.sumTotal}>
              <span>Total</span>
              <span>{formatPrice(grandTotal)}</span>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.pay} type="submit" disabled={submitting}>
            {submitting
              ? "Traitement…"
              : useStripeOnline
                ? `Payer ${formatPrice(grandTotal)}`
                : `Payer ${formatPrice(grandTotal)}`}
          </button>
          <p className={styles.note}>
            {useStripeOnline
              ? "Paiement réel sécurisé via Stripe."
              : "Virement bancaire — commande préparée à réception du paiement."}
          </p>
        </form>
      </div>
    </div>
  );
}
