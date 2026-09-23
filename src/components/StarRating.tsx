import "./StarRating.css";

interface StarRatingProps {
  rating: number;
  size?: number;
  animated?: boolean;
}

export default function StarRating({ rating, size = 16, animated = false }: StarRatingProps) {
  const rounded = Math.round(rating);

  return (
    <div
      className={`star-rating ${animated ? "star-rating-animated" : ""}`}
      style={{ fontSize: size }}
      role="img"
      aria-label={`${rating.toFixed(1)} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? "star star-filled" : "star"} style={{ animationDelay: `${n * 70}ms` }}>
          ★
        </span>
      ))}
    </div>
  );
}
