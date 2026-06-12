import { useState, useEffect } from "react";

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_ES = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

export default function Calendar({ supabase, session, profile }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [reviews, setReviews] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [filterUser, setFilterUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setFilterUser(session?.user?.id || null);
  }, [session]);

  const loadData = async () => {
    const { data: reviewData } = await supabase
      .from("reviews")
      .select("id, name, cover, score, created_at, user_id")
      .order("created_at", { ascending: false });

    setReviews(reviewData || []);

    const ids = [...new Set((reviewData || []).map(r => r.user_id).filter(Boolean))];
    if (ids.length) {
      const { data: profileData } = await supabase.from("profiles").select("*").in("id", ids);
      if (profileData) {
        const map = {};
        profileData.forEach(p => map[p.id] = p);
        setProfiles(map);
        setAllUsers(profileData);
      }
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(null);
  };

  // Filtrar reseñas por usuario si hay filtro activo
  const filteredReviews = filterUser
    ? reviews.filter(r => r.user_id === filterUser)
    : reviews;

  // Agrupar reseñas por día (clave: "YYYY-MM-DD")
  const reviewsByDay = {};
  filteredReviews.forEach(r => {
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    if (!reviewsByDay[key]) reviewsByDay[key] = [];
    reviewsByDay[key].push(r);
  });

  // Construir días del mes
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const totalDays = lastDay.getDate();

  // Lunes=0 ... Domingo=6
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const days = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const getKey = (day) =>
    `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

  const isToday = (day) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const selectedKey = selectedDay ? getKey(selectedDay) : null;
  const selectedReviews = selectedKey ? (reviewsByDay[selectedKey] || []) : [];

  // Total reseñas del mes visible
  const monthTotal = Object.entries(reviewsByDay)
    .filter(([k]) => k.startsWith(`${currentYear}-${String(currentMonth+1).padStart(2,"0")}`))
    .reduce((acc, [, arr]) => acc + arr.length, 0);

  return (
    <>
      <div className="section-header">
        <h2 className="section-title">CALENDARIO</h2>
      </div>

      {/* CONTROLES */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={prevMonth} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-dim)", fontFamily: "var(--font-display)", fontSize: "0.7rem", padding: "0.4rem 0.8rem", cursor: "pointer" }}>◀</button>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "0.85rem", letterSpacing: "0.2em", color: "var(--neon)", textShadow: "0 0 10px var(--neon)", minWidth: 220, textAlign: "center" }}>
            {MONTHS_ES[currentMonth].toUpperCase()} {currentYear}
          </span>
          <button onClick={nextMonth} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-dim)", fontFamily: "var(--font-display)", fontSize: "0.7rem", padding: "0.4rem 0.8rem", cursor: "pointer" }}>▶</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {allUsers.length > 0 && (
            <select value={filterUser || ""}
              onChange={(e) => { setFilterUser(e.target.value || null); setSelectedDay(null); }}
              style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "0.75rem", padding: "0.4rem 0.8rem", outline: "none", cursor: "pointer" }}>
              <option value="">TODOS LOS USUARIOS</option>
              {allUsers.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
          )}
          <span style={{ fontFamily: "var(--font-display)", fontSize: "0.55rem", letterSpacing: "0.15em", color: "var(--text-dim)" }}>
            {monthTotal} RESEÑA{monthTotal !== 1 ? "S" : ""} ESTE MES
          </span>
        </div>
      </div>

      {/* GRID CALENDARIO */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", marginBottom: "2rem" }}>
        {/* Cabecera días */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--border)" }}>
          {DAYS_ES.map(d => (
            <div key={d} style={{ padding: "0.6rem", textAlign: "center", fontFamily: "var(--font-display)", fontSize: "0.5rem", letterSpacing: "0.15em", color: "var(--text-dim)" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Días */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {days.map((day, idx) => {
            const key = day ? getKey(day) : null;
            const dayReviews = key ? (reviewsByDay[key] || []) : [];
            const hasReviews = dayReviews.length > 0;
            const isSelected = day === selectedDay;
            const isTodayDay = day && isToday(day);

            return (
              <div
                key={idx}
                onClick={() => day && setSelectedDay(isSelected ? null : day)}
                style={{
                  minHeight: 72,
                  padding: "0.4rem",
                  borderRight: "1px solid var(--border)",
                  borderBottom: "1px solid var(--border)",
                  cursor: day ? "pointer" : "default",
                  background: isSelected ? "var(--neon-dim)" : hasReviews ? "rgba(168,85,247,0.05)" : "transparent",
                  transition: "background 0.2s",
                  position: "relative",
                }}
              >
                {day && (
                  <>
                    <div style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "0.6rem",
                      letterSpacing: "0.1em",
                      color: isTodayDay ? "var(--neon)" : hasReviews ? "var(--text)" : "var(--text-dim)",
                      textShadow: isTodayDay ? "0 0 8px var(--neon)" : "none",
                      marginBottom: "0.3rem",
                      width: 20, height: 20,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: isTodayDay ? "50%" : "none",
                      border: isTodayDay ? "1px solid var(--neon)" : "none",
                    }}>
                      {day}
                    </div>

                    {/* Portadas en miniatura */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      {dayReviews.slice(0, 4).map((r, i) => (
                        r.cover ? (
                          <img key={i} src={r.cover} alt={r.name}
                            title={r.name}
                            style={{ width: 24, height: 32, objectFit: "cover", border: `1px solid ${profiles[r.user_id]?.color || "var(--border)"}` }} />
                        ) : (
                          <div key={i} title={r.name}
                            style={{ width: 24, height: 32, background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", border: `1px solid ${profiles[r.user_id]?.color || "var(--border)"}` }}>
                            🎮
                          </div>
                        )
                      ))}
                      {dayReviews.length > 4 && (
                        <div style={{ width: 24, height: 32, background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: "0.4rem", color: "var(--text-dim)" }}>
                          +{dayReviews.length - 4}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DETALLE DÍA SELECCIONADO */}
      {selectedDay && (
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--neon)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <span style={{ width: 3, height: 18, background: "var(--neon)", display: "inline-block", boxShadow: "0 0 8px var(--neon)" }} />
            {selectedDay} DE {MONTHS_ES[currentMonth].toUpperCase()} DE {currentYear}
            <span style={{ color: "var(--text-dim)", fontSize: "0.5rem" }}>— {selectedReviews.length} RESEÑA{selectedReviews.length !== 1 ? "S" : ""}</span>
          </div>

          {selectedReviews.length === 0 ? (
            <div style={{ color: "var(--text-dim)", fontFamily: "var(--font-display)", fontSize: "0.55rem", letterSpacing: "0.15em" }}>
              SIN RESEÑAS ESTE DÍA
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {selectedReviews.map(r => {
                const p = profiles[r.user_id];
                const score = parseFloat(r.score) || 0;
                const scoreColor = score >= 8 ? "#00ffe5" : score >= 6 ? "#a855f7" : score >= 4 ? "#fbbf24" : "#ff2d78";
                return (
                  <div key={r.id} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", display: "flex", gap: "0.8rem", padding: "0.75rem", alignItems: "flex-start" }}>
                    {r.cover
                      ? <img src={r.cover} alt={r.name} style={{ width: 48, height: 64, objectFit: "cover", flexShrink: 0 }} />
                      : <div style={{ width: 48, height: 64, background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.2rem" }}>🎮</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "0.6rem", letterSpacing: "0.05em", color: "var(--text)", marginBottom: "0.3rem", lineHeight: 1.4 }}>{r.name}</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 900, color: scoreColor, textShadow: `0 0 8px ${scoreColor}` }}>
                        {score.toFixed(1)}
                      </div>
                      {p && (
                        <div style={{ fontFamily: "var(--font-display)", fontSize: "0.5rem", letterSpacing: "0.1em", color: p.color || "#a855f7", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                          {p.is_admin && <span style={{ color: "#ff8c00" }}>★</span>}
                          {p.username}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
