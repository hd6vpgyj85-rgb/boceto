import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { LoyaltyClaim, LoyaltyClaimAdmin, LoyaltyTier } from "../types";

interface TierRow {
  id: string;
  purchases_required: number;
  reward_description: string;
  discount_percent: number | null;
  created_at: string;
}

function rowToTier(row: TierRow): LoyaltyTier {
  return {
    id: row.id,
    purchasesRequired: row.purchases_required,
    rewardDescription: row.reward_description,
    discountPercent: row.discount_percent,
    createdAt: row.created_at,
  };
}

export interface NewTierInput {
  purchasesRequired: number;
  rewardDescription: string;
  discountPercent?: number | null;
}

export interface PublicCustomer {
  id: string;
  name: string;
  purchasesCount: number;
}

interface ClaimRow {
  tier_id: string;
  requested_at: string;
  claimed: boolean;
  claimed_at: string | null;
  coupon_code: string | null;
}

interface AdminClaimRow {
  id: string;
  customer_id: string;
  tier_id: string;
  requested_at: string;
  claimed: boolean;
  claimed_at: string | null;
  coupon_id: string | null;
}

interface LoyaltyContextValue {
  tiers: LoyaltyTier[];
  loading: boolean;
  refreshTiers: () => Promise<void>;
  createTier: (input: NewTierInput) => Promise<void>;
  updateTier: (id: string, input: NewTierInput) => Promise<void>;
  deleteTier: (id: string) => Promise<void>;
  getCustomerByToken: (token: string) => Promise<PublicCustomer | null>;
  getOrCreateCustomerForCheckout: (name: string, phone: string) => Promise<{ id: string; token: string }>;
  requestClaim: (token: string, tierId: string) => Promise<void>;
  getClaimsByToken: (token: string) => Promise<LoyaltyClaim[]>;
  getClaimsByCustomerId: (customerId: string) => Promise<LoyaltyClaimAdmin[]>;
  confirmClaim: (claimId: string) => Promise<void>;
  revertClaim: (claimId: string) => Promise<void>;
  pendingClaimCustomerIds: Set<string>;
  refreshPendingClaims: () => Promise<void>;
}

const LoyaltyContext = createContext<LoyaltyContextValue | null>(null);

export function LoyaltyProvider({ children }: { children: ReactNode }) {
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingClaimCustomerIds, setPendingClaimCustomerIds] = useState<Set<string>>(new Set());

  const refreshPendingClaims = useCallback(async () => {
    const { data, error } = await supabase.from("loyalty_claims").select("customer_id").eq("claimed", false);
    if (error) {
      console.error(error);
      return;
    }
    setPendingClaimCustomerIds(new Set((data as { customer_id: string }[]).map((row) => row.customer_id)));
  }, []);

  useEffect(() => {
    refreshPendingClaims();
  }, [refreshPendingClaims]);

  const refreshTiers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("loyalty_tiers")
      .select("*")
      .order("purchases_required", { ascending: true });
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    setTiers((data as TierRow[]).map(rowToTier));
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshTiers();
  }, [refreshTiers]);

  const createTier = async (input: NewTierInput) => {
    const { error } = await supabase.from("loyalty_tiers").insert({
      purchases_required: input.purchasesRequired,
      reward_description: input.rewardDescription,
      discount_percent: input.discountPercent ?? null,
    });
    if (error) throw error;
    await refreshTiers();
  };

  const updateTier = async (id: string, input: NewTierInput) => {
    const { error } = await supabase
      .from("loyalty_tiers")
      .update({
        purchases_required: input.purchasesRequired,
        reward_description: input.rewardDescription,
        discount_percent: input.discountPercent ?? null,
      })
      .eq("id", id);
    if (error) throw error;
    await refreshTiers();
  };

  const deleteTier = async (id: string) => {
    const { error, count } = await supabase.from("loyalty_tiers").delete({ count: "exact" }).eq("id", id);
    if (error) throw error;
    if (!count) throw new Error("No se pudo eliminar el nivel (bloqueado por permisos)");
    await refreshTiers();
  };

  const getCustomerByToken = async (token: string): Promise<PublicCustomer | null> => {
    const { data, error } = await supabase.rpc("get_customer_by_token", { p_token: token }).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as { id: string; name: string; purchases_count: number };
    return { id: row.id, name: row.name, purchasesCount: row.purchases_count };
  };

  const getOrCreateCustomerForCheckout = async (name: string, phone: string) => {
    const { data, error } = await supabase
      .rpc("get_or_create_customer_for_checkout", { p_name: name, p_phone: phone })
      .single();
    if (error) throw error;
    const row = data as { id: string; token: string };
    return { id: row.id, token: row.token };
  };

  const requestClaim = async (token: string, tierId: string) => {
    const { error } = await supabase.rpc("request_loyalty_claim", { p_token: token, p_tier_id: tierId });
    if (error) throw error;
    await refreshPendingClaims();
  };

  const getClaimsByToken = async (token: string): Promise<LoyaltyClaim[]> => {
    const { data, error } = await supabase.rpc("get_loyalty_claims_by_token", { p_token: token });
    if (error) throw error;
    return (data as ClaimRow[]).map((row) => ({
      tierId: row.tier_id,
      requestedAt: row.requested_at,
      claimed: row.claimed,
      claimedAt: row.claimed_at,
      couponCode: row.coupon_code,
    }));
  };

  const getClaimsByCustomerId = async (customerId: string): Promise<LoyaltyClaimAdmin[]> => {
    const { data, error } = await supabase.from("loyalty_claims").select("*").eq("customer_id", customerId);
    if (error) throw error;
    return (data as AdminClaimRow[]).map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      tierId: row.tier_id,
      requestedAt: row.requested_at,
      claimed: row.claimed,
      claimedAt: row.claimed_at,
      couponCode: row.coupon_id,
    }));
  };

  const confirmClaim = async (claimId: string) => {
    const { error } = await supabase.rpc("confirm_loyalty_claim", { p_claim_id: claimId });
    if (error) throw error;
    await refreshPendingClaims();
  };

  const revertClaim = async (claimId: string) => {
    const { error } = await supabase.rpc("revert_loyalty_claim", { p_claim_id: claimId });
    if (error) throw error;
    await refreshPendingClaims();
  };

  return (
    <LoyaltyContext.Provider
      value={{
        tiers,
        loading,
        refreshTiers,
        createTier,
        updateTier,
        deleteTier,
        getCustomerByToken,
        getOrCreateCustomerForCheckout,
        requestClaim,
        getClaimsByToken,
        getClaimsByCustomerId,
        confirmClaim,
        revertClaim,
        pendingClaimCustomerIds,
        refreshPendingClaims,
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
}

export function useLoyalty() {
  const ctx = useContext(LoyaltyContext);
  if (!ctx) throw new Error("useLoyalty debe usarse dentro de <LoyaltyProvider>");
  return ctx;
}
