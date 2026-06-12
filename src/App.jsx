import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Reviews from "./components/Reviews";
import Backlog from "./components/Backlog";
import Login from "./components/Login";
import ResetPassword from "./components/ResetPassword";
import Calendar from "./components/Calendar";
import "./App.css";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [tab, setTab] = useState("reviews");
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setProfile(null);

      // Detectar cuando el usuario llega desde el enlace de recuperación
      if (event === "PASSWORD_RECOVERY") {
        setShowReset(true);
      }
    });

    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 8000);

    return () => { subscription.unsubscribe(); clearInterval(interval); };
  }, []);

  const loadProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const isAdmin = profile?.is_admin === true;

  return (
    <div className="app">
      <div className="bg-watermark" />

      <header className="header">
        <div className="header-inner">
          <nav className="nav">
            <button className={`nav-btn ${tab === "reviews" ? "active" : ""}`} onClick={() => setTab("reviews")}>
              <span className="nav-icon">◈</span>
              <span className="nav-label">RESEÑAS</span>
            </button>
            <button className={`nav-btn ${tab === "backlog" ? "active" : ""}`} onClick={() => setTab("backlog")}>
              <span className="nav-icon">◉</span>
              <span className="nav-label">PENDIENTES</span>
            </button>
            <button className={`nav-btn ${tab === "calendar" ? "active" : ""}`} onClick={() => setTab("calendar")}>
              <span className="nav-icon">◻</span>
              <span className="nav-label">CALENDARIO</span>
            </button>
          </nav>
          <div className="auth-area">
            {session && profile ? (
              <div className="user-menu">
                <span className="user-chip" style={{ color: profile.color || "#a855f7" }}>
                  {isAdmin && <span className="admin-dot" />}
                  {profile.username}
                </span>
                <button className="btn-secondary" onClick={handleLogout} style={{ fontSize: "0.5rem", padding: "0.3rem 0.7rem" }}>
                  SALIR
                </button>
              </div>
            ) : (
              <button className="login-btn" onClick={() => setShowLogin(true)}>ACCEDER</button>
            )}
          </div>
        </div>
      </header>

      <div className="hero">
        <div className="hero-glow" />
        <img src="/logo.png" alt="FenixGG" className="hero-logo" />
        <div className="hero-title">
          <span className={`hero-name ${glitch ? "glitch" : ""}`} data-text="FENIXGG">FENIXGG</span>
          <span className="hero-sub">RESEÑAS DE VIDEOJUEGOS</span>
        </div>
      </div>

      <main className="main">
        {tab === "reviews" && <Reviews supabase={supabase} session={session} profile={profile} isAdmin={isAdmin} />}
        {tab === "backlog" && <Backlog supabase={supabase} session={session} profile={profile} isAdmin={isAdmin} onGoToReviews={() => setTab("reviews")} />}
        {tab === "calendar" && <Calendar supabase={supabase} session={session} profile={profile} />}
      </main>

      {showLogin && <Login supabase={supabase} onClose={() => setShowLogin(false)} />}
      {showReset && <ResetPassword supabase={supabase} onDone={() => setShowReset(false)} />}
    </div>
  );
}
