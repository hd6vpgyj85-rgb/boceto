import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatCurrency } from "../../lib/format";
import { useToast } from "../../context/ToastContext";
import type { Coupon, CouponScope, DiscountType } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import { PlusIcon, SparkIcon } from "../../components/Icons";
import "./adminShared.css";

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export default function Coupons() {
  const toast = useToast();
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
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons((data as Coupon[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (coupon: Coupon) => {
    const { error: updateError } = await supabase.from("coupons").update({ active: !coupon.active }).eq("code", coupon.code);
    if (updateError) {
      toast("No se pudo actualizar el cupón", "error");
      return;
    }
    setCoupons((prev) => prev.map((c) => (c.code === coupon.code ? { ...c, active: !coupon.active } : c)));
    toast(coupon.active ? `${coupon.code} desactivado` : `${coupon.code} activado`, "info");
  };

  const remove = async (coupon: Coupon) => {
    if (!window.confirm(`¿Eliminar el cupón ${coupon.code}?`)) return;
    const { error: deleteError } = await supabase.from("coupons").delete().eq("code", coupon.code);
    if (deleteError) {
      toast("No se pudo eliminar el cupón", "error");
      return;
    }
    setCoupons((prev) => prev.filter((c) => c.code !== coupon.code));
    toast(`Cupón ${coupon.code} eliminado`, "info");
  };

  const copyCode = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast(`${value} copiado`, "info");
    } catch {
      toast("No se pudo copiar el código", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = Number(discountValue) || 0;
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "");
    if (!cleanCode) {
      setError("Escribe un código para el cupón.");
      return;
    }
    if (value <= 0 || (discountType === "percentage" && value > 100)) {
      setError(discountType === "percentage" ? "El porcentaje debe estar entre 1 y 100." : "El monto debe ser mayor a 0.");
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase.from("coupons").insert({
      code: cleanCode,
      discount_type: discountType,
      discount_value: value,
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
    toast(`Cupón ${cleanCode} creado`, "success");
    load();
  };

  const describe = (c: Coupon) =>
    c.discount_type === "percentage" ? `${c.discount_value}%` : formatCurrency(Number(c.discount_value));

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Cupones</h1>
        <button
          type="button"
          className={`btn btn-sm ${showForm ? "btn-ghost" : "btn-primary products-new-btn"}`}
          onClick={() => {
            setShowForm((v) => !v);
            setError(null);
          }}
        >
          {showForm ? (
            "Cancelar"
          ) : (
            <>
              <PlusIcon size={16} />
              Nuevo cupón
            </>
          )}
        </button>
      </div>
      <p className="admin-page-hint">
        Crea códigos de descuento para campañas, clientes frecuentes o redes sociales. Tus clientes los escriben en el
        checkout.
      </p>

      {showForm && (
        <form className="card admin-inline-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="field">
              <label>Código</label>
              <div className="admin-input-with-action">
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="BIENVENIDA10"
                  autoFocus
                />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setCode(randomCode())} title="Generar código">
                  <SparkIcon size={16} />
                </button>
              </div>
            </div>
            <div className="field">
              <label>Tipo de descuento</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)}>
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo</option>
              </select>
            </div>
            <div className="field">
              <label>{discountType === "percentage" ? "Porcentaje" : "Monto"}</label>
              <input
                required
                type="number"
                min="1"
                max={discountType === "percentage" ? 100 : undefined}
                step="any"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Aplica a</label>
              <select value={scope} onChange={(e) => setScope(e.target.value as CouponScope)}>
                <option value="cart">Carrito completo</option>
                <option value="single_product">Compras de un solo producto</option>
              </select>
            </div>
            <div className="field">
              <label>Límite de usos</label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Sin límite"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
              />
            </div>
          </div>
          {error && (
            <p className="admin-form-error" key={error}>
              {error}
            </p>
          )}
          <div className="admin-form-actions">
            <button type="submit" className={`btn btn-primary ${saving ? "btn-loading" : ""}`} disabled={saving}>
              {saving ? "Creando" : "Crear cupón"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : coupons.length === 0 ? (
        <p className="admin-empty">Aún no has creado cupones. Un buen primer cupón: 10% en la primera compra.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descuento</th>
                <th>Aplica a</th>
                <th>Usos</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const exhausted = coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit;
                return (
                  <tr key={coupon.code} className={coupon.active ? "" : "admin-row-muted"}>
                    <td>
                      <button type="button" className="admin-coupon-code" onClick={() => copyCode(coupon.code)} title="Copiar código">
                        {coupon.code}
                      </button>
                    </td>
                    <td>{describe(coupon)}</td>
                    <td>{coupon.scope === "cart" ? "Carrito" : "1 producto"}</td>
                    <td>
                      {coupon.used_count}
                      {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}
                      {coupon.usage_limit ? (
                        <span className="admin-usage-bar">
                          <span style={{ width: `${Math.min(100, (coupon.used_count / coupon.usage_limit) * 100)}%` }} />
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <span
                        className={
                          coupon.active && !exhausted ? "admin-badge admin-badge-completed" : "admin-badge admin-badge-cancelled"
                        }
                      >
                        {exhausted ? "Agotado" : coupon.active ? "Activo" : "Inactivo"}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
