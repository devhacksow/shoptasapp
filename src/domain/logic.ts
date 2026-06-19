/** Formate un prix en centimes vers une chaîne d'affichage (ex. "12,99 €"). */
export function formatPrice(amountCents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
}

/** Renvoie l'année d'une date sous forme de chaîne à quatre chiffres. */
export function copyrightYear(now: Date): string {
  return String(now.getFullYear()).padStart(4, "0");
}
