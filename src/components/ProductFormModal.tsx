import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError, type ProductInput } from "../api/client";
import type { Category, Product } from "../domain/types";
import styles from "./ProductFormModal.module.css";

interface ProductFormModalProps {
  open: boolean;
  product: Product | null; // null = création
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

interface VariantRow {
  color: string;
  size: string;
  stock: string;
}

export function ProductFormModal({
  open,
  product,
  categories,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [variants, setVariants] = useState<VariantRow[]>([
    { color: "", size: "", stock: "" },
  ]);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (product) {
      setName(product.name);
      setCategoryId(product.categoryId);
      setPrice((product.priceCents / 100).toString());
      setDescription(product.description);
      setVariants(
        product.variants.map((v) => ({
          color: v.color,
          size: v.size,
          stock: String(v.stock),
        }))
      );
      setImageUrl(product.imageUrl);
      setPreview(product.imageUrl);
    } else {
      setName("");
      setCategoryId(categories[0]?.id ?? "");
      setPrice("");
      setDescription("");
      setVariants([{ color: "", size: "", stock: "" }]);
      setImageUrl(undefined);
      setPreview(null);
    }
    setError(null);
  }, [open, product, categories]);

  if (!open) return null;

  const updateVariant = (i: number, field: keyof VariantRow, value: string) => {
    setVariants((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v))
    );
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    try {
      const url = await api.uploadImage(file);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload impossible.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceEuros = Number(price.replace(",", "."));
    if (!Number.isFinite(priceEuros) || priceEuros <= 0) {
      setError("Prix invalide.");
      return;
    }
    const cleanVariants = variants
      .filter((v) => v.size.trim())
      .map((v) => ({
        color: v.color.trim(),
        size: v.size.trim(),
        stock: Number(v.stock) || 0,
      }));
    if (cleanVariants.length === 0) {
      setError("Ajoute au moins une taille.");
      return;
    }

    const body: ProductInput = {
      name: name.trim(),
      categoryId,
      priceEuros,
      description: description.trim() || undefined,
      imageUrl,
      variants: cleanVariants,
    };

    setSubmitting(true);
    try {
      if (product) {
        await api.adminUpdateProduct(product.id, body);
      } else {
        await api.adminCreateProduct(body);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enregistrement impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.close} onClick={onClose} aria-label="Fermer">
          ✕
        </button>
        <h2 className={styles.title}>
          {product ? "Modifier le produit" : "Nouveau produit"}
        </h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Nom
            <input
              className={styles.input}
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <div className={styles.row}>
            <label className={styles.label}>
              Catégorie
              <select
                className={styles.input}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Prix (€)
              <input
                className={styles.input}
                value={price}
                required
                inputMode="decimal"
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
          </div>

          <label className={styles.label}>
            Description
            <textarea
              className={styles.textarea}
              value={description}
              rows={2}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className={styles.variants}>
            <span className={styles.label}>Couleurs, tailles & stock</span>
            {variants.map((v, i) => (
              <div key={i} className={styles.variantRow}>
                <input
                  className={styles.input}
                  placeholder="Couleur (ex. Noir)"
                  value={v.color}
                  onChange={(e) => updateVariant(i, "color", e.target.value)}
                />
                <input
                  className={styles.input}
                  placeholder="Taille (ex. M)"
                  value={v.size}
                  onChange={(e) => updateVariant(i, "size", e.target.value)}
                />
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  placeholder="Stock"
                  value={v.stock}
                  onChange={(e) => updateVariant(i, "stock", e.target.value)}
                />
                <button
                  type="button"
                  className={styles.removeVariant}
                  onClick={() =>
                    setVariants((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  aria-label="Retirer"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.addVariant}
              onClick={() =>
                setVariants((prev) => [
                  ...prev,
                  { color: "", size: "", stock: "" },
                ])
              }
            >
              + Ajouter une déclinaison
            </button>
          </div>

          <label className={styles.label}>
            Photo
            <input
              className={styles.input}
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {preview && <img className={styles.preview} src={preview} alt="Aperçu" />}

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.submit} type="submit" disabled={submitting}>
            {submitting ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}
