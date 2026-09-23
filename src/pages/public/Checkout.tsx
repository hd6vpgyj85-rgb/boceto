import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useSiteSettings } from "../../hooks/useSiteData";
import { supabase } from "../../lib/supabase";
import { formatCurrency } from "../../lib/format";
import { buildWhatsAppUrl } from "../../lib/whatsapp";
import { uploadImage } from "../../lib/imageUpload";
import type { OrderItem } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./Checkout.css";

const PAYMENT_METHODS = ["Efectivo contra entrega", "Transferencia bancaria", "Tarjeta (link de pago)"];

interface CouponResult {
  success: boolean;
  code?: string;
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
  scope?: "single_product" | "cart";
  error?: string;
}

export default function Checkout() {
  const { lines, subtotal, itemCount, clearCart } = useCart();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState(settings?.city ?? "");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [wantsReview, setWantsReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewQuote, setReviewQuote] = useState("");
  const [reviewImage, setReviewImage] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToken, setSuccessToken] = useState<string | null>(null);

  if (lines.length === 0 && !successToken) {
    navigate("/carrito");
    return null;
  }

  const discount =
    coupon?.success && coupon.discount_type
      ? coupon.discount_type === "percentage"
        ? Math.round((subtotal * (coupon.discount_value ?? 0)) / 100)
        : Math.min(coupon.discount_value ?? 0, subtotal)
      : 0;

  const total = Math.max(subtotal - discount, 0);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    const { data, error: rpcError } = await supabase.rpc("redeem_coupon", {
      p_code: couponInput.trim(),
      p_item_count: itemCount,
    });
    setCouponLoading(false);
    if (rpcError) {
      setCoupon({ success: false, error: "No se pudo validar el cupón" });
      return;
    }
    setCoupon(data as CouponResult);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSubmitting(true);
    setError(null);

    try {
      const items: OrderItem[] = lines.map((l) => ({
        product_id: l.productId,
        name: l.name,
        image: l.image,
        price: l.price,
        size: l.size,
        quantity: l.quantity,
      }));

      const { error: orderError } = await supabase.from("orders").insert({
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        address,
        city,
        payment_method: paymentMethod,
        notes: notes || null,
        items,
        subtotal,
        discount,
        coupon_code: coupon?.success ? coupon.code : null,
        total,
      });
      if (orderError) throw orderError;

      const { data: customerRows } = await supabase.rpc("get_or_create_customer_for_checkout", {
        p_name: name,
        p_phone: phone,
      });
      const token = customerRows?.[0]?.token as string | undefined;

      if (wantsReview && reviewQuote.trim()) {
        let imageUrl: string | null = null;
        if (reviewImage) {
          try {
            imageUrl = await uploadImage(reviewImage, "reviews");
          } catch {
            imageUrl = null;
          }
        }
        await supabase.from("reviews").insert({
          name,
          rating: reviewRating,
          quote: reviewQuote.trim(),
          image_url: imageUrl,
          status: "pending",
        });
      }

      for (const line of lines) {
        void supabase.rpc("increment_product_stat", { p_product_id: line.productId, p_field: "purchases" });
      }

      const itemsText = lines
        .map((l) => `• ${l.quantity}x ${l.name}${l.size ? ` (${l.size})` : ""} — ${formatCurrency(l.price * l.quantity)}`)
        .join("\n");
      const message = [
        `¡Hola! Quiero confirmar mi pedido en ${settings.business_name} 🛍️`,
        "",
        itemsText,
        "",
        `Subtotal: ${formatCurrency(subtotal)}`,
        discount > 0 ? `Descuento (${coupon?.code}): -${formatCurrency(discount)}` : null,
        `Total: ${formatCurrency(total)}`,
        "",
        `Nombre: ${name}`,
        `Dirección: ${address}, ${city}`,
        `Pago: ${paymentMethod}`,
        notes ? `Notas: ${notes}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      window.open(buildWhatsAppUrl(settings.whatsapp, message), "_blank", "noopener,noreferrer");

      clearCart();
      setSuccessToken(token ?? null);
    } catch {
      setError("No pudimos registrar tu pedido. Intenta de nuevo o escríbenos por WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  if (successToken) {
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      `${window.location.origin}/fidelidad/${successToken}`,
    )}`;
    return (
      <div className="section container checkout-success">
        <h1>¡Pedido enviado!</h1>
        <p>Te abrimos WhatsApp para confirmar tu pedido. Guarda tu tarjeta de fidelidad escaneando el código:</p>
        <img src={qrSrc} alt="Código QR de tu tarjeta de fidelidad" className="checkout-success-qr" />
        <div className="hero-actions">
          <Link to={`/fidelidad/${successToken}`} className="btn btn-primary">
            Ver mi tarjeta de fidelidad
          </Link>
          <Link to="/" className="btn btn-outline">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  if (!settings) return <LoadingSpinner />;

  return (
    <div className="section container checkout-page">
      <h1 className="checkout-title">Checkout</h1>

      <form className="checkout-layout" onSubmit={handleSubmit}>
        <div className="checkout-form">
          <div className="card checkout-card">
            <h2>Datos personales</h2>
            <div className="field">
              <label htmlFor="name">Nombre completo</label>
              <input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="phone">WhatsApp</label>
              <input
                id="phone"
                required
                placeholder="573001234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="email">Correo (opcional)</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="card checkout-card">
            <h2>Dirección de entrega</h2>
            <div className="field">
              <label htmlFor="address">Dirección</label>
              <input id="address" required value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="city">Ciudad</label>
              <input id="city" required value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>

          <div className="card checkout-card">
            <h2>Método de pago</h2>
            <div className="chip-row">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  className={`chip ${paymentMethod === method ? "chip-active" : ""}`}
                  onClick={() => setPaymentMethod(method)}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="card checkout-card">
            <h2>Cupón</h2>
            <div className="checkout-coupon-row">
              <input
                placeholder="Código de cupón"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                disabled={coupon?.success}
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={applyCoupon}
                disabled={couponLoading || coupon?.success}
              >
                {couponLoading ? "Validando…" : "Aplicar"}
              </button>
            </div>
            {coupon && !coupon.success && <p className="checkout-coupon-error">{coupon.error}</p>}
            {coupon?.success && <p className="checkout-coupon-ok">Cupón {coupon.code} aplicado ✓</p>}
          </div>

          <div className="card checkout-card">
            <h2>Notas del pedido</h2>
            <div className="field">
              <textarea
                placeholder="Ej. tocar el timbre, referencia del edificio, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="card checkout-card">
            <label className="checkout-review-toggle">
              <input
                type="checkbox"
                checked={wantsReview}
                onChange={(e) => setWantsReview(e.target.checked)}
              />
              Quiero dejar una reseña con este pedido
            </label>
            {wantsReview && (
              <div className="checkout-review-fields">
                <div className="field">
                  <label>Calificación</label>
                  <div className="checkout-star-picker">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        type="button"
                        key={n}
                        className={n <= reviewRating ? "checkout-star checkout-star-active" : "checkout-star"}
                        onClick={() => setReviewRating(n)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="reviewQuote">Tu comentario</label>
                  <textarea
                    id="reviewQuote"
                    value={reviewQuote}
                    onChange={(e) => setReviewQuote(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="reviewImage">Foto (opcional)</label>
                  <input
                    id="reviewImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setReviewImage(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="cart-summary card checkout-summary">
          <h2>Resumen</h2>
          {lines.map((line) => (
            <div className="checkout-summary-line" key={`${line.productId}-${line.size}`}>
              <span>
                {line.quantity}× {line.name}
              </span>
              <span>{formatCurrency(line.price * line.quantity)}</span>
            </div>
          ))}
          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="cart-summary-row checkout-discount-row">
              <span>Descuento</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="cart-summary-row checkout-total-row">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {error && <p className="checkout-coupon-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Enviando…" : "Confirmar por WhatsApp"}
          </button>
        </aside>
      </form>
    </div>
  );
}
