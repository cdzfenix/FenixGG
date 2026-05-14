import { useState, useEffect } from "react";
import GameSearch from "./GameSearch";

const ScoreDisplay = ({ score }) => {
  const s = parseFloat(score) || 0;
  const color = s >= 8 ? "#00ffe5" : s >= 6 ? "#a855f7" : s >= 4 ? "#fbbf24" : "#ff2d78";
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "0.2rem" }}>
      <span style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 900, color, textShadow: `0 0 12px ${color}` }}>
        {s.toFixed(1)}
      </span>

    </div>
  );
};

const ScoreInput = ({ value, onChange }) => {
  const [input, setInput] = useState(value?.toString() || "5.0");

  const handleChange = (e) => {
    const val = e.target.value.replace(",", ".");
    setInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 10) onChange(Math.round(num * 10) / 10);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
      <input
        type="number" min="0" max="10" step="0.5"
        className="form-input"
        style={{ width: 90 }}
        value={input}
        onChange={handleChange}
      />
      <span style={{ fontFamily: "var(--font-display)", fontSize: "0.55rem", color: "var(--text-dim)" }}>
        (0.0 — 10.0)
      </span>
    </div>
  );
};

const UserTag = ({ profile }) => {
  if (!profile) return null;
  return (
    <span style={{
      fontFamily: "var(--font-display)",
      fontSize: "0.65rem",
      letterSpacing: "0.1em",
      color: profile.color || "#a855f7",
      textShadow: `0 0 10px ${profile.color || "#a855f7"}88`,
      display: "flex", alignItems: "center", gap: "0.35rem"
    }}>
      {profile.is_admin && <span style={{ color: "#ff8c00" }}>★</span>}
      {profile.username}
    </span>
  );
};

