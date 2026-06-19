import { useState } from "react";
import { SearchComponent } from "./SearchComponent";
import styles from "./NavigationBar.module.css";

interface NavigationBarProps {
  searchError: string | null;
  cartCount: number;
  username: string | null;
  role: "user" | "admin" | null;
  onSearch: (term: string) => void;
  onSearchChange: (term: string) => void;
  onLogoClick: () => void;
  onCart: () => void;
  onAuth: () => void;
  onLogout: () => void;
  onAccount: () => void;
  onAdmin: () => void;
}

export function NavigationBar({
  searchError,
  cartCount,
  username,
  role,
  onSearch,
  onSearchChange,
  onLogoClick,
  onCart,
  onAuth,
  onLogout,
  onAccount,
  onAdmin,
}: NavigationBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const cartButton = (
    <button className={styles.cart} onClick={onCart} aria-label="Panier">
      🛒
      {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
    </button>
  );

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <button
          className={styles.logo}
          onClick={onLogoClick}
          aria-label="Retour à l'accueil"
        >
          ShopTaSapp
        </button>

        <SearchComponent
          error={searchError}
          onSubmit={onSearch}
          onChange={onSearchChange}
        />

        <nav className={styles.actions} aria-label="Actions principales">
          {role === "admin" && (
            <button className={styles.admin} onClick={onAdmin}>
              🔒 Admin
            </button>
          )}
          {cartButton}
          {username ? (
            <div className={styles.userBox}>
              <button className={styles.user} onClick={onAccount}>
                👤 {username}
              </button>
              <button className={styles.signin} onClick={onLogout}>
                Déconnexion
              </button>
            </div>
          ) : (
            <button className={styles.signin} onClick={onAuth}>
              Se connecter
            </button>
          )}
        </nav>

        <div className={styles.mobileRight}>
          {cartButton}
          <button
            className={styles.burger}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          {role === "admin" && (
            <button className={styles.admin} onClick={onAdmin}>
              🔒 Espace admin
            </button>
          )}
          {username ? (
            <>
              <button className={styles.user} onClick={onAccount}>
                👤 Mon compte ({username})
              </button>
              <button className={styles.signin} onClick={onLogout}>
                Déconnexion
              </button>
            </>
          ) : (
            <button className={styles.signin} onClick={onAuth}>
              Se connecter
            </button>
          )}
        </div>
      )}
    </header>
  );
}
