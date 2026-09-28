import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProducts } from "../../context/ProductsContext";
import { useAnalytics } from "../../context/AnalyticsContext";
import { useCart } from "../../context/CartContext";
import { LEVEL_LABELS } from "../../types";
import { formatPrice } from "../../lib/format";
import { getProductDescription } from "../../lib/productDescription";
import ProductBadge from "../../components/ProductBadge";
import Lightbox from "../../components/Lightbox";
import QuantityStepper from "../../components/QuantityStepper";
import RelatedProducts from "../../components/RelatedProducts";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./ProductDetailPage.css";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, loading, getById } = useProducts();
  const { registerView, registerCartAdd } = useAnalytics();
  const { addLine } = useCart();

  const product = id ? getById(id) : undefined;

  const [imageIndex, setImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<"detalles" | "envios" | null>("detalles");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (product) registerView(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  useEffect(() => {
    setImageIndex(0);
    setQuantity(1);
  }, [id]);

  if (loading) return <LoadingSpinner />;

  if (!product) {
    return (
      <div className="container product-not-found">
        <p>No encontramos este producto.</p>
        <button className="btn btn-primary" onClick={() => navigate("/buscar")}>
          Buscar productos
        </button>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [];
  const levelText = product.levels?.length ? product.levels.map((l) => LEVEL_LABELS[l]).join(" / ") : null;
  const outOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    addLine({
      productId: product.id,
      name: product.name,
      image: images[0] ?? null,
      price: product.price,
      level: levelText ?? undefined,
      quantity,
      stock: product.stock,
    });
    registerCartAdd(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="container product-detail">
      <div className="product-detail-gallery">
        <div className="product-detail-main-image">
          <ProductBadge product={product} />
          {images.length > 0 ? (
            <img src={images[imageIndex]} alt={product.name} onClick={() => setLightboxOpen(true)} />
          ) : (
            <div className="product-detail-placeholder" />
          )}

          {images.length > 1 && (
            <div className="product-detail-dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={i === imageIndex ? "is-active" : ""}
                  onClick={() => setImageIndex(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="product-detail-thumbs">
            {images.map((img, i) => (
              <button key={i} className={i === imageIndex ? "is-active" : ""} onClick={() => setImageIndex(i)}>
                <img src={img} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="product-detail-info">
        <span className="product-detail-brand">{product.brand}</span>
        <h1>{product.name}</h1>

        <div className="product-detail-price">
          {product.onSale && product.compareAtPrice && (
            <span className="product-detail-price-old">{formatPrice(product.compareAtPrice)}</span>
          )}
          <span className="product-detail-price-current">{formatPrice(product.price)}</span>
        </div>

        {levelText && <p className="product-detail-level">{levelText}</p>}

        <div className="product-detail-buy">
          <QuantityStepper quantity={quantity} max={Math.max(1, product.stock)} onChange={setQuantity} />
          <button className="btn btn-primary btn-block" onClick={handleAddToCart} disabled={outOfStock}>
            {outOfStock ? "Agotado" : added ? "¡Agregado! ✓" : "Agregar al carrito"}
          </button>
        </div>

        <p className="product-detail-description">{getProductDescription(product)}</p>

        <div className="accordion">
          <button
            className="accordion-trigger"
            onClick={() => setOpenAccordion(openAccordion === "detalles" ? null : "detalles")}
          >
            Detalles
            <span>{openAccordion === "detalles" ? "−" : "+"}</span>
          </button>
          {openAccordion === "detalles" && (
            <div className="accordion-content">
              <ul>
                <li>Marca: {product.brand}</li>
                {product.sizes && product.sizes.length > 0 && <li>Tallas disponibles: {product.sizes.join(", ")}</li>}
                {product.vendor && <li>Proveedor: {product.vendor}</li>}
              </ul>
            </div>
          )}
        </div>

        <div className="accordion">
          <button
            className="accordion-trigger"
            onClick={() => setOpenAccordion(openAccordion === "envios" ? null : "envios")}
          >
            Envíos y devoluciones
            <span>{openAccordion === "envios" ? "−" : "+"}</span>
          </button>
          {openAccordion === "envios" && (
            <div className="accordion-content">
              <p>
                Coordinamos tu envío directamente por WhatsApp una vez confirmado tu pedido. Si tu producto llega con
                algún defecto, contáctanos dentro de las primeras 48 horas para gestionar tu cambio o devolución.
              </p>
            </div>
          )}
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox images={images} index={imageIndex} onClose={() => setLightboxOpen(false)} onNavigate={setImageIndex} />
      )}

      <RelatedProducts current={product} all={products} />
    </div>
  );
}
