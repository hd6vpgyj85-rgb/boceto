import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { formatCurrency, formatDate } from "../../lib/format";
import { buildWhatsAppUrl } from "../../lib/whatsapp";
import { useSiteSettings } from "../../hooks/useSiteData";
import { useToast } from "../../context/ToastContext";
import type { Order, OrderStatus } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import { CloseIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from "../../components/Icons";
import "./adminShared.css";
import "./Orders.css";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  processing: "En proceso",
  completed: "Completado",
  cancelled: "Cancelado",
};

const STATUS_ORDER: OrderStatus[] = ["pending", "processing", "completed", "cancelled"];

const orderRef = (order: Order) => `#${order.id.slice(0, 6).toUpperCase()}`;

export default function Orders() {
  const { settings } = useSiteSettings();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    let request = supabase.from("orders").select("*").order("created_at", { ascending: false });
    request = showArchived ? request.not("archived_at", "is", null) : request.is("archived_at", null);
    const { data } = await request;
    const rows = (data as Order[] | null) ?? [];
    setOrders(rows);
    setLoading(false);
    return rows;
  };

  useEffect(() => {
    load().then((rows) => {
      const target = searchParams.get("pedido");
      if (!target) return;
      const match = rows.find((o) => o.id === target);
      if (match) setSelected(match);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const closeModal = () => {
    setSelected(null);
    if (searchParams.has("pedido")) setSearchParams({}, { replace: true, preventScrollReset: true });
  };

  const counts = useMemo(() => {
    const result: Record<OrderStatus | "all", number> = { all: orders.length, pending: 0, processing: 0, completed: 0, cancelled: 0 };
    for (const o of orders) result[o.status] += 1;
    return result;
  }, [orders]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        o.id.slice(0, 6).toLowerCase().includes(q.replace("#", ""))
      );
    });
  }, [orders, statusFilter, query]);

  const updateStatus = async (order: Order, status: OrderStatus) => {
    setUpdating(true);
    const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
    setUpdating(false);
    if (error) {
      toast("No se pudo cambiar el estado", "error");
      return;
    }
    setSelected((s) => (s ? { ...s, status } : s));
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    toast(`Pedido ${orderRef(order)}: ${STATUS_LABELS[status].toLowerCase()}`, "success");
  };

  const toggleArchive = async (order: Order) => {
    const archiving = !order.archived_at;
    const { error } = await supabase
      .from("orders")
      .update({ archived_at: archiving ? new Date().toISOString() : null })
      .eq("id", order.id);
    if (error) {
      toast("No se pudo actualizar el pedido", "error");
      return;
    }
    closeModal();
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    toast(archiving ? `Pedido ${orderRef(order)} archivado` : `Pedido ${orderRef(order)} restaurado`, "info");
  };

  const customerWhatsApp = (order: Order) =>
    buildWhatsAppUrl(
      order.customer_phone,
      `¡Hola, ${order.customer_name.split(" ")[0]}! Te escribimos de ${settings?.business_name ?? "la tienda"} sobre tu pedido ${orderRef(order)}.`,
    );

  const itemCount = (order: Order) => order.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">{showArchived ? "Pedidos archivados" : "Pedidos"}</h1>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowArchived((v) => !v)}>
          {showArchived ? "Ver activos" : "Ver archivados"}
        </button>
      </div>

      <div className="orders-filters">
        {(["all", ...STATUS_ORDER] as const).map((status) => (
          <button
            key={status}
            type="button"
            className={`orders-filter ${statusFilter === status ? "is-active" : ""}`}
            onClick={() => setStatusFilter(status)}
          >
            {status === "all" ? "Todos" : STATUS_LABELS[status]}
            <span className="orders-filter-count">{counts[status]}</span>
          </button>
        ))}
      </div>

      <div className="admin-toolbar">
        <input
          className="admin-search-input"
          type="search"
          placeholder="Buscar por cliente, teléfono o referencia"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : visible.length === 0 ? (
        <p className="admin-empty">
          {orders.length === 0
            ? showArchived
              ? "No hay pedidos archivados."
              : "Aún no hay pedidos. Cuando alguien compre, aparecerá aquí."
            : "Ningún pedido coincide con el filtro."}
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Artículos</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => (
                <tr key={order.id} onClick={() => setSelected(order)} className="admin-row-link">
                  <td>
                    <span className="orders-ref">{orderRef(order)}</span>
                    <span className="orders-date">{formatDate(order.created_at)}</span>
                  </td>
                  <td>{order.customer_name}</td>
                  <td>{itemCount(order)}</td>
                  <td className="orders-total">{formatCurrency(order.total)}</td>
                  <td>
                    <span className={`admin-badge admin-badge-${order.status}`}>{STATUS_LABELS[order.status]}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(order);
                      }}
                    >
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
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal order-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal-head">
              <div>
                <span className="order-modal-ref">Pedido {orderRef(selected)}</span>
                <h2>{selected.customer_name}</h2>
              </div>
              <button type="button" className="admin-modal-close" onClick={closeModal} aria-label="Cerrar">
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="order-steps">
              {STATUS_ORDER.filter((s) => s !== "cancelled").map((status, i) => {
                const currentIndex = STATUS_ORDER.indexOf(selected.status);
                const done = selected.status !== "cancelled" && i <= currentIndex;
                return (
                  <span key={status} className={`order-step ${done ? "is-done" : ""}`}>
                    <span className="order-step-dot" />
                    {STATUS_LABELS[status]}
                  </span>
                );
              })}
              {selected.status === "cancelled" && <span className="order-step is-cancelled">Cancelado</span>}
            </div>

            <div className="order-contact">
              <span>
                <PhoneIcon size={15} />
                {selected.customer_phone}
              </span>
              <span>
                <MapPinIcon size={15} />
                {selected.address}
                {selected.city ? `, ${selected.city}` : ""}
              </span>
              <a href={customerWhatsApp(selected)} target="_blank" rel="noreferrer" className="btn btn-whatsapp btn-sm">
                <WhatsAppIcon size={16} />
                Escribir al cliente
              </a>
            </div>

            <dl className="order-meta">
              <div>
                <dt>Fecha</dt>
                <dd>{formatDate(selected.created_at)}</dd>
              </div>
              <div>
                <dt>Pago</dt>
                <dd>{selected.payment_method}</dd>
              </div>
              {selected.customer_email && (
                <div>
                  <dt>Correo</dt>
                  <dd>{selected.customer_email}</dd>
                </div>
              )}
              {selected.coupon_code && (
                <div>
                  <dt>Cupón</dt>
                  <dd className="order-coupon">{selected.coupon_code}</dd>
                </div>
              )}
            </dl>

            {selected.notes && <p className="order-notes">{selected.notes}</p>}

            <ul className="order-items">
              {selected.items.map((item, i) => (
                <li key={i} style={{ animationDelay: `${i * 50}ms` }}>
                  {item.image ? <img src={item.image} alt="" /> : <span className="order-item-placeholder" />}
                  <span className="order-item-name">
                    {item.name}
                    <small>
                      {item.quantity} × {formatCurrency(item.price)}
                      {item.size ? ` · ${item.size}` : ""}
                    </small>
                  </span>
                  <span className="order-item-total">{formatCurrency(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="order-totals">
              <div>
                <span>Subtotal</span>
                <span>{formatCurrency(selected.subtotal)}</span>
              </div>
              {selected.discount > 0 && (
                <div className="order-discount">
                  <span>Descuento</span>
                  <span>−{formatCurrency(selected.discount)}</span>
                </div>
              )}
              <div className="order-grand-total">
                <span>Total</span>
                <span>{formatCurrency(selected.total)}</span>
              </div>
            </div>

            <div className="field order-status-field">
              <label>Estado del pedido</label>
              <select
                value={selected.status}
                disabled={updating}
                onChange={(e) => updateStatus(selected, e.target.value as OrderStatus)}
              >
                {STATUS_ORDER.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-actions">
              <button type="button" className="btn btn-ghost" onClick={closeModal}>
                Cerrar
              </button>
              <button type="button" className="btn btn-outline" onClick={() => toggleArchive(selected)}>
                {selected.archived_at ? "Restaurar" : "Archivar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
