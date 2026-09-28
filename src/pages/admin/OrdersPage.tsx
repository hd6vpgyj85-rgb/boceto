import { Link } from "react-router-dom";
import { useOrders } from "../../context/OrdersContext";
import { formatDateTime, formatPrice } from "../../lib/format";
import type { OrderStatus } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";

const STATUS_OPTIONS: OrderStatus[] = ["pendiente", "en proceso", "completado", "cancelado"];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pendiente: "#fde3cf",
  "en proceso": "#d9e8fc",
  completado: "#d7f5e6",
  cancelado: "#f6d5d5",
};

export default function OrdersPage() {
  const { orders, loading, updateStatus, archiveOrder } = useOrders();
  const active = orders.filter((o) => !o.archivedAt);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Pedidos ({active.length})</h1>
        <Link to="/admin/pedidos/baul" className="admin-btn-sm">
          Ver baúl
        </Link>
      </div>

      {active.length === 0 ? (
        <p className="admin-empty">No hay pedidos activos.</p>
      ) : (
        <div className="admin-list">
          {active.map((order) => (
            <div className="admin-card" key={order.id}>
              <div className="admin-page-header" style={{ marginBottom: 8 }}>
                <strong>
                  {order.customer.nombre} {order.customer.apellido}
                </strong>
                <span className="admin-status-badge" style={{ background: STATUS_COLORS[order.status] }}>
                  {order.status}
                </span>
              </div>
              <p style={{ color: "var(--color-muted)", fontSize: "0.85rem", marginBottom: 8 }}>
                {formatDateTime(order.createdAt)} · {order.items.length} artículos · {formatPrice(order.total)}
              </p>
              <ul style={{ marginBottom: 12 }}>
                {order.items.map((item, i) => (
                  <li key={i} style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}>
                    {item.quantity}x {item.name} {item.level ? `(${item.level})` : ""}
                  </li>
                ))}
              </ul>
              <div className="product-form-actions">
                <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button className="admin-btn-sm" onClick={() => archiveOrder(order.id)}>
                  Archivar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
