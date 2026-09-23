import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatDate } from "../../lib/format";
import { buildWhatsAppUrl } from "../../lib/whatsapp";
import { useSiteSettings } from "../../hooks/useSiteData";
import { useToast } from "../../context/ToastContext";
import type { Customer, LoyaltyTier, CouponScope } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import { CheckIcon, CloseIcon, GiftIcon, PlusIcon, WhatsAppIcon } from "../../components/Icons";
import "./adminShared.css";
import "./Customers.css";

interface ClaimRow {
  id: string;
  customer_id: string;
  tier_id: string;
  claimed: boolean;
  claimed_at: string | null;
  coupon_code: string | null;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);

  const load = async () => {
    const [{ data: customerRows }, { data: tierRows }] = await Promise.all([
      supabase.from("customers").select("*").order("created_at", { ascending: false }),
      supabase.from("loyalty_tiers").select("*").order("required_purchases", { ascending: true }),
    ]);
    setCustomers((customerRows as Customer[] | null) ?? []);
    setTiers((tierRows as LoyaltyTier[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.access_code ?? "").toLowerCase().includes(q),
    );
  }, [customers, search]);

  const tierLabel = (purchases: number) => {
    const reached = tiers.filter((t) => purchases >= t.required_purchases).length;
    return reached === 0 ? "Nuevo" : `Nivel ${reached}`;
  };

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Clientes</h1>
        <span className="customers-total">
          {customers.length} cliente{customers.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className="admin-page-hint">
        Cada cliente que compra recibe una tarjeta de recompensas digital. Aquí puedes ajustar sus compras y confirmar
        las recompensas que reclamen.
      </p>

      <div className="admin-toolbar">
        <input
          className="admin-search-input"
          type="search"
          placeholder="Buscar por nombre, teléfono o código"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <p className="admin-empty">
          {customers.length === 0 ? "Aún no hay clientes. Se registran solos con su primera compra." : "Ningún cliente coincide con la búsqueda."}
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Compras</th>
                <th>Desde</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="admin-row-link" onClick={() => setSelected(c)}>
                  <td>
                    <span className="customers-cell">
                      <span className="admin-row-thumb admin-row-avatar admin-row-initial">
                        {(c.name || "?").charAt(0).toUpperCase()}
                      </span>
                      <span>
                        <strong>{c.name || "Sin nombre"}</strong>
                        <small className="customers-tier">{tierLabel(c.purchases)}</small>
                      </span>
                    </span>
                  </td>
                  <td className="admin-nowrap">{c.phone}</td>
                  <td>
                    <span className="customers-purchases">{c.purchases}</span>
                  </td>
                  <td className="admin-nowrap">{formatDate(c.created_at)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(c);
                      }}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <CustomerDetailModal
          key={selected.id}
          customer={selected}
          tiers={tiers}
          onClose={() => setSelected(null)}
          onChanged={load}
        />
      )}

      <div className="customers-tiers">
        <LoyaltyTiersEditor tiers={tiers} onChanged={load} />
      </div>
    </div>
  );
}

