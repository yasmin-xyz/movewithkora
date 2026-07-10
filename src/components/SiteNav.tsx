import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Shared nav bar used across Landing, Pose Library, and Feedback pages.
// Keeps behavior/styling identical everywhere and highlights the active page.
const SiteNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`kora-nav ${isHome ? (scrolled ? "scrolled" : "") : "solid"}`}>
      <style>{`
        .kora-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center;
          background: transparent; backdrop-filter: none; -webkit-backdrop-filter: none;
          border-bottom: 1px solid transparent;
          transition: background 0.35s ease, backdrop-filter 0.35s ease, border-color 0.35s ease;
        }
        .kora-nav.scrolled {
          background: rgba(245, 240, 235, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(42, 42, 40, 0.08);
        }
        .kora-nav.solid {
          background: #FDFCFA; border-bottom: 1px solid rgba(42, 42, 40, 0.08);
        }
        .kora-nav .nav-logo { display: flex; align-items: center; gap: 0.6rem; cursor: pointer; background: none; border: none; padding: 0; }
        .kora-nav .nav-logo svg { width: 22px; height: 22px; }
        .kora-nav .nav-logo span {
          font-family: 'Playfair Display', Georgia, serif; font-size: 1.5rem; color: #2A2A28; letter-spacing: -0.02em;
        }
        .kora-nav .nav-cta {
          font-family: 'Source Sans 3', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase;
          color: #FDFCFA; background: #5C6B55; border: none; padding: 0.6rem 1.4rem; border-radius: 2px;
          cursor: pointer; transition: all 0.25s ease;
        }
        .kora-nav .nav-cta:hover { background: #6B7D63; transform: translateY(-1px); }
        .kora-nav .nav-right { display: flex; align-items: center; gap: 1.1rem; }
        .kora-nav .nav-links-desktop { display: flex; align-items: center; gap: 0.6rem; }
        .kora-nav .nav-link {
          font-family: 'Source Sans 3', sans-serif; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
          color: #5C6B55; background: rgba(92, 107, 85, 0.12); border: 1px solid transparent;
          padding: 0.55rem 1.1rem; border-radius: 2px; cursor: pointer; transition: background 0.2s ease, border-color 0.2s ease;
        }
        .kora-nav .nav-link:hover {
          background: #FDFCFA; border-color: #5C6B55;
        }
        .kora-nav .nav-link.active {
          background: transparent; border-color: #5C6B55; color: #5C6B55;
        }
        .kora-nav .nav-hamburger {
          display: none; background: none; border: none; font-size: 1.3rem; line-height: 1;
          color: #2A2A28; cursor: pointer; padding: 0.3rem;
        }
        .kora-nav .nav-mobile-panel {
          position: absolute; top: 100%; right: 1.5rem; margin-top: 0.5rem;
          background: #F5F0EB; border: 1px solid rgba(42, 42, 40, 0.08); border-radius: 4px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08); display: flex; flex-direction: column; overflow: hidden; z-index: 200;
          min-width: 180px;
        }
        .kora-nav .nav-mobile-panel button {
          font-family: 'Source Sans 3', sans-serif; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.04em;
          color: #5C6B55; background: none; border: none; padding: 0.9rem 1.75rem; text-align: left;
          cursor: pointer; white-space: nowrap; transition: background 0.15s ease;
        }
        .kora-nav .nav-mobile-panel button:hover { background: rgba(92, 107, 85, 0.12); }
        .kora-nav .nav-mobile-panel .nav-mobile-cta {
          background: #5C6B55; color: #FDFCFA; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.72rem;
        }
        .kora-nav .nav-mobile-panel .nav-mobile-cta:hover { background: #6B7D63; }
        .kora-nav .nav-mobile-panel button.active { background: rgba(92, 107, 85, 0.12); }
        @media (max-width: 767px) {
          .kora-nav .nav-links-desktop { display: none; }
          .kora-nav .nav-hamburger { display: block; }
          .kora-nav .nav-cta-desktop { display: none; }
        }
      `}</style>

      <button className="nav-logo" onClick={() => navigate("/")}>
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="100" fill="#5C6B55"/>
          <g transform="translate(100,100) scale(0.95) translate(-100,-42)" fill="#FFFFFF" stroke="#5C6B55" strokeWidth="2" strokeLinejoin="round">
            <path d="M100 78 C82 66, 32 52, 6 64 C4 72, 28 84, 60 86 C78 86, 94 82, 100 78Z"/>
            <path d="M100 78 C118 66, 168 52, 194 64 C196 72, 172 84, 140 86 C122 86, 106 82, 100 78Z"/>
            <path d="M100 76 C86 58, 50 24, 36 12 C30 16, 38 38, 56 56 C70 68, 88 76, 100 76Z"/>
            <path d="M100 76 C114 58, 150 24, 164 12 C170 16, 162 38, 144 56 C130 68, 112 76, 100 76Z"/>
            <path d="M100 74 C90 52, 74 18, 68 6 C64 10, 68 32, 78 50 C86 62, 96 72, 100 74Z"/>
            <path d="M100 74 C110 52, 126 18, 132 6 C136 10, 132 32, 122 50 C114 62, 104 72, 100 74Z"/>
            <path d="M100 72 C92 48, 86 16, 88 2 C92 -2, 97 10, 100 2 C103 10, 108 -2, 112 2 C114 16, 108 48, 100 72Z"/>
          </g>
        </svg>
        <span>Kora</span>
      </button>

      <div className="nav-right">
        <div className="nav-links-desktop">
          <button
            className={`nav-link ${isActive("/pose-library") ? "active" : ""}`}
            onClick={() => navigate("/pose-library")}
          >
            Pose Library
          </button>
          <button
            className={`nav-link ${isActive("/feedback") ? "active" : ""}`}
            onClick={() => navigate("/feedback")}
          >
            Feedback
          </button>
        </div>
        <button
          className="nav-hamburger"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
        <button className="nav-cta nav-cta-desktop" onClick={() => navigate("/planner")}>Plan a Class</button>
      </div>

      {mobileMenuOpen && (
        <div className="nav-mobile-panel">
          <button className="nav-mobile-cta" onClick={() => { setMobileMenuOpen(false); navigate("/planner"); }}>
            Plan a Class
          </button>
          <button
            className={isActive("/pose-library") ? "active" : ""}
            onClick={() => { setMobileMenuOpen(false); navigate("/pose-library"); }}
          >
            Pose Library
          </button>
          <button
            className={isActive("/feedback") ? "active" : ""}
            onClick={() => { setMobileMenuOpen(false); navigate("/feedback"); }}
          >
            Feedback
          </button>
        </div>
      )}
    </nav>
  );
};

export default SiteNav;
