import { formatPrice } from "../lib/format";
import type { Product } from "../types";
import "./ProductPrice.css";

export default function ProductPrice({ product }: { product: Product }) {
  const showSale = product.onSale && product.compareAtPrice;
  return (
    <div className="product-price">
      {showSale && <span className="product-price-old">{formatPrice(product.compareAtPrice!)}</span>}
      <span className={showSale ? "product-price-sale" : ""}>{formatPrice(product.price)}</span>
    </div>
  );
}