function CustomerDetailModal({
  customer,
  tiers,
  onClose,
  onChanged,
}: {
  customer: Customer;
  tiers: LoyaltyTier[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const { settings } = useSiteSettings();
  const toast = useToast();
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [notes, setNotes] = useState(customer.notes ?? "");
  const [purchases, setPurchases] = useState(customer.purchases);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [busyClaim, setBusyClaim] = useState<string | null>(null);

  const loadClaims = async () => {
    const { data } = await supabase.from("loyalty_claims").select("*").eq("customer_id", customer.id);
    setClaims((data as ClaimRow[] | null) ?? []);
  };

  useEffect(() => {
    loadClaims();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.id]);

  const cardUrl = `${window.location.origin}/fidelidad/${customer.token}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=6&data=${encodeURIComponent(cardUrl)}`;
  const shareUrl = buildWhatsAppUrl(
    customer.phone,
    `¡Hola${customer.name ? `, ${customer.name.split(" ")[0]}` : ""}! Esta es tu tarjeta de recompensas de ${settings?.business_name ?? "la tienda"}: ${cardUrl} — Tu código de acceso es ${customer.access_code}.`,
  );

  const dirty =
    name !== customer.name || phone !== customer.phone || notes !== (customer.notes ?? "") || purchases !== customer.purchases;

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("customers")
      .update({ name: name.trim(), phone: phone.replace(/\D/g, ""), notes, purchases })
      .eq("id", customer.id);
    setSaving(false);
    if (error) {
      toast("No se pudieron guardar los cambios", "error");
      return;
    }
    toast("Cliente actualizado", "success");
    onChanged();
    onClose();
  };

  const runClaim = async (claimId: string, action: "confirm" | "revert") => {
    setBusyClaim(claimId);
    const { error } = await supabase.rpc(action === "confirm" ? "confirm_loyalty_claim" : "revert_loyalty_claim", {
      p_claim_id: claimId,
    });
    await loadClaims();
    setBusyClaim(null);
    if (error) {
      toast("No se pudo actualizar la recompensa", "error");
      return;
    }
    toast(action === "confirm" ? "Recompensa confirmada" : "Recompensa revertida", action === "confirm" ? "success" : "info");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl);
      toast("Enlace de la tarjeta copiado", "info");
    } catch {
      toast("No se pudo copiar el enlace", "error");
    }
  };

  const nextTier = tiers.find((t) => purchases < t.required_purchases);

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="admin-modal-head">
          <h2>{customer.name || "Cliente"}</h2>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Cerrar">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="customer-card">
          <img src={qrSrc} alt="Código QR de la tarjeta" className="customer-card-qr" />
          <div className="customer-card-info">
            <span className="customer-card-label">Código de acceso</span>
            <span className="customer-card-code">{customer.access_code}</span>
            <div className="customer-card-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={copyLink}>
                Copiar enlace
              </button>
              <a href={shareUrl} target="_blank" rel="noreferrer" className="btn btn-whatsapp btn-sm">
                <WhatsAppIcon size={15} />
                Enviar tarjeta
              </a>
            </div>
          </div>
        </div>

        <div className="admin-form-grid">
          <div className="field">
            <label>Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Teléfono</label>
            <input inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="field field-full">
            <label>Compras acumuladas</label>
            <div className="customer-purchases">
              <button
                type="button"
                className="customer-purchases-btn"
                onClick={() => setPurchases((p) => Math.max(0, p - 1))}
                disabled={purchases === 0}
                aria-label="Quitar una compra"
              >
                −
              </button>
              <span className="customer-purchases-value" key={purchases}>
                {purchases}
              </span>
              <button
                type="button"
                className="customer-purchases-btn"
                onClick={() => setPurchases((p) => p + 1)}
                aria-label="Sumar una compra"
              >
                <PlusIcon size={16} />
              </button>
              <span className="customer-purchases-next">
                {nextTier
                  ? `Faltan ${nextTier.required_purchases - purchases} para: ${nextTier.reward_description}`
                  : tiers.length > 0
                    ? "Alcanzó el nivel máximo"
                    : ""}
              </span>
            </div>
          </div>
          <div className="field field-full">
            <label>Notas internas</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferencias, fechas especiales, detalles de entrega…"
            />
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className={`btn btn-primary ${saving ? "btn-loading" : ""}`} onClick={handleSave} disabled={saving || !dirty}>
            {saving ? "Guardando" : "Guardar cambios"}
          </button>
        </div>

        <h3 className="customer-claims-title">Recompensas solicitadas</h3>
        {claims.length === 0 ? (
          <p className="customer-claims-empty">Este cliente aún no ha reclamado recompensas.</p>
        ) : (
          <ul className="customer-claims">
            {claims.map((claim) => {
              const tier = tiers.find((t) => t.id === claim.tier_id);
              return (
                <li key={claim.id} className={claim.claimed ? "is-claimed" : ""}>
                  <span className="customer-claim-icon">{claim.claimed ? <CheckIcon size={16} strokeWidth={3} /> : <GiftIcon size={16} />}</span>
                  <span className="customer-claim-info">
                    <strong>{tier?.reward_description ?? "Recompensa"}</strong>
                    <small>
                      {claim.claimed ? `Entregada${claim.claimed_at ? ` · ${formatDate(claim.claimed_at)}` : ""}` : "Esperando confirmación"}
                      {claim.coupon_code ? ` · Cupón ${claim.coupon_code}` : ""}
                    </small>
                  </span>
                  {claim.claimed ? (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      disabled={busyClaim === claim.id}
                      onClick={() => runClaim(claim.id, "revert")}
                    >
                      Revertir
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`btn btn-primary btn-sm ${busyClaim === claim.id ? "btn-loading" : ""}`}
                      disabled={busyClaim === claim.id}
                      onClick={() => runClaim(claim.id, "confirm")}
                    >
                      Confirmar
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function LoyaltyTiersEditor({ tiers, onChanged }: { tiers: LoyaltyTier[]; onChanged: () => void }) {
  const toast = useToast();
  const [editing, setEditing] = useState<LoyaltyTier | "new" | null>(null);

  const remove = async (tier: LoyaltyTier) => {
    if (!window.confirm(`¿Eliminar la recompensa «${tier.reward_description}»?`)) return;
    const { error } = await supabase.from("loyalty_tiers").delete().eq("id", tier.id);
    if (error) {
      toast("No se pudo eliminar el nivel", "error");
      return;
    }
    toast("Nivel de recompensas eliminado", "info");
    onChanged();
  };

  return (
    <div>
      <div className="admin-page-head">
        <h2 className="admin-page-title customers-tiers-title">Programa de recompensas</h2>
        <button type="button" className="btn btn-primary btn-sm products-new-btn" onClick={() => setEditing("new")}>
          <PlusIcon size={16} />
          Nuevo nivel
        </button>
      </div>
      <p className="admin-page-hint">
        Define cuántas compras necesita un cliente para desbloquear cada recompensa. Si agregas un porcentaje, se genera
        un cupón automático al confirmarla.
      </p>

      {tiers.length === 0 ? (
        <p className="admin-empty">Aún no hay niveles. Crea el primero para activar el programa.</p>
      ) : (
        <div className="customers-tier-grid">
          {tiers.map((tier, i) => (
            <div key={tier.id} className="card customers-tier-card" style={{ animationDelay: `${i * 70}ms` }}>
              <span className="customers-tier-step">Nivel {i + 1}</span>
              <span className="customers-tier-required">
                {tier.required_purchases}
                <small>compra{tier.required_purchases === 1 ? "" : "s"}</small>
              </span>
              <p className="customers-tier-reward">{tier.reward_description}</p>
              <div className="customers-tier-meta">
                {tier.discount_percent != null && <span>{Number(tier.discount_percent)}% de descuento</span>}
                <span>{tier.coupon_scope === "cart" ? "Toda la compra" : "Compra de un producto"}</span>
              </div>
              <div className="customers-tier-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(tier)}>
                  Editar
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(tier)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TierFormModal
          tier={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function TierFormModal({
  tier,
  onClose,
  onSaved,
}: {
  tier: LoyaltyTier | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [required, setRequired] = useState(String(tier?.required_purchases ?? 2));
  const [description, setDescription] = useState(tier?.reward_description ?? "");
  const [discountPercent, setDiscountPercent] = useState(
    tier?.discount_percent != null ? String(tier.discount_percent) : "",
  );
  const [scope, setScope] = useState<CouponScope>(tier?.coupon_scope ?? "cart");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      required_purchases: Number(required) || 0,
      reward_description: description.trim(),
      discount_percent: discountPercent ? Number(discountPercent) : null,
      coupon_scope: scope,
      display_order: tier?.display_order ?? (Number(required) || 0),
    };
    const { error } = tier
      ? await supabase.from("loyalty_tiers").update(payload).eq("id", tier.id)
      : await supabase.from("loyalty_tiers").insert(payload);
    setSaving(false);
    if (error) {
      toast("No se pudo guardar el nivel", "error");
      return;
    }
    toast(tier ? "Nivel actualizado" : "Nivel creado", "success");
    onSaved();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="admin-modal-head">
          <h2>{tier ? "Editar nivel" : "Nuevo nivel"}</h2>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Cerrar">
            <CloseIcon size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="field">
              <label>Compras requeridas</label>
              <input required type="number" min="1" step="1" value={required} onChange={(e) => setRequired(e.target.value)} />
            </div>
            <div className="field">
              <label>% de descuento</label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Opcional"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
              />
            </div>
            <div className="field field-full">
              <label>Descripción de la recompensa</label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="10% de descuento en tu próxima compra"
              />
            </div>
            <div className="field field-full">
              <label>El cupón generado aplica a</label>
              <select value={scope} onChange={(e) => setScope(e.target.value as CouponScope)}>
                <option value="cart">Toda la compra</option>
                <option value="single_product">Compras de un solo producto</option>
              </select>
            </div>
          </div>
          <div className="admin-form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={`btn btn-primary ${saving ? "btn-loading" : ""}`} disabled={saving}>
              {saving ? "Guardando" : "Guardar nivel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
