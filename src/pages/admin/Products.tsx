import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { parseCsv, findField } from "../../lib/csv";
import { formatCurrency } from "../../lib/format";
import type { Product } from "../../types";
import { useToast } from "../../context/ToastContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import { PlusIcon } from "../../components/Icons";
import "./adminShared.css";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts((data as Product[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }, [products, search]);

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) {
      toast("No se pudo eliminar el producto", "error");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    toast(`«${product.name}» eliminado`, "info");
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const payloads = rows
        .map((row) => {
          const name = findField(row, ["name", "título", "title", "nombre"]);
          if (!name) return null;
          const price = Number(findField(row, ["price", "precio", "variant price"]).replace(/[^0-9.]/g, "")) || 0;
          const salePriceRaw = findField(row, ["sale_price", "precio_oferta", "variant compare at price"]);
          const images = findField(row, ["images", "imagenes", "image src"])
            .split(/[|,]/)
            .map((s) => s.trim())
            .filter(Boolean);
          const sizes = findField(row, ["sizes", "tallas", "option1 value"])
            .split(/[|,]/)
            .map((s) => s.trim())
            .filter(Boolean);
          const levels = findField(row, ["levels", "niveles"])
            .split(/[|,]/)
            .map((s) => s.trim())
            .filter(Boolean);
          const description = findField(row, ["description", "descripcion", "body (html)", "body"]).replace(
            /<[^>]+>/g,
            "",
          );

          return {
            name,
            brand: findField(row, ["brand", "marca", "vendor"]),
            vendor: findField(row, ["vendor", "proveedor"]),
            price,
            sale_price: salePriceRaw ? Number(salePriceRaw.replace(/[^0-9.]/g, "")) : null,
            on_sale: !!salePriceRaw,
            category: findField(row, ["category", "categoria", "type", "product type"]) || null,
            levels,
            stock: Number(findField(row, ["stock", "inventario", "variant inventory qty"])) || 0,
            sizes,
            description,
            images,
            cover_fit: "cover" as const,
            featured: false,
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      if (payloads.length === 0) {
        toast("No se encontraron filas válidas en el archivo", "error");
      } else {
        const { error } = await supabase.from("products").insert(payloads);
        if (error) throw error;
        toast(`Se importaron ${payloads.length} producto${payloads.length === 1 ? "" : "s"}`, "success");
        load();
      }
    } catch {
      toast("No se pudo procesar el archivo CSV", "error");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Productos</h1>
        <div className="admin-actions-cell">
          <label className={`btn btn-outline btn-sm ${importing ? "btn-loading" : ""}`}>
            {importing ? "Importando" : "Importar CSV / Shopify"}
            <input
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = "";
              }}
            />
          </label>
          <Link to="/admin/productos/nuevo" className="btn btn-primary btn-sm products-new-btn">
            <PlusIcon size={16} />
            Nuevo producto
          </Link>
        </div>
      </div>

      <div className="admin-toolbar">
        <input
          className="admin-search-input"
          type="search"
          placeholder="Buscar por nombre o marca"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <p className="admin-empty">
          {products.length === 0 ? "Tu catálogo está vacío. Crea tu primer producto o importa un CSV." : "No hay productos que coincidan."}
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Nombre</th>
                <th>Marca</th>
                <th>Precio</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.images[0] ? (
                      <img src={product.images[0]} alt="" className="admin-row-thumb" loading="lazy" />
                    ) : (
                      <span className="admin-row-thumb admin-row-thumb-empty" />
                    )}
                  </td>
                  <td>
                    <Link to={`/admin/productos/${product.id}`} className="products-name">
                      {product.name}
                    </Link>
                    {product.featured && <span className="products-flag">Destacado</span>}
                    {product.on_sale && product.sale_price != null && <span className="products-flag is-sale">Oferta</span>}
                  </td>
                  <td>{product.brand}</td>
                  <td>
                    {product.on_sale && product.sale_price != null ? (
                      <>
                        {formatCurrency(product.sale_price)}
                        <s className="products-old-price">{formatCurrency(product.price)}</s>
                      </>
                    ) : (
                      formatCurrency(product.price)
                    )}
                  </td>
                  <td>
                    <span className={`admin-stock ${product.stock <= 0 ? "is-out" : product.stock <= 5 ? "is-low" : ""}`}>
                      {product.stock <= 0 ? "Agotado" : product.stock}
                    </span>
                  </td>
                  <td className="admin-actions-cell">
                    <Link to={`/admin/productos/${product.id}`} className="btn btn-outline btn-sm">
                      Editar
                    </Link>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(product)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
