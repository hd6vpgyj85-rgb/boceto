import { Link } from "react-router-dom";
import { useCoupons } from "../../context/CouponsContext";
import { formatPrice } from "../../lib/format";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";

export default function CouponsPage() {
  const { coupons, loading, toggleActive, deleteCoupon } = useCoupons();

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Cupones</h1>
        <Link to="/admin/cupones/nuevo" className="admin-btn-sm primary">
          + Nuevo
        </Link>
      </div>

      {coupons.length === 0 ? (
        <p className="admin-empty">Aún no hay cupones.</p>
      ) : (
        <div className="admin-list">
          {coupons.map((coupon) => (
            <div className="admin-list-item" key={coupon.code}>
              <div className="admin-list-item-info">
                <strong>{coupon.code}</strong>
                <span>
                  {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : formatPrice(coupon.discountValue)} ·{" "}
                  {coupon.timesUsed}/{coupon.usageLimit} usos
                </span>
              </div>
              <div className="admin-list-item-actions">
                <button className="admin-btn-sm" onClick={() => toggleActive(coupon.code, !coupon.active)}>
                  {coupon.active ? "Desactivar" : "Activar"}
                </button>
                <button className="admin-btn-sm danger" onClick={() => deleteCoupon(coupon.code)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
