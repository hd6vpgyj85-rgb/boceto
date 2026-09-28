import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "../lib/format";
import type { Product } from "../types";
import "./FeaturedCarousel.css";

function pickRandom(products: Product[], count: number): Product[] {
  const shuffled = [...products].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function FeaturedCarousel({ products }: { products: Product[] }) {
  const [featured] = useState(() => pickRandom(products, Math.min(8, products.length)));
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || featured.length === 0) return;

    if (window.innerWidth >= 1024) {
      track.scrollLeft = (track.scrollWidth - track.clientWidth) / 2;
    }

    const updateActive = () => {
      const items = Array.from(track.children) as HTMLElement[];
      const center = track.scrollLeft + track.clientWidth / 2;
      let closest = 0;
      let minDist = Infinity;
      items.forEach((item, i) => {
        const itemCenter = item.offsetLeft + item.offsetWidth / 2;
        const dist = Math.abs(itemCenter - center);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      setActiveIndex(closest);
    };

    updateActive();
    track.addEventListener("scroll", updateActive, { passive: true });
    return () => track.removeEventListener("scroll", updateActive);
  }, [featured.length]);

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const item = track.children[index] as HTMLElement | undefined;
    if (!item) return;
    track.scrollTo({
      left: item.offsetLeft - (track.clientWidth - item.offsetWidth) / 2,
      behavior: "smooth",
    });
  };

  if (featured.length === 0) return null;

  const active = featured[activeIndex];

  return (
    <section className="featured-carousel">
      <h2>Productos destacados</h2>

      <div className="featured-carousel-wrap">
        <button
          className="featured-arrow featured-arrow-prev"
          onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
          aria-label="Anterior"
        >
          ‹
        </button>

        <div className="featured-track" ref={trackRef}>
          {featured.map((product, i) => (
            <button
              key={product.id}
              className={`featured-item ${i === activeIndex ? "is-active" : ""}`}
              onClick={() => scrollToIndex(i)}
            >
              <img src={product.images?.[0]} alt={product.name} loading="lazy" />
            </button>
          ))}
        </div>

        <button
          className="featured-arrow featured-arrow-next"
          onClick={() => scrollToIndex(Math.min(featured.length - 1, activeIndex + 1))}
          aria-label="Siguiente"
        >
          ›
        </button>
      </div>

      <div className="featured-dots">
        {featured.map((product, i) => (
          <button
            key={product.id}
            className={`featured-dot ${i === activeIndex ? "is-active" : ""}`}
            onClick={() => scrollToIndex(i)}
            aria-label={`Ver producto ${i + 1}`}
          />
        ))}
      </div>

      {active && (
        <div className="featured-info">
          <span className="featured-tag">Top venta</span>
          <h3>{active.name}</h3>
          <p>{formatPrice(active.price)}</p>
          <Link to={`/producto/${active.id}`} className="btn btn-primary">
            Ver producto
          </Link>
        </div>
      )}
    </section>
  );
}
