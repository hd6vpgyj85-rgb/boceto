import { Link } from "react-router-dom";
import { usePageTitle } from "../../hooks/useSiteData";
import "./NotFound.css";

export default function NotFound() {
  usePageTitle("Página no encontrada");

  return (
    <div className="section container not-found">
      <div className="not-found-art" aria-hidden="true">
        <span className="not-found-digit">4</span>
        <span className="not-found-bag">
          <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 22h36l-3 32a4 4 0 0 1-4 3.6H21a4 4 0 0 1-4-3.6L14 22z" />
            <path d="M24 26v-8a8 8 0 0 1 16 0v8" />
            <circle cx="27" cy="37" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="37" cy="37" r="1.4" fill="currentColor" stroke="none" />
            <path d="M27 46c2.6-2.2 7.4-2.2 10 0" />
          </svg>
        </span>
        <span className="not-found-digit">4</span>
      </div>
      <h1 className="not-found-title">Esta página se fue de compras</h1>
      <p className="not-found-text">
        No encontramos lo que buscabas. Puede que el enlace haya cambiado o que el producto ya no esté disponible.
      </p>
      <div className="not-found-actions">
        <Link to="/" className="btn btn-primary">
          Volver al inicio
        </Link>
        <Link to="/productos" className="btn btn-outline">
          Ver catálogo
        </Link>
      </div>
    </div>
  );
}
