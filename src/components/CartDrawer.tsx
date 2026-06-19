import type { CartLine } from "../domain/types";
import { formatPrice } from "../domain/logic";
import styles from "./CartDrawer.module.css";

interface CartDrawerProps {
  open: boolean;
  lines: CartLine[];
  totalCents: number;
  onClose: () => void;
  onSetQuantity: (
    productId: string,
    color: string,
    size: string,
    quantity: number
  ) => void;
  onRemove: (productId: string, color: string, size: string) => void;
  onCheckout: () => void;
}

export function CartDrawer({
  open,
  lines,
  totalCents,
  onClose,
  onSetQuantity,
  onRemove,
  onCheckout,
}: CartDrawerProps) {
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Panier"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Mon panier</h2>
          <button className={styles.close} onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>

        {lines.length === 0 ? (
          <p className={styles.empty}>Ton panier est vide.</p>
        ) : (
          <>
            <ul className={styles.lines}>
              {lines.map((l) => (
                <li
                  key={`${l.productId}-${l.color}-${l.size}`}
                  className={styles.line}
                >
                  <img className={styles.img} src={l.imageUrl} alt={l.name} />
                  <div className={styles.info}>
                    <span className={styles.name}>{l.name}</span>
                    <span className={styles.size}>
                      {l.color ? `${l.color} · ` : ""}Taille {l.size}
                    </span>
                    <span className={styles.linePrice}>
                      {formatPrice(l.priceCents)}
                    </span>
                    <div className={styles.qtyControl}>
                      <button
                        onClick={() =>
                          onSetQuantity(l.productId, l.color, l.size, l.quantity - 1)
                        }
                        aria-label="Diminuer"
                      >
                        −
                      </button>
                      <span>{l.quantity}</span>
                      <button
                        onClick={() =>
                          onSetQuantity(l.productId, l.color, l.size, l.quantity + 1)
                        }
                        disabled={l.quantity >= l.maxStock}
                        aria-label="Augmenter"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    className={styles.remove}
                    onClick={() => onRemove(l.productId, l.color, l.size)}
                    aria-label="Retirer"
                  >
                    🗑
                  </button>
                </li>
              ))}
            </ul>

            <footer className={styles.footer}>
              <div className={styles.totalRow}>
                <span>Total</span>
                <span className={styles.total}>{formatPrice(totalCents)}</span>
              </div>
              <button className={styles.checkout} onClick={onCheckout}>
                Passer la commande
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
