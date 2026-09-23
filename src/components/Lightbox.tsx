import { useEffect, useRef, useState } from "react";
import "./Lightbox.css";

interface LightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  altPrefix?: string;
}

export default function Lightbox({ images, initialIndex, onClose, altPrefix = "Imagen" }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50) setIndex((i) => (i - 1 + images.length) % images.length);
    else if (delta < -50) setIndex((i) => (i + 1) % images.length);
    touchStartX.current = null;
  };

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Cerrar">
        ×
      </button>

      <div
        className="lightbox-stage"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {images.length > 1 && (
          <button
            type="button"
            className="lightbox-arrow lightbox-arrow-left"
            onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
            aria-label="Anterior"
          >
            ‹
          </button>
        )}
        <img src={images[index]} alt={`${altPrefix} ${index + 1}`} className="lightbox-image" />
        {images.length > 1 && (
          <button
            type="button"
            className="lightbox-arrow lightbox-arrow-right"
            onClick={() => setIndex((i) => (i + 1) % images.length)}
            aria-label="Siguiente"
          >
            ›
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="lightbox-dots">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`lightbox-dot ${i === index ? "lightbox-dot-active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              aria-label={`Ir a imagen ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
