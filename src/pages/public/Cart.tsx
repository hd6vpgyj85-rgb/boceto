import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { usePageTitle } from "../../hooks/useSiteData";
import { formatCurrency } from "../../lib/format";
import QuantityStepper from "../../components/QuantityStepper";
import EmptyState from "../../components/EmptyState";
import SmartImage from "../../components/SmartImage";
import { ArrowRightIcon, CloseIcon, GiftIcon, ShieldIcon, TruckIcon } from "../../components/Icons";
import "./Cart.css";

export default function Cart() {
  usePageTitle("Carrito");
  const { lines, updateQuantity, removeFromCart, clearCart, subtotal, itemCount } = useCart();
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  const keyOf = (productId: string, size: string | null) => `${productId}::${size ?? ""}`;

  const animateRemove = (productId: string, size: string | null) => {
    const key = keyOf(productId, size);
    setRemoving((prev) => new Set(prev).add(key));
    window.setTimeout(() => {
      removeFromCart(productId, size);
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 320);
  };

  if (lines.length === 0) {
    return (
      <div className="section container">
        <EmptyState
          title="Tu carrito está vacío"
          description="Todavía no agregas nada. Date una vuelta por el catálogo: seguro encuentras algo que te encante."
          action={
            <>
              <Link to="/productos" className="btn btn-primary">
                Explorar catálogo
                <ArrowRightIcon size={18} className="btn-arrow" />
              </Link>
              <Link to="/ofertas" className="btn btn-outline">
                Ver ofertas
              </Link>
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="section container cart-page">
      <div className="cart-head">
        <h1 className="cart-title">
          Tu carrito <span className="cart-title-count">{itemCount}</span>
        </h1>
        <button
          type="button"
          className="cart-clear"
          onClick={() => window.confirm("¿Vaciar el carrito?") && clearCart()}
        >
          Vaciar carrito
        </button>
      </div>

      <div className="cart-layout">
        <ul className="cart-lines">
          {lines.map((line, i) => {
            const key = keyOf(line.productId, line.size);
            return (
              <li
                className={`cart-line ${removing.has(key) ? "is-removing" : ""}`}
                key={key}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Link to={`/producto/${line.productId}`} className="cart-line-image">
                  <SmartImage src={line.image} alt={line.name} />
                </Link>
                <div className="cart-line-info">
                  <Link to={`/producto/${line.productId}`} className="cart-line-name">
                    {line.name}
                  </Link>
                  {line.size && <span className="cart-line-size">{line.size}</span>}
                  <span className="cart-line-unit">{formatCurrency(line.price)} c/u</span>
                </div>
                <div className="cart-line-controls">
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(q) => updateQuantity(line.productId, line.size, q)}
                    max={line.stock > 0 ? Math.min(line.stock, 99) : 99}
                  />
                  <span key={line.quantity} className="cart-line-total">
                    {formatCurrency(line.price * line.quantity)}
                  </span>
                </div>
                <button
                  type="button"
                  className="cart-line-remove"
                  onClick={() => animateRemove(line.productId, line.size)}
                  aria-label={`Quitar ${line.name} del carrito`}
                >
                  <CloseIcon size={16} />
                </button>
              </li>
            );
          })}
        </ul>

        <aside className="cart-summary card">
          <h2>Resumen del pedido</h2>
          <div className="cart-summary-row">
            <span>
              Productos ({itemCount})
            </span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="cart-summary-row cart-summary-muted">
            <span>Envío</span>
            <span>Se coordina por WhatsApp</span>
          </div>
          <div className="cart-summary-row cart-summary-total">
            <span>Subtotal</span>
            <span key={subtotal} className="cart-summary-amount">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <p className="cart-summary-note">
            <GiftIcon size={16} />
            ¿Tienes un cupón? Lo aplicas en el siguiente paso.
          </p>
          <Link to="/checkout" className="btn btn-primary btn-block">
            Continuar con el pedido
            <ArrowRightIcon size={18} className="btn-arrow" />
          </Link>
          <Link to="/productos" className="btn btn-ghost btn-block">
            Seguir comprando
          </Link>
          <ul className="cart-trust">
            <li>
              <ShieldIcon size={16} /> Compra segura
            </li>
            <li>
              <TruckIcon size={16} /> Envíos a todo el país
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
