import { useState } from "react";
import type { GridMode, Product, SortKey } from "../domain/types";
import { ProductCard } from "./ProductCard";
import styles from "./ProductGrid.module.css";

interface ProductGridProps {
  products: Product[];
  mode: GridMode;
  sortKey: SortKey;
  favorites: Set<string>;
  onSort: (key: SortKey) => void;
  onPriceRange: (min: number | null, max: number | null) => void;
  onToggleFavorite: (productId: string) => void;
  onOpen: (product: Product) => void;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Nouveautés" },
  { value: "priceAsc", label: "Prix croissant" },
  { value: "priceDesc", label: "Prix décroissant" },
  { value: "nameAsc", label: "Nom (A-Z)" },
];

export function ProductGrid({
  products,
  mode,
  sortKey,
  favorites,
  onSort,
  onPriceRange,
  onToggleFavorite,
  onOpen,
}: ProductGridProps) {
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const applyPrice = () => {
    onPriceRange(
      min ? Number(min) : null,
      max ? Number(max) : null
    );
  };

  if (mode.kind === "empty") {
    return <p className={styles.message}>Le catalogue est vide pour le moment.</p>;
  }
  if (mode.kind === "noResults") {
    return (
      <p className={styles.message}>
        Aucun produit ne correspond à ta recherche.
      </p>
    );
  }

  return (
    <>
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {products.length} produit{products.length > 1 ? "s" : ""}
        </span>

        <div className={styles.controls}>
          <div className={styles.price}>
            <input
              className={styles.priceInput}
              type="number"
              min="0"
              placeholder="Min €"
              value={min}
              onChange={(e) => setMin(e.target.value)}
            />
            <span>–</span>
            <input
              className={styles.priceInput}
              type="number"
              min="0"
              placeholder="Max €"
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
            <button className={styles.priceBtn} onClick={applyPrice}>
              OK
            </button>
          </div>

          <label className={styles.sortLabel}>
            Trier
            <select
              className={styles.sortSelect}
              value={sortKey}
              onChange={(e) => onSort(e.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className={styles.grid}>
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            isFavorite={favorites.has(p.id)}
            onToggleFavorite={onToggleFavorite}
            onOpen={onOpen}
          />
        ))}
      </div>
    </>
  );
}
