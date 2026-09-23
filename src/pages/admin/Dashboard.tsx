import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";

interface Stats {
  products: number;
  pendingOrders: number;
  activeOrders: number;
  pendingReviews: number;
  customers: number;
  lowStock: number;
  outOfStock: number;
  activeCoupons: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const [products, pendingOrders, activeOrders, pendingReviews, customers, lowStock, outOfStock, activeCoupons] =
        await Promise.all([
          supabase.from("products").select("*", { count: "exact", head: true }),
          supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .in("status", ["pending", "processing"]),
          supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("customers").select("*", { count: "exact", head: true }),
          supabase.from("products").select("*", { count: "exact", head: true }).gt("stock", 0).lte("stock", 5),
          supabase.from("products").select("*", { count: "exact", head: true }).lte("stock", 0),
          supabase.from("coupons").select("*", { count: "exact", head: true }).eq("active", true),
        ]);

      setStats({
        products: products.count ?? 0,
        pendingOrders: pendingOrders.count ?? 0,
        activeOrders: activeOrders.count ?? 0,
        pendingReviews: pendingReviews.count ?? 0,
        customers: customers.count ?? 0,
        lowStock: lowStock.count ?? 0,
        outOfStock: outOfStock.count ?? 0,
        activeCoupons: activeCoupons.count ?? 0,
      });
    }
    load();
  }, []);

  if (!stats) return <LoadingSpinner />;

  const cards = [
    { label: "Productos", value: stats.products, path: "/admin/productos" },
    { label: "Pedidos pendientes", value: stats.pendingOrders, path: "/admin/pedidos" },
    { label: "Pedidos activos", value: stats.activeOrders, path: "/admin/pedidos" },
    { label: "Reseñas por revisar", value: stats.pendingReviews, path: "/admin/resenas" },
    { label: "Clientes", value: stats.customers, path: "/admin/clientes" },
    { label: "Pocas unidades", value: stats.lowStock, path: "/admin/productos" },
    { label: "Agotados", value: stats.outOfStock, path: "/admin/productos" },
    { label: "Cupones activos", value: stats.activeCoupons, path: "/admin/cupones" },
  ];

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Panel</h1>
      </div>
      <div className="admin-stat-grid">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            className="admin-stat-card card"
            onClick={() => navigate(card.path)}
          >
            <span className="admin-stat-value">{card.value}</span>
            <span className="admin-stat-label">{card.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
