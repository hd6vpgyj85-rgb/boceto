import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useCategories, useLevels } from "../../hooks/useSiteData";
import type { Product } from "../../types";
import FilterBar from "../../components/FilterBar";
import { StaggerGroup } from "../../components/Reveal";
import ProductCard from "../../components/ProductCard";
import ProductCarousel from "../../components/ProductCarousel";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import "./ProductListing.css";

type ListingMode = "category" | "all" | "offers";

interface ProductListingProps {
  mode: ListingMode;
  categorySlug?: string;
}

export default function ProductListing({ mode, categorySlug }: ProductListingProps) {
  const { categories } = useCategories();
  const { levels } = useLevels();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const activeLevel = searchParams.get("nivel");
  const activeBrand = searchParams.get("marca");

  const category = mode === "category" ? categories.find((c) => c.slug === categorySlug) : null;

  useEffect(() => {
    setLoading(true);
    let query = supabase.from("products").select("*");
    if (mode === "category" && categorySlug) query = query.eq("category", categorySlug);
    if (mode === "offers") query = query.eq("on_sale", true);

    query
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts((data as Product[] | null) ?? []);
        setLoading(false);
      });
  }, [mode, categorySlug]);

  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort(),
    [products],
  );

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (!activeLevel || p.levels.includes(activeLevel)) && (!activeBrand || p.brand === activeBrand),
      ),
    [products, activeLevel, activeBrand],
  );

  const featured = useMemo(() => filtered.filter((p) => p.featured).slice(0, 10), [filtered]);

  const title = mode === "category" ? (category?.name ?? "Categoría") : mode === "offers" ? "Ofertas" : "Todos los productos";
  const subtitle =
    mode === "category"
      ? category?.tagline
      : mode === "offers"
        ? "Fragancias en descuento por tiempo limitado"
        : "Todo nuestro catálogo, en un solo lugar";
  const bannerImage = mode === "category" ? category?.banner_image_url : null;

  return (
    <div className="listing-page">
      <section className={`listing-hero ${bannerImage ? "listing-hero-photo" : ""}`}
        style={bannerImage ? { backgroundImage: `url(${bannerImage})` } : undefined}
      >
        {bannerImage && <div className="listing-hero-overlay" />}
        <div className="container listing-hero-content">
          <h1 className="listing-title">{title}</h1>
          {subtitle && <p className="listing-subtitle">{subtitle}</p>}
        </div>
      </section>

      <div className="section">
        <div className="container">
          <FilterBar
            levels={levels}
            brands={brands}
            activeLevel={activeLevel}
            activeBrand={activeBrand}
            onLevelChange={(slug) =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (slug) next.set("nivel", slug);
                else next.delete("nivel");
                return next;
              })
            }
            onBrandChange={(brand) =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (brand) next.set("marca", brand);
                else next.delete("marca");
                return next;
              })
            }
          />

          {loading ? (
            <LoadingSpinner />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Sin resultados"
              description="No encontramos productos con estos filtros. Prueba con otra combinación."
            />
          ) : (
            <StaggerGroup className="product-grid" itemClassName="">
              {filtered.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </StaggerGroup>
          )}
        </div>
      </div>

      {featured.length > 1 && (
        <div className="section">
          <div className="container">
            <div className="section-head">
              <h2 className="section-title">Destacados</h2>
            </div>
            <ProductCarousel products={featured} />
          </div>
        </div>
      )}
    </div>
  );
}
