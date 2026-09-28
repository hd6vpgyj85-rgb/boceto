import { LEVEL_LABELS, type Product, type ProductLevel } from "../types";
import "./ProductFilters.css";

export type ActiveFilter = { type: "all" } | { type: "sale" } | { type: "brand"; value: string } | { type: "level"; value: ProductLevel };

export function filterKey(filter: ActiveFilter): string {
  return filter.type === "all" || filter.type === "sale" ? filter.type : `${filter.type}:${filter.value}`;
}

export function applyFilter(products: Product[], filter: ActiveFilter): Product[] {
  switch (filter.type) {
    case "all":
      return products;
    case "sale":
      return products.filter((p) => p.onSale && p.compareAtPrice);
    case "brand":
      return products.filter((p) => p.brand === filter.value);
    case "level":
      return products.filter((p) => p.levels?.includes(filter.value));
  }
}

interface ProductFiltersProps {
  products: Product[];
  active: ActiveFilter;
  onChange: (filter: ActiveFilter) => void;
}

export default function ProductFilters({ products, active, onChange }: ProductFiltersProps) {
  const brands = Array.from(new Set(products.map((p) => p.brand))).sort();
  const activeKey = filterKey(active);

  return (
    <div className="product-filters">
      <button
        className={`filter-chip ${activeKey === "all" ? "is-active" : ""}`}
        onClick={() => onChange({ type: "all" })}
      >
        Todas
      </button>
      <button
        className={`filter-chip ${activeKey === "sale" ? "is-active" : ""}`}
        onClick={() => onChange({ type: "sale" })}
      >
        Ofertas
      </button>
      {brands.map((brand) => (
        <button
          key={brand}
          className={`filter-chip ${activeKey === `brand:${brand}` ? "is-active" : ""}`}
          onClick={() => onChange({ type: "brand", value: brand })}
        >
          {brand}
        </button>
      ))}
      {(Object.keys(LEVEL_LABELS) as ProductLevel[]).map((level) => (
        <button
          key={level}
          className={`filter-chip ${activeKey === `level:${level}` ? "is-active" : ""}`}
          onClick={() => onChange({ type: "level", value: level })}
        >
          {LEVEL_LABELS[level]}
        </button>
      ))}
    </div>
  );
}
