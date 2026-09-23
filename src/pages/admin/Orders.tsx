import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatCurrency, formatDate } from "../../lib/format";
import type { Order, OrderStatus } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  processing: "En proceso",
  completed: "Completado",
  cancelled: "Cancelado",
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);

  const load = async () => {
    setLoading(true);
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
    query = showArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
    const { data } = await query;
    setOrders((data as Order[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  const updateStatus = async (order: Order, status: OrderStatus) => {
    await supabase.from("orders").update({ status }).eq("id", order.id);
    setSelected((s) => (s ? { ...s, status } : s));
    load();
  };

  const toggleArchive = async (order: Order) => {
    await supabase
      .from("orders")
      .update({ archived_at: order.archived_at ? null : new Date().toISOString() })
      .eq("id", order.id);
    setSelected(null);
    load();
  };

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Pedidos</h1>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowArchived((v) => !v)}>
          {showArchived ? "Ver activos" : "Ver baúl de archivados"}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <p className="admin-empty">No hay pedidos {showArchived ? "archivados" : "por aquí"}.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} onClick={() => setSelected(order)} style={{ cursor: "pointer" }}>
                  <td>{formatDate(order.created_at)}</td>
                  <td>{order.customer_name}</td>
                  <td>{formatCurrency(order.total)}</td>
                  <td>
                    <span className={`admin-badge admin-badge-${order.status}`}>{STATUS_LABELS[order.status]}</span>
                  </td>
                  <td>
                    <button type="button" className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); setSelected(order); }}>
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="admin-modal-overlay" onClick={() => setSelected(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h2>Pedido de {selected.customer_name}</h2>
              <button type="button" className="admin-modal-close" onClick={() => setSelected(null)}>
                ×
              </button>
            </div>

            <p><strong>Teléfono:</strong> {selected.customer_phone}</p>
            <p><strong>Dirección:</strong> {selected.address}, {selected.city}</p>
            <p><strong>Pago:</strong> {selected.payment_method}</p>
            {selected.notes && <p><strong>Notas:</strong> {selected.notes}</p>}
            {selected.coupon_code && <p><strong>Cupón:</strong> {selected.coupon_code}</p>}

            <div style={{ margin: "16px 0" }}>
              {selected.items.map((item, i) => (
                <div key={i} className="checkout-summary-line">
                  <span>{item.quantity}× {item.name}{item.size ? ` (${item.size})` : ""}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(selected.subtotal)}</span>
            </div>
            {selected.discount > 0 && (
              <div className="cart-summary-row checkout-discount-row">
                <span>Descuento</span>
                <span>-{formatCurrency(selected.discount)}</span>
              </div>
            )}
            <div className="cart-summary-row checkout-total-row">
              <span>Total</span>
              <span>{formatCurrency(selected.total)}</span>
            </div>

            <div className="field" style={{ marginTop: 16 }}>
              <label>Estado</label>
              <select value={selected.status} onChange={(e) => updateStatus(selected, e.target.value as OrderStatus)}>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-actions">
              <button type="button" className="btn btn-outline" onClick={() => toggleArchive(selected)}>
                {selected.archived_at ? "Sacar del baúl" : "Archivar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
