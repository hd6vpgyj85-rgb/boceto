import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSiteSettings, useCategories } from "../hooks/useSiteData";
import { useCart } from "../context/CartContext";
import { useScrolledPast } from "../hooks/useScrollY";
import { BagIcon, SearchIcon, UserIcon } from "./Icons";
import "./Header.css";

export default function Header() {
  const { settings, loading } = useSiteSettings();
  const { categories } = useCategories();
  const { itemCount, lastAdded } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = useScrolledPast(8);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const navLinks = [
    { to: "/", label: "Inicio", end: true },
    ...categories.map((c) => ({ to: `/${c.slug}`, label: c.name, end: false })),
    { to: "/productos", label: "Catálogo", end: false },
  ];

  return (
    <>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""} ${menuOpen ? "is-menu-open" : ""}`}>
        <div className="container site-header-inner">
          <Link to="/" className="site-logo" aria-label="Ir al inicio">
            {loading ? (
              <span className="skeleton site-logo-skeleton" />
            ) : settings?.logo_url ? (
              <img src={settings.logo_url} alt={settings.business_name} className="site-logo-image" />
            ) : (
              <span className="site-logo-text">
                {settings?.business_name}
                <span className="site-logo-dot" />
              </span>
            )}
          </Link>

          <nav className="site-nav" aria-label="Principal">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end}>
                {link.label}
              </NavLink>
            ))}
            <NavLink to="/ofertas" className="site-nav-sale">
              Ofertas
            </NavLink>
          </nav>

          <div className="site-header-actions">
            <Link to="/buscar" className="icon-btn" aria-label="Buscar productos">
              <SearchIcon />
            </Link>
            <Link to="/admin/login" className="icon-btn icon-btn-hide-sm" aria-label="Mi cuenta">
              <UserIcon />
            </Link>
            <Link
              to="/carrito"
              className="icon-btn cart-btn"
              aria-label={`Carrito, ${itemCount} producto${itemCount === 1 ? "" : "s"}`}
            >
              <span key={lastAdded?.addedAt ?? 0} className={lastAdded ? "cart-btn-icon is-bumping" : "cart-btn-icon"}>
                <BagIcon />
              </span>
              {itemCount > 0 && (
                <span key={itemCount} className="cart-count">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              className={`menu-toggle ${menuOpen ? "is-open" : ""}`}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

      <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <button type="button" className="mobile-menu-backdrop" tabIndex={-1} onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" />
        <nav className="mobile-menu-panel" aria-label="Menú móvil">
          {[...navLinks, { to: "/ofertas", label: "Ofertas", end: false }, { to: "/buscar", label: "Buscar", end: false }].map(
            (link, i) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className="mobile-menu-link"
                style={{ transitionDelay: menuOpen ? `${80 + i * 45}ms` : "0ms" }}
                tabIndex={menuOpen ? 0 : -1}
              >
                {link.label}
                <span className="mobile-menu-arrow">→</span>
              </NavLink>
            ),
          )}
          <Link
            to="/admin/login"
            className="mobile-menu-account"
            style={{ transitionDelay: menuOpen ? `${80 + (navLinks.length + 2) * 45}ms` : "0ms" }}
            tabIndex={menuOpen ? 0 : -1}
          >
            <UserIcon size={18} />
            Mi cuenta / tarjeta de recompensas
          </Link>
        </nav>
      </div>
      </header>
    </>
  );
}
