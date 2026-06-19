import { useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import type { Category, GridMode, Product, SortKey } from "../domain/types";

export interface Filters {
  category: string | null;
  sort: SortKey;
  minPrice: number | null;
  maxPrice: number | null;
}

export interface UseShop {
  categories: Category[];
  products: Product[];
  loading: boolean;
  loadError: string | null;
  searchError: string | null;
  filters: Filters;
  gridMode: GridMode;
  setSearch: (term: string) => void;
  selectCategory: (categoryId: string) => void;
  setSort: (key: SortKey) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  reload: () => void;
}

export function useShop(): UseShop {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSortKey] = useState<SortKey>("relevance");
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    api
      .getCategories()
      .then(setCategories)
      .catch(() => setLoadError("Impossible de charger les rayons."));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getProducts({ q: debouncedTerm, category, sort, minPrice, maxPrice })
      .then((res) => {
        if (!cancelled) {
          setProducts(res.products);
          setLoadError(null);
        }
      })
      .catch((e) => {
        if (!cancelled)
          setLoadError(
            e instanceof ApiError ? e.message : "Impossible de charger les produits."
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedTerm, category, sort, minPrice, maxPrice, reloadToken]);

  const setSearch = (next: string) => {
    if (next.length > 100) {
      setSearchError("Recherche limitée à 100 caractères.");
      return;
    }
    setSearchError(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedTerm(next.trim()), 300);
  };

  const selectCategory = (id: string) =>
    setCategory((prev) => (prev === id ? null : id));
  const setSort = (key: SortKey) => setSortKey(key);
  const setPriceRange = (min: number | null, max: number | null) => {
    setMinPrice(min);
    setMaxPrice(max);
  };
  const reload = () => setReloadToken((t) => t + 1);

  const hasFilter =
    debouncedTerm.trim().length > 0 ||
    category !== null ||
    minPrice !== null ||
    maxPrice !== null;

  const gridMode: GridMode = useMemo(() => {
    if (products.length === 0) {
      return hasFilter ? { kind: "noResults" } : { kind: "empty" };
    }
    return { kind: "items" };
  }, [products, hasFilter]);

  return {
    categories,
    products,
    loading,
    loadError,
    searchError,
    filters: { category, sort, minPrice, maxPrice },
    gridMode,
    setSearch,
    selectCategory,
    setSort,
    setPriceRange,
    reload,
  };
}
