import type { Review } from "../types";
import StarRating from "./StarRating";
import "./ReviewCard.css";

interface ReviewCardProps {
  review: Review;
  onImageClick?: () => void;
}

export default function ReviewCard({ review, onImageClick }: ReviewCardProps) {
  return (
    <div className="review-card card">
      <button
        type="button"
        className="review-card-avatar-btn"
        onClick={onImageClick}
        aria-label={`Ver foto de ${review.name} en grande`}
        disabled={!review.image_url}
      >
        {review.image_url ? (
          <img src={review.image_url} alt={review.name} className="review-card-avatar" />
        ) : (
          <span className="review-card-avatar review-card-avatar-fallback">{review.name[0]}</span>
        )}
      </button>
      <div className="review-card-body">
        <StarRating rating={review.rating} />
        <p className="review-card-quote">&ldquo;{review.quote}&rdquo;</p>
        <span className="review-card-name">{review.name}</span>
      </div>
    </div>
  );
}
