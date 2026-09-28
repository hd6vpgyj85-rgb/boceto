import { storeInfo } from "../../data/store";
import "./LegalPage.css";

export default function TerminosPage() {
  return (
    <div className="container legal-page">
      <h1>Términos y condiciones</h1>
      <p>
        Al realizar una compra en {storeInfo.name} aceptas los siguientes términos. Todos los pedidos se confirman
        por WhatsApp una vez enviado el formulario de checkout; el pago se coordina directamente con nuestro equipo
        fuera del sitio.
      </p>

      <h2>Pedidos y pagos</h2>
      <p>
        Los precios mostrados están en pesos mexicanos (MXN) e incluyen IVA cuando aplica. Aceptamos efectivo,
        transferencia bancaria y depósito en tienda. El pedido se considera confirmado hasta recibir la validación de
        pago por parte de nuestro equipo.
      </p>

      <h2>Envíos</h2>
      <p>
        Los tiempos y costos de envío se coordinan por WhatsApp según tu ubicación en Ciudad Juárez y alrededores.
      </p>

      <h2>Programa de fidelidad</h2>
      <p>
        Las recompensas del programa de fidelidad se otorgan a criterio de {storeInfo.name} y pueden actualizarse en
        cualquier momento.
      </p>
    </div>
  );
}
