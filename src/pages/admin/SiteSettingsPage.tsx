import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { uploadImage } from "../../lib/imageUpload";
import type { SiteSettings } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./adminShared.css";
import "./SiteSettingsPage.css";

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingStorePhoto, setUploadingStorePhoto] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle()
      .then(({ data }) => setSettings(data as SiteSettings));
  }, []);

  const update = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file || !settings) return;
    setUploadingLogo(true);
    const url = await uploadImage(file, "logo");
    update("logo_url", url);
    setUploadingLogo(false);
  };

  const handleStorePhotoUpload = async (file: File | undefined) => {
    if (!file || !settings) return;
    setUploadingStorePhoto(true);
    const url = await uploadImage(file, "store");
    update("store_photo_url", url);
    setUploadingStorePhoto(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    const { id: _id, updated_at: _updatedAt, ...rest } = settings;
    void _id;
    void _updatedAt;
    await supabase.from("site_settings").update(rest).eq("id", true);
    setSaving(false);
    setSavedMessage("Configuración guardada");
    window.setTimeout(() => setSavedMessage(null), 2500);
  };

  if (!settings) return <LoadingSpinner />;

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Configuración del negocio</h1>
      </div>
      {savedMessage && <p className="checkout-coupon-ok">{savedMessage}</p>}

      <form onSubmit={handleSubmit} className="settings-form">
        <section className="card settings-section">
          <h2>Identidad</h2>
          <div className="admin-form-grid">
            <div className="field">
              <label>Nombre del negocio</label>
              <input required value={settings.business_name} onChange={(e) => update("business_name", e.target.value)} />
            </div>
            <div className="field">
              <label>Tagline</label>
              <input value={settings.tagline} onChange={(e) => update("tagline", e.target.value)} />
            </div>
            <div className="field field-full">
              <label>Logo (opcional — si no subes uno, se usa el nombre del negocio como logotipo de texto)</label>
              <div className="admin-image-picker">
                {settings.logo_url && (
                  <div className="admin-image-thumb-wrap is-cover">
                    <img src={settings.logo_url} alt="" />
                    <button type="button" className="admin-image-remove" onClick={() => update("logo_url", null)}>
                      ×
                    </button>
                  </div>
                )}
                <label className="admin-image-add">
                  {uploadingLogo ? "…" : "+"}
                  <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="card settings-section">
          <h2>Contacto</h2>
          <div className="admin-form-grid">
            <div className="field">
              <label>WhatsApp (solo números, con código de país)</label>
              <input required value={settings.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="573001234567" />
            </div>
            <div className="field">
              <label>Teléfono para mostrar</label>
              <input value={settings.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="field">
              <label>Correo</label>
              <input type="email" value={settings.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className="field">
              <label>Ciudad</label>
              <input value={settings.city} onChange={(e) => update("city", e.target.value)} />
            </div>
            <div className="field field-full">
              <label>Dirección</label>
              <input value={settings.address} onChange={(e) => update("address", e.target.value)} />
            </div>
            <div className="field field-full">
              <label>Enlace de Google Maps</label>
              <input value={settings.map_url ?? ""} onChange={(e) => update("map_url", e.target.value)} />
            </div>
            <div className="field field-full">
              <label>Foto del local (sección "Visítanos" y fondo del footer)</label>
              <div className="admin-image-picker">
                {settings.store_photo_url && (
                  <div className="admin-image-thumb-wrap is-cover">
                    <img src={settings.store_photo_url} alt="" />
                  </div>
                )}
                <label className="admin-image-add">
                  {uploadingStorePhoto ? "…" : "+"}
                  <input type="file" accept="image/*" onChange={(e) => handleStorePhotoUpload(e.target.files?.[0])} />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="card settings-section">
          <h2>Redes sociales</h2>
          <div className="admin-form-grid">
            <div className="field">
              <label>Instagram</label>
              <input value={settings.instagram_url ?? ""} onChange={(e) => update("instagram_url", e.target.value)} />
            </div>
            <div className="field">
              <label>Facebook</label>
              <input value={settings.facebook_url ?? ""} onChange={(e) => update("facebook_url", e.target.value)} />
            </div>
            <div className="field">
              <label>TikTok</label>
              <input value={settings.tiktok_url ?? ""} onChange={(e) => update("tiktok_url", e.target.value)} />
            </div>
          </div>
        </section>

        <section className="card settings-section">
          <h2>Horario</h2>
          <div className="field">
            <label>Horario de atención (una línea por renglón)</label>
            <textarea rows={4} value={settings.hours} onChange={(e) => update("hours", e.target.value)} />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Nota del pie de página</label>
            <input value={settings.footer_note} onChange={(e) => update("footer_note", e.target.value)} />
          </div>
        </section>

        <div className="admin-form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando…" : "Guardar configuración"}
          </button>
        </div>
      </form>
    </div>
  );
}
