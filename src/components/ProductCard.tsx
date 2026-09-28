import { Link } from "react-router-dom";
import type { Product } from "../types";
import ProductBadge from "./ProductBadge";
import ProductPrice from "./ProductPrice";
import "./ProductCard.css";

export default function ProductCard({ product }: { product: Product }) {
  const cover = product.images?.[0];

  return (
    <Link to={`/producto/${product.id}`} className="product-card">
      <div className="product-card-image">
        <ProductBadge product={product} />
        {cover ? (
          <img src={cover} alt={product.name} loading="lazy" style={{ objectFit: product.homeImageFit ?? "cover" }} />
        ) : (
          <div className="product-card-placeholder" />
        )}
      </div>
      <div className="product-card-body">
        <span className="product-card-brand">{product.brand}</span>
        <h3 className="product-card-name">{product.name}</h3>
        <ProductPrice product={product} />
      </div>
    </Link>
  );
}
