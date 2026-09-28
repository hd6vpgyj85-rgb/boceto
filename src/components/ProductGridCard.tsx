import type { Product } from "../types";
import ProductCard from "./ProductCard";

export default function ProductGridCard({ product }: { product: Product }) {
  return <ProductCard product={product} />;
}
