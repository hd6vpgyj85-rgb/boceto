import { useEffect, useRef, useState } from "react";
import "./BannerCarousel.css";

interface BannerCarouselProps {
  images: string[];
}

const AUTOPLAY_MS = 8000;

export default function BannerCarousel({ images }: BannerCarouselProps) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const count = images.length;

  useEffect(() => {
    if (count < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count]);

  if (count === 0) return null;

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || count < 2) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 40) go(-1);
    else if (delta < -40) go(1);
    touchStartX.current = null;
  };

  function diffFor(i: number) {
    let diff = i - index;
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;
    return diff;
  }

  return (
    <div className="banner">
      {/* Coverflow para escritorio */}
      <div className="banner-desktop" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {images.map((img, i) => {
          const diff = diffFor(i);
          const visible = Math.abs(diff) <= 1;
          return (
            <button
              key={img + i}
              type="button"
              className="banner-slide"
              data-diff={visible ? diff : "hidden"}
              style={{ backgroundImage: `url(${img})` }}
              onClick={() => setIndex(i)}
              aria-label={`Ver imagen ${i + 1}`}
            />
          );
        })}
        {count > 1 && (
          <>
            <button
              type="button"
              className="banner-arrow banner-arrow-left"
              onClick={() => go(-1)}
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              type="button"
              className="banner-arrow banner-arrow-right"
              onClick={() => go(1)}
              aria-label="Siguiente"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Imagen completa por vez en móvil */}
      <div className="banner-mobile" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="banner-mobile-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {images.map((img, i) => (
            <div key={img + i} className="banner-mobile-slide" style={{ backgroundImage: `url(${img})` }} />
          ))}
        </div>
      </div>

      {count > 1 && (
        <div className="banner-dots">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`banner-dot ${i === index ? "banner-dot-active" : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`Ir a la imagen ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
