import { Link } from "react-router-dom";
import { useOrders } from "../../context/OrdersContext";
import { formatDateTime, formatPrice } from "../../lib/format";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";

export default function OrdersArchivePage() {
  const { orders, loading, restoreOrder } = useOrders();
  const archived = orders.filter((o) => o.archivedAt);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Baúl de pedidos</h1>
        <Link to="/admin/pedidos" className="admin-btn-sm">
          Volver
        </Link>
      </div>

      {archived.length === 0 ? (
        <p className="admin-empty">No hay pedidos archivados.</p>
      ) : (
        <div className="admin-list">
          {archived.map((order) => (
            <div className="admin-list-item" key={order.id}>
              <div className="admin-list-item-info">
                <strong>
                  {order.customer.nombre} {order.customer.apellido}
                </strong>
                <span>
                  {formatDateTime(order.createdAt)} · {formatPrice(order.total)}
                </span>
              </div>
              <div className="admin-list-item-actions">
                <button className="admin-btn-sm" onClick={() => restoreOrder(order.id)}>
                  Restaurar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
