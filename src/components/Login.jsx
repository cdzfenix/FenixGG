import { useState } from "react";

export default function Login({ supabase, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "reset"
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError("Email o contraseña incorrectos");
    else onClose();
  };

  const handleReset = async () => {
    if (!email.trim()) { setError("Introduce tu email primero"); return; }
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (error) setError("No se pudo enviar el email");
    else setResetSent(true);
  };

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="form-panel" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <span className="form-title">
            {mode === "login" ? "◈ ACCESO" : "◈ RECUPERAR CONTRASEÑA"}
          </span>
          <button className="form-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-body">
          <div style={{ fontFamily: "var(--font-display)", fontSize: "0.5rem", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "1.5rem", lineHeight: 1.8 }}>
            {mode === "login" ? "ZONA RESTRINGIDA — Acceso solo por invitación." : "TE ENVIAREMOS UN ENLACE A TU EMAIL PARA RESTABLECER LA CONTRASEÑA."}
          </div>

          <div className="form-group">
            <label className="form-label">EMAIL</label>
            <input type="email" className="form-input" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleReset())}
              autoFocus />
          </div>

          {mode === "login" && (
            <div className="form-group">
              <label className="form-label">CONTRASEÑA</label>
              <input type="password" className="form-input" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
            </div>
          )}

          {error && (
            <div style={{ color: "var(--neon2)", fontFamily: "var(--font-display)", fontSize: "0.55rem", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>
              ✕ {error}
            </div>
          )}

          {resetSent && (
            <div style={{ color: "var(--neon)", fontFamily: "var(--font-display)", fontSize: "0.55rem", letterSpacing: "0.15em" }}>
              ✓ EMAIL ENVIADO — REVISA TU BANDEJA DE ENTRADA
            </div>
          )}

          {mode === "login" && !resetSent && (
            <button
              onClick={() => { setMode("reset"); setError(""); }}
              style={{ background: "none", border: "none", color: "var(--text-dim)", fontFamily: "var(--font-display)", fontSize: "0.5rem", letterSpacing: "0.15em", cursor: "pointer", padding: 0, marginTop: "0.5rem", textDecoration: "underline" }}
            >
              ¿OLVIDASTE TU CONTRASEÑA?
            </button>
          )}

          {mode === "reset" && !resetSent && (
            <button
              onClick={() => { setMode("login"); setError(""); }}
              style={{ background: "none", border: "none", color: "var(--text-dim)", fontFamily: "var(--font-display)", fontSize: "0.5rem", letterSpacing: "0.15em", cursor: "pointer", padding: 0, marginTop: "0.5rem", textDecoration: "underline" }}
            >
              ← VOLVER AL LOGIN
            </button>
          )}
        </div>

        <div className="form-footer">
          <button className="btn-secondary" onClick={onClose}>CANCELAR</button>
          {mode === "login" ? (
            <button className="btn-primary" onClick={handleLogin} disabled={loading}>
              {loading ? "..." : "ENTRAR"}
            </button>
          ) : (
            <button className="btn-primary" onClick={handleReset} disabled={loading || resetSent}>
              {loading ? "..." : "ENVIAR EMAIL"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
