import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { usePageTitle, useSiteSettings } from "../../hooks/useSiteData";
import { ArrowLeftIcon, GiftIcon, ShieldIcon } from "../../components/Icons";
import "./Login.css";

export default function Login() {
  usePageTitle("Acceso");
  const { signIn } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const id = identifier.trim();
    const isEmail = id.includes("@");

    if (!isEmail) {
      const { data: customerRows } = await supabase.rpc("authenticate_customer_by_code", {
        p_phone: id.replace(/[^0-9]/g, ""),
        p_code: secret.trim(),
      });
      if (customerRows && customerRows.length > 0) {
        navigate(`/fidelidad/${customerRows[0].token}`);
        return;
      }
    }

    const { error: authError } = isEmail ? await signIn(id, secret) : { error: "no-match" };
    setLoading(false);

    if (authError) {
      setError(
        isEmail
          ? "Correo o contraseña incorrectos."
          : "No encontramos una tarjeta con ese WhatsApp y código. Revisa ambos datos.",
      );
      setErrorCount((n) => n + 1);
      return;
    }

    navigate("/admin");
  };

  return (
    <div className="login-page">
      <div className="login-orb login-orb-1" aria-hidden="true" />
      <div className="login-orb login-orb-2" aria-hidden="true" />

      <form key={errorCount} className={`login-card card ${errorCount ? "is-error" : ""}`} onSubmit={handleSubmit}>
        <Link to="/" className="login-brand">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={settings.business_name} />
          ) : (
            <span>
              {settings?.business_name}
              <span className="site-logo-dot" />
            </span>
          )}
        </Link>

        <div className="login-head">
          <h1>Bienvenido</h1>
          <p>Entra a tu tarjeta de recompensas o al panel de tu tienda.</p>
        </div>

        <div className="login-modes">
          <div>
            <GiftIcon size={18} />
            <span>
              <strong>Cliente</strong>
              WhatsApp + código de acceso
            </span>
          </div>
          <div>
            <ShieldIcon size={18} />
            <span>
              <strong>Administrador</strong>
              Correo + contraseña
            </span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="identifier">Correo o número de WhatsApp</label>
          <input
            id="identifier"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>

        <div className="field">
          <label htmlFor="secret">Contraseña o código de acceso</label>
          <div className="login-secret">
            <input
              id="secret"
              type={showSecret ? "text" : "password"}
              required
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowSecret((v) => !v)} aria-label={showSecret ? "Ocultar" : "Mostrar"}>
              {showSecret ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </div>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className={`btn btn-primary btn-block ${loading ? "btn-loading" : ""}`} disabled={loading}>
          {loading ? "Verificando" : "Entrar"}
        </button>

        <Link to="/" className="login-back">
          <ArrowLeftIcon size={14} />
          Volver a la tienda
        </Link>
      </form>
    </div>
  );
}
