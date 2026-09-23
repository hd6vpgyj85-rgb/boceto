import type { Product } from "../types";

export type SortOption = "featured" | "newest" | "price_asc" | "price_desc" | "name";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Destacados" },
  { value: "newest", label: "Más recientes" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "name", label: "Nombre (A–Z)" },
];

export function effectivePrice(product: Product): number {
  return product.on_sale && product.sale_price != null ? product.sale_price : product.price;
}

export function sortProducts(products: Product[], sort: SortOption): Product[] {
  const list = [...products];
  switch (sort) {
    case "newest":
      return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    case "price_asc":
      return list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    case "price_desc":
      return list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name, "es"));
    default:
      return list.sort((a, b) => {
        if (a.stock <= 0 !== b.stock <= 0) return a.stock <= 0 ? 1 : -1;
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.on_sale !== b.on_sale) return a.on_sale ? -1 : 1;
        return b.created_at.localeCompare(a.created_at);
      });
  }
}

export function isSortOption(value: string | null): value is SortOption {
  return SORT_OPTIONS.some((o) => o.value === value);
}
