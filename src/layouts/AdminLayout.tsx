import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminLayout.css";

export default function AdminLayout() {
  const { session, loading, signOut } = useAuth();

  if (loading) {
    return <div className="admin-gate">Cargando…</div>;
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link to="/admin" className="admin-header-logo">
          beautylat
        </Link>

        <div className="admin-header-actions">
          <Link to="/admin/clientes" className="admin-header-icon" aria-label="Clientes" title="Clientes">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" strokeLinecap="round" />
            </svg>
          </Link>
          <Link to="/admin/resenas" className="admin-header-icon" aria-label="Reseñas" title="Reseñas">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2.5l2.94 6.3 6.86.7-5.1 4.72 1.44 6.78L12 17.9l-6.14 3.1 1.44-6.78-5.1-4.72 6.86-.7L12 2.5Z" />
            </svg>
          </Link>
          <Link to="/admin/cupones" className="admin-header-icon" aria-label="Cupones" title="Cupones">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
              <path d="M10 6v12" strokeDasharray="2 3" />
            </svg>
          </Link>

          <span className="admin-header-sep" />

          <Link to="/" target="_blank" className="admin-header-link">
            Ver sitio
          </Link>
          <button className="admin-header-link" onClick={signOut}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="admin-content">
        <Outlet />
      </div>

      <nav className="admin-tabbar">
        <NavLink to="/admin" end>
          Panel
        </NavLink>
        <NavLink to="/admin/productos">Productos</NavLink>
        <NavLink to="/admin/categorias">Categorías</NavLink>
        <NavLink to="/admin/pedidos">Pedidos</NavLink>
      </nav>
    </div>
  );
}
