import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { formatCurrency, formatDate } from "../../lib/format";
import { useCountUp } from "../../hooks/useCountUp";
import { useSiteSettings } from "../../hooks/useSiteData";
import type { Order, OrderStatus } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import { ArrowRightIcon, BagIcon, BoxIcon, CashIcon, GiftIcon, PlusIcon, SparkIcon, UserIcon } from "../../components/Icons";
import "./adminShared.css";
import "./Dashboard.css";

interface Stats {
  products: number;
  pendingOrders: number;
  activeOrders: number;
  pendingReviews: number;
  customers: number;
  lowStock: number;
  outOfStock: number;
  activeCoupons: number;
  monthSales: number;
  monthOrders: number;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  processing: "En proceso",
  completed: "Completado",
  cancelled: "Cancelado",
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Order[]>([]);

  useEffect(() => {
    async function load() {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [
        products,
        pendingOrders,
        activeOrders,
        pendingReviews,
        customers,
        lowStock,
        outOfStock,
        activeCoupons,
        monthRows,
        recentRows,
      ] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending").is("archived_at", null),
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .in("status", ["pending", "processing"])
          .is("archived_at", null),
        supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("customers").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }).gt("stock", 0).lte("stock", 5),
        supabase.from("products").select("*", { count: "exact", head: true }).lte("stock", 0),
        supabase.from("coupons").select("*", { count: "exact", head: true }).eq("active", true),
        supabase.from("orders").select("total").neq("status", "cancelled").gte("created_at", monthStart.toISOString()),
        supabase.from("orders").select("*").is("archived_at", null).order("created_at", { ascending: false }).limit(5),
      ]);

      const monthTotals = (monthRows.data as { total: number }[] | null) ?? [];

      setStats({
        products: products.count ?? 0,
        pendingOrders: pendingOrders.count ?? 0,
        activeOrders: activeOrders.count ?? 0,
        pendingReviews: pendingReviews.count ?? 0,
        customers: customers.count ?? 0,
        lowStock: lowStock.count ?? 0,
        outOfStock: outOfStock.count ?? 0,
        activeCoupons: activeCoupons.count ?? 0,
        monthSales: monthTotals.reduce((sum, o) => sum + Number(o.total), 0),
        monthOrders: monthTotals.length,
      });
      setRecent((recentRows.data as Order[] | null) ?? []);
    }
    load();
  }, []);

  if (!stats) return <LoadingSpinner />;

  const attention = [
    stats.pendingOrders > 0 && {
      label: `${stats.pendingOrders} pedido${stats.pendingOrders === 1 ? "" : "s"} esperando confirmación`,
      path: "/admin/pedidos",
    },
    stats.pendingReviews > 0 && {
      label: `${stats.pendingReviews} reseña${stats.pendingReviews === 1 ? "" : "s"} por aprobar`,
      path: "/admin/resenas",
    },
    stats.outOfStock > 0 && {
      label: `${stats.outOfStock} producto${stats.outOfStock === 1 ? "" : "s"} agotado${stats.outOfStock === 1 ? "" : "s"}`,
      path: "/admin/productos",
    },
    stats.lowStock > 0 && {
      label: `${stats.lowStock} producto${stats.lowStock === 1 ? "" : "s"} con pocas unidades`,
      path: "/admin/productos",
    },
  ].filter(Boolean) as { label: string; path: string }[];

  const cards: { label: string; value: number; path: string; icon: ReactNode; alert?: boolean }[] = [
    { label: "Pedidos pendientes", value: stats.pendingOrders, path: "/admin/pedidos", icon: <BagIcon size={18} />, alert: stats.pendingOrders > 0 },
    { label: "Pedidos activos", value: stats.activeOrders, path: "/admin/pedidos", icon: <BagIcon size={18} /> },
    { label: "Productos", value: stats.products, path: "/admin/productos", icon: <BoxIcon size={18} /> },
    { label: "Pocas unidades", value: stats.lowStock, path: "/admin/productos", icon: <BoxIcon size={18} />, alert: stats.lowStock > 0 },
    { label: "Agotados", value: stats.outOfStock, path: "/admin/productos", icon: <BoxIcon size={18} />, alert: stats.outOfStock > 0 },
    { label: "Reseñas por revisar", value: stats.pendingReviews, path: "/admin/resenas", icon: <SparkIcon size={18} />, alert: stats.pendingReviews > 0 },
    { label: "Clientes", value: stats.customers, path: "/admin/clientes", icon: <UserIcon size={18} /> },
    { label: "Cupones activos", value: stats.activeCoupons, path: "/admin/cupones", icon: <GiftIcon size={18} /> },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-hero card">
        <div className="dashboard-hero-text">
          <span className="dashboard-hero-eyebrow">{greeting()}</span>
          <h1 className="admin-page-title">{settings?.business_name || "Tu tienda"}</h1>
          <p>
            {attention.length === 0
              ? "Todo está al día. Buen momento para subir un producto nuevo."
              : "Esto es lo que necesita tu atención hoy."}
          </p>
        </div>
        <div className="dashboard-hero-sales">
          <span className="dashboard-hero-sales-icon">
            <CashIcon size={20} />
          </span>
          <span className="dashboard-hero-sales-label">Ventas del mes</span>
          <MoneyCounter value={stats.monthSales} />
          <span className="dashboard-hero-sales-sub">
            {stats.monthOrders} pedido{stats.monthOrders === 1 ? "" : "s"} este mes
          </span>
        </div>
      </div>

      {attention.length > 0 && (
        <ul className="dashboard-attention">
          {attention.map((item, i) => (
            <li key={item.label} style={{ animationDelay: `${120 + i * 70}ms` }}>
              <Link to={item.path}>
                <span className="dashboard-attention-dot" />
                {item.label}
                <ArrowRightIcon size={14} className="dashboard-attention-arrow" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="dashboard-quick">
        <Link to="/admin/productos/nuevo" className="btn btn-primary btn-sm">
          <PlusIcon size={16} />
          Nuevo producto
        </Link>
        <Link to="/admin/cupones" className="btn btn-outline btn-sm">
          Crear cupón
        </Link>
        <Link to="/admin/contenido-inicio" className="btn btn-outline btn-sm">
          Editar portada
        </Link>
      </div>

      <div className="admin-stat-grid">
        {cards.map((card, i) => (
          <StatCard key={card.label} {...card} delay={i * 50} onClick={() => navigate(card.path)} />
        ))}
      </div>

      <section className="dashboard-recent card">
        <div className="dashboard-recent-head">
          <h2>Pedidos recientes</h2>
          <Link to="/admin/pedidos" className="link-underline">
            Ver todos
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="dashboard-recent-empty">Aún no hay pedidos. Cuando alguien compre, aparecerá aquí.</p>
        ) : (
          <ul className="dashboard-recent-list">
            {recent.map((order, i) => (
              <li key={order.id} style={{ animationDelay: `${200 + i * 60}ms` }}>
                <button type="button" onClick={() => navigate(`/admin/pedidos?pedido=${order.id}`)}>
                  <span className="dashboard-recent-avatar">{order.customer_name.charAt(0).toUpperCase()}</span>
                  <span className="dashboard-recent-info">
                    <strong>{order.customer_name}</strong>
                    <small>
                      #{order.id.slice(0, 6).toUpperCase()} · {formatDate(order.created_at)}
                    </small>
                  </span>
                  <span className={`admin-badge admin-badge-${order.status}`}>{STATUS_LABELS[order.status]}</span>
                  <span className="dashboard-recent-total">{formatCurrency(order.total)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  alert,
  delay,
  onClick,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  alert?: boolean;
  delay: number;
  onClick: () => void;
}) {
  const shown = useCountUp(value, 1100);
  return (
    <button
      type="button"
      className={`admin-stat-card card ${alert ? "is-alert" : ""}`}
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="admin-stat-icon">{icon}</span>
      <span className="admin-stat-value">{shown}</span>
      <span className="admin-stat-label">{label}</span>
    </button>
  );
}

function MoneyCounter({ value }: { value: number }) {
  const shown = useCountUp(value, 1400);
  return <strong className="dashboard-hero-sales-value">{formatCurrency(shown)}</strong>;
}
