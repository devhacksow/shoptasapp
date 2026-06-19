import { useEffect, useMemo, useState } from "react";
import { footerGroups, socialLinks } from "./data/demoData";
import { useShop } from "./state/useShop";
import { useAuth } from "./state/useAuth";
import { useCart } from "./state/useCart";
import { api, ApiError, type Order } from "./api/client";
import { scrollToCatalog, scrollToTop, CATALOG_ID } from "./utils/scroll";
import { NavigationBar } from "./components/NavigationBar";
import { HeroSection } from "./components/HeroSection";
import { CategorySection } from "./components/CategorySection";
import { ProductGrid } from "./components/ProductGrid";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { CartDrawer } from "./components/CartDrawer";
import { CheckoutModal } from "./components/CheckoutModal";
import { AuthModal } from "./components/AuthModal";
import { AccountPage } from "./components/AccountPage";
import { AdminPage } from "./components/AdminPage";
import { Footer } from "./components/Footer";
import { InfoModal } from "./components/InfoModal";
import { footerContent, type InfoPage } from "./data/footerContent";
import type { Product } from "./domain/types";
import styles from "./App.module.css";

type View = "home" | "account" | "admin";

export default function App() {
  const shop = useShop();
  const auth = useAuth();
  const cart = useCart();

  const [view, setView] = useState<View>("home");
  const [selected, setSelected] = useState<Product | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [infoPage, setInfoPage] = useState<InfoPage | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Capture le retour de paiement Stripe depuis l'URL (une seule fois).
  const [stripeReturn] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("checkout");
    const sessionId = params.get("session_id");
    if (status) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    return { status, sessionId };
  });
  const [stripeHandled, setStripeHandled] = useState(false);

  const favorites = useMemo(
    () => new Set(auth.user?.favorites ?? []),
    [auth.user]
  );

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  const goHome = () => {
    setView("home");
    scrollToTop();
  };

  // Finalise la commande après retour de Stripe.
  useEffect(() => {
    if (stripeHandled) return;
    if (stripeReturn.status === "cancel") {
      setStripeHandled(true);
      showToast("Paiement annulé. Ton panier est conservé.");
      return;
    }
    if (stripeReturn.status === "success" && stripeReturn.sessionId) {
      if (auth.loading) return; // attend la restauration de session
      if (!auth.user) return;
      setStripeHandled(true);
      api
        .confirmStripe(stripeReturn.sessionId)
        .then((order) => {
          cart.clear();
          showToast(
            `Paiement réussi ! Commande confirmée — ${(order.totalCents / 100).toFixed(2)} € 🎉`
          );
          setView("account");
        })
        .catch((e) =>
          showToast(
            e instanceof ApiError ? e.message : "Confirmation du paiement impossible."
          )
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripeReturn, stripeHandled, auth.loading, auth.user]);

  const handleToggleFavorite = async (productId: string) => {
    if (!auth.user) {
      setAuthOpen(true);
      return;
    }
    try {
      const updated = await api.toggleFavorite(productId);
      auth.setFavorites(updated);
    } catch {
      /* silencieux */
    }
  };

  const handleAddToCart = (
    product: Product,
    color: string,
    size: string,
    quantity: number,
    maxStock: number
  ) => {
    cart.add(product, color, size, quantity, maxStock);
    const variant = [color, size].filter(Boolean).join(" / ");
    showToast(`${product.name} (${variant}) ajouté au panier 🛒`);
    setCartOpen(true);
  };

  const handleCheckout = () => {
    if (!auth.user) {
      setCartOpen(false);
      setAuthOpen(true);
      return;
    }
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handleOrderSuccess = (order: Order) => {
    cart.clear();
    setCheckoutOpen(false);
    showToast(`Commande confirmée ! Total ${(order.totalCents / 100).toFixed(2)} € 🎉`);
    setView("account");
  };

  const handleLogout = () => {
    setView("home");
    auth.logout();
  };

  const isAdmin = auth.user?.role === "admin";

  return (
    <>
      <NavigationBar
        searchError={shop.searchError}
        cartCount={cart.count}
        username={auth.user?.username ?? null}
        role={auth.user?.role ?? null}
        onSearch={shop.setSearch}
        onSearchChange={shop.setSearch}
        onLogoClick={goHome}
        onCart={() => setCartOpen(true)}
        onAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
        onAccount={() => setView("account")}
        onAdmin={() => setView("admin")}
      />

      <main className={styles.main}>
        {view === "account" && auth.user ? (
          <AccountPage
            username={auth.user.username}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onOpen={setSelected}
          />
        ) : view === "admin" && isAdmin ? (
          <AdminPage
            categories={shop.categories}
            onCatalogChanged={shop.reload}
          />
        ) : (
          <>
            <HeroSection onShopNow={scrollToCatalog} />

            <CategorySection
              categories={shop.categories}
              activeCategory={shop.filters.category}
              onSelect={shop.selectCategory}
            />

            <section id={CATALOG_ID} aria-label="Catalogue">
              <h2 className={styles.gridHeading}>Notre sélection</h2>
              {shop.loadError && (
                <p className={styles.loadError} role="alert">
                  {shop.loadError}
                </p>
              )}
              {shop.loading ? (
                <p className={styles.loading}>Chargement des produits…</p>
              ) : (
                <ProductGrid
                  products={shop.products}
                  mode={shop.gridMode}
                  sortKey={shop.filters.sort}
                  favorites={favorites}
                  onSort={shop.setSort}
                  onPriceRange={shop.setPriceRange}
                  onToggleFavorite={handleToggleFavorite}
                  onOpen={setSelected}
                />
              )}
            </section>
          </>
        )}

        <Footer
          groups={footerGroups}
          socialLinks={socialLinks}
          onOpenPage={(href) => setInfoPage(footerContent[href] ?? null)}
        />
      </main>

      <ProductDetailModal
        product={selected}
        isFavorite={selected ? favorites.has(selected.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onClose={() => setSelected(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        open={cartOpen}
        lines={cart.lines}
        totalCents={cart.totalCents}
        onClose={() => setCartOpen(false)}
        onSetQuantity={cart.setQuantity}
        onRemove={cart.remove}
        onCheckout={handleCheckout}
      />

      <CheckoutModal
        open={checkoutOpen}
        lines={cart.lines}
        totalCents={cart.totalCents}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={handleOrderSuccess}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onRegister={auth.register}
        onLogin={auth.login}
        onGoogle={auth.loginWithGoogle}
      />

      {toast && <div className={styles.toast}>{toast}</div>}

      <InfoModal page={infoPage} onClose={() => setInfoPage(null)} />
    </>
  );
}
