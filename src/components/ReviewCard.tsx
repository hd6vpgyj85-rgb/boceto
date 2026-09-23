import type { Review } from "../types";
import StarRating from "./StarRating";
import { CheckIcon } from "./Icons";
import "./ReviewCard.css";

interface ReviewCardProps {
  review: Review;
  onImageClick?: () => void;
}

export default function ReviewCard({ review, onImageClick }: ReviewCardProps) {
  return (
    <article className="review-card card">
      <span className="review-card-quote-mark" aria-hidden="true">
        &ldquo;
      </span>
      <button
        type="button"
        className="review-card-avatar-btn"
        onClick={onImageClick}
        aria-label={`Ver foto de ${review.name} en grande`}
        disabled={!review.image_url}
      >
        {review.image_url ? (
          <img src={review.image_url} alt={review.name} className="review-card-avatar" loading="lazy" />
        ) : (
          <span className="review-card-avatar review-card-avatar-fallback">{review.name[0]}</span>
        )}
      </button>
      <div className="review-card-body">
        <StarRating rating={review.rating} />
        <p className="review-card-quote">{review.quote}</p>
        <div className="review-card-footer">
          <span className="review-card-name">{review.name}</span>
          <VerifiedBadge />
        </div>
      </div>
    </article>
  );
}

export function VerifiedBadge() {
  return (
    <span className="review-verified">
      <CheckIcon size={11} strokeWidth={3.2} />
      Compra verificada
    </span>
  );
}
