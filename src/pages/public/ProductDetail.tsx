import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { useCategories, useLevels, usePageTitle, useSiteSettings } from "../../hooks/useSiteData";
import type { Product } from "../../types";
import { discountPercent, formatCurrency } from "../../lib/format";
import { buildWhatsAppUrl } from "../../lib/whatsapp";
import Lightbox from "../../components/Lightbox";
import EmptyState from "../../components/EmptyState";
import SmartImage from "../../components/SmartImage";
import QuantityStepper from "../../components/QuantityStepper";
import ProductCarousel from "../../components/ProductCarousel";
import Reveal from "../../components/Reveal";
import {
  BagIcon,
  CheckIcon,
  ChatIcon,
  ShareIcon,
  ShieldIcon,
  GiftIcon,
  WhatsAppIcon,
} from "../../components/Icons";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const { categories } = useCategories();
  const { levels } = useLevels();
  const { settings } = useSiteSettings();
  const { addToCart } = useCart();
  const toast = useToast();

  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [related, setRelated] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const buyRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setProduct(undefined);
    setRelated([]);
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!active) return;
        const p = data as Product | null;
        setProduct(p);
        setSize(p?.sizes?.[0] ?? null);
        setActiveImage(0);
        setQuantity(1);
        if (!p) return;
        void supabase.rpc("increment_product_stat", { p_product_id: p.id, p_field: "views" });

        let relatedQuery = supabase.from("products").select("*").neq("id", p.id).gt("stock", 0).limit(10);
        relatedQuery = p.category ? relatedQuery.eq("category", p.category) : relatedQuery.eq("featured", true);
        const { data: rel } = await relatedQuery;
        let list = (rel as Product[] | null) ?? [];
        if (list.length < 3) {
          const { data: extra } = await supabase
            .from("products")
            .select("*")
            .neq("id", p.id)
            .eq("featured", true)
            .limit(10);
          const seen = new Set(list.map((x) => x.id));
          list = [...list, ...((extra as Product[] | null) ?? []).filter((x) => !seen.has(x.id))];
        }
        if (active) setRelated(list.slice(0, 10));
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    const node = buyRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(node);
    return () => observer.disconnect();
  }, [product]);

  const category = useMemo(() => categories.find((c) => c.slug === product?.category), [categories, product]);
  const levelLabels = useMemo(
    () => (product ? levels.filter((l) => product.levels.includes(l.slug)).map((l) => l.label) : []),
    [levels, product],
  );

  usePageTitle(product?.name);

  if (product === undefined) return <ProductDetailSkeleton />;
  if (product === null) {
    return (
      <div className="section container">
        <EmptyState
          icon="box"
          title="Producto no encontrado"
          description="Puede que ya no esté disponible o que el enlace haya cambiado."
          action={
            <Link to="/productos" className="btn btn-primary">
              Ver catálogo
            </Link>
          }
        />
      </div>
    );
  }

  const onSale = product.on_sale && product.sale_price != null;
  const finalPrice = onSale ? (product.sale_price as number) : product.price;
  const discount = onSale ? discountPercent(product.price, product.sale_price) : 0;
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;
  const maxQty = outOfStock ? 1 : Math.min(product.stock, 99);
  const images = product.images.length ? product.images : [];

  const description =
    product.description?.trim() ||
    `${product.name}${product.brand ? ` de ${product.brand}` : ""}. ${
      category ? `Parte de nuestra categoría ${category.name}` : "Parte de nuestro catálogo"
    }${levelLabels.length ? `, colección ${levelLabels.join(" / ")}` : ""}. Escríbenos si tienes cualquier duda antes de comprar.`;

  const handleAddToCart = () => {
    addToCart(
      {
        productId: product.id,
        name: product.name,
        image: images[0] ?? null,
        price: finalPrice,
        size,
        stock: product.stock,
      },
      quantity,
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  };

  const whatsappMessage = [
    `¡Hola! Me interesa este producto:`,
    `${quantity}× ${product.name}${size ? ` (${size})` : ""} — ${formatCurrency(finalPrice * quantity)}`,
    window.location.href,
  ].join("\n");

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast("Enlace copiado al portapapeles", "info");
    } catch {
      toast("No se pudo copiar el enlace", "error");
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || images.length < 2) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 40) setActiveImage((i) => (i - 1 + images.length) % images.length);
    else if (delta < -40) setActiveImage((i) => (i + 1) % images.length);
    touchStartX.current = null;
  };

  return (
    <div className="product-page">
      <div className="container">
        <nav className="breadcrumbs product-breadcrumbs" aria-label="Migas de pan">
          <Link to="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          {category ? <Link to={`/${category.slug}`}>{category.name}</Link> : <Link to="/productos">Catálogo</Link>}
          <span aria-hidden="true">/</span>
          <span>{product.name}</span>
        </nav>
      </div>

      <div className="container product-detail">
        <div className="product-detail-gallery">
          <button
            type="button"
            className={`product-detail-main ${zoom ? "is-zooming" : ""}`}
            onClick={() => images.length && setLightboxOpen(true)}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setZoom(null)}
            onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
            onTouchEnd={handleTouchEnd}
            aria-label="Ver imagen en grande"
            style={zoom ? ({ "--zoom-x": `${zoom.x}%`, "--zoom-y": `${zoom.y}%` } as React.CSSProperties) : undefined}
          >
            <SmartImage key={activeImage} src={images[activeImage]} alt={product.name} fit={product.cover_fit} eager />
            {discount > 0 && <span className="product-detail-main-badge">-{discount}%</span>}
            {images.length > 1 && (
              <span className="product-detail-main-dots" aria-hidden="true">
                {images.map((_, i) => (
                  <span key={i} className={i === activeImage ? "is-active" : ""} />
                ))}
              </span>
            )}
          </button>
          {images.length > 1 && (
            <div className="product-detail-thumbs">
              {images.map((img, i) => (
                <button
                  key={img + i}
                  type="button"
                  className={`product-detail-thumb ${i === activeImage ? "product-detail-thumb-active" : ""}`}
                  onClick={() => setActiveImage(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                >
                  <SmartImage src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail-info">
          <div className="product-detail-tags">
            {product.brand && <span className="product-detail-brand">{product.brand}</span>}
            {levelLabels.map((label) => (
              <Link key={label} to={`/productos?nivel=${levels.find((l) => l.label === label)?.slug ?? ""}`} className="product-detail-tag">
                {label}
              </Link>
            ))}
          </div>

          <h1 className="product-detail-name">{product.name}</h1>

          <div className="product-detail-price-row">
            <span className="product-detail-price">{formatCurrency(finalPrice)}</span>
            {onSale && (
              <>
                <span className="product-detail-price-old">{formatCurrency(product.price)}</span>
                <span className="product-detail-save">Ahorras {formatCurrency(product.price - finalPrice)}</span>
              </>
            )}
          </div>

          <p className={`product-detail-stock ${outOfStock ? "is-out" : lowStock ? "is-low" : "is-ok"}`}>
            <span className="product-detail-stock-dot" />
            {outOfStock
              ? "Agotado por ahora"
              : lowStock
                ? `¡Solo quedan ${product.stock} unidad${product.stock === 1 ? "" : "es"}!`
                : "Disponible"}
          </p>

          {product.sizes.length > 0 && (
            <div className="product-detail-option">
              <span className="product-detail-label">
                Opción: <strong>{size}</strong>
              </span>
              <div className="chip-row product-detail-sizes">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`chip ${size === s ? "chip-active" : ""}`}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="product-detail-buy" ref={buyRef}>
            <QuantityStepper value={quantity} onChange={setQuantity} max={maxQty} size="md" />
            <button
              type="button"
              className={`btn btn-primary product-detail-add ${justAdded ? "is-added" : ""}`}
              onClick={handleAddToCart}
              disabled={outOfStock}
            >
              {outOfStock ? (
                "Agotado"
              ) : justAdded ? (
                <>
                  <CheckIcon size={18} strokeWidth={3} /> ¡Agregado!
                </>
              ) : (
                <>
                  <BagIcon size={18} /> Agregar al carrito
                </>
              )}
            </button>
          </div>

          <div className="product-detail-secondary">
            {settings?.whatsapp && (
              <a
                href={buildWhatsAppUrl(settings.whatsapp, whatsappMessage)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline product-detail-wa"
              >
                <WhatsAppIcon size={18} />
                {outOfStock ? "Avísame cuando llegue" : "Pedir por WhatsApp"}
              </a>
            )}
            <button type="button" className="btn btn-ghost product-detail-share" onClick={handleShare}>
              <ShareIcon size={18} />
              Compartir
            </button>
          </div>

          <ul className="product-detail-trust">
            <li>
              <GiftIcon size={20} />
              <span>
                <strong>Recompensas en cada compra</strong>
                Acumula compras y desbloquea descuentos.
              </span>
            </li>
            <li>
              <ShieldIcon size={20} />
              <span>
                <strong>Compra segura</strong>
                Paga al recibir o por transferencia.
              </span>
            </li>
            <li>
              <ChatIcon size={20} />
              <span>
                <strong>Te asesoramos</strong>
                Resolvemos tus dudas antes y después de comprar.
              </span>
            </li>
          </ul>

          <div className="product-detail-description">
            <h2>Descripción</h2>
            <p>{description}</p>
            <dl className="product-detail-specs">
              {product.brand && (
                <div>
                  <dt>Marca</dt>
                  <dd>{product.brand}</dd>
                </div>
              )}
              {category && (
                <div>
                  <dt>Categoría</dt>
                  <dd>
                    <Link to={`/${category.slug}`} className="link-underline">
                      {category.name}
                    </Link>
                  </dd>
                </div>
              )}
              {levelLabels.length > 0 && (
                <div>
                  <dt>Colección</dt>
                  <dd>{levelLabels.join(", ")}</dd>
                </div>
              )}
              {product.sizes.length > 0 && (
                <div>
                  <dt>Opciones</dt>
                  <dd>{product.sizes.join(" · ")}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <Reveal as="section" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="section-eyebrow">Sigue explorando</span>
                <h2 className="section-title">También te puede gustar</h2>
              </div>
            </div>
            <ProductCarousel products={related} />
          </div>
        </Reveal>
      )}

      {!outOfStock && (
        <div className={`product-sticky-bar ${showStickyBar ? "is-visible" : ""}`} aria-hidden={!showStickyBar}>
          <div className="product-sticky-info">
            <span className="product-sticky-name">{product.name}</span>
            <span className="product-sticky-price">{formatCurrency(finalPrice)}</span>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleAddToCart} tabIndex={showStickyBar ? 0 : -1}>
            {justAdded ? <CheckIcon size={16} strokeWidth={3} /> : <BagIcon size={16} />}
            {justAdded ? "¡Listo!" : "Agregar"}
          </button>
        </div>
      )}

      {lightboxOpen && (
        <Lightbox images={images} initialIndex={activeImage} onClose={() => setLightboxOpen(false)} altPrefix={product.name} />
      )}
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="product-page" aria-busy="true">
      <div className="container">
        <span className="skeleton" style={{ display: "block", width: 220, height: 12, margin: "28px 0 20px" }} />
      </div>
      <div className="container product-detail">
        <div className="product-detail-gallery">
          <div className="product-detail-main skeleton" />
        </div>
        <div className="product-detail-info">
          <span className="skeleton" style={{ width: "30%", height: 12 }} />
          <span className="skeleton" style={{ width: "80%", height: 44 }} />
          <span className="skeleton" style={{ width: "40%", height: 32 }} />
          <span className="skeleton" style={{ width: "100%", height: 52, marginTop: 20 }} />
          <span className="skeleton" style={{ width: "100%", height: 90, marginTop: 10 }} />
        </div>
      </div>
    </div>
  );
}
