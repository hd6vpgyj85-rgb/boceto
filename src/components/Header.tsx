import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSiteSettings, useCategories } from "../hooks/useSiteData";
import { useCart } from "../context/CartContext";
import "./Header.css";

export default function Header() {
  const { settings } = useSiteSettings();
  const { categories } = useCategories();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link to="/" className="site-logo" onClick={closeMenu}>
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={settings.business_name} className="site-logo-image" />
          ) : (
            <span className="site-logo-text">{settings?.business_name ?? "Cargando…"}</span>
          )}
        </Link>

        <nav className={`site-nav ${menuOpen ? "site-nav-open" : ""}`}>
          <NavLink to="/" end onClick={closeMenu}>
            Inicio
          </NavLink>
          {categories.map((cat) => (
            <NavLink key={cat.slug} to={`/${cat.slug}`} onClick={closeMenu}>
              {cat.name}
            </NavLink>
          ))}
          <NavLink to="/productos" onClick={closeMenu}>
            Todos
          </NavLink>
          <NavLink to="/ofertas" onClick={closeMenu}>
            Ofertas
          </NavLink>
        </nav>

        <div className="site-header-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label="Buscar"
            onClick={() => navigate("/buscar")}
          >
            <SearchIcon />
          </button>
          <Link to="/admin/login" className="icon-btn" aria-label="Acceso">
            <LockIcon />
          </Link>
          <Link to="/carrito" className="icon-btn cart-btn" aria-label="Carrito">
            <CartIcon />
            {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
          </Link>
          <button
            type="button"
            className="icon-btn menu-toggle"
            aria-label="Menú"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M1 1h4l2.6 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
