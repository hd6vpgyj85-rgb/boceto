import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { usePageTitle, useSiteSettings } from "../../hooks/useSiteData";
import { supabase } from "../../lib/supabase";
import { formatCurrency } from "../../lib/format";
import { buildWhatsAppUrl } from "../../lib/whatsapp";
import { uploadImage } from "../../lib/imageUpload";
import type { CartLine, OrderItem } from "../../types";
import SmartImage from "../../components/SmartImage";
import {
  ArrowRightIcon,
  BankIcon,
  CardIcon,
  CashIcon,
  CheckIcon,
  GiftIcon,
  ShieldIcon,
  WhatsAppIcon,
} from "../../components/Icons";
import "./Checkout.css";

const PAYMENT_METHODS = [
  { value: "Efectivo contra entrega", icon: CashIcon, hint: "Pagas al recibir tu pedido" },
  { value: "Transferencia bancaria", icon: BankIcon, hint: "Te compartimos los datos por WhatsApp" },
  { value: "Tarjeta (link de pago)", icon: CardIcon, hint: "Te enviamos un enlace seguro" },
];

const CUSTOMER_KEY = "boceto-customer";

interface SavedCustomer {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
}

interface CouponResult {
  success: boolean;
  code?: string;
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
  error?: string;
}

interface PlacedOrder {
  ref: string;
  token: string | null;
  lines: CartLine[];
  total: number;
  whatsappUrl: string;
}

