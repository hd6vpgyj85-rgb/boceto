import { useMemo, useState } from "react";
import { useProducts } from "../../context/ProductsContext";
import { normalizeSearch } from "../../lib/slug";
import ProductGrid from "../../components/ProductGrid";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./SearchPage.css";

export default function SearchPage() {
  const { products, loading } = useProducts();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const normalized = normalizeSearch(query);
    return products.filter(
      (p) => normalizeSearch(p.name).includes(normalized) || normalizeSearch(p.brand).includes(normalized)
    );
  }, [products, query]);

  return (
    <div className="container search-page">
      <h1>Buscar productos</h1>
      <input
        type="search"
        placeholder="Busca por nombre o marca…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {loading ? (
        <LoadingSpinner />
      ) : query.trim() ? (
        <ProductGrid products={results} />
      ) : (
        <p className="search-hint">Escribe para encontrar tus productos favoritos.</p>
      )}
    </div>
  );
}
