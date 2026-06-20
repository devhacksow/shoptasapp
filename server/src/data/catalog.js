// Catalogue de démonstration façon boutique de prêt-à-porter homme (type Jules).

export const categories = [
  { id: "tshirts", label: "T-shirts & Polos", visual: "👕" },
  { id: "chemises", label: "Chemises", visual: "👔" },
  { id: "pulls", label: "Pulls & Gilets", visual: "🧥" },
  { id: "pantalons", label: "Pantalons & Jeans", visual: "👖" },
  { id: "vestes", label: "Vestes & Manteaux", visual: "🧥" },
  { id: "chaussures", label: "Chaussures", visual: "👟" },
  { id: "accessoires", label: "Accessoires", visual: "🧢" },
];

// Image correspondant à l'article via LoremFlickr (mots-clés), verrouillée pour
// rester stable d'un chargement à l'autre.
const img = (kw, lock) =>
  `https://loremflickr.com/500/600/${encodeURIComponent(kw)}?lock=${lock}`;

const APPAREL_SIZES = ["S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["40", "41", "42", "43", "44", "45"];

// Génère des variantes couleur × taille avec un stock décroissant.
function variants(colors, sizes, baseStock) {
  const out = [];
  colors.forEach((color, ci) => {
    sizes.forEach((size, si) => {
      out.push({ color, size, stock: Math.max(0, baseStock - ci * 3 - si * 2) });
    });
  });
  return out;
}

const raw = [
  { id: "p1", name: "T-shirt col rond coton bio", kw: "tshirt", categoryId: "tshirts", priceCents: 1299, colors: ["Blanc", "Noir", "Bleu marine"], sizes: APPAREL_SIZES, stock: 14 },
  { id: "p2", name: "Polo piqué manches courtes", kw: "polo,shirt", categoryId: "tshirts", priceCents: 2499, colors: ["Blanc", "Vert"], sizes: APPAREL_SIZES, stock: 12 },
  { id: "p3", name: "T-shirt imprimé graphique", kw: "tshirt", categoryId: "tshirts", priceCents: 1599, colors: ["Noir", "Gris"], sizes: APPAREL_SIZES, stock: 10 },
  { id: "p4", name: "Chemise en lin manches longues", kw: "linen,shirt", categoryId: "chemises", priceCents: 3999, colors: ["Beige", "Bleu ciel"], sizes: APPAREL_SIZES, stock: 11 },
  { id: "p5", name: "Chemise oxford coupe droite", kw: "shirt", categoryId: "chemises", priceCents: 3499, colors: ["Blanc", "Bleu"], sizes: APPAREL_SIZES, stock: 12 },
  { id: "p6", name: "Chemise à carreaux flanelle", kw: "flannel,shirt", categoryId: "chemises", priceCents: 3799, colors: ["Rouge", "Vert"], sizes: APPAREL_SIZES, stock: 8 },
  { id: "p7", name: "Pull col rond maille fine", kw: "sweater", categoryId: "pulls", priceCents: 3299, colors: ["Gris", "Bordeaux", "Noir"], sizes: APPAREL_SIZES, stock: 12 },
  { id: "p8", name: "Gilet zippé en maille", kw: "cardigan", categoryId: "pulls", priceCents: 4299, colors: ["Anthracite", "Camel"], sizes: APPAREL_SIZES, stock: 9 },
  { id: "p9", name: "Pull col camionneur", kw: "turtleneck,sweater", categoryId: "pulls", priceCents: 4599, colors: ["Écru", "Bleu marine"], sizes: APPAREL_SIZES, stock: 7 },
  { id: "p10", name: "Jean slim brut", kw: "jeans,denim", categoryId: "pantalons", priceCents: 4999, colors: ["Brut", "Noir"], sizes: APPAREL_SIZES, stock: 16 },
  { id: "p11", name: "Chino coupe ajustée", kw: "chino,trousers", categoryId: "pantalons", priceCents: 3999, colors: ["Beige", "Kaki", "Marine"], sizes: APPAREL_SIZES, stock: 14 },
  { id: "p12", name: "Pantalon cargo coton", kw: "cargo,pants", categoryId: "pantalons", priceCents: 4499, colors: ["Kaki", "Noir"], sizes: APPAREL_SIZES, stock: 10 },
  { id: "p13", name: "Veste en jean délavée", kw: "denim,jacket", categoryId: "vestes", priceCents: 5999, colors: ["Bleu clair", "Bleu foncé"], sizes: APPAREL_SIZES, stock: 8 },
  { id: "p14", name: "Bomber matelassé", kw: "bomber,jacket", categoryId: "vestes", priceCents: 7999, colors: ["Noir", "Kaki"], sizes: APPAREL_SIZES, stock: 7 },
  { id: "p15", name: "Manteau en laine mélangée", kw: "wool,coat", categoryId: "vestes", priceCents: 9999, colors: ["Camel", "Anthracite"], sizes: APPAREL_SIZES, stock: 6 },
  { id: "p16", name: "Baskets basses en cuir", kw: "sneakers", categoryId: "chaussures", priceCents: 6499, colors: ["Blanc", "Noir"], sizes: SHOE_SIZES, stock: 12 },
  { id: "p17", name: "Sneakers running urbaines", kw: "running,shoes", categoryId: "chaussures", priceCents: 5999, colors: ["Gris", "Bleu"], sizes: SHOE_SIZES, stock: 11 },
  { id: "p18", name: "Bottines chukka daim", kw: "boots", categoryId: "chaussures", priceCents: 7999, colors: ["Camel", "Marron"], sizes: SHOE_SIZES, stock: 8 },
  { id: "p19", name: "Casquette coton brodée", kw: "cap,hat", categoryId: "accessoires", priceCents: 1799, colors: ["Noir", "Beige"], sizes: ["TU"], stock: 22 },
  { id: "p20", name: "Ceinture cuir réversible", kw: "leather,belt", categoryId: "accessoires", priceCents: 2499, colors: ["Noir/Marron"], sizes: ["85", "90", "95", "100"], stock: 12 },
  { id: "p21", name: "Bonnet maille côtelée", kw: "beanie,hat", categoryId: "accessoires", priceCents: 1499, colors: ["Gris", "Noir", "Bordeaux"], sizes: ["TU"], stock: 20 },
  { id: "p22", name: "Écharpe laine unie", kw: "scarf", categoryId: "accessoires", priceCents: 1999, colors: ["Camel", "Gris", "Marine"], sizes: ["TU"], stock: 16 },
];

export const products = raw.map((p, i) => ({
  id: p.id,
  name: p.name,
  brand: "ShopTaSapp",
  categoryId: p.categoryId,
  priceCents: p.priceCents,
  imageUrl: img(p.kw, i + 1),
  description: `${p.name} — coupe soignée et matières de qualité, signée ShopTaSapp. Un essentiel du vestiaire masculin, facile à associer au quotidien.`,
  variants: variants(p.colors, p.sizes, p.stock),
}));
