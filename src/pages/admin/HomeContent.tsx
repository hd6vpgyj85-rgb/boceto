import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { uploadImage } from "../../lib/imageUpload";
import type { Level } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";
import "./HomeContent.css";

export default function HomeContent() {
  const [images, setImages] = useState<string[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: bannerRow }, { data: levelRows }] = await Promise.all([
      supabase.from("home_banner").select("*").eq("id", true).maybeSingle(),
      supabase.from("levels").select("*").order("display_order", { ascending: true }),
    ]);
    setImages((bannerRow?.images as string[] | undefined) ?? []);
    setLevels((levelRows as Level[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (msg: string) => {
    setSavedMessage(msg);
    window.setTimeout(() => setSavedMessage(null), 2500);
  };

  const saveBanner = async (nextImages: string[]) => {
    setImages(nextImages);
    await supabase.from("home_banner").update({ images: nextImages }).eq("id", true);
    flash("Banner actualizado");
  };

  const handleBannerUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingBanner(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      uploaded.push(await uploadImage(file, "banner"));
    }
    setUploadingBanner(false);
    saveBanner([...images, ...uploaded]);
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    saveBanner(next);
  };

  const removeImage = (index: number) => {
    saveBanner(images.filter((_, i) => i !== index));
  };

  const updateLevelImage = async (slug: string, file: File) => {
    const url = await uploadImage(file, "levels");
    await supabase.from("levels").update({ image_url: url }).eq("slug", slug);
    setLevels((prev) => prev.map((l) => (l.slug === slug ? { ...l, image_url: url } : l)));
    flash("Imagen de nivel actualizada");
  };

  const updateLevelField = (slug: string, field: "label" | "tagline", value: string) => {
    setLevels((prev) => prev.map((l) => (l.slug === slug ? { ...l, [field]: value } : l)));
  };

  const saveLevel = async (level: Level) => {
    await supabase.from("levels").update({ label: level.label, tagline: level.tagline }).eq("slug", level.slug);
    flash(`Nivel "${level.label}" guardado`);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Contenido de inicio</h1>
      </div>
      {savedMessage && <p className="checkout-coupon-ok">{savedMessage}</p>}

      <section className="home-content-section">
        <h2>Banner promocional</h2>
        <p className="home-content-hint">Sube, reordena o quita las imágenes del carrusel de inicio.</p>
        <div className="admin-image-picker">
          {images.map((img, i) => (
            <div key={img} className="banner-manage-item">
              <div className="admin-image-thumb-wrap is-cover">
                <img src={img} alt="" />
                <button type="button" className="admin-image-remove" onClick={() => removeImage(i)}>
                  ×
                </button>
              </div>
              <div className="banner-manage-controls">
                <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0}>
                  ‹
                </button>
                <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1}>
                  ›
                </button>
              </div>
            </div>
          ))}
          <label className="admin-image-add">
            {uploadingBanner ? "…" : "+"}
            <input type="file" accept="image/*" multiple onChange={(e) => handleBannerUpload(e.target.files)} />
          </label>
        </div>
      </section>

      <section className="home-content-section">
        <h2>Elige tu nivel</h2>
        <p className="home-content-hint">Imagen y etiqueta de cada círculo en la página de inicio.</p>
        <div className="level-editor-row">
          {levels.map((level) => (
            <div key={level.slug} className="level-editor-item">
              <div className="level-editor-circle">
                {level.image_url && <img src={level.image_url} alt={level.label} />}
                <label className="admin-inline-circle-edit" title="Cambiar imagen">
                  <GalleryIcon />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && updateLevelImage(level.slug, e.target.files[0])}
                  />
                </label>
              </div>
              <input
                className="level-editor-label-input"
                value={level.label}
                onChange={(e) => updateLevelField(level.slug, "label", e.target.value)}
              />
              <input
                className="level-editor-tagline-input"
                placeholder="Tagline (opcional)"
                value={level.tagline ?? ""}
                onChange={(e) => updateLevelField(level.slug, "tagline", e.target.value)}
              />
              <button type="button" className="btn btn-outline btn-sm" onClick={() => saveLevel(level)}>
                Guardar
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function GalleryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
