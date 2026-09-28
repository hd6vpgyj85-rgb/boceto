import { Link } from "react-router-dom";
import { storeInfo } from "../data/store";
import "./CategoryFooter.css";

export default function CategoryFooter() {
  return (
    <section className="category-footer">
      <div className="category-footer-image">
        <img src={storeInfo.storePhoto} alt={storeInfo.name} loading="lazy" />
      </div>
      <div className="category-footer-text">
        <h2>Proyecta tu mejor versión con {storeInfo.name}</h2>
        <p>Piezas pensadas para realzar tu figura y darte la confianza que buscas, todos los días.</p>
        <Link to="/buscar" className="btn btn-outline">
          Explorar catálogo
        </Link>
      </div>
    </section>
  );
}
