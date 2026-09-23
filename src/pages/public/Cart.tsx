import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../lib/format";
import QuantityStepper from "../../components/QuantityStepper";
import EmptyState from "../../components/EmptyState";
import "./Cart.css";

export default function Cart() {
  const { lines, updateQuantity, removeFromCart, subtotal } = useCart();

  if (lines.length === 0) {
    return (
      <div className="section container">
        <EmptyState
          title="Tu carrito está vacío"
          description="Explora nuestras fragancias árabes, de diseñador y de alta perfumería de nicho."
          action={
            <Link to="/productos" className="btn btn-primary">
              Explorar catálogo
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="section container cart-page">
      <h1 className="cart-title">Tu carrito</h1>

      <div className="cart-layout">
        <div className="cart-lines">
          {lines.map((line) => (
            <div className="cart-line" key={`${line.productId}-${line.size}`}>
              {line.image ? (
                <img src={line.image} alt={line.name} className="cart-line-image" />
              ) : (
                <div className="cart-line-image cart-line-image-fallback" />
              )}
              <div className="cart-line-info">
                <span className="cart-line-name">{line.name}</span>
                {line.size && <span className="cart-line-size">Tamaño: {line.size}</span>}
                <span className="cart-line-price">{formatCurrency(line.price)}</span>
              </div>
              <QuantityStepper
                value={line.quantity}
                onChange={(q) => updateQuantity(line.productId, line.size, q)}
              />
              <button
                type="button"
                className="cart-line-remove"
                onClick={() => removeFromCart(line.productId, line.size)}
                aria-label="Quitar del carrito"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <aside className="cart-summary card">
          <h2>Resumen</h2>
          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <p className="cart-summary-note">Los envíos y descuentos se calculan en el checkout.</p>
          <Link to="/checkout" className="btn btn-primary btn-block">
            Continuar
          </Link>
          <Link to="/productos" className="btn btn-ghost btn-block">
            Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}
