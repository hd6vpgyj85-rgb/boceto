import { useState } from "react";
import type { Review } from "../types";
import ReviewCard from "./ReviewCard";
import StarRating from "./StarRating";
import Lightbox from "./Lightbox";
import "./ReviewsShowcase.css";

interface ReviewsShowcaseProps {
  reviews: Review[];
}

export default function ReviewsShowcase({ reviews }: ReviewsShowcaseProps) {
  const [mobileIndex, setMobileIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if (reviews.length === 0) return null;

  const images = reviews.map((r) => r.image_url).filter((url): url is string => !!url);

  return (
    <div className="reviews-showcase">
      <div className="reviews-desktop-grid">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onImageClick={() => review.image_url && setLightboxImage(review.image_url)}
          />
        ))}
      </div>

      <div className="reviews-mobile">
        <div
          className="reviews-mobile-track"
          style={{ transform: `translateX(-${mobileIndex * 100}%)` }}
        >
          {reviews.map((review) => (
            <div className="reviews-mobile-slide" key={review.id}>
              <button
                type="button"
                className="reviews-mobile-avatar-btn"
                onClick={() => review.image_url && setLightboxImage(review.image_url)}
              >
                {review.image_url ? (
                  <img src={review.image_url} alt={review.name} className="reviews-mobile-avatar" />
                ) : (
                  <span className="reviews-mobile-avatar reviews-mobile-avatar-fallback">
                    {review.name[0]}
                  </span>
                )}
              </button>
              <StarRating rating={review.rating} size={18} />
              <p className="reviews-mobile-quote">&ldquo;{review.quote}&rdquo;</p>
              <span className="reviews-mobile-name">{review.name}</span>
            </div>
          ))}
        </div>
        <div className="reviews-mobile-dots">
          {reviews.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`reviews-mobile-dot ${i === mobileIndex ? "reviews-mobile-dot-active" : ""}`}
              onClick={() => setMobileIndex(i)}
              aria-label={`Reseña ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {lightboxImage && (
        <Lightbox
          images={images}
          initialIndex={Math.max(images.indexOf(lightboxImage), 0)}
          onClose={() => setLightboxImage(null)}
          altPrefix="Cliente"
        />
      )}
    </div>
  );
}
