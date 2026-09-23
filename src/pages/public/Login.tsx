import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: customerRows } = await supabase.rpc("authenticate_customer_by_code", {
      p_phone: identifier.trim(),
      p_code: secret.trim(),
    });

    if (customerRows && customerRows.length > 0) {
      navigate(`/fidelidad/${customerRows[0].token}`);
      return;
    }

    const { error: authError } = await signIn(identifier.trim(), secret);
    setLoading(false);

    if (authError) {
      setError("No encontramos una cuenta con esos datos. Verifica e intenta de nuevo.");
      return;
    }

    navigate("/admin");
  };

  return (
    <div className="login-page">
      <form className="login-card card" onSubmit={handleSubmit}>
        <h1>Acceso</h1>
        <p className="login-subtitle">Ingresa como cliente de fidelidad o como administrador.</p>

        <div className="field">
          <label htmlFor="identifier">Correo o número de WhatsApp</label>
          <input
            id="identifier"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="field">
          <label htmlFor="secret">Contraseña o código de acceso</label>
          <input
            id="secret"
            type="password"
            required
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Ingresando…" : "Entrar"}
        </button>

        <Link to="/" className="login-back">
          ← Volver a la tienda
        </Link>
      </form>
    </div>
  );
}
