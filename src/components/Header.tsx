import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { CATEGORIES } from "../types";
import { storeInfo } from "../data/store";
import { useCart } from "../context/CartContext";
import "./Header.css";

export default function Header({ centered = false }: { centered?: boolean }) {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={`site-header ${centered ? "site-header-centered" : ""}`}>
      <div className="container site-header-inner">
        <button className="site-header-burger" onClick={() => setMenuOpen((v) => !v)} aria-label="Menú">
          <span />
          <span />
          <span />
        </button>

        <Link to="/" className="site-header-logo">
          {storeInfo.name}
        </Link>

        <nav className={`site-header-nav ${menuOpen ? "is-open" : ""}`}>
          {CATEGORIES.map((c) => (
            <NavLink key={c.slug} to={`/${c.slug}`} onClick={() => setMenuOpen(false)}>
              {c.name}
            </NavLink>
          ))}
        </nav>

        <div className="site-header-actions">
          <Link to="/buscar" aria-label="Buscar" className="site-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
          </Link>
          <Link to="/carrito" aria-label="Carrito" className="site-header-icon site-header-cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6h15l-1.5 9h-12L6 6Z" strokeLinejoin="round" />
              <path d="M6 6L4.5 3H2" strokeLinecap="round" />
              <circle cx="10" cy="20" r="1.4" />
              <circle cx="17" cy="20" r="1.4" />
            </svg>
            {count > 0 && <span className="site-header-cart-count">{count}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
