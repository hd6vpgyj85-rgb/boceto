import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useProducts } from "../../context/ProductsContext";
import { useAnalytics } from "../../context/AnalyticsContext";
import { getWhatsAppUrl, storeInfo } from "../../data/store";
import ProductCard from "../../components/ProductCard";
import Testimonials from "../../components/Testimonials";
import VisitUs from "../../components/VisitUs";
import CtaFooter from "../../components/CtaFooter";
import StarRating from "../../components/StarRating";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./HomePage.css";

export default function HomePage() {
  const { products, loading } = useProducts();
  const { stats } = useAnalytics();

  const topProducts = useMemo(() => {
    if (products.length === 0) return [];
    const withViews = products
      .map((p) => ({ product: p, views: stats.find((s) => s.productId === p.id)?.views ?? 0 }))
      .sort((a, b) => b.views - a.views);

    const topViewed = withViews.filter((p) => p.views > 0).slice(0, 3);
    if (topViewed.length >= 3) return topViewed.map((p) => p.product);

    const remaining = products.filter((p) => !topViewed.some((t) => t.product.id === p.id));
    const shuffled = [...remaining].sort(() => Math.random() - 0.5);
    return [...topViewed.map((p) => p.product), ...shuffled].slice(0, 3);
  }, [products, stats]);

  return (
    <>
      <section className="hero">
        <div className="hero-overlay" />
        <div className="container hero-content">
          <span className="hero-badge">Especialistas en moda</span>
          <h1>Realza tu figura, con estilo</h1>
          <p>Fajas, ropa y accesorios seleccionados para lucir y sentirte increíble todos los días.</p>
          <div className="hero-actions">
            <Link to="/fajas" className="btn btn-primary">
              Ver más
            </Link>
            <a
              href={getWhatsAppUrl(`Hola ${storeInfo.name}, quiero más información 💗`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline hero-btn-outline"
            >
              Escríbenos
            </a>
          </div>
          <div className="hero-rating">
            <StarRating rating={5} />
            <span>+500 clientas satisfechas</span>
          </div>
        </div>
      </section>

      <section id="top-productos" className="top-products container">
        <h2>Top productos de la semana</h2>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="top-products-grid">
            {topProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <Testimonials />
      <VisitUs />
      <CtaFooter />
    </>
  );
}
