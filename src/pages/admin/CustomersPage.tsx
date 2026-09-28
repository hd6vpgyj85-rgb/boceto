import { useEffect, useMemo, useState } from "react";
import { useCustomers, type NewCustomerInput } from "../../context/CustomersContext";
import { useLoyalty } from "../../context/LoyaltyContext";
import { normalizeSearch } from "../../lib/slug";
import { generateLoyaltyQrDataUrl, getLoyaltyCardUrl } from "../../lib/loyaltyQr";
import { formatDate } from "../../lib/format";
import type { Customer, LoyaltyClaimAdmin, LoyaltyTier } from "../../types";
import Modal from "../../components/Modal";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./Customers.css";

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export default function CustomersPage() {
  const { customers, loading, createCustomer, updateCustomer, deleteCustomer, adjustPurchases } = useCustomers();
  const { pendingClaimCustomerIds } = useLoyalty();

  const [query, setQuery] = useState("");
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [qrCustomer, setQrCustomer] = useState<Customer | null>(null);
  const [rewardsCustomer, setRewardsCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [tiersOpen, setTiersOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return customers;
    const normalizedName = normalizeSearch(query);
    const normalizedPhone = normalizePhone(query);
    return customers.filter(
      (c) =>
        normalizeSearch(c.name).includes(normalizedName) ||
        (normalizedPhone && normalizePhone(c.phone).includes(normalizedPhone))
    );
  }, [customers, query]);

  const handleCreate = async (input: NewCustomerInput) => {
    const customer = await createCustomer(input);
    setNewCustomerOpen(false);
    setQrCustomer(customer);
  };

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`¿Eliminar a ${customer.name}?`)) return;
    await deleteCustomer(customer.id);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Clientes ({customers.length})</h1>
        <button className="admin-btn-sm primary" onClick={() => setNewCustomerOpen(true)}>
          + Nuevo
        </button>
      </div>

      <input
        className="admin-search"
        placeholder="Buscar por nombre o WhatsApp…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length === 0 ? (
        <p className="admin-empty">No hay clientes que coincidan.</p>
      ) : (
        <div className="admin-list">
          {filtered.map((customer) => {
            const hasPending = pendingClaimCustomerIds.has(customer.id);
            return (
              <div className={`customer-card ${hasPending ? "has-pending" : ""}`} key={customer.id}>
                {hasPending && <span className="customer-pending-badge">Reclamo pendiente</span>}
                <div className="customer-card-header">
                  <strong>{customer.name}</strong>
                  <span>{customer.phone}</span>
                </div>
                {customer.notes && <p className="customer-notes">{customer.notes}</p>}

                <div className="customer-purchases">
                  <span>Compras</span>
                  <div className="customer-purchases-stepper">
                    <button onClick={() => adjustPurchases(customer.id, -1)} disabled={customer.purchasesCount <= 0}>
                      −
                    </button>
                    <strong>{customer.purchasesCount}</strong>
                    <button onClick={() => adjustPurchases(customer.id, 1)}>+</button>
                  </div>
                </div>

                <div className="customer-actions">
                  <button className="admin-btn-sm" onClick={() => setQrCustomer(customer)}>
                    Ver QR
                  </button>
                  <button className="admin-btn-sm" onClick={() => setRewardsCustomer(customer)}>
                    Recompensas
                  </button>
                  <button className="admin-btn-sm" onClick={() => setEditCustomer(customer)}>
                    Editar
                  </button>
                  <button className="admin-btn-sm danger" onClick={() => handleDelete(customer)}>
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TiersManager open={tiersOpen} onToggle={() => setTiersOpen((v) => !v)} />

      {newCustomerOpen && (
        <CustomerFormModal title="Nuevo cliente" onClose={() => setNewCustomerOpen(false)} onSubmit={handleCreate} />
      )}

      {editCustomer && (
        <CustomerFormModal
          title="Editar cliente"
          initial={editCustomer}
          onClose={() => setEditCustomer(null)}
          onSubmit={async (input) => {
            await updateCustomer(editCustomer.id, input);
            setEditCustomer(null);
          }}
        />
      )}

      {qrCustomer && <QrModal customer={qrCustomer} onClose={() => setQrCustomer(null)} />}
      {rewardsCustomer && <RewardsModal customer={rewardsCustomer} onClose={() => setRewardsCustomer(null)} />}
    </div>
  );
}

function CustomerFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial?: Customer;
  onClose: () => void;
  onSubmit: (input: NewCustomerInput) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), phone: phone.trim(), notes: notes.trim() || undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="admin-form-field">
          <label>Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="admin-form-field">
          <label>WhatsApp</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div className="admin-form-field">
          <label>Notas</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </Modal>
  );
}

function QrModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const cardUrl = getLoyaltyCardUrl(customer.token);

  useEffect(() => {
    generateLoyaltyQrDataUrl(customer.token).then(setQrDataUrl);
  }, [customer.token]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-${customer.name.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  };

  return (
    <Modal title={`QR de ${customer.name}`} onClose={onClose}>
      <div className="qr-modal">
        {qrDataUrl ? <img src={qrDataUrl} alt="Código QR" /> : <LoadingSpinner />}
        <p className="qr-modal-url">{cardUrl}</p>
        <div className="product-form-actions">
          <button className="admin-btn-sm" onClick={() => navigator.clipboard.writeText(cardUrl)}>
            Copiar link
          </button>
          <button className="admin-btn-sm primary" onClick={handleDownload}>
            Descargar PNG
          </button>
        </div>
      </div>
    </Modal>
  );
}

function RewardsModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { tiers, getClaimsByCustomerId, confirmClaim, revertClaim } = useLoyalty();
  const [claims, setClaims] = useState<LoyaltyClaimAdmin[] | null>(null);
  const [busyTierId, setBusyTierId] = useState<string | null>(null);

  const load = async () => setClaims(await getClaimsByCustomerId(customer.id));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.id]);

  const sortedTiers = [...tiers].sort((a, b) => a.purchasesRequired - b.purchasesRequired);

  const handleConfirm = async (claimId: string) => {
    setBusyTierId(claimId);
    try {
      await confirmClaim(claimId);
      await load();
    } finally {
      setBusyTierId(null);
    }
  };

  const handleRevert = async (claimId: string) => {
    setBusyTierId(claimId);
    try {
      await revertClaim(claimId);
      await load();
    } finally {
      setBusyTierId(null);
    }
  };

  return (
    <Modal title={`Recompensas de ${customer.name}`} onClose={onClose}>
      {claims === null ? (
        <LoadingSpinner />
      ) : (
        <div className="admin-list">
          {sortedTiers.map((tier) => {
            const unlocked = customer.purchasesCount >= tier.purchasesRequired;
            const claim = claims.find((c) => c.tierId === tier.id);
            return (
              <div className="admin-card" key={tier.id}>
                <strong>{tier.purchasesRequired} compras</strong>
                <p style={{ color: "var(--color-muted)", marginBottom: 8 }}>{tier.rewardDescription}</p>

                {!unlocked && <span className="admin-status-badge">No desbloqueado</span>}
                {unlocked && !claim && <span className="admin-status-badge">Sin reclamar</span>}
                {unlocked && claim && !claim.claimed && (
                  <div className="product-form-actions">
                    <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
                      Pendiente desde {formatDate(claim.requestedAt)}
                    </span>
                    <button className="admin-btn-sm primary" disabled={busyTierId === claim.id} onClick={() => handleConfirm(claim.id)}>
                      Confirmar
                    </button>
                  </div>
                )}
                {unlocked && claim?.claimed && (
                  <div className="product-form-actions">
                    <span style={{ fontSize: "0.8rem", color: "var(--color-accent-dark)" }}>
                      Reclamado {claim.claimedAt ? `el ${formatDate(claim.claimedAt)}` : ""}{" "}
                      {claim.couponCode ? `· Cupón ${claim.couponCode}` : ""}
                    </span>
                    <button className="admin-btn-sm danger" disabled={busyTierId === claim.id} onClick={() => handleRevert(claim.id)}>
                      Revertir
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

function TiersManager({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { tiers, createTier, updateTier, deleteTier } = useLoyalty();
  const [editing, setEditing] = useState<LoyaltyTier | "new" | null>(null);

  return (
    <div className="admin-card tiers-manager" style={{ marginTop: 32 }}>
      <button className="tiers-manager-toggle" onClick={onToggle}>
        Niveles del programa de fidelidad ({tiers.length}) <span>{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div style={{ marginTop: 16 }}>
          <div className="admin-list">
            {tiers.map((tier) => (
              <div className="admin-list-item" key={tier.id}>
                <div className="admin-list-item-info">
                  <strong>{tier.purchasesRequired} compras</strong>
                  <span>
                    {tier.rewardDescription} {tier.discountPercent ? `(${tier.discountPercent}% cupón)` : ""}
                  </span>
                </div>
                <div className="admin-list-item-actions">
                  <button className="admin-btn-sm" onClick={() => setEditing(tier)}>
                    Editar
                  </button>
                  <button className="admin-btn-sm danger" onClick={() => deleteTier(tier.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="admin-btn-sm primary" style={{ marginTop: 12 }} onClick={() => setEditing("new")}>
            + Nuevo nivel
          </button>
        </div>
      )}

      {editing && (
        <TierFormModal
          initial={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSubmit={async (input) => {
            if (editing === "new") await createTier(input);
            else await updateTier(editing.id, input);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function TierFormModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: LoyaltyTier;
  onClose: () => void;
  onSubmit: (input: { purchasesRequired: number; rewardDescription: string; discountPercent?: number | null }) => Promise<void>;
}) {
  const [purchasesRequired, setPurchasesRequired] = useState(initial?.purchasesRequired ?? 3);
  const [rewardDescription, setRewardDescription] = useState(initial?.rewardDescription ?? "");
  const [discountPercent, setDiscountPercent] = useState(initial?.discountPercent ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({ purchasesRequired, rewardDescription, discountPercent: discountPercent || null });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={initial ? "Editar nivel" : "Nuevo nivel"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="admin-form-field">
          <label>Compras requeridas</label>
          <input
            type="number"
            min={1}
            value={purchasesRequired}
            onChange={(e) => setPurchasesRequired(Number(e.target.value))}
          />
        </div>
        <div className="admin-form-field">
          <label>Descripción de la recompensa</label>
          <textarea rows={2} value={rewardDescription} onChange={(e) => setRewardDescription(e.target.value)} required />
        </div>
        <div className="admin-form-field">
          <label>% de descuento (opcional, genera cupón al confirmar)</label>
          <input type="number" min={0} max={100} value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </Modal>
  );
}
