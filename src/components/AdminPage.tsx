import { useCallback, useEffect, useState } from "react";
import {
  api,
  type AdminOrder,
  type AdminStats,
  type AdminUser,
} from "../api/client";
import { formatPrice } from "../domain/logic";
import type { Category, Product } from "../domain/types";
import { ProductFormModal } from "./ProductFormModal";
import styles from "./AdminPage.module.css";

type Tab = "products" | "orders" | "users";

interface AdminPageProps {
  categories: Category[];
  onCatalogChanged: () => void;
}

export function AdminPage({ categories, onCatalogChanged }: AdminPageProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const loadStats = useCallback(() => {
    api.adminStats().then(setStats).catch(() => {});
  }, []);

  const loadProducts = useCallback(() => {
    api.adminProducts().then(setProducts).catch(() => {});
  }, []);

  useEffect(() => {
    loadStats();
    api.adminOrderStatuses().then(setStatuses).catch(() => {});
  }, [loadStats]);

  useEffect(() => {
    if (tab === "products") loadProducts();
    else if (tab === "orders") api.adminOrders().then(setOrders).catch(() => {});
    else api.adminUsers().then(setUsers).catch(() => {});
  }, [tab, loadProducts]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer ce produit ?")) return;
    await api.adminDeleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    loadStats();
    onCatalogChanged();
  };

  const handleStatus = async (id: string, status: string) => {
    const updated = await api.adminSetOrderStatus(id, status);
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: updated.status } : o))
    );
  };

  const afterSave = () => {
    loadProducts();
    loadStats();
    onCatalogChanged();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Espace administrateur</h1>
        <span className={styles.badge}>🔒 Réservé</span>
      </div>

      {stats && (
        <div className={styles.stats}>
          <Stat n={stats.users} label="Utilisateurs" />
          <Stat n={stats.products} label="Produits" />
          <Stat n={stats.orders} label="Commandes" />
          <Stat n={formatPrice(stats.revenueCents)} label="Chiffre d'affaires" />
          <Stat n={stats.lowStock} label="Stock faible (≤3)" />
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "products" ? styles.active : ""}`}
          onClick={() => setTab("products")}
        >
          Produits
        </button>
        <button
          className={`${styles.tab} ${tab === "orders" ? styles.active : ""}`}
          onClick={() => setTab("orders")}
        >
          Commandes
        </button>
        <button
          className={`${styles.tab} ${tab === "users" ? styles.active : ""}`}
          onClick={() => setTab("users")}
        >
          Utilisateurs
        </button>
      </div>

      {tab === "products" && (
        <>
          <div className={styles.actionsBar}>
            <button
              className={styles.primary}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              + Nouveau produit
            </button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Prix</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.categoryId}</td>
                    <td>{formatPrice(p.priceCents)}</td>
                    <td className={p.totalStock <= 3 ? styles.low : ""}>
                      {p.totalStock}
                    </td>
                    <td className={styles.rowActions}>
                      <button
                        className={styles.edit}
                        onClick={() => {
                          setEditing(p);
                          setFormOpen(true);
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        className={styles.delete}
                        onClick={() => handleDelete(p.id)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "orders" && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Acheteur</th>
                <th>Articles</th>
                <th>Montant</th>
                <th>Date</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    Aucune commande.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.buyer}</td>
                    <td>{o.itemCount}</td>
                    <td>{formatPrice(o.totalCents)}</td>
                    <td>{new Date(o.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td>
                      <select
                        className={styles.statusSelect}
                        value={o.status}
                        onChange={(e) => handleStatus(o.id, e.target.value)}
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "users" && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>E-mail</th>
                <th>Rôle</th>
                <th>Commandes</th>
                <th>Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span
                      className={
                        u.role === "admin" ? styles.roleAdmin : styles.roleUser
                      }
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>{u.orders_count}</td>
                  <td>{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductFormModal
        open={formOpen}
        product={editing}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSaved={afterSave}
      />
    </div>
  );
}

function Stat({ n, label }: { n: number | string; label: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statNum}>{n}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
