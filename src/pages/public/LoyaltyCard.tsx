import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { usePageTitle, useSiteSettings } from "../../hooks/useSiteData";
import { useToast } from "../../context/ToastContext";
import { buildWhatsAppUrl } from "../../lib/whatsapp";
import type { Customer, LoyaltyTier } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { ArrowLeftIcon, CheckIcon, GiftIcon } from "../../components/Icons";
import "./LoyaltyCard.css";

interface ClaimInfo {
  tier_id: string;
  claimed: boolean;
  claimed_at: string | null;
  coupon_code: string | null;
}

export default function LoyaltyCard() {
  const { token } = useParams();
  const { settings } = useSiteSettings();
  const toast = useToast();
  const [customer, setCustomer] = useState<Customer | null | undefined>(undefined);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [claims, setClaims] = useState<ClaimInfo[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [claimingTier, setClaimingTier] = useState<string | null>(null);
  const [progressReady, setProgressReady] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const touchStartX = useRef<number | null>(null);

  usePageTitle("Mi tarjeta de recompensas");

  const load = async () => {
    if (!token) return;
    const [{ data: customerRows }, { data: tierRows }, { data: claimRows }] = await Promise.all([
      supabase.rpc("get_customer_by_token", { p_token: token }),
      supabase.from("loyalty_tiers").select("*").order("required_purchases", { ascending: true }),
      supabase.rpc("get_loyalty_claims_by_token", { p_token: token }),
    ]);
    setCustomer((customerRows?.[0] as Customer | undefined) ?? null);
    setTiers((tierRows as LoyaltyTier[] | null) ?? []);
    setClaims((claimRows as ClaimInfo[] | null) ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!customer) return;
    const id = window.setTimeout(() => setProgressReady(true), 400);
    return () => window.clearTimeout(id);
  }, [customer]);

  if (customer === undefined) {
    return (
      <div className="loyalty-standalone">
        <LoadingSpinner label="Cargando tu tarjeta…" />
      </div>
    );
  }

  if (customer === null) {
    return (
      <div className="loyalty-standalone">
        <EmptyState
          icon="box"
          title="Tarjeta no encontrada"
          description="Este enlace no corresponde a ninguna tarjeta. Revisa que esté completo o entra con tu WhatsApp y código de acceso."
          action={
            <>
              <Link to="/admin/login" className="btn btn-primary">
                Entrar con mi código
              </Link>
              <Link to="/" className="btn btn-outline">
                Volver a la tienda
              </Link>
            </>
          }
        />
      </div>
    );
  }

  const businessName = settings?.business_name ?? "";
  const currentIndex = tiers.reduce((acc, t, i) => (customer.purchases >= t.required_purchases ? i : acc), -1);
  const nextTier = tiers.find((t) => customer.purchases < t.required_purchases);
  const previousRequired = currentIndex >= 0 ? tiers[currentIndex].required_purchases : 0;
  const progress = nextTier
    ? Math.min(100, Math.round(((customer.purchases - previousRequired) / (nextTier.required_purchases - previousRequired)) * 100))
    : 100;
  const remaining = nextTier ? nextTier.required_purchases - customer.purchases : 0;

  const cardUrl = `${window.location.origin}/fidelidad/${customer.token}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(cardUrl)}`;
  const claimFor = (tierId: string) => claims.find((c) => c.tier_id === tierId);

  const handleClaim = async (tier: LoyaltyTier) => {
    if (!token || !settings) return;
    const popup = window.open("", "_blank");
    setClaimingTier(tier.id);
    const { data } = await supabase.rpc("request_loyalty_claim", { p_token: token, p_tier_id: tier.id });
    await load();
    setClaimingTier(null);
    if (!(data as { success?: boolean } | null)?.success) {
      popup?.close();
      toast("No pudimos registrar tu solicitud. Inténtalo de nuevo.", "error");
      return;
    }
    toast("¡Solicitud enviada! Te confirmamos por WhatsApp.", "success");
    const message = `¡Hola, ${businessName}! Soy ${customer.name} (código ${customer.access_code}). Quiero reclamar mi recompensa: ${tier.reward_description}.`;
    const url = buildWhatsAppUrl(settings.whatsapp, message);
    if (popup) popup.location.href = url;
    else window.location.href = url;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((e.clientY - rect.top) / rect.height - 0.5) * -12,
      y: ((e.clientX - rect.left) / rect.width - 0.5) * 16,
    });
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(customer.access_code ?? "");
      toast("Código copiado", "info");
    } catch {
      toast("No se pudo copiar el código", "error");
    }
  };

  return (
    <div className="loyalty-standalone">
      <div className="loyalty-bg-orb" aria-hidden="true" />
      <Link to="/" className="loyalty-back-link">
        <ArrowLeftIcon size={16} />
        Volver a {businessName || "la tienda"}
      </Link>

      <div className="loyalty-heading">
        <span className="section-eyebrow">Programa de recompensas</span>
        <h1>¡Hola, {customer.name?.split(" ")[0] || "cliente"}!</h1>
      </div>

      <div
        className={`loyalty-card ${flipped ? "loyalty-card-flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX.current != null && Math.abs(e.changedTouches[0].clientX - touchStartX.current) > 40) {
            e.preventDefault();
            setFlipped((f) => !f);
          }
          touchStartX.current = null;
        }}
        role="button"
        tabIndex={0}
        aria-label={flipped ? "Ver frente de la tarjeta" : "Ver código QR"}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setFlipped((f) => !f)}
        style={{ transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <div className="loyalty-card-inner">
          <div className="loyalty-card-face loyalty-card-front">
            <span className="loyalty-card-shine" aria-hidden="true" />
            <div className="loyalty-card-top">
              <span className="loyalty-card-brand">{businessName}</span>
              <span className="loyalty-card-crown">
                <CrownIcon />
              </span>
            </div>
            <div className="loyalty-card-middle">
              <span className="loyalty-card-name">{customer.name || "Cliente"}</span>
              <span className="loyalty-card-tier">
                {currentIndex >= 0 ? `Nivel ${currentIndex + 1} de ${tiers.length}` : "Miembro nuevo"}
              </span>
            </div>
            <div className="loyalty-progress">
              <div className="loyalty-progress-head">
                <span>
                  <strong>{customer.purchases}</strong> compra{customer.purchases === 1 ? "" : "s"}
                </span>
                <span>{nextTier ? `Faltan ${remaining} para el nivel ${tiers.indexOf(nextTier) + 1}` : "¡Nivel máximo!"}</span>
              </div>
              <div className="loyalty-progress-bar">
                <div className="loyalty-progress-fill" style={{ width: progressReady ? `${progress}%` : "0%" }} />
              </div>
              <div className="loyalty-steps">
                {tiers.map((tier, i) => (
                  <span
                    key={tier.id}
                    className={`loyalty-step ${customer.purchases >= tier.required_purchases ? "loyalty-step-done" : ""}`}
                    style={{ transitionDelay: `${600 + i * 150}ms` }}
                    title={`Nivel ${i + 1}: ${tier.required_purchases} compras`}
                  />
                ))}
              </div>
            </div>
            <span className="loyalty-flip-hint">Toca la tarjeta para ver tu código QR</span>
          </div>

          <div className="loyalty-card-face loyalty-card-back">
            <img src={qrSrc} alt="Código QR de tu tarjeta" className="loyalty-qr" />
            <span className="loyalty-access-label">Código de acceso</span>
            <span className="loyalty-access-code">{customer.access_code}</span>
            <span className="loyalty-flip-hint">Muéstralo en tienda o úsalo para entrar desde otro dispositivo</span>
          </div>
        </div>
      </div>

      <button type="button" className="loyalty-copy" onClick={copyCode}>
        Copiar código de acceso
      </button>

      <div className="loyalty-rewards">
        <h2>Tus recompensas</h2>
        {tiers.length === 0 && <p className="loyalty-empty">Pronto habrá recompensas disponibles.</p>}
        {tiers.map((tier, i) => {
          const unlocked = customer.purchases >= tier.required_purchases;
          const claim = claimFor(tier.id);
          const state = claim?.claimed ? "claimed" : claim ? "requested" : unlocked ? "unlocked" : "locked";
          return (
            <div
              className={`loyalty-reward-row card is-${state}`}
              key={tier.id}
              style={{ animationDelay: `${300 + i * 90}ms` }}
            >
              <span className="loyalty-reward-icon">
                {state === "claimed" ? <CheckIcon size={20} strokeWidth={3} /> : <GiftIcon size={20} />}
              </span>
              <div className="loyalty-reward-info">
                <span className="loyalty-reward-tier">
                  Nivel {i + 1} · {tier.required_purchases} compra{tier.required_purchases === 1 ? "" : "s"}
                </span>
                <span className="loyalty-reward-desc">{tier.reward_description}</span>
                {claim?.coupon_code && (
                  <span className="loyalty-reward-coupon">
                    Tu cupón: <strong>{claim.coupon_code}</strong>
                  </span>
                )}
              </div>
              {state === "claimed" ? (
                <span className="loyalty-reward-status is-claimed">Reclamado</span>
              ) : state === "requested" ? (
                <span className="loyalty-reward-status is-requested">En revisión</span>
              ) : state === "unlocked" ? (
                <button
                  type="button"
                  className={`btn btn-primary btn-sm ${claimingTier === tier.id ? "btn-loading" : ""}`}
                  onClick={() => handleClaim(tier)}
                  disabled={claimingTier === tier.id}
                >
                  {claimingTier === tier.id ? "Enviando" : "Reclamar"}
                </button>
              ) : (
                <span className="loyalty-reward-status">
                  Faltan {tier.required_purchases - customer.purchases}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CrownIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M2 8l4 4 6-8 6 8 4-4-2 11H4L2 8z" />
    </svg>
  );
}
