import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartLine } from "../types";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "noire-cart";

interface CartContextValue {
  lines: CartLine[];
  addToCart: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, size: string | null, quantity: number) => void;
  removeFromCart: (productId: string, size: string | null) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  lastAdded: CartLine | null;
  dismissLastAdded: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(productId: string, size: string | null) {
  return `${productId}::${size ?? ""}`;
}

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => loadCart());
  const [lastAdded, setLastAdded] = useState<CartLine | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const addToCart: CartContextValue["addToCart"] = (line, quantity = 1) => {
    setLines((prev) => {
      const key = lineKey(line.productId, line.size);
      const existing = prev.find((l) => lineKey(l.productId, l.size) === key);
      if (existing) {
        return prev.map((l) =>
          lineKey(l.productId, l.size) === key
            ? { ...l, quantity: Math.min(l.quantity + quantity, l.stock || 99) }
            : l,
        );
      }
      return [...prev, { ...line, quantity }];
    });
    setLastAdded({ ...line, quantity });
    void supabase.rpc("increment_product_stat", { p_product_id: line.productId, p_field: "cart_adds" });
  };

  const updateQuantity: CartContextValue["updateQuantity"] = (productId, size, quantity) => {
    setLines((prev) => {
      if (quantity <= 0) {
        return prev.filter((l) => lineKey(l.productId, l.size) !== lineKey(productId, size));
      }
      return prev.map((l) =>
        lineKey(l.productId, l.size) === lineKey(productId, size) ? { ...l, quantity } : l,
      );
    });
  };

  const removeFromCart: CartContextValue["removeFromCart"] = (productId, size) => {
    setLines((prev) => prev.filter((l) => lineKey(l.productId, l.size) !== lineKey(productId, size)));
  };

  const clearCart = () => setLines([]);

  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.price * l.quantity, 0), [lines]);

  return (
    <CartContext.Provider
      value={{
        lines,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        itemCount,
        subtotal,
        lastAdded,
        dismissLastAdded: () => setLastAdded(null),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
