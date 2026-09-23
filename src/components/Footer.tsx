import { Link } from "react-router-dom";
import { useCategories, useSiteSettings } from "../hooks/useSiteData";
import {
  BankIcon,
  CardIcon,
  CashIcon,
  ChevronUpIcon,
  ClockIcon,
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TikTokIcon,
} from "./Icons";
import "./Footer.css";

interface FooterProps {
  variant?: "home" | "default";
}

export default function Footer({ variant = "default" }: FooterProps) {
  const { settings } = useSiteSettings();
  const { categories } = useCategories();

  if (!settings) return null;

  const style =
    variant === "default" && settings.store_photo_url
      ? { backgroundImage: `url(${settings.store_photo_url})` }
      : undefined;

  const socials = [
    { url: settings.instagram_url, label: "Instagram", icon: <InstagramIcon size={18} /> },
    { url: settings.facebook_url, label: "Facebook", icon: <FacebookIcon size={18} /> },
    { url: settings.tiktok_url, label: "TikTok", icon: <TikTokIcon size={18} /> },
  ].filter((s) => s.url);

  return (
    <footer className={`site-footer site-footer-${variant}`} style={style}>
      {variant === "default" && <div className="site-footer-overlay" />}
      <div className="site-footer-glow" aria-hidden="true" />

      <div className="container site-footer-inner">
        <div className="footer-col footer-brand">
          <Link to="/" className="footer-logo-link">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={settings.business_name} className="footer-logo" />
            ) : (
              <span className="footer-logo-text">
                {settings.business_name}
                <span className="site-logo-dot" />
              </span>
            )}
          </Link>
          <p className="footer-tagline">{settings.tagline}</p>
          {socials.length > 0 && (
            <div className="footer-social">
              {socials.map((s) => (
                <a key={s.label} href={s.url as string} target="_blank" rel="noreferrer" aria-label={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="footer-col">
          <h4>Tienda</h4>
          <Link to="/productos" className="link-underline">Catálogo completo</Link>
          {categories.slice(0, 5).map((c) => (
            <Link key={c.slug} to={`/${c.slug}`} className="link-underline">
              {c.name}
            </Link>
          ))}
          <Link to="/ofertas" className="link-underline">Ofertas</Link>
        </div>

        <div className="footer-col">
          <h4>Ayuda</h4>
          <Link to="/carrito" className="link-underline">Mi carrito</Link>
          <Link to="/admin/login" className="link-underline">Mi tarjeta de recompensas</Link>
          <Link to="/buscar" className="link-underline">Buscar productos</Link>
          <Link to="/terminos" className="link-underline">Términos y condiciones</Link>
          <Link to="/privacidad" className="link-underline">Política de privacidad</Link>
        </div>

        <div className="footer-col footer-contact">
          <h4>Contacto</h4>
          {(settings.address || settings.city) && (
            <p>
              <MapPinIcon size={16} />
              <span>
                {settings.address}
                {settings.address && settings.city && <br />}
                {settings.city}
              </span>
            </p>
          )}
          {settings.phone && (
            <p>
              <PhoneIcon size={16} />
              <span>{settings.phone}</span>
            </p>
          )}
          {settings.email && (
            <p>
              <MailIcon size={16} />
              <a href={`mailto:${settings.email}`} className="link-underline">{settings.email}</a>
            </p>
          )}
          {settings.hours && (
            <p>
              <ClockIcon size={16} />
              <span className="footer-hours">{settings.hours}</span>
            </p>
          )}
        </div>
      </div>

      <div className="container footer-payments">
        <span className="footer-payments-label">Formas de pago</span>
        <span className="footer-payment-chip"><CashIcon size={16} /> Efectivo</span>
        <span className="footer-payment-chip"><BankIcon size={16} /> Transferencia</span>
        <span className="footer-payment-chip"><CardIcon size={16} /> Tarjeta</span>
      </div>

      <div className="container footer-bottom">
        <p>{settings.footer_note}</p>
        <button
          type="button"
          className="footer-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Volver arriba"
        >
          <ChevronUpIcon size={18} />
        </button>
      </div>
    </footer>
  );
}
