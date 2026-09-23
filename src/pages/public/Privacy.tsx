import { usePageTitle, useSiteSettings } from "../../hooks/useSiteData";
import "./LegalPage.css";

// [MODIFICAR MANUAL] Texto legal de ejemplo: no está conectado al panel de admin.
// Reemplázalo por la política de privacidad real del negocio antes de publicar.
export default function Privacy() {
  usePageTitle("Política de privacidad");
  const { settings } = useSiteSettings();
  const name = settings?.business_name || "la tienda";

  return (
    <div className="section container legal-page">
      <span className="section-eyebrow">Legal</span>
      <h1>Política de privacidad</h1>
      <p className="legal-page-updated">Última actualización: enero de 2026</p>

      <h2>1. Qué datos recopilamos</h2>
      <p>
        Cuando haces un pedido en {name} recopilamos tu nombre, número de WhatsApp, correo (opcional), dirección de
        entrega y el detalle de tu compra. Si dejas una reseña, también guardamos tu comentario, calificación y la
        foto que decidas subir.
      </p>

      <h2>2. Para qué los usamos</h2>
      <p>
        Usamos tus datos únicamente para procesar y entregar tu pedido, contactarte por WhatsApp sobre el mismo,
        administrar tu tarjeta de recompensas y, si lo autorizas, publicar tu reseña una vez aprobada.
      </p>

      <h2>3. Datos guardados en tu dispositivo</h2>
      <p>
        Para que comprar sea más rápido, tu carrito y los datos de tu último pedido se guardan solo en tu navegador.
        Puedes borrarlos en cualquier momento limpiando los datos del sitio.
      </p>

      <h2>4. Seguridad</h2>
      <p>
        La información se almacena en una base de datos protegida y solo el equipo administrador de la tienda tiene
        acceso a ella. No vendemos ni compartimos tus datos con terceros.
      </p>

      <h2>5. Tarjeta de recompensas</h2>
      <p>
        Tu tarjeta se identifica con un enlace único y un código de acceso personal. No compartas tu código: con él se
        puede consultar tu progreso y solicitar tus recompensas.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes pedirnos consultar, corregir o eliminar tus datos personales escribiéndonos por WhatsApp
        {settings?.email ? ` o a ${settings.email}` : ""}.
      </p>
    </div>
  );
}
