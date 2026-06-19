import { useEffect } from "react";
import type { InfoPage } from "../data/footerContent";
import styles from "./InfoModal.module.css";

interface InfoModalProps {
  page: InfoPage | null;
  onClose: () => void;
}

export function InfoModal({ page, onClose }: InfoModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (page) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [page, onClose]);

  if (!page) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={page.title}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.close} onClick={onClose} aria-label="Fermer">
          ✕
        </button>
        <h2 className={styles.title}>{page.title}</h2>
        {page.paragraphs.map((p, i) => (
          <p key={i} className={styles.paragraph}>
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
