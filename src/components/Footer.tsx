import { Link } from "react-router-dom";
import { useSiteSettings } from "../hooks/useSiteData";
import "./Footer.css";

interface FooterProps {
  variant?: "home" | "default";
}

export default function Footer({ variant = "default" }: FooterProps) {
  const { settings } = useSiteSettings();

  if (!settings) return null;

  const style =
    variant === "default" && settings.store_photo_url
      ? { backgroundImage: `url(${settings.store_photo_url})` }
      : undefined;

  return (
    <footer className={`site-footer site-footer-${variant}`} style={style}>
      {variant === "default" && <div className="site-footer-overlay" />}
      <div className="container site-footer-inner">
        <div className="footer-col footer-brand">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt={settings.business_name} className="footer-logo" />
          ) : (
            <span className="footer-logo-text">{settings.business_name}</span>
          )}
          <p className="footer-tagline">{settings.tagline}</p>
          <div className="footer-social">
            {settings.instagram_url && (
              <a href={settings.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram">
                <InstagramIcon />
              </a>
            )}
            {settings.facebook_url && (
              <a href={settings.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook">
                <FacebookIcon />
              </a>
            )}
            {settings.tiktok_url && (
              <a href={settings.tiktok_url} target="_blank" rel="noreferrer" aria-label="TikTok">
                <TikTokIcon />
              </a>
            )}
          </div>
        </div>

        <div className="footer-col">
          <h4>Contacto</h4>
          <p>{settings.address}</p>
          <p>{settings.city}</p>
          <p>{settings.phone}</p>
          <p>{settings.email}</p>
        </div>

        <div className="footer-col">
          <h4>Horario</h4>
          <p className="footer-hours">{settings.hours}</p>
        </div>

        <div className="footer-col">
          <h4>Enlaces</h4>
          <Link to="/terminos">Términos y condiciones</Link>
          <Link to="/privacidad">Política de privacidad</Link>
          <Link to="/admin/login">Acceso</Link>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>{settings.footer_note}</p>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.5 2h-3v13.2a2.8 2.8 0 1 1-2-2.68V9.4a5.9 5.9 0 1 0 5 5.83V8.3a7.4 7.4 0 0 0 4.5 1.5V6.7A4.4 4.4 0 0 1 16.5 2z" />
    </svg>
  );
}
