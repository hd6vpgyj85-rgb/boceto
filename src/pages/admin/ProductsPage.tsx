import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../../context/ProductsContext";
import { normalizeSearch } from "../../lib/slug";
import { formatPrice } from "../../lib/format";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";

type ProductFilterKey = "all" | "sale" | "soldout" | "low";

const FILTERS: { key: ProductFilterKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "sale", label: "En oferta" },
  { key: "soldout", label: "Agotados" },
  { key: "low", label: "Pocas unidades" },
];

export default function ProductsPage() {
  const { products, loading, deleteProduct, deleteAllProducts } = useProducts();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProductFilterKey>("all");
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = products;
    if (filter === "sale") list = list.filter((p) => p.onSale && p.compareAtPrice);
    if (filter === "soldout") list = list.filter((p) => p.stock <= 0);
    if (filter === "low") list = list.filter((p) => p.stock > 0 && p.stock <= 5);

    if (query.trim()) {
      const normalized = normalizeSearch(query);
      list = list.filter(
        (p) =>
          normalizeSearch(p.name).includes(normalized) ||
          normalizeSearch(p.brand).includes(normalized) ||
          normalizeSearch(p.category).includes(normalized)
      );
    }

    return list;
  }, [products, filter, query]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    setBusyId(id);
    try {
      await deleteProduct(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo eliminar el producto");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (confirmText !== "delete products") return;
    await deleteAllProducts();
    setConfirmDeleteAll(false);
    setConfirmText("");
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Productos ({products.length})</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/admin/productos/importar" className="admin-btn-sm">
            Importar
          </Link>
          <Link to="/admin/productos/nuevo" className="admin-btn-sm primary">
            + Nuevo
          </Link>
        </div>
      </div>

      <input
        className="admin-search"
        placeholder="Buscar por nombre, marca o categoría…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="admin-chip-row">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`admin-chip ${filter === f.key ? "is-active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="admin-empty">No hay productos que coincidan.</p>
      ) : (
        <div className="admin-list">
          {filtered.map((product) => (
            <div className="admin-list-item" key={product.id}>
              {product.images?.[0] ? <img src={product.images[0]} alt="" /> : <div className="admin-list-item-img-placeholder" />}
              <div className="admin-list-item-info">
                <strong>{product.name}</strong>
                <span>
                  {product.brand} · {formatPrice(product.price)} · stock {product.stock}
                </span>
              </div>
              <div className="admin-list-item-actions">
                <Link to={`/admin/productos/${product.id}`} className="admin-btn-sm">
                  Editar
                </Link>
                <button className="admin-btn-sm danger" disabled={busyId === product.id} onClick={() => handleDelete(product.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        {!confirmDeleteAll ? (
          <button className="admin-btn-sm danger" onClick={() => setConfirmDeleteAll(true)}>
            Eliminar todos los productos
          </button>
        ) : (
          <div className="admin-card">
            <p style={{ marginBottom: 10 }}>
              Esta acción es irreversible. Escribe <strong>delete products</strong> para confirmar.
            </p>
            <input
              className="admin-search"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete products"
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="admin-btn-sm danger" disabled={confirmText !== "delete products"} onClick={handleDeleteAll}>
                Confirmar eliminación
              </button>
              <button
                className="admin-btn-sm"
                onClick={() => {
                  setConfirmDeleteAll(false);
                  setConfirmText("");
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
