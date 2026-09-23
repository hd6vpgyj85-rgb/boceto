import { useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { discountPercent, formatCurrency } from "../lib/format";
import { useCart } from "../context/CartContext";
import SmartImage from "./SmartImage";
import { CheckIcon, PlusIcon } from "./Icons";
import "./ProductCard.css";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;
  const onSale = product.on_sale && product.sale_price != null;
  const finalPrice = onSale ? (product.sale_price as number) : product.price;
  const discount = onSale ? discountPercent(product.price, product.sale_price) : 0;
  const canQuickAdd = !outOfStock && product.sizes.length <= 1;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.images[0] ?? null,
      price: finalPrice,
      size: product.sizes[0] ?? null,
      stock: product.stock,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <Link to={`/producto/${product.id}`} className={`product-card card ${outOfStock ? "is-out" : ""}`}>
      <div className="product-card-media">
        <SmartImage src={product.images[0]} alt={product.name} fit={product.cover_fit} />
        {product.images[1] && (
          <SmartImage
            src={product.images[1]}
            alt=""
            fit={product.cover_fit}
            className="product-card-alt-image"
          />
        )}

        <div className="product-card-badges">
          {discount > 0 && <span className="product-card-badge">-{discount}%</span>}
          {lowStock && <span className="product-card-badge product-card-badge-warn">Últimas piezas</span>}
        </div>
        {outOfStock && <span className="product-card-soldout">Agotado</span>}

        {canQuickAdd && (
          <button
            type="button"
            className={`product-card-quick ${added ? "is-added" : ""}`}
            onClick={handleQuickAdd}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            {added ? <CheckIcon size={18} /> : <PlusIcon size={18} />}
          </button>
        )}
      </div>

      <div className="product-card-body">
        {product.brand && <span className="product-card-brand">{product.brand}</span>}
        <h3 className="product-card-name">{product.name}</h3>
        <div className="product-card-price-row">
          <span className="product-card-price">{formatCurrency(finalPrice)}</span>
          {onSale && <span className="product-card-price-old">{formatCurrency(product.price)}</span>}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card card product-card-skeleton" aria-hidden="true">
      <div className="product-card-media skeleton" />
      <div className="product-card-body">
        <span className="skeleton" style={{ width: "40%", height: 10 }} />
        <span className="skeleton" style={{ width: "80%", height: 14, marginTop: 6 }} />
        <span className="skeleton" style={{ width: "35%", height: 18, marginTop: 12 }} />
      </div>
    </div>
  );
}
