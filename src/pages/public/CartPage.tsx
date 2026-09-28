import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../lib/format";
import QuantityStepper from "../../components/QuantityStepper";
import "./CartPage.css";

export default function CartPage() {
  const { lines, updateQuantity, removeLine, subtotal } = useCart();
  const navigate = useNavigate();

  if (lines.length === 0) {
    return (
      <div className="container cart-empty">
        <h1>Tu carrito está vacío</h1>
        <p>Explora nuestro catálogo y encuentra tu próxima pieza favorita.</p>
        <Link to="/fajas" className="btn btn-primary">
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <h1>Tu carrito</h1>

      <div className="cart-lines">
        {lines.map((line) => (
          <div className="cart-line" key={`${line.productId}-${line.level ?? ""}`}>
            {line.image ? <img src={line.image} alt={line.name} /> : <div className="cart-line-placeholder" />}
            <div className="cart-line-info">
              <h3>{line.name}</h3>
              {line.level && <span className="cart-line-level">{line.level}</span>}
              <span className="cart-line-price">{formatPrice(line.price)}</span>
            </div>
            <div className="cart-line-actions">
              <QuantityStepper
                quantity={line.quantity}
                max={line.stock}
                onChange={(qty) => updateQuantity(line.productId, line.level, qty)}
              />
              <button className="cart-line-remove" onClick={() => removeLine(line.productId, line.level)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-summary-row">
          <span>Subtotal</span>
          <strong>{formatPrice(subtotal)}</strong>
        </div>
        <p className="cart-summary-note">El envío se coordina al confirmar tu pedido.</p>
        <button className="btn btn-primary btn-block" onClick={() => navigate("/checkout")}>
          Continuar al checkout
        </button>
      </div>
    </div>
  );
}
