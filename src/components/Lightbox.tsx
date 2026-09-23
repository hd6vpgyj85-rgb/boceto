import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon } from "./Icons";
import "./Lightbox.css";

interface LightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  altPrefix?: string;
}

export default function Lightbox({ images, initialIndex, onClose, altPrefix = "Imagen" }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<"next" | "prev" | "none">("none");
  const [closing, setClosing] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = images.length;

  const go = useCallback(
    (dir: 1 | -1) => {
      if (count < 2) return;
      setDirection(dir === 1 ? "next" : "prev");
      setIndex((i) => (i + dir + count) % count);
    },
    [count],
  );

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, 220);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", handler);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = previousOverflow;
    };
  }, [close, go]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50) go(-1);
    else if (delta < -50) go(1);
    touchStartX.current = null;
  };

  return (
    <div className={`lightbox-overlay ${closing ? "is-closing" : ""}`} onClick={close} role="dialog" aria-modal="true">
      <button type="button" className="lightbox-close" onClick={close} aria-label="Cerrar">
        <CloseIcon size={24} />
      </button>

      {count > 1 && (
        <span className="lightbox-counter">
          {index + 1} / {count}
        </span>
      )}

      <div
        className="lightbox-stage"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {count > 1 && (
          <button type="button" className="lightbox-arrow lightbox-arrow-left" onClick={() => go(-1)} aria-label="Anterior">
            <ArrowLeftIcon size={22} />
          </button>
        )}
        <img
          key={index}
          src={images[index]}
          alt={`${altPrefix} ${index + 1}`}
          className={`lightbox-image lightbox-image-${direction}`}
        />
        {count > 1 && (
          <button type="button" className="lightbox-arrow lightbox-arrow-right" onClick={() => go(1)} aria-label="Siguiente">
            <ArrowRightIcon size={22} />
          </button>
        )}
      </div>

      {count > 1 && (
        <div className="lightbox-dots" onClick={(e) => e.stopPropagation()}>
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`lightbox-dot ${i === index ? "lightbox-dot-active" : ""}`}
              onClick={() => {
                setDirection(i > index ? "next" : "prev");
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
