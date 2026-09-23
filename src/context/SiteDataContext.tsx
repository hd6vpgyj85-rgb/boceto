import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { setCurrency } from "../lib/format";
import type { Category, Level, SiteSettings } from "../types";

interface SiteDataValue {
  settings: SiteSettings | null;
  categories: Category[];
  levels: Level[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const SiteDataContext = createContext<SiteDataValue | null>(null);

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [{ data: settingsRow }, { data: categoryRows }, { data: levelRows }] = await Promise.all([
      supabase.from("site_settings").select("*").eq("id", true).maybeSingle(),
      supabase.from("categories").select("*").order("display_order", { ascending: true }),
      supabase.from("levels").select("*").order("display_order", { ascending: true }),
    ]);
    const nextSettings = settingsRow as SiteSettings | null;
    setCurrency(nextSettings?.currency);
    setSettings(nextSettings);
    setCategories((categoryRows as Category[] | null) ?? []);
    setLevels((levelRows as Level[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SiteDataContext.Provider value={{ settings, categories, levels, loading, refresh }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error("useSiteData debe usarse dentro de <SiteDataProvider>");
  return ctx;
}
