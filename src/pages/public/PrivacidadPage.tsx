import { storeInfo } from "../../data/store";
import "./LegalPage.css";

export default function PrivacidadPage() {
  return (
    <div className="container legal-page">
      <h1>Aviso de privacidad</h1>
      <p>
        En {storeInfo.name} recopilamos únicamente los datos necesarios para procesar tu pedido: nombre, teléfono,
        correo (opcional) y dirección de envío. Esta información se utiliza exclusivamente para coordinar tu compra
        por WhatsApp y para tu tarjeta de fidelidad.
      </p>

      <h2>Uso de tus datos</h2>
      <p>
        No compartimos tu información con terceros. Tus datos se almacenan de forma segura en nuestra base de datos y
        solo son visibles para el equipo de {storeInfo.name}.
      </p>

      <h2>Contacto</h2>
      <p>
        Si tienes dudas sobre el manejo de tus datos, escríbenos a {storeInfo.email} o por WhatsApp al{" "}
        {storeInfo.phone}.
      </p>
    </div>
  );
}
