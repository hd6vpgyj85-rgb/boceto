import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartLine } from "../types";

const STORAGE_KEY = "beautylat-cart";

interface CartContextValue {
  lines: CartLine[];
  addLine: (line: CartLine) => void;
  updateQuantity: (productId: string, level: string | undefined, quantity: number) => void;
  removeLine: (productId: string, level: string | undefined) => void;
  clear: () => void;
  subtotal: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(productId: string, level?: string) {
  return `${productId}::${level ?? ""}`;
}

function loadInitialLines(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadInitialLines);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const addLine = (line: CartLine) => {
    setLines((prev) => {
      const existing = prev.find((l) => lineKey(l.productId, l.level) === lineKey(line.productId, line.level));
      if (existing) {
        return prev.map((l) =>
          lineKey(l.productId, l.level) === lineKey(line.productId, line.level)
            ? { ...l, quantity: Math.min(l.quantity + line.quantity, l.stock) }
            : l
        );
      }
      return [...prev, line];
    });
  };

  const updateQuantity = (productId: string, level: string | undefined, quantity: number) => {
    setLines((prev) =>
      prev
        .map((l) =>
          lineKey(l.productId, l.level) === lineKey(productId, level)
            ? { ...l, quantity: Math.max(1, Math.min(quantity, l.stock)) }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  };

  const removeLine = (productId: string, level: string | undefined) => {
    setLines((prev) => prev.filter((l) => lineKey(l.productId, l.level) !== lineKey(productId, level)));
  };

  const clear = () => setLines([]);

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.price * l.quantity, 0), [lines]);
  const count = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  return (
    <CartContext.Provider value={{ lines, addLine, updateQuantity, removeLine, clear, subtotal, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
