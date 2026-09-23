import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { uploadImage } from "../../lib/imageUpload";
import { slugify } from "../../lib/format";
import { useSiteData } from "../../context/SiteDataContext";
import { useToast } from "../../context/ToastContext";
import type { Category } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";
import "./Categories.css";

export default function Categories() {
  const { refresh } = useSiteData();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  const load = async () => {
    const [{ data }, { data: productRows }] = await Promise.all([
      supabase.from("categories").select("*").order("display_order", { ascending: true }),
      supabase.from("products").select("category"),
    ]);
    const nextCounts: Record<string, number> = {};
    for (const row of (productRows as { category: string | null }[] | null) ?? []) {
      if (row.category) nextCounts[row.category] = (nextCounts[row.category] ?? 0) + 1;
    }
    setCategories((data as Category[] | null) ?? []);
    setCounts(nextCounts);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (category: Category) => {
    const count = counts[category.slug] ?? 0;
    const warning = count
      ? `\n\nTiene ${count} producto${count === 1 ? "" : "s"}: no se borran, solo quedan sin categoría.`
      : "";
    if (!window.confirm(`¿Eliminar la categoría "${category.name}"?${warning}`)) return;
    const { error } = await supabase.from("categories").delete().eq("slug", category.slug);
    if (error) {
      toast("No se pudo eliminar la categoría", "error");
      return;
    }
    toast(`Categoría "${category.name}" eliminada`);
    load();
    refresh();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Categorías</h1>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing("new")}>
          + Nueva categoría
        </button>
      </div>
      <p className="admin-page-hint">
        Cada categoría tiene su propia página en la tienda y aparece en el menú de navegación, en el orden de
        esta lista.
      </p>

      {categories.length === 0 ? (
        <p className="admin-empty">Aún no hay categorías. Crea la primera para organizar tu catálogo.</p>
      ) : (
        <div className="category-admin-grid">
          {categories.map((cat, i) => (
            <article key={cat.slug} className="category-admin-card card" style={{ animationDelay: `${i * 60}ms` }}>
              <div
                className="category-admin-banner"
                style={cat.banner_image_url ? { backgroundImage: `url(${cat.banner_image_url})` } : undefined}
              >
                <span className="category-admin-count">
                  {counts[cat.slug] ?? 0} producto{(counts[cat.slug] ?? 0) === 1 ? "" : "s"}
                </span>
              </div>
              <div className="category-admin-body">
                <h2>{cat.name}</h2>
                <p>{cat.tagline || "Sin frase"}</p>
                <span className="category-admin-slug">/{cat.slug}</span>
              </div>
              <div className="category-admin-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(cat)}>
                  Editar
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(cat)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <CategoryFormModal
          category={editing === "new" ? null : editing}
          existing={categories}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            toast(message);
            load();
            refresh();
          }}
        />
      )}
    </div>
  );
}

function CategoryFormModal({
  category,
  existing,
  onClose,
  onSaved,
}: {
  category: Category | null;
  existing: Category[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [tagline, setTagline] = useState(category?.tagline ?? "");
  const [bannerUrl, setBannerUrl] = useState(category?.banner_image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      setBannerUrl(await uploadImage(file, "categories"));
    } catch {
      setError("No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (category) {
      const { error: saveError } = await supabase
        .from("categories")
        .update({ name, tagline, banner_image_url: bannerUrl || null })
        .eq("slug", category.slug);
      setSaving(false);
      if (saveError) return setError("No se pudo guardar la categoría.");
      return onSaved(`Categoría "${name}" guardada`);
    }

    const base = slugify(name) || "categoria";
    const reserved = ["productos", "ofertas", "producto", "carrito", "checkout", "buscar", "terminos", "privacidad", "admin", "fidelidad"];
    let slug = base;
    let n = 2;
    while (reserved.includes(slug) || existing.some((c) => c.slug === slug)) slug = `${base}-${n++}`;
    const nextOrder = existing.length ? Math.max(...existing.map((c) => c.display_order)) + 1 : 1;

    const { error: insertError } = await supabase
      .from("categories")
      .insert({ slug, name, tagline: tagline || null, banner_image_url: bannerUrl || null, display_order: nextOrder });
    setSaving(false);
    if (insertError) return setError("No se pudo crear la categoría.");
    onSaved(`Categoría "${name}" creada`);
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-head">
          <h2>{category ? "Editar categoría" : "Nueva categoría"}</h2>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="field field-full">
              <label>Nombre</label>
              <input required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Novedades" />
            </div>
            <div className="field field-full">
              <label>Frase corta (opcional)</label>
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Ej. Lo último que llegó a la tienda" />
            </div>
            <div className="field field-full">
              <label>Imagen de banner</label>
              <div className="admin-image-picker">
                {bannerUrl && (
                  <div className="admin-image-thumb-wrap is-cover category-admin-thumb">
                    <img src={bannerUrl} alt="" />
                    <button type="button" className="admin-image-remove" onClick={() => setBannerUrl("")} aria-label="Quitar imagen">
                      ×
                    </button>
                  </div>
                )}
                <label className="admin-image-add">
                  {uploading ? <span className="admin-mini-spinner" /> : "+"}
                  <input type="file" accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0])} />
                </label>
              </div>
            </div>
          </div>
          {error && <p className="admin-form-error">{error}</p>}
          <div className="admin-form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
              {saving ? "Guardando…" : category ? "Guardar" : "Crear categoría"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
