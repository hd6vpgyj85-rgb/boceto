import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatDate } from "../../lib/format";
import type { Customer, LoyaltyTier, CouponScope } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";

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
    setLoading(true);
    const [{ data: customerRows }, { data: tierRows }] = await Promise.all([
      supabase.from("customers").select("*").order("created_at", { ascending: false }),
      supabase.from("loyalty_tiers").select("*").order("display_order", { ascending: true }),
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
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [customers, search]);

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Clientes</h1>
      </div>

      <div className="admin-toolbar">
        <input
          className="admin-search-input"
          placeholder="Buscar por nombre o teléfono…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <p className="admin-empty">No hay clientes registrados todavía.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Compras</th>
                <th>Desde</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setSelected(c)}>
                  <td>{c.name || "—"}</td>
                  <td>{c.phone}</td>
                  <td>{c.purchases}</td>
                  <td>{formatDate(c.created_at)}</td>
                  <td>
                    <button type="button" className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); setSelected(c); }}>
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
          customer={selected}
          tiers={tiers}
          onClose={() => setSelected(null)}
          onChanged={load}
        />
      )}

      <div style={{ marginTop: 48 }}>
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
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [notes, setNotes] = useState(customer.notes ?? "");
  const [purchases, setPurchases] = useState(customer.purchases);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [saving, setSaving] = useState(false);

  const loadClaims = async () => {
    const { data } = await supabase.from("loyalty_claims").select("*").eq("customer_id", customer.id);
    setClaims((data as ClaimRow[] | null) ?? []);
  };

  useEffect(() => {
    loadClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.id]);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    `${window.location.origin}/fidelidad/${customer.token}`,
  )}`;

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("customers").update({ name, phone, notes, purchases }).eq("id", customer.id);
    setSaving(false);
    onChanged();
  };

  const confirmClaim = async (claimId: string) => {
    await supabase.rpc("confirm_loyalty_claim", { p_claim_id: claimId });
    loadClaims();
  };

  const revertClaim = async (claimId: string) => {
    await supabase.rpc("revert_loyalty_claim", { p_claim_id: claimId });
    loadClaims();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-head">
          <h2>Cliente</h2>
          <button type="button" className="admin-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
          <img src={qrSrc} alt="QR" style={{ borderRadius: 8, background: "#fff", padding: 6 }} />
          <div>
            <p><strong>Código de acceso:</strong> {customer.access_code}</p>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-dim)" }}>
              Enlace: /fidelidad/{customer.token}
            </p>
          </div>
        </div>

        <div className="admin-form-grid">
          <div className="field">
            <label>Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Teléfono</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="field">
            <label>Compras acumuladas</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setPurchases((p) => Math.max(0, p - 1))}>
                −
              </button>
              <span>{purchases}</span>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setPurchases((p) => p + 1)}>
                +
              </button>
            </div>
          </div>
          <div className="field field-full">
            <label>Notas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>

        <h3 style={{ marginTop: 24, marginBottom: 10, fontSize: "1rem", textTransform: "uppercase" }}>
          Recompensas
        </h3>
        {claims.length === 0 ? (
          <p style={{ color: "var(--color-text-dim)", fontSize: "0.85rem" }}>Sin reclamos todavía.</p>
        ) : (
          claims.map((claim) => {
            const tier = tiers.find((t) => t.id === claim.tier_id);
            return (
              <div key={claim.id} className="loyalty-reward-row card" style={{ marginBottom: 8 }}>
                <div className="loyalty-reward-info">
                  <span className="loyalty-reward-tier">{tier?.reward_description ?? "Recompensa"}</span>
                  {claim.coupon_code && <span className="loyalty-reward-desc">Cupón: {claim.coupon_code}</span>}
                </div>
                {claim.claimed ? (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => revertClaim(claim.id)}>
                    Revertir
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => confirmClaim(claim.id)}>
                    Confirmar
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function LoyaltyTiersEditor({ tiers, onChanged }: { tiers: LoyaltyTier[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<LoyaltyTier | "new" | null>(null);

  const remove = async (tier: LoyaltyTier) => {
    if (!window.confirm("¿Eliminar este nivel de fidelidad?")) return;
    await supabase.from("loyalty_tiers").delete().eq("id", tier.id);
    onChanged();
  };

  return (
    <div>
      <div className="admin-page-head">
        <h2 className="admin-page-title" style={{ fontSize: "1.3rem" }}>
          Niveles de fidelidad
        </h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing("new")}>
          + Nuevo nivel
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Compras requeridas</th>
              <th>Recompensa</th>
              <th>% Descuento</th>
              <th>Alcance</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => (
              <tr key={tier.id}>
                <td>{tier.required_purchases}</td>
                <td>{tier.reward_description}</td>
                <td>{tier.discount_percent ?? "—"}</td>
                <td>{tier.coupon_scope === "cart" ? "Carrito" : "1 producto"}</td>
                <td className="admin-actions-cell">
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(tier)}>
                    Editar
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(tier)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
  const [required, setRequired] = useState(String(tier?.required_purchases ?? 2));
  const [description, setDescription] = useState(tier?.reward_description ?? "");
  const [discountPercent, setDiscountPercent] = useState(
    tier?.discount_percent != null ? String(tier.discount_percent) : "",
  );
  const [scope, setScope] = useState<CouponScope>(tier?.coupon_scope ?? "cart");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      required_purchases: Number(required) || 0,
      reward_description: description,
      discount_percent: discountPercent ? Number(discountPercent) : null,
      coupon_scope: scope,
      display_order: tier?.display_order ?? (Number(required) || 0),
    };
    const query = tier
      ? supabase.from("loyalty_tiers").update(payload).eq("id", tier.id)
      : supabase.from("loyalty_tiers").insert(payload);
    await query;
    setSaving(false);
    onSaved();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-head">
          <h2>{tier ? "Editar nivel" : "Nuevo nivel"}</h2>
          <button type="button" className="admin-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="field">
              <label>Compras requeridas</label>
              <input required type="number" min="1" value={required} onChange={(e) => setRequired(e.target.value)} />
            </div>
            <div className="field">
              <label>% Descuento (opcional)</label>
              <input type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
            </div>
            <div className="field field-full">
              <label>Descripción de la recompensa</label>
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="field field-full">
              <label>Alcance del cupón generado</label>
              <select value={scope} onChange={(e) => setScope(e.target.value as CouponScope)}>
                <option value="cart">Carrito completo</option>
                <option value="single_product">Solo un único producto</option>
              </select>
            </div>
          </div>
          <div className="admin-form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Guardando…" : "Guardar nivel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
