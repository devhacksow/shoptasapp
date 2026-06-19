import { useEffect, useMemo, useState } from "react";
import type { Product } from "../domain/types";
import { formatPrice } from "../domain/logic";
import styles from "./ProductDetailModal.module.css";

const FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='720'>
       <rect width='100%' height='100%' fill='#e5e7eb'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
         fill='#6b7280' font-family='sans-serif' font-size='24'>Image indisponible</text>
     </svg>`
  );

interface ProductDetailModalProps {
  product: Product | null;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    color: string,
    size: string,
    quantity: number,
    maxStock: number
  ) => void;
}

export function ProductDetailModal({
  product,
  isFavorite,
  onToggleFavorite,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [src, setSrc] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setSrc(product.imageUrl);
      setColor(product.colors.length === 1 ? product.colors[0]! : null);
      setSize(null);
      setQty(1);
      setError(null);
    }
  }, [product]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (product) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  // Tailles disponibles pour la couleur sélectionnée
  const sizesForColor = useMemo(() => {
    if (!product) return [];
    return product.variants.filter((v) => !color || v.color === color);
  }, [product, color]);

  if (!product) return null;

  const selectedVariant = product.variants.find(
    (v) => v.color === color && v.size === size
  );
  const maxStock = selectedVariant?.stock ?? 0;

  const handleAdd = () => {
    if (product.colors.length > 0 && !color) {
      setError("Choisis une couleur.");
      return;
    }
    if (!size) {
      setError("Choisis une taille.");
      return;
    }
    if (maxStock < 1) {
      setError("Cette déclinaison est en rupture de stock.");
      return;
    }
    onAddToCart(product, color ?? "", size, qty, maxStock);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.close} onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        <div className={styles.media}>
          <img
            className={styles.image}
            src={src}
            alt={product.name}
            onError={() => setSrc(FALLBACK)}
          />
        </div>

        <div className={styles.info}>
          <span className={styles.brand}>{product.brand}</span>
          <h2 className={styles.name}>{product.name}</h2>
          <p className={styles.price}>{formatPrice(product.priceCents)}</p>
          <p className={styles.description}>{product.description}</p>

          {product.colors.length > 0 && (
            <div className={styles.block}>
              <span className={styles.label}>
                Couleur{color ? ` : ${color}` : ""}
              </span>
              <div className={styles.chipList}>
                {product.colors.map((c) => (
                  <button
                    key={c}
                    className={`${styles.chip} ${color === c ? styles.chipActive : ""}`}
                    onClick={() => {
                      setColor(c);
                      setSize(null);
                      setQty(1);
                      setError(null);
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.block}>
            <span className={styles.label}>Taille</span>
            <div className={styles.chipList}>
              {sizesForColor.map((v) => (
                <button
                  key={v.id}
                  className={`${styles.sizeBtn} ${
                    size === v.size ? styles.sizeActive : ""
                  }`}
                  disabled={v.stock < 1}
                  onClick={() => {
                    setSize(v.size);
                    setQty(1);
                    setError(null);
                  }}
                >
                  {v.size}
                </button>
              ))}
            </div>
            {selectedVariant && (
              <span className={styles.stockHint}>
                {selectedVariant.stock > 0
                  ? `${selectedVariant.stock} en stock`
                  : "Rupture de stock"}
              </span>
            )}
          </div>

          {size && maxStock > 0 && (
            <div className={styles.qtyRow}>
              <span className={styles.label}>Quantité</span>
              <div className={styles.qtyControl}>
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Diminuer"
                >
                  −
                </button>
                <span>{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(maxStock, q + 1))}
                  aria-label="Augmenter"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button
              className={styles.addBtn}
              onClick={handleAdd}
              disabled={!product.inStock}
            >
              {product.inStock ? "Ajouter au panier" : "Produit épuisé"}
            </button>
            <button
              className={`${styles.fav} ${isFavorite ? styles.favActive : ""}`}
              onClick={() => onToggleFavorite(product.id)}
              aria-pressed={isFavorite}
              aria-label="Favori"
            >
              {isFavorite ? "❤️" : "🤍"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
