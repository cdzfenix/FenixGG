import { useState, useRef, useEffect } from "react";

export default function GameSearch({ onSelect, value }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = (q) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/igdb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
        });
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    search(e.target.value);
  };

  const handleSelect = (game) => {
    setQuery(game.name);
    setOpen(false);
    setResults([]);
    onSelect({
      name: game.name,
      cover: game.cover,
      year: game.year,
      genres: game.genres,
      rawg_id: game.id,
    });
  };

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <input
        type="text"
        className="form-input"
        placeholder="Busca un videojuego..."
        value={query}
        onChange={handleChange}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {loading && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "var(--bg2)", border: "1px solid var(--border)",
          padding: "0.8rem", fontFamily: "var(--font-display)",
          fontSize: "0.55rem", letterSpacing: "0.2em", color: "var(--neon)",
          animation: "blink 0.8s infinite",
        }}>
          BUSCANDO...
        </div>
      )}
      {open && results.length > 0 && (
        <div className="search-results">
          {results.map((game) => (
            <div
              key={game.id}
              className="search-result-item"
              onClick={() => handleSelect(game)}
            >
              {game.cover ? (
                <img
                  src={game.cover}
                  alt={game.name}
                  className="search-result-thumb"
                />
              ) : (
                <div
                  className="search-result-thumb"
                  style={{
                    background: "var(--bg3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                  }}
                >
                  🎮
                </div>
              )}
              <div className="search-result-info">
                <div className="search-result-name">{game.name}</div>
                <div className="search-result-year">
                  {game.year || "—"}
                  {game.genres && ` · ${game.genres.split(",")[0]}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
