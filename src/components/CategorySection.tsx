import type { Category } from "../domain/types";
import styles from "./CategorySection.module.css";

interface CategorySectionProps {
  categories: Category[];
  activeCategory: string | null;
  onSelect: (categoryId: string) => void;
}

export function CategorySection({
  categories,
  activeCategory,
  onSelect,
}: CategorySectionProps) {
  return (
    <section className={styles.section} aria-label="Catégories">
      <h2 className={styles.heading}>Nos rayons</h2>
      <ul className={styles.list}>
        {categories.map((cat) => {
          const isActive = cat.id === activeCategory;
          return (
            <li key={cat.id}>
              <button
                className={`${styles.chip} ${isActive ? styles.active : ""}`}
                aria-pressed={isActive}
                onClick={() => onSelect(cat.id)}
              >
                <span className={styles.visual} aria-hidden="true">
                  {cat.visual}
                </span>
                <span className={styles.label}>{cat.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
