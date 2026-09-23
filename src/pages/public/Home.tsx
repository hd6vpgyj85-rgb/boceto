import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useSiteSettings, useHomeBanner, useLevels } from "../../hooks/useSiteData";
import type { Product, Review } from "../../types";
import { buildWhatsAppUrl } from "../../lib/whatsapp";
import StarRating from "../../components/StarRating";
import BannerCarousel from "../../components/BannerCarousel";
import Reveal, { StaggerGroup } from "../../components/Reveal";
import ProductCard from "../../components/ProductCard";
import ProductCarousel from "../../components/ProductCarousel";
import ReviewsShowcase from "../../components/ReviewsShowcase";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./Home.css";

const CUSTOMER_TARGET = 2480;

export default function Home() {
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { banner } = useHomeBanner();
  const { levels } = useLevels();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => setFeatured((data as Product[] | null) ?? []));

    supabase
      .from("reviews")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => setReviews((data as Review[] | null) ?? []));
  }, []);

  useEffect(() => {
    const duration = 1600;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.round(CUSTOMER_TARGET * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  if (settingsLoading || !settings) return <LoadingSpinner />;

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 4.9;

  const heroImage = banner?.images?.[0];
  const whatsappMessage = `Hola ${settings.business_name}, quiero conocer más sobre sus fragancias.`;

  return (
    <div className="home-page">
      <section className="hero" style={heroImage ? { backgroundImage: `url(${heroImage})` } : undefined}>
        <div className="hero-overlay" />
        <div className="container hero-content">
          <div className="hero-rating">
            <StarRating rating={avgRating} size={18} />
            <span>{avgRating.toFixed(1)} / 5</span>
          </div>
          <h1 className="hero-title">Encuentra tu fragancia de firma</h1>
          <p className="hero-subtitle">{settings.tagline}</p>
          <div className="hero-actions">
            <Link to="/productos" className="btn btn-primary">
              Ver catálogo
            </Link>
            <a
              href={buildWhatsAppUrl(settings.whatsapp, whatsappMessage)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
            >
              Escribir por WhatsApp
            </a>
          </div>
          <div className="hero-counter">
            <span className="hero-counter-number">+{count.toLocaleString("es-CO")}</span>
            <span className="hero-counter-label">clientes felices</span>
          </div>
        </div>
      </section>

      {banner && banner.images.length > 0 && (
        <Reveal as="section" className="section banner-section">
          <div className="container">
            <BannerCarousel images={banner.images} />
          </div>
        </Reveal>
      )}

      {levels.length > 0 && (
        <Reveal as="section" className="section">
          <div className="container">
            <div className="section-head">
              <h2 className="section-title">Elige tu nivel</h2>
              <Link to="/productos" className="section-link">
                Explorar productos →
              </Link>
            </div>
            <div className="levels-row">
              {levels.map((level) => (
                <Link to={`/productos?nivel=${level.slug}`} key={level.slug} className="level-item">
                  <span className="level-circle">
                    {level.image_url && <img src={level.image_url} alt={level.label} />}
                  </span>
                  <span className="level-label">{level.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {featured.length > 0 && (
        <Reveal as="section" className="section">
          <div className="container">
            <div className="section-head">
              <h2 className="section-title">Más vendidos</h2>
              <Link to="/productos" className="section-link">
                Ver todo →
              </Link>
            </div>
            <StaggerGroup className="product-grid" itemClassName="">
              {featured.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </StaggerGroup>
          </div>
        </Reveal>
      )}

      {reviews.length > 0 && (
        <Reveal as="section" className="section">
          <div className="container">
            <div className="section-head">
              <h2 className="section-title">Lo que dicen nuestros clientes</h2>
            </div>
            <ReviewsShowcase reviews={reviews} />
          </div>
        </Reveal>
      )}

      {featured.length > 0 && (
        <Reveal as="section" className="section">
          <div className="container">
            <div className="section-head">
              <h2 className="section-title">Destacados</h2>
            </div>
            <ProductCarousel products={featured} />
          </div>
        </Reveal>
      )}

      <Reveal as="section" className="section visit-section">
        <div className="container visit-grid">
          <div className="visit-photo">
            {settings.store_photo_url && <img src={settings.store_photo_url} alt={settings.business_name} />}
          </div>
          <div className="visit-info">
            <h2 className="section-title">Visítanos</h2>
            <p>{settings.address}</p>
            <p>{settings.city}</p>
            <p className="visit-hours">{settings.hours}</p>
            {settings.map_url && (
              <a href={settings.map_url} target="_blank" rel="noreferrer" className="btn btn-outline">
                Cómo llegar
              </a>
            )}
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="section cta-section">
        <div className="container cta-inner">
          <h2 className="cta-title">¿Lista para encontrar tu fragancia?</h2>
          <p className="cta-subtitle">Envíos a toda la ciudad y asesoría personalizada por WhatsApp.</p>
          <div className="hero-actions">
            <Link to="/productos" className="btn btn-primary">
              Explorar catálogo
            </Link>
            <a
              href={buildWhatsAppUrl(settings.whatsapp, whatsappMessage)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
            >
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
