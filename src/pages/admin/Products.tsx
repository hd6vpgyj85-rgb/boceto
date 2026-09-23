import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { parseCsv, findField } from "../../lib/csv";
import { formatCurrency } from "../../lib/format";
import type { Product } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

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
    await supabase.from("products").delete().eq("id", product.id);
    load();
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setImportMessage(null);
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
        setImportMessage("No se encontraron filas válidas en el archivo.");
      } else {
        const { error } = await supabase.from("products").insert(payloads);
        if (error) throw error;
        setImportMessage(`Se importaron ${payloads.length} productos.`);
        load();
      }
    } catch {
      setImportMessage("No se pudo procesar el archivo CSV.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Productos</h1>
        <div className="admin-actions-cell">
          <label className="btn btn-outline btn-sm">
            {importing ? "Importando…" : "Importar CSV / Shopify"}
            <input
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
            />
          </label>
          <Link to="/admin/productos/nuevo" className="btn btn-primary btn-sm">
            + Nuevo producto
          </Link>
        </div>
      </div>

      {importMessage && <p className="checkout-coupon-ok">{importMessage}</p>}

      <div className="admin-toolbar">
        <input
          className="admin-search-input"
          placeholder="Buscar por nombre o marca…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <p className="admin-empty">No hay productos que coincidan.</p>
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
                    {product.images[0] && (
                      <img src={product.images[0]} alt="" className="admin-row-thumb" />
                    )}
                  </td>
                  <td>{product.name}</td>
                  <td>{product.brand}</td>
                  <td>
                    {product.on_sale && product.sale_price != null
                      ? formatCurrency(product.sale_price)
                      : formatCurrency(product.price)}
                  </td>
                  <td>{product.stock}</td>
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
