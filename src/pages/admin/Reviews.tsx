import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatDate } from "../../lib/format";
import type { Review, ReviewStatus } from "../../types";
import StarRating from "../../components/StarRating";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReviewStatus | "all">("pending");

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
    await supabase.from("reviews").update({ status }).eq("id", review.id);
    load();
  };

  const remove = async (review: Review) => {
    if (!window.confirm("¿Eliminar esta reseña?")) return;
    await supabase.from("reviews").delete().eq("id", review.id);
    load();
  };

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Reseñas</h1>
      </div>

      <div className="chip-row" style={{ marginBottom: 20 }}>
        {(["pending", "approved", "rejected", "all"] as const).map((status) => (
          <button
            key={status}
            type="button"
            className={`chip ${filter === status ? "chip-active" : ""}`}
            onClick={() => setFilter(status)}
          >
            {status === "pending" ? "Pendientes" : status === "approved" ? "Aprobadas" : status === "rejected" ? "Rechazadas" : "Todas"}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : reviews.length === 0 ? (
        <p className="admin-empty">No hay reseñas en este filtro.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Nombre</th>
                <th>Calificación</th>
                <th>Comentario</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>{review.image_url && <img src={review.image_url} alt="" className="admin-row-thumb" style={{ borderRadius: "999px" }} />}</td>
                  <td>{review.name}</td>
                  <td><StarRating rating={review.rating} /></td>
                  <td style={{ maxWidth: 280 }}>{review.quote}</td>
                  <td>{formatDate(review.created_at)}</td>
                  <td className="admin-actions-cell">
                    {review.status !== "approved" && (
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setStatus(review, "approved")}>
                        Aprobar
                      </button>
                    )}
                    {review.status !== "rejected" && (
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setStatus(review, "rejected")}>
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
