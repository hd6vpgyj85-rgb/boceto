import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { Order, OrderAddress, OrderCustomer, OrderItem, OrderStatus } from "../types";

interface OrderRow {
  id: string;
  created_at: string;
  status: OrderStatus;
  customer: OrderCustomer;
  address: OrderAddress;
  payment_method: string;
  notes: string | null;
  items: OrderItem[];
  total: number;
  archived_at: string | null;
}

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    customer: row.customer,
    address: row.address,
    paymentMethod: row.payment_method,
    notes: row.notes,
    items: row.items,
    total: Number(row.total),
    archivedAt: row.archived_at,
  };
}

export interface NewOrderInput {
  customer: OrderCustomer;
  address: OrderAddress;
  paymentMethod: string;
  notes?: string;
  items: OrderItem[];
  total: number;
}

interface OrdersContextValue {
  orders: Order[];
  loading: boolean;
  refresh: () => Promise<void>;
  createOrder: (input: NewOrderInput) => Promise<string>;
  updateStatus: (id: string, status: OrderStatus) => Promise<void>;
  archiveOrder: (id: string) => Promise<void>;
  restoreOrder: (id: string) => Promise<void>;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    setOrders((data as OrderRow[]).map(rowToOrder));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createOrder = async (input: NewOrderInput) => {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        status: "pendiente",
        customer: input.customer,
        address: input.address,
        payment_method: input.paymentMethod,
        notes: input.notes ?? null,
        items: input.items,
        total: input.total,
      })
      .select("id")
      .single();

    if (error) throw error;
    await refresh();
    return data.id as string;
  };

  const updateStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) throw error;
    await refresh();
  };

  const archiveOrder = async (id: string) => {
    const { error } = await supabase.from("orders").update({ archived_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    await refresh();
  };

  const restoreOrder = async (id: string) => {
    const { error } = await supabase.from("orders").update({ archived_at: null }).eq("id", id);
    if (error) throw error;
    await refresh();
  };

  return (
    <OrdersContext.Provider value={{ orders, loading, refresh, createOrder, updateStatus, archiveOrder, restoreOrder }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders debe usarse dentro de <OrdersProvider>");
  return ctx;
}
