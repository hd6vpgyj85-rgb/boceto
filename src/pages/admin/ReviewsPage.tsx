import { useReviews } from "../../context/ReviewsContext";
import { formatDate } from "../../lib/format";
import StarRating from "../../components/StarRating";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";

export default function ReviewsPage() {
  const { reviews, loading, updateStatus, deleteReview } = useReviews();

  if (loading) return <LoadingSpinner />;

  const pending = reviews.filter((r) => r.status === "pendiente");
  const moderated = reviews.filter((r) => r.status !== "pendiente");

  return (
    <div>
      <div className="admin-page-header">
        <h1>Reseñas</h1>
      </div>

      <h2 style={{ fontSize: "1rem", marginBottom: 12 }}>Pendientes ({pending.length})</h2>
      {pending.length === 0 ? (
        <p className="admin-empty">No hay reseñas por moderar.</p>
      ) : (
        <div className="admin-list" style={{ marginBottom: 32 }}>
          {pending.map((review) => (
            <div className="admin-card" key={review.id}>
              <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                {review.image && <img src={review.image} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />}
                <div>
                  <strong>{review.name}</strong>
                  <div>
                    <StarRating rating={review.rating} />
                  </div>
                </div>
              </div>
              <p style={{ marginBottom: 12, color: "var(--color-muted)" }}>&ldquo;{review.quote}&rdquo;</p>
              <span style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>{formatDate(review.createdAt)}</span>
              <div className="product-form-actions" style={{ marginTop: 10 }}>
                <button className="admin-btn-sm primary" onClick={() => updateStatus(review.id, "aprobada")}>
                  Aprobar
                </button>
                <button className="admin-btn-sm danger" onClick={() => updateStatus(review.id, "rechazada")}>
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: "1rem", marginBottom: 12 }}>Moderadas</h2>
      {moderated.length === 0 ? (
        <p className="admin-empty">Sin historial todavía.</p>
      ) : (
        <div className="admin-list">
          {moderated.map((review) => (
            <div className="admin-list-item" key={review.id}>
              <div className="admin-list-item-info">
                <strong>{review.name}</strong>
                <span>
                  {review.status} · {formatDate(review.createdAt)}
                </span>
              </div>
              <div className="admin-list-item-actions">
                <button className="admin-btn-sm danger" onClick={() => deleteReview(review.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
