import "./LegalPage.css";

// [MODIFICAR MANUAL] Contenido legal de ejemplo: esta página no está conectada
// al panel de admin. Reemplaza este texto por la política de privacidad real
// del negocio (o pide asesoría legal) antes de publicar la tienda.
export default function Privacy() {
  return (
    <div className="section container legal-page">
      <h1>Política de privacidad</h1>
      <p className="legal-page-updated">Última actualización: enero de 2026</p>

      <h2>1. Datos que recopilamos</h2>
      <p>
        Al realizar un pedido recopilamos tu nombre, número de WhatsApp, correo electrónico (opcional),
        dirección de entrega y el detalle de tu compra, únicamente para poder procesar y entregar tu pedido.
      </p>

      <h2>2. Uso de la información</h2>
      <p>
        Usamos tus datos para gestionar tu pedido, contactarte por WhatsApp, administrar tu tarjeta de
        fidelidad y, si dejaste una reseña, mostrar tu nombre y calificación en el sitio una vez aprobada.
      </p>

      <h2>3. Almacenamiento</h2>
      <p>
        Tu información se almacena de forma segura en nuestra base de datos (Supabase) y solo el equipo
        administrador de la tienda tiene acceso a ella.
      </p>

      <h2>4. Programa de fidelidad</h2>
      <p>
        Tu tarjeta de fidelidad se identifica con un enlace único y un código de acceso personal. No
        compartas tu código de acceso con terceros.
      </p>

      <h2>5. Tus derechos</h2>
      <p>
        Puedes solicitar la actualización o eliminación de tus datos personales escribiéndonos por
        WhatsApp o al correo de contacto indicado en el pie de página.
      </p>
    </div>
  );
}
