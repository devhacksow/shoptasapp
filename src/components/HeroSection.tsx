import styles from "./HeroSection.module.css";

interface HeroSectionProps {
  onShopNow: () => void;
}

export function HeroSection({ onShopNow }: HeroSectionProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <span className={styles.kicker}>Nouvelle collection</span>
        <h1 className={styles.title}>Le vestiaire masculin, sans compromis</h1>
        <p className={styles.subtitle}>
          Des pièces intemporelles et des essentiels du quotidien, à prix juste.
          Livraison rapide et retours gratuits.
        </p>
        <button className={styles.cta} onClick={onShopNow}>
          Découvrir la collection
        </button>
      </div>
    </section>
  );
}
