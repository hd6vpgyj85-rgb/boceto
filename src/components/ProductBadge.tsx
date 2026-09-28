import type { Product } from "../types";

export default function ProductBadge({ product }: { product: Product }) {
  if (product.stock <= 0) return <span className="badge badge-soldout">Agotado</span>;
  if (product.onSale && product.compareAtPrice) return <span className="badge badge-sale">Oferta</span>;
  return null;
}
