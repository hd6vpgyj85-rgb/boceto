import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatDate } from "../../lib/format";
import { useToast } from "../../context/ToastContext";
import type { Review, ReviewStatus } from "../../types";
import StarRating from "../../components/StarRating";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";

const FILTERS: { value: ReviewStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
  { value: "all", label: "Todas" },
];

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

export default function Reviews() {
  const toast = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReviewStatus | "all">("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let query = supabase.from("reviews").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setReviews((data as Review[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const setStatus = async (review: Review, status: ReviewStatus) => {
    setBusy(review.id);
    const { error } = await supabase.from("reviews").update({ status }).eq("id", review.id);
    setBusy(null);
    if (error) {
      toast("No se pudo actualizar la reseña", "error");
      return;
    }
    setReviews((prev) =>
      filter === "all" ? prev.map((r) => (r.id === review.id ? { ...r, status } : r)) : prev.filter((r) => r.id !== review.id),
    );
    toast(status === "approved" ? `Reseña de ${review.name} publicada` : `Reseña de ${review.name} rechazada`, status === "approved" ? "success" : "info");
  };

  const remove = async (review: Review) => {
    if (!window.confirm(`¿Eliminar la reseña de ${review.name}?`)) return;
    const { error } = await supabase.from("reviews").delete().eq("id", review.id);
    if (error) {
      toast("No se pudo eliminar la reseña", "error");
      return;
    }
    setReviews((prev) => prev.filter((r) => r.id !== review.id));
    toast("Reseña eliminada", "info");
  };

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Reseñas</h1>
      </div>
      <p className="admin-page-hint">
        Las reseñas nuevas llegan como pendientes. Solo las aprobadas se muestran en la tienda.
      </p>

      <div className="chip-row admin-filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`chip ${filter === f.value ? "chip-active" : ""}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : reviews.length === 0 ? (
        <p className="admin-empty">
          {filter === "pending" ? "No hay reseñas por revisar. Todo al día." : "No hay reseñas en este filtro."}
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Cliente</th>
                <th>Calificación</th>
                <th>Comentario</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    {review.image_url ? (
                      <img src={review.image_url} alt="" className="admin-row-thumb admin-row-avatar" loading="lazy" />
                    ) : (
                      <span className="admin-row-thumb admin-row-avatar admin-row-initial">
                        {review.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td>
                    <strong>{review.name}</strong>
                    {filter === "all" && (
                      <span className={`admin-badge admin-badge-${review.status} admin-badge-inline`}>{STATUS_LABELS[review.status]}</span>
                    )}
                  </td>
                  <td>
                    <StarRating rating={review.rating} />
                  </td>
                  <td className="admin-review-quote">«{review.quote}»</td>
                  <td className="admin-nowrap">{formatDate(review.created_at)}</td>
                  <td className="admin-actions-cell">
                    {review.status !== "approved" && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={busy === review.id}
                        onClick={() => setStatus(review, "approved")}
                      >
                        Aprobar
                      </button>
                    )}
                    {review.status !== "rejected" && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={busy === review.id}
                        onClick={() => setStatus(review, "rejected")}
                      >
                        Rechazar
                      </button>
                    )}
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(review)}>
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
