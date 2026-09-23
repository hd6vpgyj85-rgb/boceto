import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { uploadImage, deleteImageByUrl } from "../../lib/imageUpload";
import { useCategories, useLevels } from "../../hooks/useSiteData";
import { useToast } from "../../context/ToastContext";
import { discountPercent, formatCurrency } from "../../lib/format";
import { ArrowLeftIcon, CloseIcon, PlusIcon } from "../../components/Icons";
import type { Product } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";
import "./ProductFormPage.css";

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const { categories } = useCategories();
  const { levels } = useLevels();
  const toast = useToast();

  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [vendor, setVendor] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [onSale, setOnSale] = useState(false);
  const [category, setCategory] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [stock, setStock] = useState("0");
  const [sizes, setSizes] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [coverContain, setCoverContain] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) {
      setCategory(categories[0]?.slug ?? "");
      return;
    }
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        const p = data as Product | null;
        if (!p) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setName(p.name);
        setBrand(p.brand);
        setVendor(p.vendor);
        setPrice(String(p.price));
        setSalePrice(p.sale_price != null ? String(p.sale_price) : "");
        setOnSale(p.on_sale);
        setCategory(p.category ?? "");
        setSelectedLevels(p.levels);
        setStock(String(p.stock));
        setSizes(p.sizes.join(", "));
        setDescription(p.description);
        setImages(p.images);
        setCoverContain(p.cover_fit === "contain");
        setFeatured(p.featured);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  useEffect(() => {
    if (isNew && !category && categories.length > 0) setCategory(categories[0].slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const toggleLevel = (slug: string) => {
    setSelectedLevels((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadImage(file, "products"));
      }
      setImages((prev) => [...prev, ...uploaded]);
      toast(uploaded.length === 1 ? "Imagen agregada" : `${uploaded.length} imágenes agregadas`, "success");
    } catch {
      toast("No se pudieron subir algunas imágenes", "error");
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
    setError(null);
    const priceValue = Number(price) || 0;
    const saleValue = salePrice ? Number(salePrice) : null;
    if (onSale && (saleValue == null || saleValue >= priceValue)) {
      setError("Para marcarlo en oferta, el precio con descuento debe ser menor al precio normal.");
      return;
    }
    setSaving(true);

    const payload = {
      brand,
      vendor,
      name: name.trim(),
      price: priceValue,
      sale_price: saleValue,
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
      cover_fit: coverContain ? ("contain" as const) : ("cover" as const),
      featured,
    };

    const query = isNew
      ? supabase.from("products").insert(payload)
      : supabase.from("products").update(payload).eq("id", id);

    const { error: saveError } = await query;
    setSaving(false);

    if (saveError) {
      setError("No se pudo guardar el producto. Revisa los datos e inténtalo de nuevo.");
      toast("No se pudo guardar el producto", "error");
      return;
    }
    toast(isNew ? `«${payload.name}» ya está en tu catálogo` : "Cambios guardados", "success");
    navigate("/admin/productos");
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    const { error: deleteError } = await supabase.from("products").delete().eq("id", id);
    if (deleteError) {
      setDeleting(false);
      toast("No se pudo eliminar el producto", "error");
      return;
    }
    toast(`«${name}» eliminado`, "info");
    navigate("/admin/productos");
  };

  const salePreview = onSale ? discountPercent(Number(price) || 0, salePrice ? Number(salePrice) : null) : 0;

  if (loading) return <LoadingSpinner />;
  if (notFound) {
    return (
      <div className="product-form-page">
        <p className="admin-empty">Producto no encontrado.</p>
        <Link to="/admin/productos" className="btn btn-outline">
          Volver a productos
        </Link>
      </div>
    );
  }

  return (
    <div className="product-form-page">
      <Link to="/admin/productos" className="product-form-back">
        <ArrowLeftIcon size={15} />
        Volver a productos
      </Link>
      <h1 className="admin-page-title">{isNew ? "Nuevo producto" : "Editar producto"}</h1>
      <p className="admin-page-hint">
        {isNew
          ? "Completa lo esencial: imagen, nombre, precio y existencias. Lo demás puedes afinarlo después."
          : "Los cambios se reflejan en la tienda en cuanto guardas."}
      </p>

      <form onSubmit={handleSubmit} className="product-form">
        <section className="product-form-section">
          <h2>Imágenes</h2>
          <div className="admin-image-picker">
            {images.map((img, i) => (
              <div key={img} className={`product-form-thumb ${i === 0 ? "is-cover" : ""}`}>
                <img src={img} alt="" onClick={() => makeCover(i)} />
                <button type="button" className="admin-image-remove" onClick={() => removeImage(i)} aria-label="Quitar imagen">
                  <CloseIcon size={12} />
                </button>
                {i === 0 && <span className="product-form-cover-badge">Portada</span>}
              </div>
            ))}
            <label className={`admin-image-add ${uploading ? "is-uploading" : ""}`}>
              {uploading ? <span className="admin-mini-spinner" /> : <PlusIcon size={22} />}
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                onChange={(e) => {
                  handleUpload(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="product-form-hint">
            {images.length === 0 ? "Sube al menos una foto: los productos con imagen venden más." : "Toca una miniatura para hacerla portada."}
          </p>

          <label className="product-form-toggle">
            <input type="checkbox" checked={coverContain} onChange={(e) => setCoverContain(e.target.checked)} />
            Ajustar imagen de portada sin recortar (contain)
          </label>
        </section>

        <section className="product-form-section">
          <h2>Información</h2>
          <div className="field">
            <label>Nombre</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Precio normal</label>
            <input required type="number" min="0" step="any" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <label className="product-form-toggle">
            <input type="checkbox" checked={onSale} onChange={(e) => setOnSale(e.target.checked)} />
            Producto en oferta
          </label>
          {onSale && (
            <div className="field product-form-sale">
              <label>Precio con descuento</label>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder="Menor al precio normal"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
              />
              {salePreview > 0 && (
                <span className="product-form-sale-preview" key={salePreview}>
                  Se mostrará como <strong>−{salePreview}%</strong> · antes {formatCurrency(Number(price) || 0)}
                </span>
              )}
            </div>
          )}
          <label className="product-form-toggle">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Destacado / top ventas
          </label>
        </section>

        <section className="product-form-section">
          <h2>Categoría</h2>
          <div className="field">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="product-form-section">
          <h2>Nivel (puedes elegir varios)</h2>
          {levels.length === 0 && <p className="product-form-hint">Aún no hay niveles. Créalos en «Contenido de inicio».</p>}
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
        </section>

        <section className="product-form-section">
          <h2>Marca y existencias</h2>
          <div className="field">
            <label>Marca</label>
            <input required value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className="field">
            <label>Existencias (stock)</label>
            <input required type="number" min="0" step="1" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
          <div className="field">
            <label>Proveedor (opcional)</label>
            <input value={vendor} onChange={(e) => setVendor(e.target.value)} />
          </div>
          <div className="field">
            <label>Opciones / variantes (separadas por coma)</label>
            <input value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="Chico, Mediano, Grande" />
          </div>
        </section>

        <section className="product-form-section">
          <h2>Descripción</h2>
          <div className="field">
            <textarea
              rows={5}
              placeholder="Si la dejas vacía, se generará una descripción automática."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </section>

        {error && (
          <p className="admin-form-error" key={error}>
            {error}
          </p>
        )}

        <button
          type="submit"
          className={`btn btn-primary btn-block product-form-submit ${saving ? "btn-loading" : ""}`}
          disabled={saving || uploading}
        >
          {saving ? "Guardando" : isNew ? "Publicar producto" : "Guardar cambios"}
        </button>

        {!isNew && (
          <button
            type="button"
            className={`btn btn-danger btn-block product-form-delete ${deleting ? "btn-loading" : ""}`}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Eliminando" : "Eliminar producto"}
          </button>
        )}
      </form>
    </div>
  );
}
