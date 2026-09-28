import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { Coupon, DiscountType } from "../types";

interface CouponRow {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  usage_limit: number;
  times_used: number;
  active: boolean;
  created_at: string;
}

function rowToCoupon(row: CouponRow): Coupon {
  return {
    code: row.code,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    usageLimit: row.usage_limit,
    timesUsed: row.times_used,
    active: row.active,
    createdAt: row.created_at,
  };
}

export interface NewCouponInput {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  usageLimit: number;
}

export interface RedeemedDiscount {
  discountType: DiscountType;
  discountValue: number;
}

interface CouponsContextValue {
  coupons: Coupon[];
  loading: boolean;
  refresh: () => Promise<void>;
  createCoupon: (input: NewCouponInput) => Promise<void>;
  toggleActive: (code: string, active: boolean) => Promise<void>;
  deleteCoupon: (code: string) => Promise<void>;
  redeemCoupon: (code: string) => Promise<RedeemedDiscount>;
}

const CouponsContext = createContext<CouponsContextValue | null>(null);

export function CouponsProvider({ children }: { children: ReactNode }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    setCoupons((data as CouponRow[]).map(rowToCoupon));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createCoupon = async (input: NewCouponInput) => {
    const { error } = await supabase.from("coupons").insert({
      code: input.code.toUpperCase(),
      discount_type: input.discountType,
      discount_value: input.discountValue,
      usage_limit: input.usageLimit,
      active: true,
    });
    if (error) throw error;
    await refresh();
  };

  const toggleActive = async (code: string, active: boolean) => {
    const { error } = await supabase.from("coupons").update({ active }).eq("code", code);
    if (error) throw error;
    await refresh();
  };

  const deleteCoupon = async (code: string) => {
    const { error, count } = await supabase.from("coupons").delete({ count: "exact" }).eq("code", code);
    if (error) throw error;
    if (!count) throw new Error("No se pudo eliminar el cupón (bloqueado por permisos)");
    await refresh();
  };

  const redeemCoupon = async (code: string): Promise<RedeemedDiscount> => {
    const { data, error } = await supabase.rpc("redeem_coupon", { p_code: code }).single();
    if (error) {
      if (error.message.includes("CUPON_AGOTADO")) throw new Error("Este cupón ya alcanzó su límite de usos.");
      throw new Error("Cupón inválido o inactivo.");
    }
    const row = data as { discount_type: DiscountType; discount_value: number };
    return { discountType: row.discount_type, discountValue: Number(row.discount_value) };
  };

  return (
    <CouponsContext.Provider
      value={{ coupons, loading, refresh, createCoupon, toggleActive, deleteCoupon, redeemCoupon }}
    >
      {children}
    </CouponsContext.Provider>
  );
}

export function useCoupons() {
  const ctx = useContext(CouponsContext);
  if (!ctx) throw new Error("useCoupons debe usarse dentro de <CouponsProvider>");
  return ctx;
}
