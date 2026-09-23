import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useCart } from "../../context/CartContext";
import { useCategories, useLevels } from "../../hooks/useSiteData";
import type { Product } from "../../types";
import { formatCurrency } from "../../lib/format";
import Lightbox from "../../components/Lightbox";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const { categories } = useCategories();
  const { levels } = useLevels();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setProduct(undefined);
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        const p = data as Product | null;
        setProduct(p);
        setSize(p?.sizes?.[0] ?? null);
        setActiveImage(0);
        if (p) void supabase.rpc("increment_product_stat", { p_product_id: p.id, p_field: "views" });
      });
  }, [id]);

  const categoryName = useMemo(
    () => categories.find((c) => c.slug === product?.category)?.name,
    [categories, product],
  );
  const levelLabels = useMemo(
    () => (product ? levels.filter((l) => product.levels.includes(l.slug)).map((l) => l.label) : []),
    [levels, product],
  );

  if (product === undefined) return <LoadingSpinner />;
  if (product === null) {
    return (
      <div className="section container">
        <EmptyState
          title="Producto no encontrado"
          description="Puede que ya no esté disponible."
          action={
            <Link to="/productos" className="btn btn-primary">
              Ver catálogo
            </Link>
          }
        />
      </div>
    );
  }

  const description =
    product.description?.trim() ||
    `${product.name} de ${product.brand}, una fragancia ${levelLabels.join(" / ").toLowerCase() || "especial"}${
      categoryName ? ` de nuestra línea de ${categoryName.toLowerCase()}` : ""
    }.`;

  const handleAddToCart = () => {
    addToCart(
      {
        productId: product.id,
        name: product.name,
        image: product.images[0] ?? null,
        price: product.on_sale && product.sale_price != null ? product.sale_price : product.price,
        size,
        stock: product.stock,
      },
      1,
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div className="section container product-detail">
      <div className="product-detail-gallery">
        <button type="button" className="product-detail-main" onClick={() => setLightboxOpen(true)}>
          {product.images[activeImage] ? (
            <img
              src={product.images[activeImage]}
              alt={product.name}
              style={{ objectFit: product.cover_fit }}
            />
          ) : (
            <div className="product-detail-main-placeholder" />
          )}
        </button>
        {product.images.length > 1 && (
          <div className="product-detail-thumbs">
            {product.images.map((img, i) => (
              <button
                key={img + i}
                type="button"
                className={`product-detail-thumb ${i === activeImage ? "product-detail-thumb-active" : ""}`}
                onClick={() => setActiveImage(i)}
              >
                <img src={img} alt={`${product.name} ${i + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="product-detail-info">
        <span className="product-detail-brand">{product.brand}</span>
        <h1 className="product-detail-name">{product.name}</h1>

        <div className="product-detail-price-row">
          {product.on_sale && product.sale_price != null ? (
            <>
              <span className="product-detail-price-old">{formatCurrency(product.price)}</span>
              <span className="product-detail-price">{formatCurrency(product.sale_price)}</span>
              <span className="product-detail-badge">Oferta</span>
            </>
          ) : (
            <span className="product-detail-price">{formatCurrency(product.price)}</span>
          )}
        </div>

        {levelLabels.length > 0 && (
          <div className="product-detail-tags">
            {levelLabels.map((label) => (
              <span key={label} className="product-detail-tag">
                {label}
              </span>
            ))}
          </div>
        )}

        {product.sizes.length > 0 && (
          <div className="product-detail-sizes">
            <span className="product-detail-label">Tamaño</span>
            <div className="chip-row">
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

        <button
          type="button"
          className={`btn btn-primary btn-block product-detail-add ${justAdded ? "product-detail-add-bump" : ""}`}
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
        >
          {product.stock <= 0 ? "Agotado" : "Agregar al carrito"}
        </button>

        <p className="product-detail-description">{description}</p>

        {product.stock > 0 && product.stock <= 5 && (
          <p className="product-detail-stock-warning">¡Solo quedan {product.stock} unidades!</p>
        )}
      </div>

      {lightboxOpen && (
        <Lightbox
          images={product.images}
          initialIndex={activeImage}
          onClose={() => setLightboxOpen(false)}
          altPrefix={product.name}
        />
      )}
    </div>
  );
}
