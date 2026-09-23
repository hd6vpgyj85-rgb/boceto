import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useCategories, useLevels, usePageTitle } from "../../hooks/useSiteData";
import { isSortOption, sortProducts, type SortOption } from "../../lib/products";
import type { Product } from "../../types";
import FilterBar from "../../components/FilterBar";
import { StaggerGroup } from "../../components/Reveal";
import ProductCard, { ProductCardSkeleton } from "../../components/ProductCard";
import ProductCarousel from "../../components/ProductCarousel";
import EmptyState from "../../components/EmptyState";
import "./ProductListing.css";

type ListingMode = "category" | "all" | "offers";

interface ProductListingProps {
  mode: ListingMode;
  categorySlug?: string;
}

export default function ProductListing({ mode, categorySlug }: ProductListingProps) {
  const { categories, loading: categoriesLoading } = useCategories();
  const { levels } = useLevels();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[] | null>(null);

  const activeLevel = searchParams.get("nivel");
  const activeBrand = searchParams.get("marca");
  const sortParam = searchParams.get("orden");
  const sort: SortOption = isSortOption(sortParam) ? sortParam : "featured";

  const category = mode === "category" ? categories.find((c) => c.slug === categorySlug) : null;

  useEffect(() => {
    let active = true;
    let query = supabase.from("products").select("*");
    if (mode === "category" && categorySlug) query = query.eq("category", categorySlug);
    if (mode === "offers") query = query.eq("on_sale", true);

    query.order("created_at", { ascending: false }).then(({ data }) => {
      if (active) setProducts((data as Product[] | null) ?? []);
    });
    return () => {
      active = false;
    };
  }, [mode, categorySlug]);

  const brands = useMemo(
    () => Array.from(new Set((products ?? []).map((p) => p.brand).filter(Boolean))).sort((a, b) => a.localeCompare(b, "es")),
    [products],
  );

  const visibleLevels = useMemo(
    () => levels.filter((l) => (products ?? []).some((p) => p.levels.includes(l.slug))),
    [levels, products],
  );

  const filtered = useMemo(
    () =>
      sortProducts(
        (products ?? []).filter(
          (p) => (!activeLevel || p.levels.includes(activeLevel)) && (!activeBrand || p.brand === activeBrand),
        ),
        sort,
      ),
    [products, activeLevel, activeBrand, sort],
  );

  const featured = useMemo(() => (products ?? []).filter((p) => p.featured).slice(0, 10), [products]);

  const title =
    mode === "category" ? (category?.name ?? "") : mode === "offers" ? "Ofertas" : "Catálogo completo";
  const subtitle =
    mode === "category"
      ? category?.tagline
      : mode === "offers"
        ? "Precios especiales por tiempo limitado. Cuando se acaban, se acaban."
        : "Todo lo que tenemos para ti, en un solo lugar.";
  const bannerImage = mode === "category" ? category?.banner_image_url : null;
  usePageTitle(title || undefined);

  const setParam = (key: string, value: string | null) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );

  const heroLoading = mode === "category" && categoriesLoading;
  const filterKey = `${activeLevel}-${activeBrand}-${sort}`;

  return (
    <div className="listing-page">
      <section
        className={`listing-hero ${bannerImage ? "listing-hero-photo" : ""}`}
        style={bannerImage ? { backgroundImage: `url(${bannerImage})` } : undefined}
      >
        <div className="listing-hero-overlay" />
        <div className="container listing-hero-content">
          <nav className="breadcrumbs" aria-label="Migas de pan">
            <Link to="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            {mode === "all" ? <span>Catálogo</span> : <Link to="/productos">Catálogo</Link>}
            {mode !== "all" && (
              <>
                <span aria-hidden="true">/</span>
                <span>{title}</span>
              </>
            )}
          </nav>
          {heroLoading ? (
            <>
              <span className="skeleton listing-title-skeleton" />
              <span className="skeleton listing-subtitle-skeleton" />
            </>
          ) : (
            <>
              <h1 className="listing-title">
                {mode === "offers" && <span className="listing-sale-dot" aria-hidden="true" />}
                {title}
              </h1>
              {subtitle && <p className="listing-subtitle">{subtitle}</p>}
            </>
          )}
        </div>
      </section>

      <div className="section listing-body">
        <div className="container">
          <FilterBar
            levels={visibleLevels}
            brands={brands}
            activeLevel={activeLevel}
            activeBrand={activeBrand}
            onLevelChange={(slug) => setParam("nivel", slug)}
            onBrandChange={(brand) => setParam("marca", brand)}
            sort={sort}
            onSortChange={(value) => setParam("orden", value === "featured" ? null : value)}
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
              icon={products.length === 0 ? "box" : "search"}
              title={products.length === 0 ? "Muy pronto" : "Sin resultados"}
              description={
                products.length === 0
                  ? mode === "offers"
                    ? "Por ahora no hay ofertas activas. Vuelve pronto: las promociones cambian seguido."
                    : "Todavía no hay productos aquí. Estamos preparando algo bueno."
                  : "No encontramos productos con esta combinación de filtros."
              }
              action={
                products.length === 0 ? (
                  <Link to="/productos" className="btn btn-primary">
                    Ver todo el catálogo
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setSearchParams({}, { replace: true, preventScrollReset: true })}
                  >
                    Quitar filtros
                  </button>
                )
              }
            />
          ) : (
            <StaggerGroup key={filterKey} className="product-grid" staggerMs={45}>
              {filtered.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </StaggerGroup>
          )}
        </div>
      </div>

      {mode !== "all" && featured.length > 1 && (
        <div className="section listing-featured">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="section-eyebrow">Recomendados</span>
                <h2 className="section-title is-static">Destacados</h2>
              </div>
            </div>
            <ProductCarousel products={featured} />
          </div>
        </div>
      )}
    </div>
  );
}
