import { useRef } from "react";
import type { Product } from "../types";
import ProductCard from "./ProductCard";
import "./ProductCarousel.css";

interface ProductCarouselProps {
  products: Product[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const node = trackRef.current;
    if (!node) return;
    node.scrollBy({ left: dir * node.clientWidth * 0.8, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <div className="product-carousel">
      <button
        type="button"
        className="product-carousel-arrow product-carousel-arrow-left"
        onClick={() => scrollBy(-1)}
        aria-label="Anterior"
      >
        ‹
      </button>

      <div className="product-carousel-track" ref={trackRef}>
        {products.map((product) => (
          <div className="product-carousel-item" key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="product-carousel-arrow product-carousel-arrow-right"
        onClick={() => scrollBy(1)}
        aria-label="Siguiente"
      >
        ›
      </button>
    </div>
  );
}
