import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useSiteData } from "../context/SiteDataContext";
import type { HomeBanner } from "../types";

export function useSiteSettings() {
  const { settings, loading } = useSiteData();
  return { settings, loading };
}

export function useCategories() {
  const { categories, loading } = useSiteData();
  return { categories, loading };
}

export function useLevels() {
  const { levels, loading } = useSiteData();
  return { levels, loading };
}

export function useHomeBanner() {
  const [banner, setBanner] = useState<HomeBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("home_banner")
      .select("*")
      .eq("id", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setBanner(data as HomeBanner | null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { banner, loading };
}

export function usePageTitle(title?: string) {
  const { settings } = useSiteData();

  useEffect(() => {
    const name = settings?.business_name;
    if (!name) return;
    document.title = title ? `${title} · ${name}` : settings.tagline ? `${name} — ${settings.tagline}` : name;
  }, [title, settings]);
}
