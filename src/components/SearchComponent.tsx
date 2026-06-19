import { useState, type FormEvent } from "react";
import styles from "./SearchComponent.module.css";

interface SearchComponentProps {
  error: string | null;
  /** Soumission explicite (Entrée / bouton). */
  onSubmit: (term: string) => void;
  /** Recherche en direct au fil de la frappe. */
  onChange?: (term: string) => void;
}

export function SearchComponent({
  error,
  onSubmit,
  onChange,
}: SearchComponentProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(value);
  };

  const handleChange = (next: string) => {
    setValue(next);
    onChange?.(next);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} role="search">
      <input
        className={styles.input}
        type="text"
        value={value}
        placeholder="Rechercher des articles"
        aria-label="Rechercher des articles"
        onChange={(e) => handleChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className={styles.clear}
          aria-label="Effacer la recherche"
          onClick={() => handleChange("")}
        >
          ✕
        </button>
      )}
      <button className={styles.button} type="submit" aria-label="Rechercher">
        🔍
      </button>
      {error && <span className={styles.error}>{error}</span>}
    </form>
  );
}
