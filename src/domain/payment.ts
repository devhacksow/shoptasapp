/** Utilitaires de validation/format des moyens de paiement (côté client, simulé). */

/** Valide un numéro de carte via l'algorithme de Luhn. */
export function luhnValid(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\s+/g, "");
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** Formate un numéro de carte en groupes de 4 chiffres. */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** Formate une date d'expiration en MM/AA. */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** Vérifie qu'une date d'expiration MM/AA est valide et non dépassée. */
export function validExpiry(mmYY: string): boolean {
  const m = mmYY.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  // Dernier jour du mois d'expiration
  const expiry = new Date(year, month, 0, 23, 59, 59);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return expiry >= today;
}

/** Détecte la marque de la carte à partir des premiers chiffres. */
export function detectBrand(cardNumber: string): string {
  const d = cardNumber.replace(/\s+/g, "");
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "American Express";
  return "Carte";
}

/** Valide un CVC (3 chiffres, 4 pour Amex). */
export function validCvc(cvc: string, brand: string): boolean {
  const expected = brand === "American Express" ? 4 : 3;
  return new RegExp(`^\\d{${expected}}$`).test(cvc);
}
