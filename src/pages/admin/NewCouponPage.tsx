import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCoupons } from "../../context/CouponsContext";
import type { DiscountType } from "../../types";
import "./adminShared.css";

export default function NewCouponPage() {
  const { createCoupon } = useCoupons();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState(10);
  const [usageLimit, setUsageLimit] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError("El código es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      await createCoupon({ code: code.trim(), discountType, discountValue, usageLimit });
      navigate("/admin/cupones");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el cupón.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <div className="admin-page-header">
        <h1>Nuevo cupón</h1>
      </div>

      <div className="admin-form-field">
        <label>Código</label>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="VERANO10" />
      </div>

      <div className="admin-form-row">
        <div className="admin-form-field">
          <label>Tipo de descuento</label>
          <select value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)}>
            <option value="percentage">Porcentaje</option>
            <option value="fixed">Monto fijo</option>
          </select>
        </div>
        <div className="admin-form-field">
          <label>Valor</label>
          <input type="number" min={0} value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} />
        </div>
      </div>

      <div className="admin-form-field">
        <label>Límite de usos</label>
        <input type="number" min={1} value={usageLimit} onChange={(e) => setUsageLimit(Number(e.target.value))} />
      </div>

      {error && <p className="checkout-coupon-error">{error}</p>}

      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? "Guardando…" : "Crear cupón"}
      </button>
    </form>
  );
}
