import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatCurrency } from "../lib/format";
import "./ProductCard.css";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0] ?? null;
  const outOfStock = product.stock <= 0;

  return (
    <Link to={`/producto/${product.id}`} className="product-card card">
      <div className="product-card-image-wrap">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="product-card-image"
            style={{ objectFit: product.cover_fit }}
            loading="lazy"
          />
        ) : (
          <div className="product-card-image product-card-placeholder" />
        )}
        {product.on_sale && product.sale_price != null && (
          <span className="product-card-badge">Oferta</span>
        )}
        {outOfStock && <span className="product-card-badge product-card-badge-out">Agotado</span>}
      </div>
      <div className="product-card-body">
        <span className="product-card-brand">{product.brand}</span>
        <h3 className="product-card-name">{product.name}</h3>
        <div className="product-card-price-row">
          {product.on_sale && product.sale_price != null ? (
            <>
              <span className="product-card-price-old">{formatCurrency(product.price)}</span>
              <span className="product-card-price">{formatCurrency(product.sale_price)}</span>
            </>
          ) : (
            <span className="product-card-price">{formatCurrency(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
