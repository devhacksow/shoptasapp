/** Identifiant de la section catalogue. */
export const CATALOG_ID = "catalogue";

/** Défile de manière fluide jusqu'au haut de la page. */
export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** Défile de manière fluide jusqu'à la section catalogue. */
export function scrollToCatalog(): void {
  const el = document.getElementById(CATALOG_ID);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
