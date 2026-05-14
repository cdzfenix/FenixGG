import { useState, useEffect } from "react";
import GameSearch from "./GameSearch";

const STATUS_OPTIONS = [
  { value: "pending", label: "PENDIENTE" },
  { value: "playing", label: "JUGANDO" },
  { value: "completed", label: "COMPLETADO" },
];

const UserTag = ({ profile }) => {
  if (!profile) return null;
  return (
    <span style={{
      fontFamily: "var(--font-display)",
      fontSize: "0.5rem",
      letterSpacing: "0.12em",
      color: profile.color || "#a855f7",
      textShadow: `0 0 8px ${profile.color || "#a855f7"}55`,
      display: "flex", alignItems: "center", gap: "0.3rem"
    }}>
      {profile.is_admin && <span style={{ color: "#ff8c00" }}>★</span>}
      {profile.username}
    </span>
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
    <input type="number" min="0" max="10" step="0.5" className="form-input"
      value={input} onChange={handleChange} />
  );
};

export default function Backlog({ supabase, session, profile, isAdmin, onGoToReviews }) {
  const [games, setGames] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [notif, setNotif] = useState(null);
  const [filterStatus, setFilterStatus] = useState("mylist");
  const [filterUser, setFilterUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [reviewGame, setReviewGame] = useState(null);
  const [reviewForm, setReviewForm] = useState({ score: 5.0, review: "", playtime: "" });
  const [form, setForm] = useState({
    name: "", cover: "", year: "", genres: "", status: "pending", notes: "", rawg_id: null,
  });

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
    const { data } = await supabase.from("backlog").select("*").order("created_at", { ascending: false });
    setGames(data || []);
    const ids = [...new Set((data || []).map(g => g.user_id).filter(Boolean))];
    await loadProfiles(ids);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const notify = (msg) => { setNotif(msg); setTimeout(() => setNotif(null), 3000); };

  const handleSave = async () => {
    if (!form.name.trim() || !session) return;
    const { error } = await supabase.from("backlog").insert([{
      name: form.name, cover: form.cover, year: form.year, genres: form.genres,
      status: form.status, notes: form.notes, rawg_id: form.rawg_id, user_id: session.user.id,
    }]);
    if (!error) {
      setShowForm(false);
      setForm({ name: "", cover: "", year: "", genres: "", status: "pending", notes: "", rawg_id: null });
      load();
      notify("JUEGO AÑADIDO A PENDIENTES");
    }
  };

  const handleStatusChange = async (id, status) => {
    await supabase.from("backlog").update({ status }).eq("id", id);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este juego?")) return;
    await supabase.from("backlog").delete().eq("id", id);
    load();
    notify("JUEGO ELIMINADO");
  };

  const handleWriteReview = (game) => {
    setReviewGame(game);
    setReviewForm({ score: 5.0, review: "", playtime: "" });
  };

  const handleSaveReview = async () => {
    if (!reviewGame || !session) return;
    const { error } = await supabase.from("reviews").insert([{
      name: reviewGame.name, cover: reviewGame.cover, year: reviewGame.year,
      genres: reviewGame.genres, score: reviewForm.score, review: reviewForm.review,
      playtime: reviewForm.playtime, rawg_id: reviewGame.rawg_id, user_id: session.user.id,
    }]);
    if (!error) {
      setReviewGame(null);
      notify("¡RESEÑA PUBLICADA!");
      setTimeout(() => onGoToReviews(), 1500);
    }
  };

  const hltbUrl = (name) => `https://howlongtobeat.com/?q=${encodeURIComponent(name)}`;

  let filtered = games;
  
  if (filterStatus === "mylist" && session) {
    filtered = games.filter(g => g.user_id === session.user.id);
  } else if (filterStatus === "pending") {
    filtered = games.filter(g => g.status === "pending");
  } else if (filterStatus === "playing") {
    filtered = games.filter(g => g.status === "playing");
  } else if (filterStatus === "completed") {
    filtered = games.filter(g => g.status === "completed");
  }

  if (filterUser && filterUser !== "all") {
    filtered = filtered.filter(g => g.user_id === filterUser);
  }

  const counts = {
    mylist: session ? games.filter(g => g.user_id === session.user.id).length : 0,
    pending: games.filter(g => g.status === "pending").length,
    playing: games.filter(g => g.status === "playing").length,
    completed: games.filter(g => g.status === "completed").length,
  };

  const canEdit = (g) => isAdmin || (session && g.user_id === session.user.id);

  return (
    <>
      <div className="section-header">
        <h2 className="section-title">PENDIENTES</h2>
        {session && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ AÑADIR JUEGO</button>
        )}
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {session && (
            <button
              onClick={() => setFilterStatus("mylist")}
              style={{
                background: filterStatus === "mylist" ? "var(--neon-dim)" : "transparent",
                border: `1px solid ${filterStatus === "mylist" ? "var(--neon)" : "var(--border)"}`,
                color: filterStatus === "mylist" ? "var(--neon)" : "var(--text-dim)",
                fontFamily: "var(--font-display)",
                fontSize: "0.55rem",
                letterSpacing: "0.15em",
                padding: "0.4rem 1rem",
                cursor: "pointer",
                transition: "all 0.2s",
                clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
              }}
            >
              MI LISTA ({counts.mylist})
            </button>
          )}
          {[
            { key: "pending", label: "PENDIENTES" },
            { key: "playing", label: "JUGANDO" },
            { key: "completed", label: "COMPLETADOS" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              style={{
                background: filterStatus === f.key ? "var(--neon-dim)" : "transparent",
                border: `1px solid ${filterStatus === f.key ? "var(--neon)" : "var(--border)"}`,
                color: filterStatus === f.key ? "var(--neon)" : "var(--text-dim)",
                fontFamily: "var(--font-display)",
                fontSize: "0.55rem",
                letterSpacing: "0.15em",
                padding: "0.4rem 1rem",
                cursor: "pointer",
                transition: "all 0.2s",
                clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
              }}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>

        {/* FILTRO USUARIO */}
        {allUsers.length > 0 && (
          <select
            value={filterUser || ""}
            onChange={(e) => setFilterUser(e.target.value || null)}
            style={{
              background: "var(--bg3)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              fontFamily: "var(--font-body)",
              fontSize: "0.75rem",
              padding: "0.4rem 0.8rem",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">TODOS LOS USUARIOS</option>
            <option value="all">TODOS LOS USUARIOS</option>
            {allUsers.map(u => (
              <option key={u.id} value={u.id}>{u.username}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="loading">CARGANDO...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">◉</div><div className="empty-text">LISTA VACÍA</div></div>
      ) : (
        <div className="cards-grid">
          {filtered.map((g) => (
            <div key={g.id} className="game-card">
              {g.cover ? <img src={g.cover} alt={g.name} className="card-cover" /> : <div className="card-cover-placeholder">🎮</div>}
              <div className="card-body">
                <div className="card-title">{g.name}</div>
                <div className="card-meta">
                  {g.year && <span>{g.year}</span>}
                  {g.year && g.genres && <span> · </span>}
                  {g.genres && <span>{g.genres}</span>}
                </div>
                <div className={`status-badge ${g.status}`}>
                  {g.status === "pending" && "⬡ PENDIENTE"}
                  {g.status === "playing" && "▷ JUGANDO"}
                  {g.status === "completed" && "◈ COMPLETADO"}
                </div>
                {g.user_id && profiles[g.user_id] && <UserTag profile={profiles[g.user_id]} />}
                {g.notes && <div className="card-review" style={{ marginTop: "0.4rem" }}>{g.notes}</div>}
                <a href={hltbUrl(g.name)} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-block", marginTop: "0.5rem", fontFamily: "var(--font-display)", fontSize: "0.45rem", letterSpacing: "0.1em", color: "var(--neon3)", textDecoration: "none", opacity: 0.8 }}>
                  ⧉ HOWLONGTOBEAT
                </a>
              </div>
              {canEdit(g) && (
                <div className="card-actions" style={{ flexWrap: "wrap", gap: "0.4rem" }}>
                  <select
                    className="form-select"
                    value={g.status}
                    onChange={(e) => handleStatusChange(g.id, e.target.value)}
                    style={{ fontSize: "0.7rem", padding: "0.3rem 0.5rem", flex: 1 }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button className="btn-danger" onClick={() => handleDelete(g.id)}>✕</button>
                  {g.status === "completed" && session && (
                    <button
                      onClick={() => handleWriteReview(g)}
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "1px solid var(--neon3)",
                        color: "var(--neon3)",
                        fontFamily: "var(--font-display)",
                        fontSize: "0.55rem",
                        letterSpacing: "0.15em",
                        padding: "0.4rem 0.8rem",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        clipPath: "polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%)",
                      }}
                    >
                      ✍ ESCRIBIR RESEÑA
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FORM AÑADIR */}
      {showForm && (
        <div className="form-overlay">
          <div className="form-panel">
            <div className="form-header">
              <span className="form-title">◉ AÑADIR A PENDIENTES</span>
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
                <label className="form-label">ESTADO</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">NOTAS (OPCIONAL)</label>
                <textarea
                  className="form-textarea"
                  placeholder="¿Por qué quieres jugarlo? ¿Algo que recordar?"
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ minHeight: 80 }}
                />
              </div>
            </div>
            <div className="form-footer">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>CANCELAR</button>
              <button className="btn-primary" onClick={handleSave}>AÑADIR</button>
            </div>
          </div>
        </div>
      )}

      {/* FORM RESEÑA RÁPIDA */}
      {reviewGame && (
        <div className="form-overlay">
          <div className="form-panel">
            <div className="form-header">
              <span className="form-title">◈ RESEÑAR: {reviewGame.name}</span>
              <button className="form-close" onClick={() => setReviewGame(null)}>✕</button>
            </div>
            <div className="form-body">
              {reviewGame.cover && (
                <div style={{ marginBottom: "1rem" }}>
                  <img src={reviewGame.cover} alt="cover" style={{ width: 80, height: 108, objectFit: "cover", border: "1px solid var(--border)" }} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">PUNTUACIÓN (0.0 — 10.0)</label>
                <ScoreInput value={reviewForm.score} onChange={(v) => setReviewForm(f => ({ ...f, score: v }))} />
              </div>
              <div className="form-group">
                <label className="form-label">TIEMPO JUGADO</label>
                <input type="text" className="form-input" placeholder="Ej: 42h, 80h, 120h..." value={reviewForm.playtime}
                  onChange={(e) => setReviewForm(f => ({ ...f, playtime: e.target.value }))} />
              </div>
              {reviewGame.name && (
                <div style={{ marginBottom: "1rem" }}>
                  <a href={hltbUrl(reviewGame.name)} target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily: "var(--font-display)", fontSize: "0.5rem", letterSpacing: "0.12em", color: "var(--neon3)", textDecoration: "none" }}>
                    ⧉ CONSULTAR HOWLONGTOBEAT
                  </a>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">RESEÑA</label>
                <textarea
                  className="form-textarea"
                  placeholder="Escribe tu opinión..."
                  value={reviewForm.review}
                  onChange={(e) => setReviewForm(f => ({ ...f, review: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-footer">
              <button className="btn-secondary" onClick={() => setReviewGame(null)}>CANCELAR</button>
              <button className="btn-primary" onClick={handleSaveReview}>PUBLICAR RESEÑA</button>
            </div>
          </div>
        </div>
      )}

      {notif && <div className="notif">{notif}</div>}
    </>
  );
}
