import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useLevels } from "../../hooks/useSiteData";
import type { Product } from "../../types";
import FilterBar from "../../components/FilterBar";
import { StaggerGroup } from "../../components/Reveal";
import ProductCard from "../../components/ProductCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import "./Search.css";

export default function Search() {
  const { levels } = useLevels();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts((data as Product[] | null) ?? []);
        setLoading(false);
      });
  }, []);

  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort(),
    [products],
  );

  useEffect(() => {
    if (brands.length === 0) return;
    const id = window.setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % brands.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [brands]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
      const matchesLevel = !activeLevel || p.levels.includes(activeLevel);
      const matchesBrand = !activeBrand || p.brand === activeBrand;
      return matchesQuery && matchesLevel && matchesBrand;
    });
  }, [products, query, activeLevel, activeBrand]);

  return (
    <div className="section container search-page">
      <h1 className="search-title">Buscar</h1>

      <div className="search-bar">
        <SearchGlyph />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={brands.length ? `Prueba con "${brands[placeholderIndex]}"` : "Buscar por nombre o marca…"}
          aria-label="Buscar productos"
        />
        {query && (
          <button type="button" className="search-clear" onClick={() => setQuery("")} aria-label="Limpiar búsqueda">
            ×
          </button>
        )}
      </div>

      <FilterBar
        levels={levels}
        brands={brands}
        activeLevel={activeLevel}
        activeBrand={activeBrand}
        onLevelChange={setActiveLevel}
        onBrandChange={setActiveBrand}
      />

      <p className="search-count">
        {loading ? "Buscando…" : `${filtered.length} resultado${filtered.length === 1 ? "" : "s"}`}
      </p>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin resultados" description="Prueba con otro término o quita algún filtro." />
      ) : (
        <StaggerGroup className="product-grid" itemClassName="">
          {filtered.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
