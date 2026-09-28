import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useLoyalty, type PublicCustomer } from "../../context/LoyaltyContext";
import type { LoyaltyClaim } from "../../types";
import { buildLoyaltyClaimMessage } from "../../lib/whatsapp";
import { getWhatsAppUrl } from "../../data/store";
import { formatDate } from "../../lib/format";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./FidelidadPage.css";

export default function FidelidadPage() {
  const { token } = useParams<{ token: string }>();
  const { tiers, loading: tiersLoading, getCustomerByToken, getClaimsByToken, requestClaim } = useLoyalty();

  const [customer, setCustomer] = useState<PublicCustomer | null | undefined>(undefined);
  const [claims, setClaims] = useState<LoyaltyClaim[]>([]);
  const [requesting, setRequesting] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    const c = await getCustomerByToken(token);
    setCustomer(c);
    if (c) setClaims(await getClaimsByToken(token));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (customer === undefined || tiersLoading) return <LoadingSpinner />;

  if (!customer || tiers.length === 0) {
    return (
      <div className="loyalty-page loyalty-notfound">
        <p>No encontramos esta tarjeta de fidelidad.</p>
      </div>
    );
  }

  const sortedTiers = [...tiers].sort((a, b) => a.purchasesRequired - b.purchasesRequired);
  const reachedTiers = sortedTiers.filter((t) => customer.purchasesCount >= t.purchasesRequired);
  const currentLevel = reachedTiers.length;
  const nextTier = sortedTiers.find((t) => customer.purchasesCount < t.purchasesRequired);
  const progress = nextTier
    ? Math.min(100, Math.round((customer.purchasesCount / nextTier.purchasesRequired) * 100))
    : 100;

  const handleClaim = async (tierId: string) => {
    if (!token) return;
    setRequesting(tierId);
    try {
      await requestClaim(token, tierId);
      await load();
      const tier = sortedTiers.find((t) => t.id === tierId);
      if (tier) {
        window.open(getWhatsAppUrl(buildLoyaltyClaimMessage(customer.name, tier.rewardDescription)), "_blank");
      }
    } finally {
      setRequesting(null);
    }
  };

  return (
    <div className="loyalty-page">
      <div className="loyalty-card">
        <div className="loyalty-crown">👑</div>
        <h1>{customer.name}</h1>
        <p className="loyalty-level">
          Nivel {currentLevel} · {customer.purchasesCount} compras
        </p>

        {nextTier && (
          <div className="loyalty-progress">
            <div className="loyalty-progress-bar">
              <div className="loyalty-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span>
              {customer.purchasesCount} / {nextTier.purchasesRequired} para el siguiente nivel
            </span>
          </div>
        )}

        <div className="loyalty-tracker">
          {sortedTiers.map((tier, i) => {
            const reached = customer.purchasesCount >= tier.purchasesRequired;
            return (
              <div className="loyalty-tracker-step" key={tier.id}>
                <div className={`loyalty-tracker-dot ${reached ? "is-reached" : ""}`}>{reached ? "✓" : i + 1}</div>
                {i < sortedTiers.length - 1 && (
                  <div className={`loyalty-tracker-line ${reached ? "is-reached" : ""}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="loyalty-rewards">
        <h2>Recompensas</h2>
        {sortedTiers.map((tier) => {
          const unlocked = customer.purchasesCount >= tier.purchasesRequired;
          const claim = claims.find((c) => c.tierId === tier.id);

          return (
            <div className="loyalty-reward" key={tier.id}>
              <div>
                <strong>{tier.purchasesRequired} compras</strong>
                <p>{tier.rewardDescription}</p>
              </div>

              {!unlocked && <span className="loyalty-reward-status">Bloqueado</span>}
              {unlocked && !claim && (
                <button className="btn btn-primary" disabled={requesting === tier.id} onClick={() => handleClaim(tier.id)}>
                  {requesting === tier.id ? "..." : "Reclamar recompensa"}
                </button>
              )}
              {unlocked && claim && !claim.claimed && (
                <span className="loyalty-reward-status loyalty-reward-pending">
                  Pendiente de confirmar ({formatDate(claim.requestedAt)})
                </span>
              )}
              {unlocked && claim?.claimed && (
                <span className="loyalty-reward-status loyalty-reward-claimed">
                  ¡Reclamado! {claim.couponCode ? `Cupón: ${claim.couponCode}` : ""}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
