import { useState } from "react";

export default function Login({ onLogin, onClose }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    const ok = onLogin(password);
    if (!ok) {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="form-overlay" onClick={onClose}>
      <div
        className={`form-panel ${shake ? "shake" : ""}`}
        style={{ maxWidth: 380 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="form-header">
          <span className="form-title">◈ ACCESO ADMIN</span>
          <button className="form-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-body">
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.55rem",
              letterSpacing: "0.2em",
              color: "var(--text-dim)",
              marginBottom: "1.5rem",
              lineHeight: 1.8,
            }}
          >
            ZONA RESTRINGIDA — Solo el administrador puede crear y editar contenido.
          </div>
          <div className="form-group">
            <label className="form-label">CONTRASEÑA</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
              style={error ? { borderColor: "var(--neon2)", boxShadow: "0 0 10px rgba(255,45,120,0.3)" } : {}}
            />
            {error && (
              <div
                style={{
                  color: "var(--neon2)",
                  fontFamily: "var(--font-display)",
                  fontSize: "0.55rem",
                  letterSpacing: "0.15em",
                  marginTop: "0.5rem",
                }}
              >
                ✕ ACCESO DENEGADO
              </div>
            )}
          </div>
        </div>
        <div className="form-footer">
          <button className="btn-secondary" onClick={onClose}>CANCELAR</button>
          <button className="btn-primary" onClick={handleSubmit}>ENTRAR</button>
        </div>
      </div>
      <style>{`
        .shake { animation: shake 0.4s ease; }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
