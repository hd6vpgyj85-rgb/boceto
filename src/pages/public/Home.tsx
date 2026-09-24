import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useSiteSettings, useHomeBanner, useLevels, useCategories, usePageTitle } from "../../hooks/useSiteData";
import type { LoyaltyTier, Product, Review } from "../../types";
import { buildWhatsAppUrl } from "../../lib/whatsapp";
import StarRating from "../../components/StarRating";
import BannerCarousel from "../../components/BannerCarousel";
import Reveal, { StaggerGroup } from "../../components/Reveal";
import ProductCard, { ProductCardSkeleton } from "../../components/ProductCard";
import ProductCarousel from "../../components/ProductCarousel";
import ReviewsShowcase from "../../components/ReviewsShowcase";
import SmartImage from "../../components/SmartImage";
import {
  ArrowRightIcon,
  BagIcon,
  CashIcon,
  ChatIcon,
  ChevronDownIcon,
  ClockIcon,
  GiftIcon,
  MapPinIcon,
  ReturnIcon,
  ShieldIcon,
  WhatsAppIcon,
} from "../../components/Icons";
import "./Home.css";

const DEFAULT_HERO_TITLE = "Todo lo que buscas, en un solo lugar";

const BENEFITS = [
  { icon: ShieldIcon, label: "Compra 100% segura" },
  { icon: ChatIcon, label: "Atención personalizada por WhatsApp" },
  { icon: CashIcon, label: "Paga al recibir o por transferencia" },
  { icon: ReturnIcon, label: "Cambios sin complicaciones" },
  { icon: GiftIcon, label: "Recompensas en cada compra" },
];

const STEPS = [
  {
    icon: BagIcon,
    title: "Elige tus productos",
    text: "Explora el catálogo, filtra por colección o marca y agrega al carrito lo que te guste.",
  },
  {
    icon: WhatsAppIcon,
    title: "Confirma por WhatsApp",
    text: "Envía tu pedido en un clic. Te respondemos para coordinar el pago y la entrega.",
  },
  {
    icon: GiftIcon,
    title: "Recíbelo y acumula",
    text: "Te lo llevamos a donde estés y cada compra suma a tu tarjeta de recompensas.",
  },
];

