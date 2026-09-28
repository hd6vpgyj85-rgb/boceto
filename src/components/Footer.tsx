import { Link } from "react-router-dom";
import { CATEGORIES } from "../types";
import { getWhatsAppUrl, storeInfo } from "../data/store";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-grid">
        <div>
          <h3>{storeInfo.name}</h3>
          <p>{storeInfo.tagline}</p>
        </div>

        <div>
          <h4>Categorías</h4>
          <ul>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link to={`/${c.slug}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Ayuda</h4>
          <ul>
            <li>
              <a href={getWhatsAppUrl(`Hola ${storeInfo.name}, necesito ayuda`)} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </li>
            <li>
              <Link to="/terminos">Términos y condiciones</Link>
            </li>
            <li>
              <Link to="/privacidad">Aviso de privacidad</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Contacto</h4>
          <p>{storeInfo.address}</p>
          <p>{storeInfo.hours}</p>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} {storeInfo.name}. Todos los derechos reservados.</span>
      </div>
    </footer>
  );
}
