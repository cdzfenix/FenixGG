import { useState, useEffect } from "react";
import GameSearch from "./GameSearch";

const Stars = ({ rating }) => (
  <div className="card-rating">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={`star ${s <= rating ? "" : "empty"}`}>★</span>
    ))}
  </div>
);

const StarInput = ({ value, onChange }) => (
  <div className="star-input">
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} type="button" className={s <= value ? "lit" : ""} onClick={() => onChange(s)}>
        ★
      </button>
    ))}
  </div>
);

export default function Reviews({ supabase, isAdmin }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [notif, setNotif] = useState(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [form, setForm] = useState({
    name: "", cover: "", year: "", genres: "", rating: 5, review: "", rawg_id: null,
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    setReviews(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const notify = (msg) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3000);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const { error } = await supabase.from("reviews").insert([{
      name: form.name,
      cover: form.cover,
      year: form.year,
      genres: form.genres,
      rating: form.rating,
      review: form.review,
      rawg_id: form.rawg_id,
    }]);
    if (!error) {
      setShowForm(false);
      setForm({ name: "", cover: "", year: "", genres: "", rating: 5, review: "", rawg_id: null });
      load();
      notify("RESEÑA GUARDADA");
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("¿Eliminar esta reseña?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    load();
    notify("RESEÑA ELIMINADA");
  };

  const filtered = reviews.filter((r) =>
    r.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <>
      <div className="section-header">
        <h2 className="section-title">RESEÑAS DE VIDEOJUEGOS</h2>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + AÑADIR RESEÑA
          </button>
        )}
      </div>

      <div className="top-search">
        <input
          type="text"
          className="form-input"
          placeholder="Filtrar reseñas..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <span style={{ fontFamily: "var(--font-display)", fontSize: "0.55rem", letterSpacing: "0.15em", color: "var(--text-dim)" }}>
          {filtered.length} TÍTULO{filtered.length !== 1 ? "S" : ""}
        </span>
      </div>

      {loading ? (
        <div className="loading">CARGANDO...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◈</div>
          <div className="empty-text">NO HAY RESEÑAS AÚN</div>
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map((r) => (
            <div key={r.id} className="game-card" onClick={() => setExpanded(r)} style={{ cursor: "pointer" }}>
              {r.cover ? (
                <img src={r.cover} alt={r.name} className="card-cover" />
              ) : (
                <div className="card-cover-placeholder">🎮</div>
              )}
              <div className="card-body">
                <div className="card-title">{r.name}</div>
                <div className="card-meta">
                  {r.year && <span>{r.year}</span>}
                  {r.year && r.genres && <span> · </span>}
                  {r.genres && <span>{r.genres}</span>}
                </div>
                <Stars rating={r.rating} />
                {r.review && <div className="card-review">{r.review}</div>}
              </div>
              {isAdmin && (
                <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn-danger" onClick={(e) => handleDelete(r.id, e)}>
                    ELIMINAR
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* EXPANDED VIEW */}
      {expanded && (
        <div className="card-expanded-overlay" onClick={() => setExpanded(null)}>
          <div className="card-expanded" onClick={(e) => e.stopPropagation()}>
            {expanded.cover ? (
              <img src={expanded.cover} alt={expanded.name} className="card-expanded-cover" />
            ) : (
              <div className="card-expanded-cover-placeholder">🎮</div>
            )}
            <div className="card-expanded-body">
              <button
                onClick={() => setExpanded(null)}
                style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", alignSelf: "flex-end", fontSize: "1.2rem" }}
              >✕</button>
              <div className="card-expanded-title">{expanded.name}</div>
              <div className="card-meta">
                {expanded.year}{expanded.year && expanded.genres && " · "}{expanded.genres}
              </div>
              <Stars rating={expanded.rating} />
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
                <label className="form-label">PUNTUACIÓN</label>
                <StarInput value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
              </div>
              <div className="form-group">
                <label className="form-label">RESEÑA</label>
                <textarea
                  className="form-textarea"
                  placeholder="Escribe tu opinión..."
                  value={form.review}
                  onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))}
                />
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
