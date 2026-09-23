import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useSiteSettings } from "../../hooks/useSiteData";
import { buildWhatsAppUrl } from "../../lib/whatsapp";
import type { Customer, LoyaltyTier } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
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
  const [customer, setCustomer] = useState<Customer | null | undefined>(undefined);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [claims, setClaims] = useState<ClaimInfo[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [claimingTier, setClaimingTier] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    const [{ data: customerRows }, { data: tierRows }, { data: claimRows }] = await Promise.all([
      supabase.rpc("get_customer_by_token", { p_token: token }),
      supabase.from("loyalty_tiers").select("*").order("display_order", { ascending: true }),
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

  if (customer === undefined) return <LoadingSpinner />;
  if (customer === null) {
    return (
      <div className="loyalty-standalone">
        <EmptyState title="Tarjeta no encontrada" description="Este enlace de fidelidad no es válido." />
        <Link to="/" className="btn btn-primary loyalty-back">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  const sortedTiers = [...tiers].sort((a, b) => a.required_purchases - b.required_purchases);
  const currentTier = [...sortedTiers].reverse().find((t) => customer.purchases >= t.required_purchases);
  const nextTier = sortedTiers.find((t) => customer.purchases < t.required_purchases);
  const progress = nextTier
    ? Math.min(100, Math.round((customer.purchases / nextTier.required_purchases) * 100))
    : 100;

  const cardUrl = `${window.location.origin}/fidelidad/${customer.token}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(cardUrl)}`;

  const claimFor = (tierId: string) => claims.find((c) => c.tier_id === tierId);

  const handleClaim = async (tier: LoyaltyTier) => {
    if (!token) return;
    setClaimingTier(tier.id);
    await supabase.rpc("request_loyalty_claim", { p_token: token, p_tier_id: tier.id });
    await load();
    setClaimingTier(null);
    if (settings) {
      const message = `Hola, soy ${customer.name} (código ${customer.access_code}). Quiero reclamar mi recompensa: ${tier.reward_description}.`;
      window.open(buildWhatsAppUrl(settings.whatsapp, message), "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="loyalty-standalone">
      <Link to="/" className="loyalty-back-link">
        ← Volver a la tienda
      </Link>

      <div className={`loyalty-card ${flipped ? "loyalty-card-flipped" : ""}`} onClick={() => setFlipped((f) => !f)}>
        <div className="loyalty-card-inner">
          <div className="loyalty-card-face loyalty-card-front">
            <CrownIcon />
            <h1 className="loyalty-card-name">{customer.name || "Cliente NOIRE"}</h1>
            <span className="loyalty-card-tier">{currentTier?.reward_description ? `Nivel: ${sortedTiers.indexOf(currentTier) + 1}` : "Nuevo miembro"}</span>
            <div className="loyalty-progress">
              <div className="loyalty-progress-bar">
                <div className="loyalty-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="loyalty-progress-label">
                {nextTier
                  ? `${customer.purchases} / ${nextTier.required_purchases} compras`
                  : "¡Nivel máximo alcanzado!"}
              </span>
            </div>
            <div className="loyalty-steps">
              {sortedTiers.map((tier, i) => (
                <span
                  key={tier.id}
                  className={`loyalty-step ${customer.purchases >= tier.required_purchases ? "loyalty-step-done" : ""}`}
                  title={`Nivel ${i + 1}: ${tier.required_purchases} compras`}
                />
              ))}
            </div>
            <span className="loyalty-flip-hint">Toca para ver tu código QR</span>
          </div>

          <div className="loyalty-card-face loyalty-card-back">
            <img src={qrSrc} alt="Código QR de tu tarjeta" className="loyalty-qr" />
            <span className="loyalty-access-label">Código de acceso</span>
            <span className="loyalty-access-code">{customer.access_code}</span>
            <span className="loyalty-flip-hint">Toca para volver</span>
          </div>
        </div>
      </div>

      <div className="loyalty-rewards">
        <h2>Recompensas por nivel</h2>
        {sortedTiers.map((tier, i) => {
          const unlocked = customer.purchases >= tier.required_purchases;
          const claim = claimFor(tier.id);
          return (
            <div className="loyalty-reward-row card" key={tier.id}>
              <div className="loyalty-reward-info">
                <span className="loyalty-reward-tier">Nivel {i + 1} · {tier.required_purchases} compras</span>
                <span className="loyalty-reward-desc">{tier.reward_description}</span>
              </div>
              {claim?.claimed ? (
                <span className="loyalty-reward-claimed">Reclamado ✓</span>
              ) : unlocked ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleClaim(tier)}
                  disabled={claimingTier === tier.id}
                >
                  {claimingTier === tier.id ? "Enviando…" : "Reclamar"}
                </button>
              ) : (
                <span className="loyalty-reward-locked">Bloqueado</span>
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
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 8l4 4 6-8 6 8 4-4-2 11H4L2 8z" />
    </svg>
  );
}
