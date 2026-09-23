import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "../types";
import ProductCard from "./ProductCard";
import { ArrowLeftIcon, ArrowRightIcon } from "./Icons";
import "./ProductCarousel.css";

interface ProductCarouselProps {
  products: Product[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const node = trackRef.current;
    if (!node) return;
    setAtStart(node.scrollLeft <= 4);
    setAtEnd(node.scrollLeft + node.clientWidth >= node.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges, products.length]);

  const scrollBy = (dir: 1 | -1) => {
    const node = trackRef.current;
    if (!node) return;
    node.scrollBy({ left: dir * node.clientWidth * 0.8, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <div className={`product-carousel ${atStart ? "at-start" : ""} ${atEnd ? "at-end" : ""}`}>
      <button
        type="button"
        className="product-carousel-arrow product-carousel-arrow-left"
        onClick={() => scrollBy(-1)}
        disabled={atStart}
        aria-label="Ver anteriores"
      >
        <ArrowLeftIcon size={20} />
      </button>

      <div className="product-carousel-viewport">
        <div className="product-carousel-track" ref={trackRef} onScroll={updateEdges}>
          {products.map((product, i) => (
            <div className="product-carousel-item" key={product.id} style={{ animationDelay: `${Math.min(i, 6) * 70}ms` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="product-carousel-arrow product-carousel-arrow-right"
        onClick={() => scrollBy(1)}
        disabled={atEnd}
        aria-label="Ver siguientes"
      >
        <ArrowRightIcon size={20} />
      </button>
    </div>
  );
}
