import { getWhatsAppUrl, storeInfo } from "../data/store";
import "./CtaFooter.css";

export default function CtaFooter() {
  return (
    <section className="cta-footer">
      <h2>¿Lista para renovar tu guardarropa?</h2>
      <p>Escríbenos por WhatsApp y te ayudamos a encontrar tu talla y modelo ideal.</p>
      <a href={getWhatsAppUrl(`Hola ${storeInfo.name}, quiero más información 💗`)} className="btn btn-primary">
        Escríbenos por WhatsApp
      </a>
    </section>
  );
}
