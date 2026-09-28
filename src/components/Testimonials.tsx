import { useState } from "react";
import { useReviews } from "../context/ReviewsContext";
import StarRating from "./StarRating";
import "./Testimonials.css";

export default function Testimonials() {
  const { approvedReviews } = useReviews();
  const [slide, setSlide] = useState(0);

  const slides: (typeof approvedReviews)[] = [];
  for (let i = 0; i < approvedReviews.length; i += 2) {
    slides.push(approvedReviews.slice(i, i + 2));
  }

  if (slides.length === 0) return null;

  return (
    <section className="testimonials">
      <h2>Lo que dicen nuestras clientas</h2>

      <div className="testimonials-slide">
        {slides[slide].map((review) => (
          <div className="testimonial-card" key={review.id}>
            {review.image && <img src={review.image} alt={review.name} />}
            <StarRating rating={review.rating} />
            <p>&ldquo;{review.quote}&rdquo;</p>
            <span>{review.name}</span>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="testimonials-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`testimonials-dot ${i === slide ? "is-active" : ""}`}
              onClick={() => setSlide(i)}
              aria-label={`Ver reseñas ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
