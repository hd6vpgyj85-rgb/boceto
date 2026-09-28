import type { Product } from "../types";
import ProductGridCard from "./ProductGridCard";
import "./ProductGrid.css";

export default function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="product-grid-empty">No encontramos productos con este filtro por ahora.</p>;
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductGridCard key={product.id} product={product} />
      ))}
    </div>
  );
}