function readSavedCustomer(): Partial<SavedCustomer> {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveCustomer(data: SavedCustomer): boolean {
  try {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export default function Checkout() {
  usePageTitle("Finalizar pedido");
  const { lines, subtotal, itemCount, clearCart } = useCart();
  const { settings } = useSiteSettings();
  const [saved] = useState(readSavedCustomer);

  const [name, setName] = useState(saved.name ?? "");
  const [phone, setPhone] = useState(saved.phone ?? "");
  const [email, setEmail] = useState(saved.email ?? "");
  const [address, setAddress] = useState(saved.address ?? "");
  const [city, setCity] = useState(saved.city ?? "");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].value);
  const [notes, setNotes] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponShake, setCouponShake] = useState(0);

  const [wantsReview, setWantsReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewQuote, setReviewQuote] = useState("");
  const [reviewImage, setReviewImage] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  useEffect(() => {
    if (!city && settings?.city) setCity(settings.city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.city]);

  if (placed) return <CheckoutSuccess order={placed} />;
  if (lines.length === 0) return <Navigate to="/carrito" replace />;

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
    const result: CouponResult = rpcError ? { success: false, error: "No se pudo validar el cupón" } : (data as CouponResult);
    setCoupon(result);
    if (!result.success) setCouponShake((n) => n + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSubmitting(true);
    setError(null);
    const popup = window.open("", "_blank");

    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const orderId = crypto.randomUUID();
      const ref = orderId.slice(0, 6).toUpperCase();
      const items: OrderItem[] = lines.map((l) => ({
        product_id: l.productId,
        name: l.name,
        image: l.image,
        price: l.price,
        size: l.size,
        quantity: l.quantity,
      }));

      const { error: orderError } = await supabase.from("orders").insert({
        id: orderId,
        customer_name: name.trim(),
        customer_phone: cleanPhone,
        customer_email: email.trim() || null,
        address: address.trim(),
        city: city.trim(),
        payment_method: paymentMethod,
        notes: notes.trim() || null,
        items,
        subtotal,
        discount,
        coupon_code: coupon?.success ? coupon.code : null,
        total,
      });
      if (orderError) throw orderError;

      saveCustomer({ name: name.trim(), phone: cleanPhone, email: email.trim(), address: address.trim(), city: city.trim() });

      const { data: customerRows } = await supabase.rpc("get_or_create_customer_for_checkout", {
        p_name: name.trim(),
        p_phone: cleanPhone,
      });
      const token = (customerRows?.[0]?.token as string | undefined) ?? null;

      if (wantsReview && reviewQuote.trim()) {
        let imageUrl: string | null = null;
        if (reviewImage) {
          imageUrl = await uploadImage(reviewImage, "reviews").catch(() => null);
        }
        await supabase.from("reviews").insert({
          name: name.trim(),
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
        .map((l) => `• ${l.quantity}× ${l.name}${l.size ? ` (${l.size})` : ""} — ${formatCurrency(l.price * l.quantity)}`)
        .join("\n");
      const message = [
        `¡Hola, ${settings.business_name}! Quiero confirmar mi pedido #${ref}`,
        "",
        itemsText,
        "",
        `Subtotal: ${formatCurrency(subtotal)}`,
        discount > 0 ? `Descuento (${coupon?.code}): -${formatCurrency(discount)}` : null,
        `Total: ${formatCurrency(total)}`,
        "",
        `Nombre: ${name.trim()}`,
        `Entrega: ${address.trim()}, ${city.trim()}`,
        `Pago: ${paymentMethod}`,
        notes.trim() ? `Notas: ${notes.trim()}` : null,
      ]
        .filter((line) => line !== null)
        .join("\n");

      const whatsappUrl = buildWhatsAppUrl(settings.whatsapp, message);
      if (popup) popup.location.href = whatsappUrl;

      setPlaced({ ref, token, lines: [...lines], total, whatsappUrl });
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      popup?.close();
      setError("No pudimos registrar tu pedido. Revisa tu conexión e inténtalo de nuevo, o escríbenos por WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section container checkout-page">
      <ol className="checkout-steps" aria-label="Progreso de compra">
        <li className="is-done">
          <span>
            <CheckIcon size={14} strokeWidth={3} />
          </span>
          Carrito
        </li>
        <li className="is-active">
          <span>2</span>
          Tus datos
        </li>
        <li>
          <span>3</span>
          Confirmación
        </li>
      </ol>

      <h1 className="checkout-title">Finalizar pedido</h1>
      {saved.name && (
        <p className="checkout-welcome">
          ¡Qué gusto verte de nuevo, {saved.name.split(" ")[0]}! Ya llenamos tus datos de la última vez.
        </p>
      )}

      <form className="checkout-layout" onSubmit={handleSubmit}>
        <div className="checkout-form">
          <section className="card checkout-card">
            <h2>
              <span className="checkout-card-num">1</span>
              Datos de contacto
            </h2>
            <div className="field">
              <label htmlFor="name">Nombre completo</label>
              <input id="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="checkout-row">
              <div className="field">
                <label htmlFor="phone">WhatsApp</label>
                <input
                  id="phone"
                  required
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="5215512345678"
                  pattern="[0-9+ ]{8,16}"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9+ ]/g, ""))}
                />
                <span className="field-hint">Con código de país. Aquí te confirmamos el pedido.</span>
              </div>
              <div className="field">
                <label htmlFor="email">Correo (opcional)</label>
                <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          </section>

          <section className="card checkout-card">
            <h2>
              <span className="checkout-card-num">2</span>
              Dirección de entrega
            </h2>
            <div className="field">
              <label htmlFor="address">Calle, número y colonia</label>
              <input id="address" required autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="city">Ciudad</label>
              <input id="city" required autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="notes">Indicaciones para la entrega (opcional)</label>
              <textarea
                id="notes"
                placeholder="Ej. casa azul, tocar el timbre, entregar después de las 5 p. m."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </section>

          <section className="card checkout-card">
            <h2>
              <span className="checkout-card-num">3</span>
              Forma de pago
            </h2>
            <div className="payment-options" role="radiogroup" aria-label="Forma de pago">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  role="radio"
                  aria-checked={paymentMethod === method.value}
                  className={`payment-option ${paymentMethod === method.value ? "is-selected" : ""}`}
                  onClick={() => setPaymentMethod(method.value)}
                >
                  <span className="payment-option-icon">
                    <method.icon size={22} />
                  </span>
                  <span className="payment-option-text">
                    <strong>{method.value}</strong>
                    <small>{method.hint}</small>
                  </span>
                  <span className="payment-option-check">
                    <CheckIcon size={12} strokeWidth={3.4} />
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="card checkout-card">
            <label className="checkout-toggle">
              <input type="checkbox" checked={wantsReview} onChange={(e) => setWantsReview(e.target.checked)} />
              <span className="checkout-toggle-switch" />
              <span>
                <strong>Dejar una reseña</strong>
                <small>Ayuda a otros clientes. La publicamos después de revisarla.</small>
              </span>
            </label>
            <div className={`checkout-review-fields ${wantsReview ? "is-open" : ""}`}>
              <div className="checkout-review-inner">
                <div className="field">
                  <label>¿Cómo calificarías tu experiencia?</label>
                  <div className="checkout-star-picker" role="radiogroup">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        type="button"
                        key={n}
                        role="radio"
                        aria-checked={n === reviewRating}
                        aria-label={`${n} estrella${n === 1 ? "" : "s"}`}
                        className={n <= reviewRating ? "checkout-star checkout-star-active" : "checkout-star"}
                        onClick={() => setReviewRating(n)}
                        tabIndex={wantsReview ? 0 : -1}
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
                    tabIndex={wantsReview ? 0 : -1}
                    placeholder="¿Qué te gustó de comprar con nosotros?"
                  />
                </div>
                <div className="field">
                  <label htmlFor="reviewImage">Tu foto (opcional)</label>
                  <label className="checkout-file">
                    <input
                      id="reviewImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setReviewImage(e.target.files?.[0] ?? null)}
                      tabIndex={wantsReview ? 0 : -1}
                    />
                    <span>{reviewImage ? reviewImage.name : "Elegir foto"}</span>
                  </label>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="card checkout-summary">
          <h2>Tu pedido</h2>
          <ul className="checkout-summary-lines">
            {lines.map((line) => (
              <li key={`${line.productId}-${line.size}`}>
                <span className="checkout-summary-thumb">
                  <SmartImage src={line.image} alt="" />
                  <span className="checkout-summary-qty">{line.quantity}</span>
                </span>
                <span className="checkout-summary-name">
                  {line.name}
                  {line.size && <small>{line.size}</small>}
                </span>
                <span>{formatCurrency(line.price * line.quantity)}</span>
              </li>
            ))}
          </ul>

          <div key={couponShake} className={`checkout-coupon ${couponShake ? "is-shaking" : ""}`}>
            {coupon?.success ? (
              <div className="checkout-coupon-applied">
                <GiftIcon size={16} />
                <span>
                  Cupón <strong>{coupon.code}</strong> aplicado
                </span>
              </div>
            ) : (
              <div className="checkout-coupon-row">
                <input
                  placeholder="Código de cupón"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyCoupon();
                    }
                  }}
                  aria-label="Código de cupón"
                />
                <button type="button" className="btn btn-outline btn-sm" onClick={applyCoupon} disabled={couponLoading || !couponInput.trim()}>
                  {couponLoading ? "…" : "Aplicar"}
                </button>
              </div>
            )}
            {coupon && !coupon.success && <p className="checkout-coupon-error">{coupon.error}</p>}
          </div>

          <div className="checkout-summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="checkout-summary-row checkout-discount-row">
              <span>Descuento</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="checkout-summary-row checkout-summary-muted">
            <span>Envío</span>
            <span>Por coordinar</span>
          </div>
          <div className="checkout-summary-row checkout-total-row">
            <span>Total</span>
            <span key={total} className="checkout-total-amount">
              {formatCurrency(total)}
            </span>
          </div>

          {error && <p className="checkout-error">{error}</p>}

          <button type="submit" className={`btn btn-whatsapp btn-block checkout-submit ${submitting ? "btn-loading" : ""}`} disabled={submitting}>
            {!submitting && <WhatsAppIcon size={20} />}
            {submitting ? "Enviando pedido…" : "Confirmar por WhatsApp"}
          </button>
          <p className="checkout-secure">
            <ShieldIcon size={14} /> No cobramos nada todavía: confirmas pago y entrega por WhatsApp.
          </p>
        </aside>
      </form>
    </div>
  );
}

