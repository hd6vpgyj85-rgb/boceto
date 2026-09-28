import { CATEGORIES, LEVEL_LABELS, type Product } from "../types";

export function getProductDescription(product: Product): string {
  if (product.description?.trim()) return product.description.trim();

  const categoryLabel =
    CATEGORIES.find((c) => c.slug === product.category)?.name.toLowerCase() ?? "producto";
  const levelText = product.levels?.length
    ? ` con ${product.levels.map((l) => LEVEL_LABELS[l].toLowerCase()).join(" / ")}`
    : "";

  return `${product.name} de ${product.brand}. Esta pieza de ${categoryLabel}${levelText} está pensada para acompañarte todos los días, combinando comodidad y un acabado que se ve tan bien como se siente.`;
}
