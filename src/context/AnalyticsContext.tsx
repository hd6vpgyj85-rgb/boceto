import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { ProductStat } from "../types";

interface ProductStatRow {
  product_id: string;
  views: number;
  cart_adds: number;
  purchases: number;
}

function rowToStat(row: ProductStatRow): ProductStat {
  return { productId: row.product_id, views: row.views, cartAdds: row.cart_adds, purchases: row.purchases };
}

interface AnalyticsContextValue {
  stats: ProductStat[];
  loading: boolean;
  refresh: () => Promise<void>;
  registerView: (productId: string) => void;
  registerCartAdd: (productId: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<ProductStat[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("product_stats").select("*");
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    setStats((data as ProductStatRow[]).map(rowToStat));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const registerView = useCallback((productId: string) => {
    supabase.rpc("increment_product_stat", { p_product_id: productId, p_field: "views" }).then(({ error }) => {
      if (error) console.error(error);
    });
  }, []);

  const registerCartAdd = useCallback((productId: string) => {
    supabase.rpc("increment_product_stat", { p_product_id: productId, p_field: "cart_adds" }).then(({ error }) => {
      if (error) console.error(error);
    });
  }, []);

  return (
    <AnalyticsContext.Provider value={{ stats, loading, refresh, registerView, registerCartAdd }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics debe usarse dentro de <AnalyticsProvider>");
  return ctx;
}
