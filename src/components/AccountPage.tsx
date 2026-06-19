import { useEffect, useState } from "react";
import { api, type Order } from "../api/client";
import { formatPrice } from "../domain/logic";
import type { Product } from "../domain/types";
import { ProductCard } from "./ProductCard";
import styles from "./AccountPage.module.css";

type Tab = "orders" | "favorites";

interface AccountPageProps {
  username: string;
  favorites: Set<string>;
  onToggleFavorite: (productId: string) => void;
  onOpen: (product: Product) => void;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "livrée"
      ? styles.stDone
      : status === "expédiée"
        ? styles.stShipped
        : status === "annulée"
          ? styles.stCancel
          : styles.stPaid;
  return <span className={`${styles.badge} ${cls}`}>{status}</span>;
}

export function AccountPage({
  username,
  favorites,
  onToggleFavorite,
  onOpen,
}: AccountPageProps) {
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [favs, setFavs] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        if (tab === "orders") {
          const d = await api.myOrders();
          if (!cancelled) setOrders(d);
        } else {
          const d = await api.myFavorites();
          if (!cancelled) setFavs(d);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, favorites]);

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Bonjour {username} 👋</h1>

      <div className={styles.tabs} role="tablist">
        <button
          className={`${styles.tab} ${tab === "orders" ? styles.active : ""}`}
          onClick={() => setTab("orders")}
        >
          Mes commandes
        </button>
        <button
          className={`${styles.tab} ${tab === "favorites" ? styles.active : ""}`}
          onClick={() => setTab("favorites")}
        >
          Mes favoris
        </button>
      </div>

      {loading ? (
        <p className={styles.empty}>Chargement…</p>
      ) : tab === "orders" ? (
        orders.length === 0 ? (
          <p className={styles.empty}>Tu n'as pas encore passé de commande.</p>
        ) : (
          <ul className={styles.orders}>
            {orders.map((o) => (
              <li key={o.id} className={styles.order}>
                <div className={styles.orderHead}>
                  <span className={styles.orderDate}>
                    Commande du{" "}
                    {new Date(o.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                  <StatusBadge status={o.status} />
                  <span className={styles.orderTotal}>
                    {formatPrice(o.totalCents)}
                  </span>
                </div>
                <ul className={styles.items}>
                  {o.items.map((it, i) => (
                    <li key={i} className={styles.item}>
                      <img
                        className={styles.itemImg}
                        src={it.imageUrl}
                        alt={it.name}
                      />
                      <span className={styles.itemName}>
                        {it.quantity} × {it.name}
                        <span className={styles.itemSize}>
                          {it.color ? ` · ${it.color}` : ""} · {it.size}
                        </span>
                      </span>
                      <span className={styles.itemPrice}>
                        {formatPrice(it.unitPriceCents * it.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className={styles.shipping}>
                  {o.deliveryMethod} · Paiement {o.paymentMethod}
                  <br />
                  Livraison : {o.shipping.fullName}, {o.shipping.address},{" "}
                  {o.shipping.zip} {o.shipping.city}
                </p>
              </li>
            ))}
          </ul>
        )
      ) : favs.length === 0 ? (
        <p className={styles.empty}>
          Aucun favori. Clique sur ❤️ sur un produit.
        </p>
      ) : (
        <div className={styles.grid}>
          {favs.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              isFavorite={favorites.has(p.id)}
              onToggleFavorite={onToggleFavorite}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}
