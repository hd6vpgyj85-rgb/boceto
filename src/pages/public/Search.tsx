import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useCategories, useLevels, usePageTitle } from "../../hooks/useSiteData";
import { isSortOption, sortProducts, type SortOption } from "../../lib/products";
import type { Product } from "../../types";
import FilterBar from "../../components/FilterBar";
import { StaggerGroup } from "../../components/Reveal";
import ProductCard, { ProductCardSkeleton } from "../../components/ProductCard";
import EmptyState from "../../components/EmptyState";
import { CloseIcon, SearchIcon } from "../../components/Icons";
import "./Search.css";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function Search() {
  usePageTitle("Buscar");
  const { levels } = useLevels();
  const { categories } = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const sortParam = searchParams.get("orden");
  const [sort, setSort] = useState<SortOption>(isSortOption(sortParam) ? sortParam : "featured");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
    supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setProducts((data as Product[] | null) ?? []));
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (query.trim()) next.set("q", query.trim());
          else next.delete("q");
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    }, 300);
    return () => window.clearTimeout(id);
  }, [query, setSearchParams]);

  const suggestions = useMemo(() => (products ?? []).slice(0, 8).map((p) => p.name), [products]);

  useEffect(() => {
    if (suggestions.length < 2) return;
    const id = window.setInterval(() => setPlaceholderIndex((i) => (i + 1) % suggestions.length), 2600);
    return () => window.clearInterval(id);
  }, [suggestions.length]);

  const brands = useMemo(
    () => Array.from(new Set((products ?? []).map((p) => p.brand).filter(Boolean))).sort((a, b) => a.localeCompare(b, "es")),
    [products],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return sortProducts(
      (products ?? []).filter((p) => {
        const haystack = normalize(`${p.name} ${p.brand} ${p.description}`);
        const matchesQuery = !q || q.split(/\s+/).every((word) => haystack.includes(word));
        const matchesLevel = !activeLevel || p.levels.includes(activeLevel);
        const matchesBrand = !activeBrand || p.brand === activeBrand;
        return matchesQuery && matchesLevel && matchesBrand;
      }),
      sort,
    );
  }, [products, query, activeLevel, activeBrand, sort]);

  const placeholder = suggestions.length ? `Prueba con “${suggestions[placeholderIndex % suggestions.length]}”` : "¿Qué estás buscando?";

  return (
    <div className="section container search-page">
      <h1 className="search-title">¿Qué estás buscando?</h1>

      <div className={`search-bar ${query ? "has-value" : ""}`}>
        <SearchIcon size={22} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar productos"
          enterKeyHint="search"
        />
        {query && (
          <button type="button" className="search-clear" onClick={() => setQuery("")} aria-label="Limpiar búsqueda">
            <CloseIcon size={16} />
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="search-shortcuts">
          <span>Explora:</span>
          {categories.map((c) => (
            <Link key={c.slug} to={`/${c.slug}`} className="search-shortcut">
              {c.name}
            </Link>
          ))}
          <Link to="/ofertas" className="search-shortcut search-shortcut-sale">
            Ofertas
          </Link>
        </div>
      )}

      <FilterBar
        levels={levels}
        brands={brands}
        activeLevel={activeLevel}
        activeBrand={activeBrand}
        onLevelChange={setActiveLevel}
        onBrandChange={setActiveBrand}
        sort={sort}
        onSortChange={setSort}
        resultCount={filtered.length}
        loading={products === null}
      />

      {products === null ? (
        <div className="product-grid">
          {Array.from({ length: 8 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title="Sin resultados"
          description={
            query
              ? `No encontramos nada para “${query}”. Revisa la ortografía o prueba con otra palabra.`
              : "Ningún producto coincide con estos filtros."
          }
          action={
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setQuery("");
                setActiveLevel(null);
                setActiveBrand(null);
              }}
            >
              Ver todos los productos
            </button>
          }
        />
      ) : (
        <StaggerGroup
          key={`${searchParams.get("q") ?? ""}-${activeLevel}-${activeBrand}-${sort}`}
          className="product-grid"
          staggerMs={35}
        >
          {filtered.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}
