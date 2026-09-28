import { storeInfo } from "../data/store";
import "./VisitUs.css";

export default function VisitUs() {
  return (
    <section className="visit-us">
      <div className="visit-us-image">
        <img src={storeInfo.storePhoto} alt={storeInfo.name} loading="lazy" />
      </div>
      <div className="visit-us-info">
        <h2>Viste con estilo</h2>
        <p>Visítanos en tienda y encuentra la pieza perfecta para ti.</p>
        <div className="visit-us-detail">
          <strong>Dirección</strong>
          <span>{storeInfo.address}</span>
        </div>
        <div className="visit-us-detail">
          <strong>Horario</strong>
          <span>{storeInfo.hours}</span>
        </div>
        <a href={storeInfo.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
          Cómo llegar
        </a>
      </div>
    </section>
  );
}
