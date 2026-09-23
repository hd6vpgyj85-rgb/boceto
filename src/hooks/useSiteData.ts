import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Category, HomeBanner, Level, SiteSettings } from "../types";

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setSettings(data as SiteSettings | null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { settings, loading };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        setCategories((data as Category[] | null) ?? []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { categories, loading };
}

export function useLevels() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("levels")
      .select("*")
      .order("display_order", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        setLevels((data as Level[] | null) ?? []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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