export default function Reviews({ supabase, session, profile, isAdmin }) {
  const [reviews, setReviews] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [notif, setNotif] = useState(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [filterUser, setFilterUser] = useState(session?.user?.id || null);
  const [allUsers, setAllUsers] = useState([]);
  const [form, setForm] = useState({ name: "", cover: "", year: "", genres: "", score: 5.0, review: "", playtime: "", rawg_id: null });

  const loadProfiles = async (userIds) => {
    if (!userIds.length) return;
    const { data } = await supabase.from("profiles").select("*").in("id", userIds);
    if (data) {
      const map = {};
      data.forEach(p => map[p.id] = p);
      setProfiles(map);
      setAllUsers(data);
    }
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    setReviews(data || []);
    const ids = [...new Set((data || []).map(r => r.user_id).filter(Boolean))];
    await loadProfiles(ids);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const notify = (msg) => { setNotif(msg); setTimeout(() => setNotif(null), 3000); };

  const handleSave = async () => {
    if (!form.name.trim() || !session) return;
    const { error } = await supabase.from("reviews").insert([{
      name: form.name, cover: form.cover, year: form.year, genres: form.genres,
      score: form.score, review: form.review, playtime: form.playtime,
      rawg_id: form.rawg_id, user_id: session.user.id,
    }]);
    if (!error) {
      setShowForm(false);
      setForm({ name: "", cover: "", year: "", genres: "", score: 5.0, review: "", playtime: "", rawg_id: null });
      load();
      notify("RESEÑA GUARDADA");
    }
  };

  const handleDelete = async (id, userId, e) => {
    e.stopPropagation();
    if (!confirm("¿Eliminar esta reseña?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    load();
    notify("RESEÑA ELIMINADA");
  };

  const hltbUrl = (name) => `https://howlongtobeat.com/?q=${encodeURIComponent(name)}`;

  let filtered = reviews;
  if (filterUser) filtered = filtered.filter(r => r.user_id === filterUser);
  filtered = filtered.filter(r => r.name.toLowerCase().includes(filterQuery.toLowerCase()));

  const canDelete = (r) => isAdmin || (session && r.user_id === session.user.id);

  return (
    <>
      <div className="section-header">
        <h2 className="section-title">RESEÑAS DE VIDEOJUEGOS</h2>
        {session && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ AÑADIR RESEÑA</button>
        )}
      </div>

      <div className="top-search" style={{ flexWrap: "wrap", gap: "0.8rem" }}>
        <input type="text" className="form-input" placeholder="Filtrar reseñas..." value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)} style={{ maxWidth: 240 }} />
        {allUsers.length > 0 && (
          <select
            value={filterUser || ""}
            onChange={(e) => setFilterUser(e.target.value || null)}
            style={{
              background: "var(--bg3)", border: "1px solid var(--border)",
              color: "var(--text)", fontFamily: "var(--font-body)",
              fontSize: "0.75rem", padding: "0.4rem 0.8rem", outline: "none", cursor: "pointer",
            }}
          >
            <option value="">TODOS LOS USUARIOS</option>
            {allUsers.map(u => (
              <option key={u.id} value={u.id}>{u.username}</option>
            ))}
          </select>
        )}
        <span style={{ fontFamily: "var(--font-display)", fontSize: "0.55rem", letterSpacing: "0.15em", color: "var(--text-dim)" }}>
          {filtered.length} TÍTULO{filtered.length !== 1 ? "S" : ""}
        </span>
      </div>

      {loading ? <div className="loading">CARGANDO...</div> : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">◈</div><div className="empty-text">NO HAY RESEÑAS AÚN</div></div>
      ) : (
        <div className="cards-grid">
          {filtered.map((r) => (
            <div key={r.id} className="game-card" onClick={() => setExpanded(r)} style={{ cursor: "pointer" }}>
              {r.cover ? <img src={r.cover} alt={r.name} className="card-cover" /> : <div className="card-cover-placeholder">🎮</div>}
              <div className="card-body">
                <div className="card-title">{r.name}</div>
                <div className="card-meta">
                  {r.year && <span>{r.year}</span>}
                  {r.year && r.genres && <span> · </span>}
                  {r.genres && <span>{r.genres}</span>}
                </div>
                <ScoreDisplay score={r.score} />
                {r.user_id && profiles[r.user_id] && <UserTag profile={profiles[r.user_id]} />}
                {r.playtime && (
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "0.5rem", letterSpacing: "0.1em", color: "var(--text-dim)", marginTop: "0.3rem" }}>
                    ⏱ <span style={{ color: "var(--text)" }}>{r.playtime}</span>
                  </div>
                )}
                {r.review && <div className="card-review" style={{ marginTop: "0.4rem" }}>{r.review}</div>}
                <a href={hltbUrl(r.name)} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: "inline-block", marginTop: "0.5rem", fontFamily: "var(--font-display)", fontSize: "0.45rem", letterSpacing: "0.1em", color: "var(--neon3)", textDecoration: "none", opacity: 0.8 }}>
                  ⧉ HOWLONGTOBEAT
                </a>
              </div>
              {canDelete(r) && (
                <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn-danger" onClick={(e) => handleDelete(r.id, r.user_id, e)}>ELIMINAR</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* EXPANDED */}
      {expanded && (
        <div className="card-expanded-overlay" onClick={() => setExpanded(null)}>
          <div className="card-expanded" onClick={(e) => e.stopPropagation()}>
            {expanded.cover
              ? <img src={expanded.cover} alt={expanded.name} className="card-expanded-cover" />
              : <div className="card-expanded-cover-placeholder">🎮</div>}
            <div className="card-expanded-body">
              <button onClick={() => setExpanded(null)} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", alignSelf: "flex-end", fontSize: "1.2rem" }}>✕</button>
              <div className="card-expanded-title">{expanded.name}</div>
              <div className="card-meta">{expanded.year}{expanded.year && expanded.genres && " · "}{expanded.genres}</div>
              <ScoreDisplay score={expanded.score} />
              {expanded.user_id && profiles[expanded.user_id] && <UserTag profile={profiles[expanded.user_id]} />}
              {expanded.playtime && (
                <div style={{ fontFamily: "var(--font-display)", fontSize: "0.55rem", letterSpacing: "0.12em", color: "var(--text-dim)" }}>
                  ⏱ TIEMPO JUGADO: <span style={{ color: "var(--text)" }}>{expanded.playtime}</span>
                </div>
              )}
              <a href={hltbUrl(expanded.name)} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "var(--font-display)", fontSize: "0.5rem", letterSpacing: "0.12em", color: "var(--neon3)", textDecoration: "none" }}
                onClick={(e) => e.stopPropagation()}>
                ⧉ VER EN HOWLONGTOBEAT
              </a>
              <div className="card-expanded-review">{expanded.review || "Sin reseña escrita."}</div>
            </div>
          </div>
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <div className="form-overlay">
          <div className="form-panel">
            <div className="form-header">
              <span className="form-title">◈ NUEVA RESEÑA</span>
              <button className="form-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">BUSCAR VIDEOJUEGO</label>
                <GameSearch value={form.name} onSelect={(g) => setForm(f => ({ ...f, ...g }))} />
              </div>
              {form.cover && (
                <div style={{ marginBottom: "1rem" }}>
                  <img src={form.cover} alt="cover" style={{ width: 80, height: 108, objectFit: "cover", border: "1px solid var(--border)" }} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">PUNTUACIÓN (0.0 — 10.0)</label>
                <ScoreInput value={form.score} onChange={(v) => setForm(f => ({ ...f, score: v }))} />
              </div>
              <div className="form-group">
                <label className="form-label">TIEMPO JUGADO</label>
                <input type="text" className="form-input" placeholder="Ej: 42h, 80h, 120h..." value={form.playtime}
                  onChange={(e) => setForm(f => ({ ...f, playtime: e.target.value }))} />
              </div>
              {form.name && (
                <div style={{ marginBottom: "1rem" }}>
                  <a href={hltbUrl(form.name)} target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily: "var(--font-display)", fontSize: "0.5rem", letterSpacing: "0.12em", color: "var(--neon3)", textDecoration: "none" }}>
                    ⧉ CONSULTAR HOWLONGTOBEAT
                  </a>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">RESEÑA</label>
                <textarea className="form-textarea" placeholder="Escribe tu opinión..." value={form.review}
                  onChange={(e) => setForm(f => ({ ...f, review: e.target.value }))} />
              </div>
            </div>
            <div className="form-footer">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>CANCELAR</button>
              <button className="btn-primary" onClick={handleSave}>GUARDAR</button>
            </div>
          </div>
        </div>
      )}

      {notif && <div className="notif">{notif}</div>}
    </>
  );
}
