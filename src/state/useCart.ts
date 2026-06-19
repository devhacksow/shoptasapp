import { useCallback, useEffect, useState } from "react";
import type { CartLine, Product } from "../domain/types";

const CART_KEY = "shoptasapp_cart";

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

const sameLine = (l: CartLine, productId: string, color: string, size: string) =>
  l.productId === productId && l.color === color && l.size === size;

export interface UseCart {
  lines: CartLine[];
  count: number;
  totalCents: number;
  add: (
    product: Product,
    color: string,
    size: string,
    quantity: number,
    maxStock: number
  ) => void;
  setQuantity: (
    productId: string,
    color: string,
    size: string,
    quantity: number
  ) => void;
  remove: (productId: string, color: string, size: string) => void;
  clear: () => void;
}

export function useCart(): UseCart {
  const [lines, setLines] = useState<CartLine[]>(load);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, [lines]);

  const add = useCallback(
    (
      product: Product,
      color: string,
      size: string,
      quantity: number,
      maxStock: number
    ) => {
      setLines((prev) => {
        const existing = prev.find((l) => sameLine(l, product.id, color, size));
        if (existing) {
          return prev.map((l) =>
            sameLine(l, product.id, color, size)
              ? {
                  ...l,
                  quantity: Math.min(l.quantity + quantity, maxStock),
                  maxStock,
                }
              : l
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            color,
            size,
            priceCents: product.priceCents,
            quantity: Math.min(quantity, maxStock),
            imageUrl: product.imageUrl,
            maxStock,
          },
        ];
      });
    },
    []
  );

  const setQuantity = useCallback(
    (productId: string, color: string, size: string, quantity: number) => {
      setLines((prev) =>
        prev
          .map((l) =>
            sameLine(l, productId, color, size)
              ? { ...l, quantity: Math.max(0, Math.min(quantity, l.maxStock)) }
              : l
          )
          .filter((l) => l.quantity > 0)
      );
    },
    []
  );

  const remove = useCallback(
    (productId: string, color: string, size: string) => {
      setLines((prev) => prev.filter((l) => !sameLine(l, productId, color, size)));
    },
    []
  );

  const clear = useCallback(() => setLines([]), []);

  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const totalCents = lines.reduce((s, l) => s + l.priceCents * l.quantity, 0);

  return { lines, count, totalCents, add, setQuantity, remove, clear };
}
