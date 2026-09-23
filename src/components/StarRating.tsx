import "./StarRating.css";

interface StarRatingProps {
  rating: number;
  size?: number;
}

export default function StarRating({ rating, size = 16 }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="star-rating" style={{ fontSize: size }} aria-label={`${rating} de 5 estrellas`}>
      {stars.map((n) => (
        <span key={n} className={n <= Math.round(rating) ? "star star-filled" : "star"}>
          ★
        </span>
      ))}
    </div>
  );
}
