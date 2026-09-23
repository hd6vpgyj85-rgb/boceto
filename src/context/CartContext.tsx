import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartLine } from "../types";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "boceto-cart";

interface CartContextValue {
  lines: CartLine[];
  addToCart: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, size: string | null, quantity: number) => void;
  removeFromCart: (productId: string, size: string | null) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  lastAdded: (CartLine & { addedAt: number }) | null;
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
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(lines: CartLine[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    return true;
  } catch {
    return false;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => loadCart());
  const [lastAdded, setLastAdded] = useState<CartContextValue["lastAdded"]>(null);

  useEffect(() => {
    saveCart(lines);
  }, [lines]);

  const addToCart = useCallback<CartContextValue["addToCart"]>((line, quantity = 1) => {
    const max = line.stock > 0 ? line.stock : 99;
    setLines((prev) => {
      const key = lineKey(line.productId, line.size);
      const existing = prev.find((l) => lineKey(l.productId, l.size) === key);
      if (existing) {
        return prev.map((l) =>
          lineKey(l.productId, l.size) === key ? { ...l, quantity: Math.min(l.quantity + quantity, max) } : l,
        );
      }
      return [...prev, { ...line, quantity: Math.min(quantity, max) }];
    });
    setLastAdded({ ...line, quantity, addedAt: Date.now() });
    void supabase.rpc("increment_product_stat", { p_product_id: line.productId, p_field: "cart_adds" });
  }, []);

  const updateQuantity = useCallback<CartContextValue["updateQuantity"]>((productId, size, quantity) => {
    const key = lineKey(productId, size);
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => lineKey(l.productId, l.size) !== key)
        : prev.map((l) => (lineKey(l.productId, l.size) === key ? { ...l, quantity } : l)),
    );
  }, []);

  const removeFromCart = useCallback<CartContextValue["removeFromCart"]>((productId, size) => {
    const key = lineKey(productId, size);
    setLines((prev) => prev.filter((l) => lineKey(l.productId, l.size) !== key));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);
  const dismissLastAdded = useCallback(() => setLastAdded(null), []);

  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.price * l.quantity, 0), [lines]);

  const value = useMemo(
    () => ({
      lines,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      itemCount,
      subtotal,
      lastAdded,
      dismissLastAdded,
    }),
    [lines, addToCart, updateQuantity, removeFromCart, clearCart, itemCount, subtotal, lastAdded, dismissLastAdded],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
