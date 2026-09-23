import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "./Icons";
import "./BannerCarousel.css";

interface BannerCarouselProps {
  images: string[];
}

const AUTOPLAY_MS = 8000;

export default function BannerCarousel({ images }: BannerCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const count = images.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [count, paused, index, cycle]);

  if (count === 0) return null;

  const goTo = (i: number) => {
    setIndex(((i % count) + count) % count);
    setCycle((c) => c + 1);
  };

  const pause = () => setPaused(true);
  const resume = () => {
    setPaused(false);
    setCycle((c) => c + 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    pause();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current != null && count > 1) {
      const delta = e.changedTouches[0].clientX - touchStartX.current;
      if (delta > 40) goTo(index - 1);
      else if (delta < -40) goTo(index + 1);
    }
    touchStartX.current = null;
    resume();
  };

  function diffFor(i: number) {
    let diff = i - index;
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;
    return diff;
  }

  return (
    <div
      className={`banner ${paused ? "is-paused" : ""}`}
      onMouseEnter={pause}
      onMouseLeave={resume}
      aria-roledescription="carrusel"
    >
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
              onClick={() => diff !== 0 && goTo(i)}
              aria-label={`Ver imagen ${i + 1}`}
              tabIndex={diff === 0 ? -1 : 0}
            />
          );
        })}
        {count > 1 && (
          <>
            <button type="button" className="banner-arrow banner-arrow-left" onClick={() => goTo(index - 1)} aria-label="Anterior">
              <ArrowLeftIcon size={22} />
            </button>
            <button type="button" className="banner-arrow banner-arrow-right" onClick={() => goTo(index + 1)} aria-label="Siguiente">
              <ArrowRightIcon size={22} />
            </button>
          </>
        )}
      </div>

      <div className="banner-mobile" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="banner-mobile-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {images.map((img, i) => (
            <div
              key={img + i}
              className={`banner-mobile-slide ${i === index ? "is-active" : ""}`}
              style={{ backgroundImage: `url(${img})` }}
            />
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
              onClick={() => goTo(i)}
              aria-label={`Ir a la imagen ${i + 1}`}
            >
              {i === index && (
                <span key={`${index}-${cycle}`} className="banner-dot-fill" style={{ animationDuration: `${AUTOPLAY_MS}ms` }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
