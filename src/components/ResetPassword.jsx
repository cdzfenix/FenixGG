import { useState } from "react";

export default function ResetPassword({ supabase, onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError("");
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError("Error al actualizar la contraseña");
    else {
      setSuccess(true);
      setTimeout(() => onDone(), 2000);
    }
  };

  return (
    <div className="form-overlay">
      <div className="form-panel" style={{ maxWidth: 380 }}>
        <div className="form-header">
          <span className="form-title">◈ NUEVA CONTRASEÑA</span>
        </div>
        <div className="form-body">
          <div style={{ fontFamily: "var(--font-display)", fontSize: "0.5rem", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "1.5rem", lineHeight: 1.8 }}>
            ESTABLECE TU NUEVA CONTRASEÑA DE ACCESO.
          </div>
          <div className="form-group">
            <label className="form-label">NUEVA CONTRASEÑA</label>
            <input
              type="password" className="form-input" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">CONFIRMAR CONTRASEÑA</label>
            <input
              type="password" className="form-input" value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          {error && (
            <div style={{ color: "var(--neon2)", fontFamily: "var(--font-display)", fontSize: "0.55rem", letterSpacing: "0.15em" }}>
              ✕ {error}
            </div>
          )}
          {success && (
            <div style={{ color: "var(--neon)", fontFamily: "var(--font-display)", fontSize: "0.55rem", letterSpacing: "0.15em" }}>
              ✓ CONTRASEÑA ACTUALIZADA — REDIRIGIENDO...
            </div>
          )}
        </div>
        <div className="form-footer">
          <button className="btn-primary" onClick={handleSave} disabled={loading || success}>
            {loading ? "..." : "GUARDAR"}
          </button>
        </div>
      </div>
    </div>
  );
}
