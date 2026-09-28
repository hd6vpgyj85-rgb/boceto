import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { Review, ReviewStatus } from "../types";

interface ReviewRow {
  id: string;
  name: string;
  rating: number;
  quote: string;
  image: string | null;
  status: ReviewStatus;
  created_at: string;
}

function rowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    name: row.name,
    rating: row.rating,
    quote: row.quote,
    image: row.image,
    status: row.status,
    createdAt: row.created_at,
  };
}

export interface NewReviewInput {
  name: string;
  rating: number;
  quote: string;
  image?: string | null;
}

interface ReviewsContextValue {
  reviews: Review[];
  approvedReviews: Review[];
  loading: boolean;
  refresh: () => Promise<void>;
  createReview: (input: NewReviewInput) => Promise<void>;
  updateStatus: (id: string, status: ReviewStatus) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
}

const ReviewsContext = createContext<ReviewsContextValue | null>(null);

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    setReviews((data as ReviewRow[]).map(rowToReview));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createReview = async (input: NewReviewInput) => {
    const { error } = await supabase.from("reviews").insert({
      name: input.name,
      rating: input.rating,
      quote: input.quote,
      image: input.image ?? null,
      status: "pendiente",
    });
    if (error) throw error;
    await refresh();
  };

  const updateStatus = async (id: string, status: ReviewStatus) => {
    const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
    if (error) throw error;
    await refresh();
  };

  const deleteReview = async (id: string) => {
    const { error, count } = await supabase.from("reviews").delete({ count: "exact" }).eq("id", id);
    if (error) throw error;
    if (!count) throw new Error("No se pudo eliminar la reseña (bloqueado por permisos)");
    await refresh();
  };

  const approvedReviews = reviews.filter((r) => r.status === "aprobada");

  return (
    <ReviewsContext.Provider
      value={{ reviews, approvedReviews, loading, refresh, createReview, updateStatus, deleteReview }}
    >
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error("useReviews debe usarse dentro de <ReviewsProvider>");
  return ctx;
}
