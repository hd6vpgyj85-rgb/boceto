import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { uploadImage, deleteImageByUrl } from "../../lib/imageUpload";
import { useCategories, useLevels } from "../../hooks/useSiteData";
import type { Product } from "../../types";
import "./adminShared.css";

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProductForm({ product, onClose, onSaved }: ProductFormProps) {
  const { categories } = useCategories();
  const { levels } = useLevels();

  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [vendor, setVendor] = useState(product?.vendor ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [salePrice, setSalePrice] = useState(product?.sale_price != null ? String(product.sale_price) : "");
  const [onSale, setOnSale] = useState(product?.on_sale ?? false);
  const [category, setCategory] = useState(product?.category ?? categories[0]?.slug ?? "");
  const [selectedLevels, setSelectedLevels] = useState<string[]>(product?.levels ?? []);
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [sizes, setSizes] = useState(product?.sizes?.join(", ") ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [coverFit, setCoverFit] = useState<"cover" | "contain">(product?.cover_fit ?? "cover");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLevel = (slug: string) => {
    setSelectedLevels((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadImage(file, "products");
        uploaded.push(url);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch {
      setError("No se pudieron subir algunas imágenes.");
    } finally {
      setUploading(false);
    }
  };

  const makeCover = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      const [chosen] = next.splice(index, 1);
      return [chosen, ...next];
    });
  };

  const removeImage = (index: number) => {
    const url = images[index];
    setImages((prev) => prev.filter((_, i) => i !== index));
    void deleteImageByUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      brand,
      vendor,
      price: Number(price) || 0,
      sale_price: salePrice ? Number(salePrice) : null,
      on_sale: onSale,
      category: category || null,
      levels: selectedLevels,
      stock: Number(stock) || 0,
      sizes: sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      description,
      images,
      cover_fit: coverFit,
      featured,
    };

    const query = product
      ? supabase.from("products").update(payload).eq("id", product.id)
      : supabase.from("products").insert(payload);

    const { error: saveError } = await query;
    setSaving(false);

    if (saveError) {
      setError("No se pudo guardar el producto.");
      return;
    }
    onSaved();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-head">
          <h2>{product ? "Editar producto" : "Nuevo producto"}</h2>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="field field-full">
              <label>Nombre</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="field">
              <label>Marca</label>
              <input required value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="field">
              <label>Proveedor</label>
              <input value={vendor} onChange={(e) => setVendor(e.target.value)} />
            </div>

            <div className="field">
              <label>Precio</label>
              <input required type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="field">
              <label>Precio de oferta</label>
              <input type="number" min="0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
            </div>

            <div className="field">
              <label>Categoría</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Stock</label>
              <input required type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>

            <div className="field field-full">
              <label>Niveles</label>
              <div className="chip-row">
                {levels.map((level) => (
                  <button
                    type="button"
                    key={level.slug}
                    className={`chip ${selectedLevels.includes(level.slug) ? "chip-active" : ""}`}
                    onClick={() => toggleLevel(level.slug)}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Tamaños (separados por coma)</label>
              <input value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="30ml, 50ml" />
            </div>
            <div className="field">
              <label>Ajuste de imagen portada</label>
              <select value={coverFit} onChange={(e) => setCoverFit(e.target.value as "cover" | "contain")}>
                <option value="cover">Cubrir (cover)</option>
                <option value="contain">Contener (contain)</option>
              </select>
            </div>

            <div className="field field-full">
              <label>Descripción</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="field field-full">
              <label className="checkout-review-toggle">
                <input type="checkbox" checked={onSale} onChange={(e) => setOnSale(e.target.checked)} />
                En oferta
              </label>
              <label className="checkout-review-toggle">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                Destacado / top ventas
              </label>
            </div>

            <div className="field field-full">
              <label>Imágenes (haz click en una para hacerla portada)</label>
              <div className="admin-image-picker">
                {images.map((img, i) => (
                  <div key={img} className={`admin-image-thumb-wrap ${i === 0 ? "is-cover" : ""}`}>
                    <img src={img} alt="" onClick={() => makeCover(i)} />
                    <button type="button" className="admin-image-remove" onClick={() => removeImage(i)}>
                      ×
                    </button>
                  </div>
                ))}
                <label className="admin-image-add">
                  {uploading ? "…" : "+"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleUpload(e.target.files)}
                  />
                </label>
              </div>
            </div>
          </div>

          {error && <p className="checkout-coupon-error">{error}</p>}

          <div className="admin-form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
              {saving ? "Guardando…" : "Guardar producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
