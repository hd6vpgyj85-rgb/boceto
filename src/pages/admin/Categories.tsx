import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { uploadImage } from "../../lib/imageUpload";
import type { Category } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("display_order", { ascending: true });
    setCategories((data as Category[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Categorías</h1>
      </div>
      <p className="admin-empty" style={{ padding: "0 0 20px", textAlign: "left" }}>
        La cantidad de categorías es fija en el código. Aquí puedes editar el nombre, la frase y la imagen
        de banner de cada una — se usan también en el menú de navegación.
      </p>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>Nombre</th>
              <th>Tagline</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.slug}>
                <td>{cat.banner_image_url && <img src={cat.banner_image_url} alt="" className="admin-row-thumb" />}</td>
                <td>{cat.name}</td>
                <td>{cat.tagline}</td>
                <td>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(cat)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <CategoryFormModal category={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function CategoryFormModal({
  category,
  onClose,
  onSaved,
}: {
  category: Category;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [tagline, setTagline] = useState(category.tagline ?? "");
  const [bannerUrl, setBannerUrl] = useState(category.banner_image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file, "categories");
    setBannerUrl(url);
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase
      .from("categories")
      .update({ name, tagline, banner_image_url: bannerUrl || null })
      .eq("slug", category.slug);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-head">
          <h2>Editar categoría</h2>
          <button type="button" className="admin-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="field field-full">
              <label>Nombre</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field field-full">
              <label>Tagline</label>
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </div>
            <div className="field field-full">
              <label>Imagen de banner</label>
              <div className="admin-image-picker">
                {bannerUrl && (
                  <div className="admin-image-thumb-wrap is-cover">
                    <img src={bannerUrl} alt="" />
                  </div>
                )}
                <label className="admin-image-add">
                  {uploading ? "…" : "+"}
                  <input type="file" accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0])} />
                </label>
              </div>
            </div>
          </div>
          <div className="admin-form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
