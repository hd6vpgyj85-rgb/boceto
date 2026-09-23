import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Coupon, CouponScope, DiscountType } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState("10");
  const [scope, setScope] = useState<CouponScope>("cart");
  const [usageLimit, setUsageLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons((data as Coupon[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (coupon: Coupon) => {
    await supabase.from("coupons").update({ active: !coupon.active }).eq("code", coupon.code);
    load();
  };

  const remove = async (coupon: Coupon) => {
    if (!window.confirm(`¿Eliminar el cupón ${coupon.code}?`)) return;
    await supabase.from("coupons").delete().eq("code", coupon.code);
    load();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error: insertError } = await supabase.from("coupons").insert({
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue) || 0,
      scope,
      usage_limit: usageLimit ? Number(usageLimit) : null,
      active: true,
    });
    setSaving(false);
    if (insertError) {
      setError("No se pudo crear el cupón. ¿Ya existe ese código?");
      return;
    }
    setCode("");
    setDiscountValue("10");
    setUsageLimit("");
    setShowForm(false);
    load();
  };

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Cupones</h1>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancelar" : "+ Nuevo cupón"}
        </button>
      </div>

      {showForm && (
        <form className="card" style={{ padding: 20, marginBottom: 24 }} onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="field">
              <label>Código</label>
              <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="VERANO20" />
            </div>
            <div className="field">
              <label>Tipo de descuento</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)}>
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo</option>
              </select>
            </div>
            <div className="field">
              <label>Valor</label>
              <input required type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
            </div>
            <div className="field">
              <label>Alcance</label>
              <select value={scope} onChange={(e) => setScope(e.target.value as CouponScope)}>
                <option value="cart">Carrito completo</option>
                <option value="single_product">Solo un único producto</option>
              </select>
            </div>
            <div className="field">
              <label>Límite de usos (opcional)</label>
              <input type="number" min="0" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
            </div>
          </div>
          {error && <p className="checkout-coupon-error">{error}</p>}
          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Creando…" : "Crear cupón"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : coupons.length === 0 ? (
        <p className="admin-empty">Aún no has creado cupones.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descuento</th>
                <th>Alcance</th>
                <th>Usos</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.code}>
                  <td>{coupon.code}</td>
                  <td>{coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : coupon.discount_value}</td>
                  <td>{coupon.scope === "cart" ? "Carrito" : "1 producto"}</td>
                  <td>{coupon.used_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}</td>
                  <td>
                    <span className={coupon.active ? "admin-badge admin-badge-completed" : "admin-badge admin-badge-cancelled"}>
                      {coupon.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="admin-actions-cell">
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => toggleActive(coupon)}>
                      {coupon.active ? "Desactivar" : "Activar"}
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(coupon)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
