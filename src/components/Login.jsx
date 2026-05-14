import { useState } from "react";

export default function Login({ supabase, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Email o contraseña incorrectos");
    } else {
      onClose();
    }
  };

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="form-panel" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <span className="form-title">◈ ACCESO</span>
          <button className="form-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-body">
          <div style={{ fontFamily: "var(--font-display)", fontSize: "0.5rem", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "1.5rem", lineHeight: 1.8 }}>
            ZONA RESTRINGIDA — Acceso solo por invitación.
          </div>
          <div className="form-group">
            <label className="form-label">EMAIL</label>
            <input type="email" className="form-input" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">CONTRASEÑA</label>
            <input type="password" className="form-input" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          </div>
          {error && (
            <div style={{ color: "var(--neon2)", fontFamily: "var(--font-display)", fontSize: "0.55rem", letterSpacing: "0.15em" }}>
              ✕ {error}
            </div>
          )}
        </div>
        <div className="form-footer">
          <button className="btn-secondary" onClick={onClose}>CANCELAR</button>
          <button className="btn-primary" onClick={handleLogin} disabled={loading}>
            {loading ? "..." : "ENTRAR"}
          </button>
        </div>
      </div>
    </div>
  );
}
