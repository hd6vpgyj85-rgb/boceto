import { usePageTitle, useSiteSettings } from "../../hooks/useSiteData";
import "./LegalPage.css";

// [MODIFICAR MANUAL] Texto legal de ejemplo: no está conectado al panel de admin.
// Reemplázalo por los términos reales del negocio antes de publicar la tienda.
export default function Terms() {
  usePageTitle("Términos y condiciones");
  const { settings } = useSiteSettings();
  const name = settings?.business_name || "la tienda";

  return (
    <div className="section container legal-page">
      <span className="section-eyebrow">Legal</span>
      <h1>Términos y condiciones</h1>
      <p className="legal-page-updated">Última actualización: enero de 2026</p>

      <h2>1. Aceptación</h2>
      <p>
        Al realizar un pedido en {name} aceptas estos términos. Si no estás de acuerdo con alguno de ellos, te pedimos
        no continuar con la compra.
      </p>

      <h2>2. Productos y precios</h2>
      <p>
        Los precios se muestran en moneda local e incluyen los impuestos aplicables. Las imágenes son ilustrativas.
        Podemos modificar precios, promociones y disponibilidad sin previo aviso; el precio válido es el confirmado al
        momento de tu pedido.
      </p>

      <h2>3. Pedidos y pagos</h2>
      <p>
        Los pedidos se confirman por WhatsApp una vez que completas el checkout. El pedido queda firme cuando
        confirmamos contigo la disponibilidad, la forma de pago y la entrega. Aceptamos pago contra entrega,
        transferencia bancaria y enlaces de pago con tarjeta.
      </p>

      <h2>4. Envíos y entregas</h2>
      <p>
        Los tiempos y costos de envío dependen de tu ubicación y se comunican antes de confirmar el pedido. Es tu
        responsabilidad proporcionar una dirección completa y un número de contacto disponible.
      </p>

      <h2>5. Cambios y devoluciones</h2>
      <p>
        Si tu producto llega con un defecto o no corresponde a lo que pediste, escríbenos dentro de los 5 días
        siguientes a la entrega con fotos del producto y del empaque. Revisaremos cada caso para ofrecerte un cambio o
        reembolso.
      </p>

      <h2>6. Cupones y recompensas</h2>
      <p>
        Los cupones tienen condiciones de uso (vigencia, número de usos y productos aplicables) y no son canjeables
        por dinero. Las recompensas del programa de fidelidad se acumulan por compras confirmadas y son personales e
        intransferibles.
      </p>

      <h2>7. Contacto</h2>
      <p>
        Para cualquier duda sobre estos términos, escríbenos por WhatsApp
        {settings?.email ? ` o a ${settings.email}` : ""}.
      </p>
    </div>
  );
}
