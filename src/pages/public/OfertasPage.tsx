import { useMemo, useState } from "react";
import { useProducts } from "../../context/ProductsContext";
import CategoryPhotoBanner from "../../components/CategoryPhotoBanner";
import CategoryHero from "../../components/CategoryHero";
import ProductFilters, { applyFilter, type ActiveFilter } from "../../components/ProductFilters";
import ProductGrid from "../../components/ProductGrid";
import FeaturedCarousel from "../../components/FeaturedCarousel";
import CategoryFooter from "../../components/CategoryFooter";
import LoadingSpinner from "../../components/LoadingSpinner";

const OFERTAS_IMAGE = "/images/category-ofertas.svg";

export default function OfertasPage() {
  const { products, loading } = useProducts();
  const [filter, setFilter] = useState<ActiveFilter>({ type: "all" });

  const onSaleProducts = useMemo(() => products.filter((p) => p.onSale && p.compareAtPrice), [products]);
  const filtered = useMemo(() => applyFilter(onSaleProducts, filter), [onSaleProducts, filter]);

  return (
    <>
      <CategoryPhotoBanner name="Ofertas" tagline="Piezas seleccionadas con descuento especial" image={OFERTAS_IMAGE} />
      <CategoryHero title="Ofertas especiales" subtitle="Aprovecha antes de que se agoten" />

      <div className="container">
        <ProductFilters products={onSaleProducts} active={filter} onChange={setFilter} />
        {loading ? <LoadingSpinner /> : <ProductGrid products={filtered} />}
      </div>

      <FeaturedCarousel products={onSaleProducts} />
      <CategoryFooter />
    </>
  );
}
