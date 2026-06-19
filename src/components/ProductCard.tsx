import { useState } from "react";
import type { Product } from "../domain/types";
import { formatPrice } from "../domain/logic";
import styles from "./ProductCard.module.css";

const FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='500' height='600'>
       <rect width='100%' height='100%' fill='#e5e7eb'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
         fill='#6b7280' font-family='sans-serif' font-size='22'>Image indisponible</text>
     </svg>`
  );

interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
  onOpen: (product: Product) => void;
}

export function ProductCard({
  product,
  isFavorite,
  onToggleFavorite,
  onOpen,
}: ProductCardProps) {
  const [src, setSrc] = useState(product.imageUrl);

  return (
    <article
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(product)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(product);
        }
      }}
    >
      <div className={styles.imageWrap}>
        <img
          className={styles.image}
          src={src}
          alt={product.name}
          loading="lazy"
          onError={() => setSrc(FALLBACK)}
        />
        {!product.inStock && <span className={styles.soldOut}>Épuisé</span>}
        <button
          className={`${styles.fav} ${isFavorite ? styles.favActive : ""}`}
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={isFavorite}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
        >
          {isFavorite ? "❤️" : "🤍"}
        </button>
      </div>
      <div className={styles.body}>
        <span className={styles.brand}>{product.brand}</span>
        <h3 className={styles.name}>{product.name}</h3>
        <span className={styles.price}>{formatPrice(product.priceCents)}</span>
      </div>
    </article>
  );
}
