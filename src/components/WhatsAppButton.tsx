import { useEffect, useState } from "react";
import { useSiteSettings } from "../hooks/useSiteData";
import { useCart } from "../context/CartContext";
import { buildWhatsAppUrl } from "../lib/whatsapp";
import { WhatsAppIcon } from "./Icons";
import "./WhatsAppButton.css";

const HINT_KEY = "boceto-wa-hint-seen";

function readSeen(): boolean {
  try {
    return sessionStorage.getItem(HINT_KEY) === "1";
  } catch {
    return true;
  }
}

function markSeen(): boolean {
  try {
    sessionStorage.setItem(HINT_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export default function WhatsAppButton() {
  const { settings } = useSiteSettings();
  const { lastAdded } = useCart();
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if (readSeen()) return;
    const show = window.setTimeout(() => setHint(true), 6000);
    const hide = window.setTimeout(() => {
      setHint(false);
      markSeen();
    }, 13000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, []);

  if (!settings?.whatsapp) return null;

  const message = `¡Hola, ${settings.business_name}! Tengo una pregunta sobre sus productos.`;

  return (
    <div className={`whatsapp-fab-wrap ${lastAdded ? "is-raised" : ""}`}>
      <span className={`whatsapp-fab-hint ${hint ? "is-visible" : ""}`}>¿Tienes dudas? Escríbenos</span>
      <a
        href={buildWhatsAppUrl(settings.whatsapp, message)}
        target="_blank"
        rel="noreferrer"
        className="whatsapp-fab"
        aria-label="Escribir por WhatsApp"
        onMouseEnter={() => setHint(true)}
        onMouseLeave={() => setHint(false)}
      >
        <WhatsAppIcon size={26} />
      </a>
    </div>
  );
}
