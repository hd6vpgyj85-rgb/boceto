import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useOrders } from "../../context/OrdersContext";
import { useReviews } from "../../context/ReviewsContext";
import { useCoupons } from "../../context/CouponsContext";
import { useLoyalty } from "../../context/LoyaltyContext";
import { formatPrice } from "../../lib/format";
import { buildCheckoutMessage } from "../../lib/whatsapp";
import { getWhatsAppUrl } from "../../data/store";
import { uploadReviewImage } from "../../lib/imageUpload";
import { generateLoyaltyQrDataUrl, getLoyaltyCardUrl } from "../../lib/loyaltyQr";
import StarRating from "../../components/StarRating";
import "./CheckoutPage.css";

const PAYMENT_METHODS = ["Efectivo contra entrega", "Transferencia bancaria", "Depósito en tienda"];

interface SuccessState {
  orderId: string;
  qrDataUrl: string;
  cardUrl: string;
}

export default function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const { createOrder } = useOrders();
  const { createReview } = useReviews();
  const { redeemCoupon } = useCoupons();
  const { getOrCreateCustomerForCheckout } = useLoyalty();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
    calle: "",
    colonia: "",
    ciudad: "Ciudad Juárez",
    estado: "Chihuahua",
    codigoPostal: "",
    pais: "México",
    referencias: "",
    paymentMethod: PAYMENT_METHODS[0],
    notes: "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [wantsReview, setWantsReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewQuote, setReviewQuote] = useState("");
  const [reviewImageFile, setReviewImageFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const discount = couponStatus?.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const redeemed = await redeemCoupon(couponCode.trim());
      const amount =
        redeemed.discountType === "percentage" ? (subtotal * redeemed.discountValue) / 100 : redeemed.discountValue;
      setCouponStatus({ code: couponCode.trim().toUpperCase(), discount: Math.min(amount, subtotal) });
    } catch (err) {
      setCouponStatus(null);
      setCouponError(err instanceof Error ? err.message : "No se pudo aplicar el cupón.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const customer = { nombre: form.nombre, apellido: form.apellido, telefono: form.telefono, correo: form.correo || undefined };
      const address = {
        calle: form.calle,
        colonia: form.colonia,
        ciudad: form.ciudad,
        estado: form.estado,
        codigoPostal: form.codigoPostal,
        pais: form.pais,
        referencias: form.referencias || undefined,
      };
      const items = lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        level: l.level,
        quantity: l.quantity,
        price: l.price,
      }));

      const orderId = await createOrder({
        customer,
        address,
        paymentMethod: form.paymentMethod,
        notes: form.notes || undefined,
        items,
        total,
      });

      let reviewQuoteText: string | undefined;
      if (wantsReview && reviewQuote.trim()) {
        let imageUrl: string | null = null;
        if (reviewImageFile) {
          imageUrl = await uploadReviewImage(reviewImageFile);
        }
        await createReview({
          name: `${form.nombre} ${form.apellido}`.trim(),
          rating: reviewRating,
          quote: reviewQuote.trim(),
          image: imageUrl,
        });
        reviewQuoteText = reviewQuote.trim();
      }

      const { token } = await getOrCreateCustomerForCheckout(`${form.nombre} ${form.apellido}`.trim(), form.telefono);

      const message = buildCheckoutMessage({
        items: lines,
        subtotal,
        discount,
        couponCode: couponStatus?.code ?? null,
        total,
        customer,
        address,
        paymentMethod: form.paymentMethod,
        notes: form.notes || undefined,
        reviewQuote: reviewQuoteText,
      });

      window.open(getWhatsAppUrl(message), "_blank", "noopener,noreferrer");

      const qrDataUrl = await generateLoyaltyQrDataUrl(token);
      setSuccess({ orderId, qrDataUrl, cardUrl: getLoyaltyCardUrl(token) });
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar tu pedido. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="container checkout-success">
        <h1>¡Gracias por tu pedido! 🎉</h1>
        <p>Abrimos WhatsApp para confirmar los detalles con nuestro equipo. Este es tu QR de fidelidad:</p>

        <div className="loyalty-mini-card">
          <img src={success.qrDataUrl} alt="Código QR de tu tarjeta de fidelidad" />
          <p>Guarda este código: acumula compras y desbloquea recompensas.</p>
        </div>

        <div className="checkout-success-actions">
          <button
            className="btn btn-outline"
            onClick={() => navigator.clipboard.writeText(success.cardUrl)}
          >
            Copiar link
          </button>
          <button className="btn btn-primary" onClick={() => navigate(success.cardUrl.replace(window.location.origin, ""))}>
            Ver mi tarjeta
          </button>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container checkout-success">
        <h1>Tu carrito está vacío</h1>
        <button className="btn btn-primary" onClick={() => navigate("/fajas")}>
          Ver catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="container checkout-page">
      <h1>Checkout</h1>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <section>
          <h2>Datos personales</h2>
          <div className="checkout-row">
            <input required placeholder="Nombre" value={form.nombre} onChange={update("nombre")} />
            <input required placeholder="Apellido" value={form.apellido} onChange={update("apellido")} />
          </div>
          <div className="checkout-row">
            <input required placeholder="Teléfono / WhatsApp" value={form.telefono} onChange={update("telefono")} />
            <input type="email" placeholder="Correo (opcional)" value={form.correo} onChange={update("correo")} />
          </div>
        </section>

        <section>
          <h2>Dirección de envío</h2>
          <input required placeholder="Calle y número" value={form.calle} onChange={update("calle")} />
          <div className="checkout-row">
            <input required placeholder="Colonia" value={form.colonia} onChange={update("colonia")} />
            <input required placeholder="Código postal" value={form.codigoPostal} onChange={update("codigoPostal")} />
          </div>
          <div className="checkout-row">
            <input required placeholder="Ciudad" value={form.ciudad} onChange={update("ciudad")} />
            <input required placeholder="Estado" value={form.estado} onChange={update("estado")} />
          </div>
          <input placeholder="Referencias (opcional)" value={form.referencias} onChange={update("referencias")} />
        </section>

        <section>
          <h2>Método de pago</h2>
          <select value={form.paymentMethod} onChange={update("paymentMethod")}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </section>

        <section>
          <h2>Cupón de descuento</h2>
          <div className="checkout-row">
            <input placeholder="Código de cupón" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
            <button type="button" className="btn btn-outline" onClick={handleApplyCoupon} disabled={couponLoading}>
              {couponLoading ? "..." : "Aplicar"}
            </button>
          </div>
          {couponStatus && <p className="checkout-coupon-ok">Cupón {couponStatus.code} aplicado ✓</p>}
          {couponError && <p className="checkout-coupon-error">{couponError}</p>}
        </section>

        <section>
          <h2>Notas del pedido</h2>
          <textarea placeholder="Notas para tu pedido (opcional)" value={form.notes} onChange={update("notes")} />
        </section>

        <section>
          <label className="checkout-review-toggle">
            <input type="checkbox" checked={wantsReview} onChange={(e) => setWantsReview(e.target.checked)} />
            Quiero dejar una reseña de mi experiencia
          </label>

          {wantsReview && (
            <div className="checkout-review-fields">
              <StarRating rating={reviewRating} />
              <input
                type="range"
                min={1}
                max={5}
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
              />
              <textarea
                placeholder="Cuéntanos tu experiencia"
                value={reviewQuote}
                onChange={(e) => setReviewQuote(e.target.value)}
              />
              <input type="file" accept="image/*" onChange={(e) => setReviewImageFile(e.target.files?.[0] ?? null)} />
            </div>
          )}
        </section>

        <div className="checkout-summary">
          <div className="checkout-summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="checkout-summary-row">
              <span>Descuento</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="checkout-summary-row checkout-summary-total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {error && <p className="checkout-error">{error}</p>}

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? "Enviando…" : "Confirmar pedido por WhatsApp"}
        </button>
      </form>
    </div>
  );
}
