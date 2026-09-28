import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProducts } from "../../context/ProductsContext";
import { uniqueSlug } from "../../lib/slug";
import { uploadProductImage } from "../../lib/imageUpload";
import { CATEGORIES, LEVEL_LABELS, type Category, type Product, type ProductLevel } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./ProductFormPage.css";

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const { products, loading, getById } = useProducts();
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner />;

  const existing = id ? getById(id) : undefined;
  if (id && !existing) {
    navigate("/admin/productos", { replace: true });
    return null;
  }

  return (
    <ProductFormInner
      key={id ?? "new"}
      initial={existing ?? null}
      existingIds={new Set(products.map((p) => p.id))}
    />
  );
}

interface ProductFormInnerProps {
  initial: Product | null;
  existingIds: Set<string>;
}

function ProductFormInner({ initial, existingIds }: ProductFormInnerProps) {
  const { createProduct, updateProduct, deleteProduct } = useProducts();
  const navigate = useNavigate();

  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [onSale, setOnSale] = useState(initial?.onSale ?? false);
  const [compareAtPrice, setCompareAtPrice] = useState(initial?.compareAtPrice ?? 0);
  const [category, setCategory] = useState<Category>(initial?.category ?? "fajas");
  const [levels, setLevels] = useState<ProductLevel[]>(initial?.levels ?? []);
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [stock, setStock] = useState(initial?.stock ?? 0);
  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [sizes, setSizes] = useState<string[]>(initial?.sizes ?? []);
  const [sizeInput, setSizeInput] = useState("");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [homeImageFit, setHomeImageFit] = useState<"cover" | "contain">(initial?.homeImageFit ?? "cover");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLevel = (level: ProductLevel) => {
    setLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]));
  };

  const addSize = () => {
    const value = sizeInput.trim();
    if (!value || sizes.includes(value)) return;
    setSizes((prev) => [...prev, value]);
    setSizeInput("");
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadProductImage));
      setImages((prev) => [...prev, ...urls]);
    } catch {
      setError("No se pudieron subir una o más imágenes.");
    } finally {
      setUploading(false);
    }
  };

  const makeCover = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      return [item, ...next];
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !brand.trim()) {
      setError("Nombre y marca son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      const product: Product = {
        id: initial?.id ?? uniqueSlug(name, existingIds),
        name: name.trim(),
        price: Number(price),
        compareAtPrice: onSale ? Number(compareAtPrice) || null : null,
        onSale,
        levels,
        category,
        brand: brand.trim(),
        stock: Number(stock),
        vendor: vendor.trim() || null,
        sizes,
        description: description.trim() || null,
        images,
        homeImageFit,
        createdAt: initial?.createdAt ?? new Date().toISOString(),
      };

      if (initial) {
        await updateProduct(product);
      } else {
        await createProduct(product);
      }
      navigate("/admin/productos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    if (!confirm(`¿Eliminar "${initial.name}"?`)) return;
    await deleteProduct(initial.id);
    navigate("/admin/productos");
  };

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <div className="admin-page-header">
        <h1>{initial ? "Editar producto" : "Nuevo producto"}</h1>
      </div>

      <div className="admin-form-field">
        <label>Imágenes</label>
        <div className="product-form-images">
          {images.map((img, i) => (
            <div className={`product-form-image ${i === 0 ? "is-cover" : ""}`} key={img}>
              <img src={img} alt="" />
              {i === 0 && <span className="product-form-cover-tag">Portada</span>}
              <div className="product-form-image-actions">
                {i !== 0 && (
                  <button type="button" onClick={() => makeCover(i)}>
                    Portada
                  </button>
                )}
                <button type="button" onClick={() => removeImage(i)}>
                  Quitar
                </button>
              </div>
            </div>
          ))}
          <label className="product-form-upload">
            {uploading ? "Subiendo…" : "+ Agregar"}
            <input type="file" accept="image/*" multiple hidden onChange={(e) => handleUpload(e.target.files)} />
          </label>
        </div>
      </div>

      <div className="admin-form-field">
        <label>Ajuste de la portada en el inicio</label>
        <select value={homeImageFit} onChange={(e) => setHomeImageFit(e.target.value as "cover" | "contain")}>
          <option value="cover">Recortar (cover)</option>
          <option value="contain">Ajustar completa (contain)</option>
        </select>
      </div>

      <div className="admin-form-field">
        <label>Nombre</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="admin-form-row">
        <div className="admin-form-field">
          <label>Precio</label>
          <input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
        </div>
        <div className="admin-form-field">
          <label>Precio de oferta</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(Number(e.target.value))}
            disabled={!onSale}
          />
        </div>
      </div>

      <label className="admin-checkbox-chip" style={{ marginBottom: 16 }}>
        <input type="checkbox" checked={onSale} onChange={(e) => setOnSale(e.target.checked)} />
        Producto en oferta
      </label>

      <div className="admin-form-field">
        <label>Categoría</label>
        <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-form-field">
        <label>Nivel de compresión</label>
        <div className="admin-checkbox-group">
          {(Object.keys(LEVEL_LABELS) as ProductLevel[]).map((level) => (
            <label className="admin-checkbox-chip" key={level}>
              <input type="checkbox" checked={levels.includes(level)} onChange={() => toggleLevel(level)} />
              {LEVEL_LABELS[level]}
            </label>
          ))}
        </div>
      </div>

      <div className="admin-form-row">
        <div className="admin-form-field">
          <label>Marca</label>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} required />
        </div>
        <div className="admin-form-field">
          <label>Existencias</label>
          <input type="number" min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} />
        </div>
      </div>

      <div className="admin-form-field">
        <label>Proveedor</label>
        <input value={vendor} onChange={(e) => setVendor(e.target.value)} />
      </div>

      <div className="admin-form-field">
        <label>Tallas</label>
        <div className="product-form-sizes">
          {sizes.map((size) => (
            <span className="product-form-size-chip" key={size}>
              {size}
              <button type="button" onClick={() => setSizes((prev) => prev.filter((s) => s !== size))}>
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="checkout-row">
          <input
            value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)}
            placeholder="Ej. S, M, L, 32, 34…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSize();
              }
            }}
          />
          <button type="button" className="admin-btn-sm" onClick={addSize}>
            Agregar
          </button>
        </div>
      </div>

      <div className="admin-form-field">
        <label>Descripción</label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Si la dejas vacía, se genera una descripción automática."
        />
      </div>

      {error && <p className="checkout-coupon-error">{error}</p>}

      <div className="product-form-actions">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar producto"}
        </button>
        {initial && (
          <button type="button" className="admin-btn-sm danger" onClick={handleDelete}>
            Eliminar producto
          </button>
        )}
      </div>
    </form>
  );
}
