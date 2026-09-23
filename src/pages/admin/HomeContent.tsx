import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { uploadImage } from "../../lib/imageUpload";
import { slugify } from "../../lib/format";
import { useSiteData } from "../../context/SiteDataContext";
import { useToast } from "../../context/ToastContext";
import type { Level } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon, PlusIcon } from "../../components/Icons";
import "./adminShared.css";
import "./HomeContent.css";

export default function HomeContent() {
  const { refresh } = useSiteData();
  const toast = useToast();
  const [images, setImages] = useState<string[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLevel, setUploadingLevel] = useState<string | null>(null);
  const [savingLevel, setSavingLevel] = useState<string | null>(null);
  const [dirtyLevels, setDirtyLevels] = useState<Set<string>>(new Set());
  const [addingLevel, setAddingLevel] = useState(false);
  const [newLevelLabel, setNewLevelLabel] = useState("");

  const load = async () => {
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

  const saveBanner = async (nextImages: string[], message: string) => {
    const previous = images;
    setImages(nextImages);
    const { error } = await supabase.from("home_banner").update({ images: nextImages }).eq("id", true);
    if (error) {
      setImages(previous);
      toast("No se pudo actualizar el banner", "error");
      return;
    }
    toast(message, "success");
  };

  const handleBannerUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setUploadingBanner(true);
    const uploaded: string[] = [];
    for (const file of list) {
      try {
        uploaded.push(await uploadImage(file, "banner"));
      } catch {
        toast(`No se pudo subir «${file.name}»`, "error");
      }
    }
    setUploadingBanner(false);
    if (uploaded.length === 0) return;
    saveBanner([...images, ...uploaded], uploaded.length === 1 ? "Imagen agregada al banner" : `${uploaded.length} imágenes agregadas al banner`);
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    saveBanner(next, "Orden del banner actualizado");
  };

  const removeImage = (index: number) => {
    saveBanner(
      images.filter((_, i) => i !== index),
      "Imagen quitada del banner",
    );
  };

  const markDirty = (slug: string, dirty: boolean) => {
    setDirtyLevels((prev) => {
      const next = new Set(prev);
      if (dirty) next.add(slug);
      else next.delete(slug);
      return next;
    });
  };

  const updateLevelImage = async (slug: string, file: File) => {
    setUploadingLevel(slug);
    try {
      const url = await uploadImage(file, "levels");
      const { error } = await supabase.from("levels").update({ image_url: url }).eq("slug", slug);
      if (error) throw error;
      setLevels((prev) => prev.map((l) => (l.slug === slug ? { ...l, image_url: url } : l)));
      toast("Imagen del nivel actualizada", "success");
      refresh();
    } catch {
      toast("No se pudo actualizar la imagen", "error");
    }
    setUploadingLevel(null);
  };

  const updateLevelField = (slug: string, field: "label" | "tagline", value: string) => {
    setLevels((prev) => prev.map((l) => (l.slug === slug ? { ...l, [field]: value } : l)));
    markDirty(slug, true);
  };

  const saveLevel = async (level: Level) => {
    if (!level.label.trim()) {
      toast("El nivel necesita un nombre", "error");
      return;
    }
    setSavingLevel(level.slug);
    const { error } = await supabase
      .from("levels")
      .update({ label: level.label.trim(), tagline: level.tagline?.trim() || null })
      .eq("slug", level.slug);
    setSavingLevel(null);
    if (error) {
      toast("No se pudo guardar el nivel", "error");
      return;
    }
    markDirty(level.slug, false);
    toast(`Nivel «${level.label.trim()}» guardado`, "success");
    refresh();
  };

  const addLevel = async () => {
    const label = newLevelLabel.trim();
    if (!label) return;
    let slug = slugify(label) || "nivel";
    if (levels.some((l) => l.slug === slug)) slug = `${slug}-${Date.now().toString(36)}`;
    const nextOrder = levels.length > 0 ? Math.max(...levels.map((l) => l.display_order)) + 1 : 1;

    const { error } = await supabase
      .from("levels")
      .insert({ slug, label, image_url: null, tagline: null, display_order: nextOrder });

    if (error) {
      toast("No se pudo crear el nivel", "error");
      return;
    }
    setNewLevelLabel("");
    setAddingLevel(false);
    toast(`Nivel «${label}» creado`, "success");
    await load();
    refresh();
  };

  const deleteLevel = async (level: Level) => {
    if (!window.confirm(`¿Eliminar el nivel «${level.label}»? Los productos que lo tenían asignado dejarán de mostrarlo, pero no se borran.`)) {
      return;
    }
    const { error } = await supabase.from("levels").delete().eq("slug", level.slug);
    if (error) {
      toast("No se pudo eliminar el nivel", "error");
      return;
    }
    toast(`Nivel «${level.label}» eliminado`, "info");
    markDirty(level.slug, false);
    await load();
    refresh();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Contenido de inicio</h1>
      </div>
      <p className="admin-page-hint">
        Lo primero que ven tus clientes. Los cambios del banner se guardan en automático; los niveles, al presionar
        «Guardar».
      </p>

      <section className="card home-content-section">
        <div className="home-content-section-head">
          <div>
            <h2>Banner promocional</h2>
            <p className="home-content-hint">
              Sube, reordena o quita las imágenes del carrusel de inicio. Recomendado: 1600 × 700 px, horizontal.
            </p>
          </div>
          <span className="home-content-count">
            {images.length} imagen{images.length === 1 ? "" : "es"}
          </span>
        </div>
        <div className="admin-image-picker banner-manage-list">
          {images.map((img, i) => (
            <div key={img} className="banner-manage-item">
              <div className="admin-image-thumb-wrap banner-manage-thumb">
                <img src={img} alt={`Banner ${i + 1}`} />
                <span className="banner-manage-index">{i + 1}</span>
                <button type="button" className="admin-image-remove" onClick={() => removeImage(i)} aria-label="Quitar imagen">
                  <CloseIcon size={12} />
                </button>
              </div>
              <div className="banner-manage-controls">
                <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Mover a la izquierda">
                  <ArrowLeftIcon size={12} />
                </button>
                <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} aria-label="Mover a la derecha">
                  <ArrowRightIcon size={12} />
                </button>
              </div>
            </div>
          ))}
          <label className={`admin-image-add banner-manage-add ${uploadingBanner ? "is-uploading" : ""}`}>
            {uploadingBanner ? <span className="admin-mini-spinner" /> : <PlusIcon size={22} />}
            <span className="banner-manage-add-label">{uploadingBanner ? "Subiendo" : "Agregar"}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploadingBanner}
              onChange={(e) => {
                handleBannerUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </section>

      <section className="card home-content-section">
        <div className="home-content-section-head">
          <div>
            <h2>Elige tu nivel</h2>
            <p className="home-content-hint">
              Imagen y nombre de cada círculo en la página de inicio. Al agregar o eliminar un nivel, el filtro del
              catálogo y el buscador se actualizan solos.
            </p>
          </div>
          <span className="home-content-count">
            {levels.length} nivel{levels.length === 1 ? "" : "es"}
          </span>
        </div>
        <div className="level-editor-row">
          {levels.map((level, i) => {
            const dirty = dirtyLevels.has(level.slug);
            return (
              <div key={level.slug} className={`level-editor-item ${dirty ? "is-dirty" : ""}`} style={{ animationDelay: `${i * 60}ms` }}>
                <div className="level-editor-circle">
                  {level.image_url ? (
                    <img src={level.image_url} alt={level.label} key={level.image_url} />
                  ) : (
                    <span className="level-editor-initial">{level.label.charAt(0).toUpperCase() || "?"}</span>
                  )}
                  {uploadingLevel === level.slug && (
                    <span className="level-editor-uploading">
                      <span className="admin-mini-spinner" />
                    </span>
                  )}
                  <label className="admin-inline-circle-edit" title="Cambiar imagen">
                    <GalleryIcon />
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingLevel !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) updateLevelImage(level.slug, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <input
                  className="level-editor-label-input"
                  value={level.label}
                  aria-label="Nombre del nivel"
                  onChange={(e) => updateLevelField(level.slug, "label", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveLevel(level)}
                />
                <input
                  className="level-editor-tagline-input"
                  placeholder="Tagline (opcional)"
                  aria-label="Tagline del nivel"
                  value={level.tagline ?? ""}
                  onChange={(e) => updateLevelField(level.slug, "tagline", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveLevel(level)}
                />
                <div className="level-editor-actions">
                  <button
                    type="button"
                    className={`btn btn-sm ${dirty ? "btn-primary" : "btn-outline"} ${savingLevel === level.slug ? "btn-loading" : ""}`}
                    onClick={() => saveLevel(level)}
                    disabled={savingLevel === level.slug}
                  >
                    Guardar
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteLevel(level)}>
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}

          {addingLevel ? (
            <div className="level-editor-item level-editor-item-new">
              <div className="level-editor-circle level-editor-circle-placeholder">
                <GalleryIcon />
              </div>
              <input
                className="level-editor-label-input"
                placeholder="Nombre del nivel nuevo"
                autoFocus
                value={newLevelLabel}
                onChange={(e) => setNewLevelLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addLevel();
                  if (e.key === "Escape") {
                    setAddingLevel(false);
                    setNewLevelLabel("");
                  }
                }}
              />
              <div className="level-editor-actions">
                <button type="button" className="btn btn-primary btn-sm" onClick={addLevel} disabled={!newLevelLabel.trim()}>
                  Crear
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setAddingLevel(false);
                    setNewLevelLabel("");
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="level-editor-add" onClick={() => setAddingLevel(true)} aria-label="Agregar nivel">
              <PlusIcon size={28} />
              <span>Nuevo nivel</span>
            </button>
          )}
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
