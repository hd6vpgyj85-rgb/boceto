import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../lib/format";
import "./AddedToCartToast.css";

export default function AddedToCartToast() {
  const { lastAdded, dismissLastAdded } = useCart();

  useEffect(() => {
    if (!lastAdded) return;
    const timer = window.setTimeout(dismissLastAdded, 4500);
    return () => window.clearTimeout(timer);
  }, [lastAdded, dismissLastAdded]);

  if (!lastAdded) return null;

  return (
    <div className="added-toast" role="status">
      {lastAdded.image ? (
        <img src={lastAdded.image} alt={lastAdded.name} className="added-toast-image" />
      ) : (
        <div className="added-toast-image added-toast-image-fallback" />
      )}
      <div className="added-toast-body">
        <span className="added-toast-title">Agregado al carrito</span>
        <span className="added-toast-name">{lastAdded.name}</span>
        <span className="added-toast-price">{formatCurrency(lastAdded.price)}</span>
      </div>
      <div className="added-toast-actions">
        <Link to="/carrito" className="btn btn-primary btn-sm" onClick={dismissLastAdded}>
          Ver carrito
        </Link>
        <button type="button" className="added-toast-close" onClick={dismissLastAdded} aria-label="Cerrar">
          ×
        </button>
      </div>
    </div>
  );
}
