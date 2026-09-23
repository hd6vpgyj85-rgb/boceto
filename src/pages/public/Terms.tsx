import "./LegalPage.css";

// [MODIFICAR MANUAL] Contenido legal de ejemplo: esta página no está conectada
// al panel de admin. Reemplaza este texto por los términos reales del negocio
// (o pide asesoría legal) antes de publicar la tienda.
export default function Terms() {
  return (
    <div className="section container legal-page">
      <h1>Términos y condiciones</h1>
      <p className="legal-page-updated">Última actualización: enero de 2026</p>

      <h2>1. Aceptación de los términos</h2>
      <p>
        Al realizar una compra en NOIRE Perfumería aceptas estos términos y condiciones. Si no estás de
        acuerdo con alguno de los puntos aquí descritos, te pedimos no continuar con tu compra.
      </p>

      <h2>2. Productos y precios</h2>
      <p>
        Todos los precios están expresados en pesos colombianos (COP) e incluyen los impuestos aplicables.
        Nos reservamos el derecho de modificar precios y disponibilidad de productos sin previo aviso.
      </p>

      <h2>3. Pedidos y pagos</h2>
      <p>
        Los pedidos se confirman a través de WhatsApp una vez completado el checkout en el sitio. Aceptamos
        pago contra entrega, transferencia bancaria y enlaces de pago según se indique en cada conversación.
      </p>

      <h2>4. Envíos</h2>
      <p>
        Realizamos entregas dentro de Medellín y su área metropolitana. Los tiempos de entrega estimados se
        comunican al confirmar el pedido por WhatsApp.
      </p>

      <h2>5. Cambios y devoluciones</h2>
      <p>
        Por tratarse de productos de perfumería, solo aceptamos cambios en caso de defecto de fábrica,
        dentro de las 48 horas siguientes a la entrega, con el empaque original sin abrir.
      </p>

      <h2>6. Programa de fidelidad</h2>
      <p>
        Las recompensas del programa de fidelidad se acumulan por compras confirmadas y se reclaman a
        través de la tarjeta digital personal de cada cliente. Los cupones generados por el programa no son
        transferibles ni acumulables con otras promociones salvo que se indique lo contrario.
      </p>

      <h2>7. Contacto</h2>
      <p>Para cualquier duda sobre estos términos, escríbenos por WhatsApp o al correo de contacto del pie de página.</p>
    </div>
  );
}
