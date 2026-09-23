import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../lib/format";
import { CheckIcon, CloseIcon } from "./Icons";
import "./AddedToCartToast.css";

const VISIBLE_MS = 4500;

export default function AddedToCartToast() {
  const { lastAdded, dismissLastAdded, itemCount, subtotal } = useCart();
  const [leaving, setLeaving] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!lastAdded) return;
    setLeaving(false);
    const leaveTimer = window.setTimeout(() => setLeaving(true), VISIBLE_MS);
    const removeTimer = window.setTimeout(dismissLastAdded, VISIBLE_MS + 300);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
    };
  }, [lastAdded, dismissLastAdded]);

  useEffect(() => {
    if (location.pathname === "/carrito") dismissLastAdded();
  }, [location.pathname, dismissLastAdded]);

  if (!lastAdded) return null;

  const close = () => {
    setLeaving(true);
    window.setTimeout(dismissLastAdded, 280);
  };

  return (
    <div key={lastAdded.addedAt} className={`added-toast ${leaving ? "is-leaving" : ""}`} role="status">
      <div className="added-toast-thumb">
        {lastAdded.image ? <img src={lastAdded.image} alt="" /> : <span />}
        <span className="added-toast-check">
          <CheckIcon size={12} strokeWidth={3.2} />
        </span>
      </div>
      <div className="added-toast-body">
        <span className="added-toast-title">¡Agregado al carrito!</span>
        <span className="added-toast-name">
          {lastAdded.quantity > 1 ? `${lastAdded.quantity}× ` : ""}
          {lastAdded.name}
          {lastAdded.size ? ` · ${lastAdded.size}` : ""}
        </span>
        <span className="added-toast-meta">
          {itemCount} en tu carrito · {formatCurrency(subtotal)}
        </span>
      </div>
      <div className="added-toast-actions">
        <Link to="/carrito" className="btn btn-primary btn-sm" onClick={dismissLastAdded}>
          Ver carrito
        </Link>
        <button type="button" className="added-toast-close" onClick={close} aria-label="Cerrar aviso">
          <CloseIcon size={16} />
        </button>
      </div>
      <span className="added-toast-progress" style={{ animationDuration: `${VISIBLE_MS}ms` }} />
    </div>
  );
}