export default function Home() {
  usePageTitle();
  const { settings } = useSiteSettings();
  const { banner } = useHomeBanner();
  const { levels } = useLevels();
  const { categories } = useCategories();
  const [featured, setFeatured] = useState<Product[] | null>(null);
  const [newest, setNewest] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("products").select("*").eq("featured", true).order("created_at", { ascending: false }).limit(8),
      supabase.from("products").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("reviews").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(8),
      supabase.from("loyalty_tiers").select("*").order("required_purchases", { ascending: true }),
    ]).then(([featuredRes, newestRes, reviewsRes, tiersRes]) => {
      setFeatured((featuredRes.data as Product[] | null) ?? []);
      setNewest((newestRes.data as Product[] | null) ?? []);
      setReviews((reviewsRes.data as Review[] | null) ?? []);
      setTiers((tiersRes.data as LoyaltyTier[] | null) ?? []);
    });
  }, []);

  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 5;

  const heroImage = banner?.images?.[0];
  const businessName = settings?.business_name ?? "";
  const whatsappUrl = settings
    ? buildWhatsAppUrl(settings.whatsapp, `¡Hola, ${businessName}! Quiero conocer sus productos.`)
    : "#";
  const featuredIds = new Set((featured ?? []).map((p) => p.id));
  const freshArrivals = newest.filter((p) => !featuredIds.has(p.id)).length >= 4 ? newest.filter((p) => !featuredIds.has(p.id)) : newest;

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-bg" style={heroImage ? { backgroundImage: `url(${heroImage})` } : undefined} />
        <div className="hero-overlay" />
        <div className="hero-orb hero-orb-1" aria-hidden="true" />
        <div className="hero-orb hero-orb-2" aria-hidden="true" />

        <div className="container hero-content">
          <h1 className="hero-title">
            {(settings?.hero_title || DEFAULT_HERO_TITLE).split(" ").map((word, i) => (
              <span key={i} className="hero-word" style={{ animationDelay: `${180 + i * 70}ms` }}>
                {word}&nbsp;
              </span>
            ))}
          </h1>
          {settings?.tagline && <p className="hero-subtitle">{settings.tagline}</p>}
          <div className="hero-actions">
            <Link to="/productos" className="btn btn-primary">
              Ver catálogo
              <ArrowRightIcon size={18} className="btn-arrow" />
            </Link>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn btn-outline">
              <WhatsAppIcon size={18} />
              Escríbenos
            </a>
          </div>
        </div>

        <a href="#home-benefits" className="hero-scroll" aria-label="Seguir bajando">
          <ChevronDownIcon size={20} />
        </a>
      </section>

      <div className="benefits-marquee" id="home-benefits">
        <div className="benefits-track">
          {[...BENEFITS, ...BENEFITS].map((b, i) => (
            <span key={i} className="benefit-item" aria-hidden={i >= BENEFITS.length}>
              <b.icon size={18} />
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {banner && banner.images.length > 0 && (
        <Reveal as="section" className="section banner-section">
          <div className="container">
            <BannerCarousel images={banner.images} />
          </div>
        </Reveal>
      )}

      {categories.length > 0 && (
        <Reveal as="section" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="section-eyebrow">Categorías</span>
                <h2 className="section-title">Compra por categoría</h2>
              </div>
              <Link to="/productos" className="section-link">
                Ver todo <ArrowRightIcon size={16} />
              </Link>
            </div>
            <StaggerGroup className="category-grid" staggerMs={90}>
              {categories.map((cat) => (
                <Link key={cat.slug} to={`/${cat.slug}`} className="category-card">
                  <SmartImage src={cat.banner_image_url} alt={cat.name} className="category-card-image" />
                  <span className="category-card-shade" />
                  <span className="category-card-body">
                    <span className="category-card-name">{cat.name}</span>
                    {cat.tagline && <span className="category-card-tagline">{cat.tagline}</span>}
                    <span className="category-card-cta">
                      Explorar <ArrowRightIcon size={15} />
                    </span>
                  </span>
                </Link>
              ))}
            </StaggerGroup>
          </div>
        </Reveal>
      )}

      {levels.length > 0 && (
        <Reveal as="section" className="section section-tight">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="section-eyebrow">Colecciones</span>
                <h2 className="section-title">Explora por colección</h2>
              </div>
            </div>
            <div className="levels-row">
              {levels.map((level, i) => (
                <Link
                  to={`/productos?nivel=${level.slug}`}
                  key={level.slug}
                  className="level-item"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <span className="level-circle">
                    <span className="level-circle-ring" aria-hidden="true" />
                    <SmartImage src={level.image_url} alt={level.label} className="level-circle-image" />
                  </span>
                  <span className="level-label">{level.label}</span>
                  {level.tagline && <span className="level-tagline">{level.tagline}</span>}
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {(featured === null || featured.length > 0) && (
        <Reveal as="section" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="section-eyebrow">Lo más pedido</span>
                <h2 className="section-title">Más vendidos</h2>
              </div>
              <Link to="/productos" className="section-link">
                Ver catálogo <ArrowRightIcon size={16} />
              </Link>
            </div>
            {featured === null ? (
              <div className="product-grid">
                {Array.from({ length: 4 }, (_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <StaggerGroup className="product-grid">
                {featured.map((product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
              </StaggerGroup>
            )}
          </div>
        </Reveal>
      )}

      <Reveal as="section" className="section how-section">
        <div className="container">
          <div className="section-head section-head-center">
            <div>
              <span className="section-eyebrow">Así de fácil</span>
              <h2 className="section-title">Cómo comprar</h2>
            </div>
          </div>
          <ol className="how-steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className="how-step" style={{ transitionDelay: `${150 + i * 150}ms` }}>
                <span className="how-step-number">{String(i + 1).padStart(2, "0")}</span>
                <span className="how-step-icon">
                  <step.icon size={26} />
                </span>
                <div className="how-step-text">
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>

      {reviews.length > 0 && (
        <Reveal as="section" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="section-eyebrow">Opiniones reales</span>
                <h2 className="section-title">Lo que dicen nuestros clientes</h2>
              </div>
              <div className="reviews-summary">
                <strong>{avgRating.toFixed(1)}</strong>
                <div>
                  <StarRating rating={avgRating} size={14} />
                  <span>{reviews.length} reseña{reviews.length === 1 ? "" : "s"}</span>
                </div>
              </div>
            </div>
            <ReviewsShowcase reviews={reviews} />
          </div>
        </Reveal>
      )}

      {freshArrivals.length > 1 && (
        <Reveal as="section" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="section-eyebrow">Recién llegados</span>
                <h2 className="section-title">Novedades en la tienda</h2>
              </div>
              <Link to="/productos?orden=newest" className="section-link">
                Ver novedades <ArrowRightIcon size={16} />
              </Link>
            </div>
            <ProductCarousel products={freshArrivals} />
          </div>
        </Reveal>
      )}

      {tiers.length > 0 && (
        <Reveal as="section" className="section">
          <div className="container">
            <div className="rewards-panel">
              <div className="rewards-intro">
                <span className="section-eyebrow">Programa de recompensas</span>
                <h2 className="section-title">Compra, acumula y gana</h2>
                <p className="section-subtitle">
                  Cada pedido suma a tu tarjeta digital. Al alcanzar cada nivel desbloqueas un beneficio que puedes
                  reclamar directo por WhatsApp.
                </p>
                <Link to="/admin/login" className="btn btn-outline">
                  Consultar mi tarjeta
                  <ArrowRightIcon size={18} className="btn-arrow" />
                </Link>
              </div>
              <ol className="rewards-steps">
                {tiers.map((tier, i) => (
                  <li key={tier.id} className="rewards-step" style={{ transitionDelay: `${200 + i * 130}ms` }}>
                    <span className="rewards-step-count">
                      {tier.required_purchases}
                      <small>compras</small>
                    </span>
                    <span className="rewards-step-text">{tier.reward_description}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>
      )}

      {settings && (settings.address || settings.hours) && (
        <Reveal as="section" className="section visit-section">
          <div className="container visit-grid">
            <div className="visit-photo">
              <SmartImage src={settings.store_photo_url} alt={businessName} />
            </div>
            <div className="visit-info">
              <span className="section-eyebrow">Te esperamos</span>
              <h2 className="section-title">Visítanos</h2>
              {(settings.address || settings.city) && (
                <p className="visit-line">
                  <MapPinIcon size={18} />
                  <span>
                    {settings.address}
                    {settings.address && settings.city && <br />}
                    {settings.city}
                  </span>
                </p>
              )}
              {settings.hours && (
                <p className="visit-line">
                  <ClockIcon size={18} />
                  <span className="visit-hours">{settings.hours}</span>
                </p>
              )}
              {settings.map_url && (
                <a href={settings.map_url} target="_blank" rel="noreferrer" className="btn btn-outline">
                  Cómo llegar
                  <ArrowRightIcon size={18} className="btn-arrow" />
                </a>
              )}
            </div>
          </div>
        </Reveal>
      )}

      <Reveal as="section" className="section cta-section">
        <div className="container">
          <div className="cta-card">
            <span className="cta-glow" aria-hidden="true" />
            <h2 className="cta-title">¿Listo para tu próximo pedido?</h2>
            <p className="cta-subtitle">
              Elige tus productos, confírmalos por WhatsApp y recíbelos donde estés.
            </p>
            <div className="hero-actions">
              <Link to="/productos" className="btn btn-primary">
                Empezar a comprar
                <ArrowRightIcon size={18} className="btn-arrow" />
              </Link>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn btn-whatsapp">
                <WhatsAppIcon size={18} />
                Pedir por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
