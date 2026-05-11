import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Reviews from "./components/Reviews";
import Backlog from "./components/Backlog";
import Login from "./components/Login";
import "./App.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "changeme123";

export default function App() {
  const [tab, setTab] = useState("reviews");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("gv_admin");
    if (stored === "true") setIsAdmin(true);

    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (password) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      sessionStorage.setItem("gv_admin", "true");
      setShowLogin(false);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem("gv_admin");
  };

  return (
    <div className="app">
      {/* FONDO WATERMARK */}
      <div className="bg-watermark" />

      <header className="header">
        <div className="header-inner">
          <div className={`logo-text ${glitch ? "glitch" : ""}`} data-text="FENIXGG">
            FENIXGG
          </div>
          <nav className="nav">
            <button
              className={`nav-btn ${tab === "reviews" ? "active" : ""}`}
              onClick={() => setTab("reviews")}
            >
              <span className="nav-icon">◈</span> RESEÑAS
            </button>
            <button
              className={`nav-btn ${tab === "backlog" ? "active" : ""}`}
              onClick={() => setTab("backlog")}
            >
              <span className="nav-icon">◉</span> PENDIENTES
            </button>
          </nav>
          <div className="auth-area">
            {isAdmin ? (
              <div className="admin-badge" onClick={handleLogout} title="Cerrar sesión">
                <span className="admin-dot" /> ADMIN
              </div>
            ) : (
              <button className="login-btn" onClick={() => setShowLogin(true)}>
                ACCEDER
              </button>
            )}
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
      <div className="hero">
        <div className="hero-glow" />
        <img src="/logo.png" alt="FenixGG" className="hero-logo" />
        <div className="hero-title">
          <span className="hero-name">FENIXGG</span>
          <span className="hero-sub">RESEÑAS DE VIDEOJUEGOS</span>
        </div>
      </div>

      <main className="main">
        {tab === "reviews" && (
          <Reviews supabase={supabase} isAdmin={isAdmin} />
        )}
        {tab === "backlog" && (
          <Backlog supabase={supabase} isAdmin={isAdmin} onGoToReviews={() => setTab("reviews")} />
        )}
      </main>

      {showLogin && (
        <Login onLogin={handleLogin} onClose={() => setShowLogin(false)} />
      )}
    </div>
  );
}
