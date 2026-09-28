import "./StarRating.css";

export default function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="star-rating" aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i < Math.round(rating) ? "var(--color-primary)" : "var(--color-border)"}
        >
          <path d="M12 2.5l2.94 6.3 6.86.7-5.1 4.72 1.44 6.78L12 17.9l-6.14 3.1 1.44-6.78-5.1-4.72 6.86-.7L12 2.5Z" />
        </svg>
      ))}
    </div>
  );
}
