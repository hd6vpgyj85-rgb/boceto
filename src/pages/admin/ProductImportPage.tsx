import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../../context/ProductsContext";
import { parseShopifyFile, type ImportDraft } from "../../lib/shopifyImport";
import { uploadImageFromUrl } from "../../lib/imageUpload";
import { uniqueSlug } from "../../lib/slug";
import { CATEGORIES, LEVEL_LABELS, type Category, type Product, type ProductLevel } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";

interface DraftRow extends ImportDraft {
  selected: boolean;
}

export default function ProductImportPage() {
  const { products, createProduct } = useProducts();
  const navigate = useNavigate();

  const [parsing, setParsing] = useState(false);
  const [drafts, setDrafts] = useState<DraftRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setParsing(true);
    setError(null);
    try {
      const parsed = await parseShopifyFile(
        file,
        products.map((p) => ({ id: p.id, name: p.name }))
      );
      setDrafts(parsed.map((d) => ({ ...d, selected: !d.isDuplicate })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer el archivo.");
    } finally {
      setParsing(false);
    }
  };

  const updateDraft = (index: number, patch: Partial<DraftRow>) => {
    setDrafts((prev) => prev && prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const toggleLevel = (index: number, level: ProductLevel) => {
    setDrafts(
      (prev) =>
        prev &&
        prev.map((d, i) =>
          i === index ? { ...d, levels: d.levels.includes(level) ? d.levels.filter((l) => l !== level) : [...d.levels, level] } : d
        )
    );
  };

  const handleImport = async () => {
    if (!drafts) return;
    const selected = drafts.filter((d) => d.selected);
    if (selected.length === 0) return;

    setImporting(true);
    setProgress({ done: 0, total: selected.length });

    const existingIds = new Set(products.map((p) => p.id));

    for (const draft of selected) {
      try {
        const uploadedImages: string[] = [];
        for (const url of draft.images) {
          try {
            uploadedImages.push(await uploadImageFromUrl(url));
          } catch {
            // si una imagen falla, se omite y se continúa con las demás
          }
        }

        const id = uniqueSlug(draft.name, existingIds);
        existingIds.add(id);

        const product: Product = {
          id,
          name: draft.name,
          price: draft.price,
          compareAtPrice: draft.onSale ? draft.compareAtPrice : null,
          onSale: draft.onSale,
          levels: draft.levels,
          category: draft.category,
          brand: draft.brand,
          stock: draft.stock,
          vendor: null,
          sizes: draft.sizes,
          description: draft.description || null,
          images: uploadedImages,
          homeImageFit: "cover",
          createdAt: new Date().toISOString(),
        };

        await createProduct(product);
      } catch (err) {
        console.error(`Error importando ${draft.name}:`, err);
      } finally {
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
    }

    setImporting(false);
    navigate("/admin/productos");
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1>Importar desde Shopify</h1>
      </div>

      {!drafts && (
        <div className="admin-card">
          <p style={{ marginBottom: 14 }}>
            Sube el archivo <strong>products_export.csv</strong> o el <strong>.zip</strong> completo de tu exportación
            de Shopify.
          </p>
          <input type="file" accept=".zip,.csv" onChange={(e) => handleFile(e.target.files?.[0])} disabled={parsing} />
          {parsing && <LoadingSpinner />}
          {error && <p className="checkout-coupon-error">{error}</p>}
        </div>
      )}

      {drafts && !importing && (
        <>
          <p style={{ marginBottom: 14, color: "var(--color-muted)" }}>
            Se detectaron {drafts.length} productos. Revisa categoría, nivel y marca antes de importar.
          </p>

          <div className="admin-list">
            {drafts.map((draft, i) => (
              <div className="admin-card" key={draft.handle}>
                <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                  <input
                    type="checkbox"
                    checked={draft.selected}
                    onChange={(e) => updateDraft(i, { selected: e.target.checked })}
                  />
                  <div>
                    <strong>{draft.name}</strong>
                    {draft.isDuplicate && (
                      <span className="admin-status-badge" style={{ background: "#fde3cf", color: "#a3540f", marginLeft: 8 }}>
                        Posible duplicado
                      </span>
                    )}
                  </div>
                </label>

                <div className="admin-form-row">
                  <div className="admin-form-field">
                    <label>Categoría</label>
                    <select value={draft.category} onChange={(e) => updateDraft(i, { category: e.target.value as Category })}>
                      {CATEGORIES.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-field">
                    <label>Marca</label>
                    <input value={draft.brand} onChange={(e) => updateDraft(i, { brand: e.target.value })} />
                  </div>
                </div>

                <div className="admin-checkbox-group" style={{ marginBottom: 4 }}>
                  {(Object.keys(LEVEL_LABELS) as ProductLevel[]).map((level) => (
                    <label className="admin-checkbox-chip" key={level}>
                      <input type="checkbox" checked={draft.levels.includes(level)} onChange={() => toggleLevel(i, level)} />
                      {LEVEL_LABELS[level]}
                    </label>
                  ))}
                </div>

                <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
                  {draft.images.length} imágenes · stock {draft.stock} · precio ${draft.price}
                </span>
              </div>
            ))}
          </div>

          <div className="product-form-actions" style={{ marginTop: 20 }}>
            <button className="btn btn-primary" onClick={handleImport}>
              Importar seleccionados ({drafts.filter((d) => d.selected).length})
            </button>
            <button className="admin-btn-sm" onClick={() => setDrafts(null)}>
              Cancelar
            </button>
          </div>
        </>
      )}

      {importing && (
        <div className="admin-card" style={{ textAlign: "center" }}>
          <LoadingSpinner />
          <p>
            Importando {progress.done} de {progress.total}…
          </p>
        </div>
      )}
    </div>
  );
}
