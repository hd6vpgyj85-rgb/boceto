import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { Customer } from "../types";

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  token: string;
  purchases_count: number;
  notes: string | null;
  created_at: string;
}

function rowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    token: row.token,
    purchasesCount: row.purchases_count,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export interface NewCustomerInput {
  name: string;
  phone: string;
  notes?: string;
}

interface CustomersContextValue {
  customers: Customer[];
  loading: boolean;
  refresh: () => Promise<void>;
  createCustomer: (input: NewCustomerInput) => Promise<Customer>;
  updateCustomer: (id: string, input: NewCustomerInput) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  adjustPurchases: (id: string, delta: number) => Promise<void>;
}

const CustomersContext = createContext<CustomersContextValue | null>(null);

export function CustomersProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    setCustomers((data as CustomerRow[]).map(rowToCustomer));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createCustomer = async (input: NewCustomerInput) => {
    const { data, error } = await supabase
      .from("customers")
      .insert({ name: input.name, phone: input.phone, notes: input.notes ?? null, purchases_count: 0 })
      .select("*")
      .single();
    if (error) throw error;
    await refresh();
    return rowToCustomer(data as CustomerRow);
  };

  const updateCustomer = async (id: string, input: NewCustomerInput) => {
    const { error } = await supabase
      .from("customers")
      .update({ name: input.name, phone: input.phone, notes: input.notes ?? null })
      .eq("id", id);
    if (error) throw error;
    await refresh();
  };

  const deleteCustomer = async (id: string) => {
    const { error, count } = await supabase.from("customers").delete({ count: "exact" }).eq("id", id);
    if (error) throw error;
    if (!count) throw new Error("No se pudo eliminar el cliente (bloqueado por permisos)");
    await refresh();
  };

  const adjustPurchases = async (id: string, delta: number) => {
    const current = customers.find((c) => c.id === id);
    if (!current) return;
    const next = Math.max(0, current.purchasesCount + delta);
    const { error } = await supabase.from("customers").update({ purchases_count: next }).eq("id", id);
    if (error) throw error;
    await refresh();
  };

  return (
    <CustomersContext.Provider
      value={{ customers, loading, refresh, createCustomer, updateCustomer, deleteCustomer, adjustPurchases }}
    >
      {children}
    </CustomersContext.Provider>
  );
}

export function useCustomers() {
  const ctx = useContext(CustomersContext);
  if (!ctx) throw new Error("useCustomers debe usarse dentro de <CustomersProvider>");
  return ctx;
}
