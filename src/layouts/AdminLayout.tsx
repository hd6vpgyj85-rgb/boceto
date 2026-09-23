import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useSiteSettings } from "../hooks/useSiteData";
import LoadingSpinner from "../components/LoadingSpinner";
import "./AdminLayout.css";

export default function AdminLayout() {
  const { session, loading, signOut } = useAuth();
  const { settings } = useSiteSettings();
  const { pathname } = useLocation();
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending").is("archived_at", null),
      supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]).then(([orders, reviews]) => {
      setPendingOrders(orders.count ?? 0);
      setPendingReviews(reviews.count ?? 0);
    });
  }, [session, pathname]);

  useEffect(() => {
    const name = settings?.business_name;
    document.title = name ? `Panel · ${name}` : "Panel de administración";
  }, [settings?.business_name, pathname]);

  if (loading) return <LoadingSpinner />;
  if (!session) return <Navigate to="/admin/login" replace />;

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-inner">
          <NavLink to="/admin" end className="admin-logo">
            <span className="admin-logo-dot" />
            {settings?.business_name ?? "Admin"}
            <span className="admin-logo-tag">Panel</span>
          </NavLink>

          <div className="admin-quick-access">
            <NavLink to="/admin/clientes" className="admin-quick-icon" title="Clientes">
              <UsersIcon />
            </NavLink>
            <NavLink to="/admin/resenas" className="admin-quick-icon" title="Reseñas">
              <StarIcon />
              {pendingReviews > 0 && <span className="admin-nav-badge">{pendingReviews > 9 ? "9+" : pendingReviews}</span>}
            </NavLink>
            <NavLink to="/admin/cupones" className="admin-quick-icon" title="Cupones">
              <TagIcon />
            </NavLink>
            <NavLink to="/admin/contenido-inicio" className="admin-quick-icon" title="Contenido de inicio">
              <ImageIcon />
            </NavLink>
            <NavLink to="/admin/configuracion" className="admin-quick-icon" title="Configuración del negocio">
              <SettingsIcon />
            </NavLink>
          </div>

          <div className="admin-header-actions">
            <a href="/" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm admin-view-site">
              Ver sitio
            </a>
            <button type="button" className="btn btn-ghost btn-sm" onClick={signOut}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="admin-content">
        <div className="admin-page-transition" key={pathname}>
          <Outlet />
        </div>
      </main>

      <nav className="admin-bottom-nav">
        <NavLink to="/admin" end>
          <GridIcon />
          <span>Panel</span>
        </NavLink>
        <NavLink to="/admin/productos">
          <BoxIcon />
          <span>Productos</span>
        </NavLink>
        <NavLink to="/admin/categorias">
          <LayersIcon />
          <span>Categorías</span>
        </NavLink>
        <NavLink to="/admin/pedidos">
          <span className="admin-bottom-icon">
            <ClipboardIcon />
            {pendingOrders > 0 && <span className="admin-nav-badge">{pendingOrders > 9 ? "9+" : pendingOrders}</span>}
          </span>
          <span>Pedidos</span>
        </NavLink>
      </nav>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .58 1.42l9.58 9.58a2 2 0 0 0 2.83 0l4.6-4.6a2 2 0 0 0 0-2.83z" />
      <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 8 12 3 3 8l9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}
