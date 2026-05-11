import { useState, useEffect } from "react";
import GameSearch from "./GameSearch";

const STATUS_OPTIONS = [
  { value: "pending", label: "PENDIENTE" },
  { value: "playing", label: "JUGANDO" },
  { value: "completed", label: "COMPLETADO" },
];

export default function Backlog({ supabase, isAdmin, onGoToReviews }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [notif, setNotif] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [reviewGame, setReviewGame] = useState(null); // juego a reseñar
  const [reviewForm, setReviewForm] = useState({ rating: 5, review: "" });
  const [form, setForm] = useState({
    name: "", cover: "", year: "", genres: "", status: "pending", notes: "", rawg_id: null,
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("backlog").select("*").order("created_at", { ascending: false });
    setGames(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const notify = (msg) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3000);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const { error } = await supabase.from("backlog").insert([{
      name: form.name,
      cover: form.cover,
      year: form.year,
      genres: form.genres,
      status: form.status,
      notes: form.notes,
      rawg_id: form.rawg_id,
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
    if (!confirm("¿Eliminar este juego de pendientes?")) return;
    await supabase.from("backlog").delete().eq("id", id);
    load();
    notify("JUEGO ELIMINADO");
  };

  const handleWriteReview = (game) => {
    setReviewGame(game);
    setReviewForm({ rating: 5, review: "" });
  };

  const handleSaveReview = async () => {
    if (!reviewGame) return;
    const { error } = await supabase.from("reviews").insert([{
      name: reviewGame.name,
      cover: reviewGame.cover,
      year: reviewGame.year,
      genres: reviewGame.genres,
      rating: reviewForm.rating,
      review: reviewForm.review,
      rawg_id: reviewGame.rawg_id,
    }]);
    if (!error) {
      setReviewGame(null);
      notify("¡RESEÑA PUBLICADA EN RESEÑAS!");
      setTimeout(() => onGoToReviews(), 1500);
    }
  };

  const filtered = filterStatus === "all"
    ? games
    : games.filter((g) => g.status === filterStatus);

  const counts = {
    all: games.length,
    pending: games.filter((g) => g.status === "pending").length,
    playing: games.filter((g) => g.status === "playing").length,
    completed: games.filter((g) => g.status === "completed").length,
  };

  const StarInput = ({ value, onChange }) => (
    <div className="star-input">
      {[1,2,3,4,5].map((s) => (
        <button key={s} type="button" className={s <= value ? "lit" : ""} onClick={() => onChange(s)}>★</button>
      ))}
    </div>
  );

  return (
    <>
      <div className="section-header">
        <h2 className="section-title">PENDIENTES</h2>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + AÑADIR JUEGO
          </button>
        )}
      </div>

      {/* FILTER TABS */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { key: "all", label: "TODOS" },
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
            {f.label}
            <span style={{ marginLeft: "0.5rem", opacity: 0.6 }}>({counts[f.key]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">CARGANDO...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◉</div>
          <div className="empty-text">LISTA VACÍA</div>
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map((g) => (
            <div key={g.id} className="game-card">
              {g.cover ? (
                <img src={g.cover} alt={g.name} className="card-cover" />
              ) : (
                <div className="card-cover-placeholder">🎮</div>
              )}
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
                {g.notes && (
                  <div className="card-review" style={{ marginTop: "0.5rem" }}>{g.notes}</div>
                )}
              </div>
              {isAdmin && (
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
                  {g.status === "completed" && (
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
                <GameSearch
                  value={form.name}
                  onSelect={(g) => setForm((f) => ({ ...f, ...g }))}
                />
              </div>
              {form.cover && (
                <div style={{ marginBottom: "1rem" }}>
                  <img
                    src={form.cover}
                    alt="cover"
                    style={{ width: 80, height: 108, objectFit: "cover", border: "1px solid var(--border)" }}
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">ESTADO</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
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
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
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
                  <img
                    src={reviewGame.cover}
                    alt="cover"
                    style={{ width: 80, height: 108, objectFit: "cover", border: "1px solid var(--border)" }}
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">PUNTUACIÓN</label>
                <StarInput value={reviewForm.rating} onChange={(v) => setReviewForm((f) => ({ ...f, rating: v }))} />
              </div>
              <div className="form-group">
                <label className="form-label">RESEÑA</label>
                <textarea
                  className="form-textarea"
                  placeholder="Escribe tu opinión..."
                  value={reviewForm.review}
                  onChange={(e) => setReviewForm((f) => ({ ...f, review: e.target.value }))}
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
