import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { uploadImage } from "../../lib/imageUpload";
import { CURRENCIES, setCurrency } from "../../lib/format";
import { useSiteData } from "../../context/SiteDataContext";
import { useToast } from "../../context/ToastContext";
import type { SiteSettings } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import { CloseIcon, PlusIcon } from "../../components/Icons";
import "./adminShared.css";
import "./SiteSettingsPage.css";

type ImageKey = "logo_url" | "store_photo_url";

export default function SiteSettingsPage() {
  const { refresh } = useSiteData();
  const toast = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState<ImageKey | null>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle()
      .then(({ data }) => setSettings(data as SiteSettings));
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const update = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
  };

  const handleImageUpload = async (key: ImageKey, folder: string, file: File | undefined) => {
    if (!file || !settings) return;
    setUploading(key);
    try {
      const url = await uploadImage(file, folder);
      update(key, url);
      toast("Imagen lista. Recuerda guardar los cambios.", "info");
    } catch {
      toast("No se pudo subir la imagen", "error");
    }
    setUploading(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    const { id: _id, updated_at: _updatedAt, ...rest } = settings;
    void _id;
    void _updatedAt;
    const payload = { ...rest, whatsapp: rest.whatsapp.replace(/\D/g, "") };
    const { error } = await supabase.from("site_settings").update(payload).eq("id", true);
    setSaving(false);
    if (error) {
      toast("No se pudo guardar la configuración", "error");
      return;
    }
    setSettings((prev) => (prev ? { ...prev, whatsapp: payload.whatsapp } : prev));
    setDirty(false);
    setCurrency(payload.currency);
    await refresh();
    toast("Configuración guardada", "success");
  };

  if (!settings) return <LoadingSpinner />;

  const imagePicker = (key: ImageKey, folder: string, removable: boolean) => {
    const value = settings[key];
    return (
      <div className="admin-image-picker">
        {value && (
          <div className="admin-image-thumb-wrap is-cover" key={value}>
            <img src={value} alt="" />
            {removable && (
              <button type="button" className="admin-image-remove" onClick={() => update(key, null)} aria-label="Quitar imagen">
                <CloseIcon size={12} />
              </button>
            )}
          </div>
        )}
        <label className={`admin-image-add ${uploading === key ? "is-uploading" : ""}`}>
          {uploading === key ? <span className="admin-mini-spinner" /> : <PlusIcon size={22} />}
          <input
            type="file"
            accept="image/*"
            disabled={uploading !== null}
            onChange={(e) => {
              handleImageUpload(key, folder, e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    );
  };

  return (
    <div className="settings-page">
      <div className="admin-page-head">
        <h1 className="admin-page-title">Configuración del negocio</h1>
      </div>
      <p className="admin-page-hint">
        Todo lo que cambies aquí se refleja al instante en la tienda: nombre, contacto, moneda y textos principales.
      </p>

      <form onSubmit={handleSubmit} className="settings-form">
        <section className="card settings-section">
          <div className="settings-section-head">
            <span className="settings-section-index">01</span>
            <div>
              <h2>Identidad</h2>
              <p>Cómo se presenta tu tienda en el encabezado, pestañas del navegador y al compartir enlaces.</p>
            </div>
          </div>
          <div className="admin-form-grid">
            <div className="field">
              <label>Nombre del negocio</label>
              <input required value={settings.business_name} onChange={(e) => update("business_name", e.target.value)} />
            </div>
            <div className="field">
              <label>Tagline</label>
              <input value={settings.tagline} onChange={(e) => update("tagline", e.target.value)} placeholder="Tu tienda en línea de confianza" />
            </div>
            <div className="field field-full">
              <label>Logo</label>
              <span className="field-hint">Opcional. Si no subes uno, se usa el nombre del negocio como logotipo de texto.</span>
              {imagePicker("logo_url", "logo", true)}
            </div>
          </div>
        </section>

        <section className="card settings-section">
          <div className="settings-section-head">
            <span className="settings-section-index">02</span>
            <div>
              <h2>Tienda</h2>
              <p>Mensajes que ven tus clientes apenas entran y la moneda en la que se muestran los precios.</p>
            </div>
          </div>
          <div className="admin-form-grid">
            <div className="field field-full">
              <label>Título principal de la portada</label>
              <input value={settings.hero_title} onChange={(e) => update("hero_title", e.target.value)} placeholder="Todo lo que buscas, en un solo lugar" />
            </div>
            <div className="field">
              <label>Moneda</label>
              <select value={settings.currency} onChange={(e) => update("currency", e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Vista previa</label>
              <CurrencyPreview code={settings.currency} />
            </div>
          </div>
        </section>

        <section className="card settings-section">
          <div className="settings-section-head">
            <span className="settings-section-index">03</span>
            <div>
              <h2>Contacto</h2>
              <p>Los pedidos llegan a este WhatsApp. Verifica que el número incluya el código de país.</p>
            </div>
          </div>
          <div className="admin-form-grid">
            <div className="field">
              <label>WhatsApp</label>
              <input
                required
                inputMode="numeric"
                value={settings.whatsapp}
                onChange={(e) => update("whatsapp", e.target.value)}
                placeholder="5215512345678"
              />
              <span className="field-hint">Solo números, con código de país.</span>
            </div>
            <div className="field">
              <label>Teléfono para mostrar</label>
              <input value={settings.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+52 55 1234 5678" />
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
              <input type="url" value={settings.map_url ?? ""} onChange={(e) => update("map_url", e.target.value)} placeholder="https://maps.google.com/..." />
            </div>
            <div className="field field-full">
              <label>Foto del local</label>
              <span className="field-hint">Aparece en la sección «Visítanos» y como fondo del pie de página.</span>
              {imagePicker("store_photo_url", "store", true)}
            </div>
          </div>
        </section>

        <section className="card settings-section">
          <div className="settings-section-head">
            <span className="settings-section-index">04</span>
            <div>
              <h2>Redes sociales</h2>
              <p>Deja vacío cualquier campo para ocultar ese ícono en el sitio.</p>
            </div>
          </div>
          <div className="admin-form-grid">
            <div className="field">
              <label>Instagram</label>
              <input type="url" value={settings.instagram_url ?? ""} onChange={(e) => update("instagram_url", e.target.value)} placeholder="https://instagram.com/..." />
            </div>
            <div className="field">
              <label>Facebook</label>
              <input type="url" value={settings.facebook_url ?? ""} onChange={(e) => update("facebook_url", e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div className="field">
              <label>TikTok</label>
              <input type="url" value={settings.tiktok_url ?? ""} onChange={(e) => update("tiktok_url", e.target.value)} placeholder="https://tiktok.com/@..." />
            </div>
          </div>
        </section>

        <section className="card settings-section">
          <div className="settings-section-head">
            <span className="settings-section-index">05</span>
            <div>
              <h2>Horario y pie de página</h2>
              <p>Escribe un horario por renglón, por ejemplo «Lunes a viernes: 10:00 – 19:00».</p>
            </div>
          </div>
          <div className="field">
            <label>Horario de atención</label>
            <textarea rows={4} value={settings.hours} onChange={(e) => update("hours", e.target.value)} />
          </div>
          <div className="field">
            <label>Nota del pie de página</label>
            <input value={settings.footer_note} onChange={(e) => update("footer_note", e.target.value)} />
          </div>
        </section>

        <div className={`settings-savebar ${dirty ? "is-dirty" : ""}`}>
          <span className="settings-savebar-status">
            <span className="settings-savebar-dot" />
            {dirty ? "Tienes cambios sin guardar" : "Todo está guardado"}
          </span>
          <button type="submit" className={`btn btn-primary ${saving ? "btn-loading" : ""}`} disabled={saving || !dirty}>
            {saving ? "Guardando" : "Guardar configuración"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CurrencyPreview({ code }: { code: string }) {
  const currency = CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
  const sample = new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    maximumFractionDigits: 0,
  }).format(1299);
  return (
    <div className="settings-currency-preview" key={code}>
      {sample}
    </div>
  );
}