function CheckoutSuccess({ order }: { order: PlacedOrder }) {
  usePageTitle("¡Pedido enviado!");
  const cardUrl = order.token ? `${window.location.origin}/fidelidad/${order.token}` : null;
  const qrSrc = cardUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(cardUrl)}`
    : null;

  return (
    <div className="section container checkout-success">
      <div className="checkout-success-badge" aria-hidden="true">
        <svg viewBox="0 0 52 52" width="88" height="88">
          <circle className="checkout-success-circle" cx="26" cy="26" r="24" fill="none" />
          <path className="checkout-success-check" fill="none" d="M15 27l7 7 15-16" />
        </svg>
      </div>
      <span className="checkout-success-ref">Pedido #{order.ref}</span>
      <h1>¡Pedido enviado!</h1>
      <p>
        Abrimos WhatsApp con el resumen de tu pedido. Envía el mensaje para que confirmemos el pago y la entrega. Si no
        se abrió, usa el botón de abajo.
      </p>

      <div className="checkout-success-actions">
        <a href={order.whatsappUrl} target="_blank" rel="noreferrer" className="btn btn-whatsapp">
          <WhatsAppIcon size={18} />
          Abrir WhatsApp de nuevo
        </a>
        <Link to="/productos" className="btn btn-outline">
          Seguir comprando
        </Link>
      </div>

      {cardUrl && qrSrc && (
        <div className="checkout-success-loyalty card">
          <img src={qrSrc} alt="Código QR de tu tarjeta de recompensas" className="checkout-success-qr" />
          <div>
            <span className="section-eyebrow">Tarjeta de recompensas</span>
            <h2>Esta compra ya cuenta</h2>
            <p>Escanea el código o abre tu tarjeta para ver tu progreso y las recompensas que puedes desbloquear.</p>
            <Link to={`/fidelidad/${order.token}`} className="btn btn-primary btn-sm">
              Ver mi tarjeta
              <ArrowRightIcon size={16} className="btn-arrow" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
