import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const CYCLE_WORDS = ["Arrival", "Build", "Peak", "Return", "Completion"];
const CYCLE_NODES = [
  { x: 50, y: 180 },
  { x: 175, y: 120 },
  { x: 300, y: 100 },
  { x: 425, y: 120 },
  { x: 550, y: 180 },
];
const ARC_PATH = "M50,180 Q300,20 550,180";

const Landing = () => {
  const navigate = useNavigate();
  const lotusRef = useRef<HTMLDivElement>(null);
  const meaningRef = useRef<HTMLElement>(null);
  const meaningInnerRef = useRef<HTMLDivElement>(null);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [revealedEls, setRevealedEls] = useState<Set<string>>(new Set());
  const [navScrolled, setNavScrolled] = useState(false);

  // Nav becomes opaque once the user scrolls past the hero
  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll reveal observer for .reveal / .step elements
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-reveal-id");
            if (id) {
              setRevealedEls((prev) => new Set(prev).add(id));
            }
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll("[data-reveal-id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Lotus bloom retrigger on scroll into view
  useEffect(() => {
    const lotusWrap = lotusRef.current;
    if (!lotusWrap) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            lotusWrap.classList.remove("blooming");
            void lotusWrap.offsetWidth;
            lotusWrap.classList.add("blooming");
          } else {
            lotusWrap.classList.remove("blooming");
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(lotusWrap);
    return () => observer.disconnect();
  }, []);

  // Cycle word highlight
  useEffect(() => {
    const meaningSection = meaningRef.current;
    if (!meaningSection) return;

    let interval: ReturnType<typeof setInterval> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !interval) {
            interval = setInterval(() => {
              setCycleIndex((i) => (i + 1) % CYCLE_WORDS.length);
            }, 1200);
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(meaningSection);
    return () => {
      observer.disconnect();
      if (interval) clearInterval(interval);
    };
  }, []);

  // Subtle parallax on meaning section
  useEffect(() => {
    const handleScroll = () => {
      const meaningSection = meaningRef.current;
      const meaningInner = meaningInnerRef.current;
      if (!meaningSection || !meaningInner) return;

      const rect = meaningSection.getBoundingClientRect();
      const viewH = window.innerHeight;
      if (rect.top < viewH && rect.bottom > 0) {
        const progress = (viewH - rect.top) / (viewH + rect.height);
        const offset = (progress - 0.5) * -30;
        meaningInner.style.transform = `translateY(${offset}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isRevealed = (id: string) => revealedEls.has(id);

  const goToPlanner = () => navigate("/planner");

  return (
    <div className="kora-landing">
      <style>{`
        .kora-landing {
          --cream: #F5F0EB;
          --cream-dark: #EDE7E0;
          --olive: #5C6B55;
          --olive-light: #6B7D63;
          --olive-muted: rgba(92, 107, 85, 0.12);
          --text-primary: #2A2A28;
          --text-secondary: #8A857E;
          --text-muted: #B0AAA2;
          --white: #FDFCFA;
          --card-border: rgba(42, 42, 40, 0.08);
          --serif: 'Playfair Display', Georgia, 'Times New Roman', serif;
          --sans: 'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif;
          font-family: var(--sans);
          background: var(--cream);
          color: var(--text-primary);
          line-height: 1.6;
          overflow-x: hidden;
        }
        .kora-landing * { box-sizing: border-box; }
        .kora-landing .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .kora-landing .reveal.visible { opacity: 1; transform: translateY(0); }
        .kora-landing .reveal-delay-1 { transition-delay: 0.1s; }
        .kora-landing .reveal-delay-2 { transition-delay: 0.2s; }
        .kora-landing .reveal-delay-3 { transition-delay: 0.35s; }
        .kora-landing nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center;
          background: transparent; backdrop-filter: none; -webkit-backdrop-filter: none;
          border-bottom: 1px solid transparent;
          transition: background 0.35s ease, backdrop-filter 0.35s ease, border-color 0.35s ease;
        }
        .kora-landing nav.scrolled {
          background: rgba(245, 240, 235, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--card-border);
        }
        .kora-landing .nav-logo { display: flex; align-items: center; gap: 0.6rem; }
        .kora-landing .nav-logo svg { width: 22px; height: 22px; }
        .kora-landing .nav-logo span { font-family: var(--serif); font-size: 1.5rem; color: var(--text-primary); letter-spacing: -0.02em; }
        .kora-landing .nav-cta {
          font-family: var(--sans); font-size: 0.7rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--white); background: var(--olive); border: none; padding: 0.6rem 1.4rem; border-radius: 2px;
          cursor: pointer; transition: all 0.25s ease;
        }
        .kora-landing .nav-cta:hover { background: var(--olive-light); transform: translateY(-1px); }
        .kora-landing .hero {
          background: var(--white);
          max-width: 100%;
          min-height: 100vh; min-height: 100svh; display: flex; flex-direction: column; justify-content: center;
          align-items: center; text-align: center; padding: 6rem 1.5rem 4rem; position: relative;
        }
        .kora-landing .lotus-wrap { width: 180px; height: 95px; margin-bottom: 2rem; }
        .kora-landing .lotus-wrap svg { width: 100%; height: 100%; overflow: visible; }
        .kora-landing .lotus-petal {
          fill: none; stroke: #66725F; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round;
          opacity: 0; transform-origin: 100px 78px; transform: scale(0.92);
          transition: opacity 1.4s ease, transform 1.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .kora-landing .lotus-wrap.blooming .lotus-petal { opacity: 1; transform: scale(1); }
        .kora-landing .lotus-wrap.blooming .petal-back { transition-delay: 0s; }
        .kora-landing .lotus-wrap.blooming .petal-mid { transition-delay: 0.12s; }
        .kora-landing .lotus-wrap.blooming .petal-front { transition-delay: 0.24s; }
        .kora-landing .lotus-wrap.blooming .petal-centre { transition-delay: 0.36s; }
        .kora-landing .lotus-wrap.blooming svg { animation: lotusBreathe 5s ease-in-out 2s infinite; }
        @keyframes lotusBreathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        .kora-landing .hero-badge {
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #46523F;
          background: var(--olive-muted); padding: 0.5rem 1.2rem; border-radius: 2px; margin-bottom: 2rem;
          opacity: 0; animation: fadeUp 0.8s ease 1.1s forwards;
        }
        .kora-landing .hero h1 {
          font-family: var(--serif); font-size: clamp(4.4rem, 15vw, 8rem); font-weight: 400; letter-spacing: -0.03em;
          line-height: 0.95; color: var(--text-primary); opacity: 0; animation: fadeUp 0.8s ease 1.25s forwards; margin: 0;
        }
        .kora-landing .hero-tagline {
          font-family: var(--serif); font-size: clamp(1.85rem, 6vw, 1.85rem); font-weight: 500; font-style: italic;
          color: var(--olive); margin-top: 0.75rem; letter-spacing: -0.01em;
          opacity: 0; animation: fadeUp 0.8s ease 1.4s forwards;
        }
        .kora-landing .hero-description {
          font-size: 0.95rem; color: var(--text-secondary); max-width: 440px; margin-top: 1.75rem; line-height: 1.7;
          opacity: 0; animation: fadeUp 0.8s ease 1.55s forwards; text-wrap: pretty;
        }
        .kora-landing .hero-cta { margin-top: 3rem; opacity: 0; animation: fadeUp 0.8s ease 1.7s forwards; }
        .kora-landing .hero-cta button {
          font-family: var(--sans); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--white); background: var(--olive); border: none; padding: 1.3rem 2.5rem; border-radius: 2px;
          cursor: pointer; transition: all 0.3s ease;
        }
        .kora-landing .hero-cta button:hover { background: var(--olive-light); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(92, 107, 85, 0.2); }
        .kora-landing section { padding: 6rem 1.5rem; max-width: 720px; margin: 0 auto; }
        .kora-landing .section-label { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--olive); margin-bottom: 1.5rem; }
        .kora-landing .section-heading { font-family: var(--serif); font-size: clamp(2rem, 5vw, 2.75rem); font-weight: 400; letter-spacing: -0.02em; line-height: 1.15; color: var(--text-primary); margin-bottom: 1.5rem; text-wrap: balance; }
        .kora-landing .section-body { font-size: 1rem; color: var(--text-secondary); line-height: 1.75; max-width: 580px; text-wrap: pretty; }
        .kora-landing .problem { background: var(--cream); max-width: 100%; padding: 5rem 1.5rem; }
        .kora-landing .problem-inner { max-width: 720px; margin: 0 auto; text-align: center; }
        .kora-landing .problem .section-heading, .kora-landing .problem .section-body { max-width: 600px; margin-left: auto; margin-right: auto; }
        .kora-landing .meaning { background: var(--white); max-width: 100%; padding: 6rem 1.5rem 7rem; text-align: center; position: relative; overflow: hidden; }
        .kora-landing .meaning-inner { max-width: 600px; margin: 0 auto; position: relative; z-index: 1; will-change: transform; }
        .kora-landing .meaning-name { font-family: var(--serif); font-size: clamp(2.5rem, 7vw, 3.5rem); font-style: italic; color: var(--text-primary); letter-spacing: -0.02em; margin-bottom: 1.25rem; }
        .kora-landing .meaning-origin { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--olive); margin-bottom: 1.75rem; }
        .kora-landing .meaning-text { font-size: 1rem; color: var(--text-secondary); line-height: 1.8; max-width: 480px; margin: 0 auto 0.5rem; text-wrap: pretty; }
        .kora-landing .cycle-arc { display: flex; align-items: center; justify-content: center; gap: 0.5rem; flex-wrap: wrap; }
        .kora-landing .cycle-diagram { margin-top: 0.25rem; }
        .kora-landing .cycle-arc-svg { display: block; width: 100%; max-width: 560px; height: auto; margin: 0 auto; overflow: visible; }
        .kora-landing .cycle-arc-bg { fill: none; stroke: var(--olive); stroke-width: 2; opacity: 0.35; }
        .kora-landing .cycle-node { fill: var(--white); stroke: var(--text-muted); stroke-width: 2; transition: fill 0.5s ease, stroke 0.5s ease, filter 0.5s ease; }
        .kora-landing .cycle-node.active { fill: var(--olive); stroke: var(--olive); filter: drop-shadow(0 0 5px rgba(92, 107, 85, 0.65)); }
        .kora-landing .cycle-node-label { font-family: var(--serif); font-size: 13px; fill: var(--text-muted); transition: fill 0.5s ease, filter 0.5s ease; }
        .kora-landing .cycle-node-label.active { fill: var(--olive); filter: drop-shadow(0 0 4px rgba(92, 107, 85, 0.45)); }
        .kora-landing .cycle-word { font-family: var(--serif); font-size: 0.85rem; color: var(--text-muted); letter-spacing: 0.02em; transition: color 0.4s ease; }
        .kora-landing .cycle-word.active { color: var(--olive); }
        .kora-landing .cycle-arrow { font-size: 0.65rem; color: var(--text-muted); opacity: 0.4; }
        .kora-landing .meaning::before {
          content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 350px; height: 350px;
          background: radial-gradient(circle, var(--olive-muted) 0%, transparent 70%); opacity: 0.4; border-radius: 50%; pointer-events: none;
        }
        .kora-landing .how-it-works { background: var(--cream); max-width: 100%; padding-bottom: 6rem; }
        .kora-landing .how-it-works > * { max-width: 720px; margin-left: auto; margin-right: auto; }
        .kora-landing .steps { margin-top: 3rem; display: flex; flex-direction: column; gap: 2.75rem; max-width: 720px; margin-left: auto; margin-right: auto; }
        .kora-landing .step { display: flex; gap: 1.75rem; align-items: flex-start; opacity: 0; transform: translateY(24px); transition: all 0.65s ease; }
        .kora-landing .step.visible { opacity: 1; transform: translateY(0); }
        .kora-landing .step-indicator { flex-shrink: 0; width: 44px; height: 44px; background: var(--olive-muted); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .kora-landing .step-indicator span { font-family: var(--serif); font-size: 1.05rem; color: var(--olive); }
        .kora-landing .step-content h3 { font-family: var(--serif); font-size: 1.3rem; font-weight: 400; color: var(--text-primary); margin-bottom: 0.4rem; letter-spacing: -0.01em; }
        .kora-landing .step-content p { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.65; text-wrap: pretty; }
        .kora-landing .step-content em { color: var(--olive); font-style: italic; }
        .kora-landing .preview { background: var(--white); max-width: 100%; padding: 6rem 1.5rem; text-align: center; }
        .kora-landing .preview-inner { max-width: 720px; margin: 0 auto; }
        .kora-landing .preview-card { margin-top: 3rem; background: var(--cream); border: 1px solid var(--card-border); border-radius: 4px; overflow: hidden; text-align: left; }
        .kora-landing .preview-header { padding: 1.75rem 1.5rem 0; display: flex; justify-content: space-between; align-items: baseline; }
        .kora-landing .preview-phase { font-family: var(--serif); font-size: 1.1rem; font-weight: 600; color: var(--text-primary); letter-spacing: 0.04em; text-transform: uppercase; }
        .kora-landing .preview-time { font-size: 0.75rem; font-weight: 500; color: var(--text-muted); letter-spacing: 0.1em; text-transform: uppercase; }
        .kora-landing .preview-divider { height: 2px; background: var(--olive); margin: 1rem 1.5rem 0; opacity: 0.6; }
        .kora-landing .preview-subtitle { font-size: 0.95rem; color: var(--text-secondary); padding: 1.25rem 1.5rem 0; font-style: italic; }
        .kora-landing .pose-cards { padding: 1rem 1.5rem 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .kora-landing .pose-card { background: var(--white); border: 1px solid var(--card-border); border-radius: 3px; padding: 1.25rem; display: flex; gap: 1rem; align-items: flex-start; transition: transform 0.25s ease; }
        .kora-landing .pose-card:hover { transform: translateX(4px); }
        .kora-landing .preview-example-badge {
          display: inline-block; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--olive); background: var(--olive-muted); padding: 0.4rem 0.9rem; border-radius: 2px;
          margin: 1.75rem 1.5rem 0;
        }
        .kora-landing .pose-icon { width: 56px; height: 56px; flex-shrink: 0; background: var(--cream); border-radius: 3px; overflow: hidden; }
        .kora-landing .pose-icon img { width: 100%; height: 100%; object-fit: contain; }
        @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.06); opacity: 1; } }
        .kora-landing .pose-info { flex: 1; min-width: 0; }
        .kora-landing .pose-info h4 { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.35rem; }
        .kora-landing .pose-meta { font-size: 0.8rem; color: var(--olive); font-weight: 500; margin-bottom: 0.25rem; }
        .kora-landing .pose-cue { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; font-style: italic; }
        .kora-landing .modify-tag { font-size: 0.65rem; font-weight: 500; letter-spacing: 0.08em; color: var(--text-muted); flex-shrink: 0; align-self: flex-start; padding-top: 0.15rem; }
        .kora-landing .cta-section { background: var(--text-primary); max-width: 100%; padding: 6rem 1.5rem; text-align: center; }
        .kora-landing .cta-section-inner { max-width: 480px; margin: 0 auto; }
        .kora-landing .cta-section .section-label { color: var(--olive-light); opacity: 0.8; }
        .kora-landing .cta-section .section-heading { color: var(--cream); }
        .kora-landing .cta-section .section-body { color: var(--text-muted); margin: 0 auto 2.5rem; }
        .kora-landing .cta-section-button button {
          font-family: var(--sans); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--text-primary); background: var(--cream); border: none; padding: 1rem 2.5rem; border-radius: 2px;
          cursor: pointer; transition: all 0.25s ease;
        }
        .kora-landing .cta-section-button button:hover { background: var(--white); transform: translateY(-1px); }
        .kora-landing footer { background: var(--text-primary); border-top: 1px solid rgba(255, 255, 255, 0.06); padding: 2.5rem 1.5rem; text-align: center; }
        .kora-landing footer .footer-logo { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .kora-landing footer .footer-logo svg { width: 20px; height: 20px; }
        .kora-landing footer .footer-logo span { font-family: var(--serif); font-size: 1.25rem; color: var(--cream); opacity: 0.6; }
        .kora-landing footer p { font-size: 0.75rem; color: rgba(255, 255, 255, 0.2); margin-top: 0.75rem; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @media (min-width: 640px) {
          .kora-landing section { padding: 8rem 2rem; }
          .kora-landing .problem, .kora-landing .preview, .kora-landing .cta-section { padding: 8rem 2rem; }
          .kora-landing .meaning { padding: 6rem 2rem; }
        }
        @media (min-width: 1024px) {
          .kora-landing .lotus-wrap { width: 230px; height: 121px; }
          .kora-landing .hero h1 { font-size: clamp(3.5rem, 12vw, 9.5rem); }
          .kora-landing .hero-tagline { font-size: clamp(1.4rem, 4.5vw, 2.1rem); }
          .kora-landing .hero-description { max-width: 500px; font-size: 1.05rem; }
          .kora-landing .hero-badge { font-size: 0.72rem; padding: 0.6rem 1.4rem; }
        }
        @media (max-width: 480px) {
          .kora-landing .cycle-arc { gap: 0.3rem; }
          .kora-landing .cycle-word { font-size: 0.75rem; }
          .kora-landing .problem { padding-left: 1rem; padding-right: 1rem; }
          .kora-landing .problem .section-heading { text-wrap: pretty; max-width: 100%; }
          .kora-landing .hero {
            min-height: 900px;
            justify-content: flex-start;
            padding: 4rem 1.5rem calc(3rem + env(safe-area-inset-bottom));
          }
          .kora-landing .hero h1 { font-size: clamp(4rem, 15vw, 8rem); }
          .kora-landing .lotus-wrap { width: 100px; height: 55px; margin-bottom: 1rem; }
          .kora-landing .hero-badge { margin-bottom: 1.25rem; }
          .kora-landing .hero-tagline { margin-top: 0.5rem; }
          .kora-landing .hero-description { margin-top: 1.25rem; }
          .kora-landing .hero-cta { margin-top: 1.75rem; }
        }
      `}</style>

      <nav className={navScrolled ? "scrolled" : ""}>
        <div className="nav-logo">
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
        </div>
        <button className="nav-cta" onClick={goToPlanner}>Plan a Class</button>
      </nav>


      <section className="hero">
        <div className="lotus-wrap" id="lotus" ref={lotusRef}>
          <svg viewBox="0 0 200 105" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path className="lotus-petal petal-back" d="M100 78 C82 66, 32 52, 6 64 C4 72, 28 84, 60 86 C78 86, 94 82, 100 78Z"/>
            <path className="lotus-petal petal-back" d="M100 78 C118 66, 168 52, 194 64 C196 72, 172 84, 140 86 C122 86, 106 82, 100 78Z"/>
            <path className="lotus-petal petal-mid" d="M100 76 C86 58, 50 24, 36 12 C30 16, 38 38, 56 56 C70 68, 88 76, 100 76Z"/>
            <path className="lotus-petal petal-mid" d="M100 76 C114 58, 150 24, 164 12 C170 16, 162 38, 144 56 C130 68, 112 76, 100 76Z"/>
            <path className="lotus-petal petal-front" d="M100 74 C90 52, 74 18, 68 6 C64 10, 68 32, 78 50 C86 62, 96 72, 100 74Z"/>
            <path className="lotus-petal petal-front" d="M100 74 C110 52, 126 18, 132 6 C136 10, 132 32, 122 50 C114 62, 104 72, 100 74Z"/>
            <path className="lotus-petal petal-centre" d="M100 72 C92 48, 86 16, 88 2 C92 -2, 97 10, 100 2 C103 10, 108 -2, 112 2 C114 16, 108 48, 100 72Z"/>
          </svg>
        </div>

        <div className="hero-badge">Built for Instructors</div>
        <h1>Kora</h1>
        <p className="hero-tagline">Plan less. Teach better.</p>
        <p className="hero-description">
          Create thoughtful yoga sequences in minutes. Whether you're planning a Vinyasa flow, restorative session, or themed practice, Kora helps you turn your ideas into balanced class plans that still feel like your own.
        </p>
        <div className="hero-cta">
          <button onClick={goToPlanner}>Plan a Class</button>
        </div>
      </section>

      <section className="problem">
        <div className="problem-inner">
          <h2 className={`section-heading reveal ${isRevealed("problem-h") ? "visible" : ""}`} data-reveal-id="problem-h">
            Planning your next class shouldn't feel overwhelming.
          </h2>
          <p className={`section-body reveal reveal-delay-1 ${isRevealed("problem-p") ? "visible" : ""}`} data-reveal-id="problem-p">
            Whether you're teaching every day or a few times a week, creating fresh classes takes time and creative energy. Kora provides a structured starting point that you can adapt to your students, teaching style, and class goals.
          </p>
        </div>
      </section>

      <section className="meaning" ref={meaningRef}>
        <div className="meaning-inner" ref={meaningInnerRef}>
          <p className={`meaning-origin reveal ${isRevealed("meaning-origin") ? "visible" : ""}`} data-reveal-id="meaning-origin">The Name</p>
          <h2 className={`meaning-name reveal reveal-delay-1 ${isRevealed("meaning-name") ? "visible" : ""}`} data-reveal-id="meaning-name">Kora</h2>
          <p className={`meaning-text reveal reveal-delay-2 ${isRevealed("meaning-text") ? "visible" : ""}`} data-reveal-id="meaning-text">
            In Tibetan tradition, a kora is a circular pilgrimage — an intentional journey around a sacred site. The word means to move in a complete arc. Every great class follows its own cycle. Kora is the intelligent structure behind that flow.
          </p>
          <div className={`cycle-diagram reveal reveal-delay-3 ${isRevealed("cycle-arc") ? "visible" : ""}`} data-reveal-id="cycle-arc">
            <svg viewBox="0 0 600 210" className="cycle-arc-svg">
              <path className="cycle-arc-bg" d={ARC_PATH} />
              {CYCLE_NODES.map((node, i) => (
                <g key={CYCLE_WORDS[i]}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={5}
                    className={`cycle-node ${i === cycleIndex ? "active" : ""}`}
                  />
                  <text x={node.x} y={node.y + 30} textAnchor="middle" className={`cycle-node-label ${i === cycleIndex ? "active" : ""}`}>
                    {CYCLE_WORDS[i]}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className={`section-label reveal ${isRevealed("how-label") ? "visible" : ""}`} data-reveal-id="how-label">How It Works</div>
        <h2 className={`section-heading reveal reveal-delay-1 ${isRevealed("how-h") ? "visible" : ""}`} data-reveal-id="how-h">
          From peak pose to full class<br />in three steps.
        </h2>
        <p className={`section-body reveal reveal-delay-2 ${isRevealed("how-p") ? "visible" : ""}`} data-reveal-id="how-p">
          Tell Kora what you're building towards — a peak pose, a theme, or even a teaching style you admire. It generates a complete, intelligent flow you can edit and make your own.
        </p>
        <div className="steps">
          <div className={`step ${isRevealed("step-1") ? "visible" : ""}`} data-reveal-id="step-1">
            <div className="step-indicator"><span>1</span></div>
            <div className="step-content">
              <h3>Set your intention</h3>
              <p>Choose your class length, skill level, and peak movement. Want to build around Bird of Paradise? A hip-opener theme? A flow inspired by <em>Dharma Mittra's inversion philosophy</em>? Start there.</p>
            </div>
          </div>
          <div className={`step ${isRevealed("step-2") ? "visible" : ""}`} data-reveal-id="step-2">
            <div className="step-indicator"><span>2</span></div>
            <div className="step-content">
              <h3>Kora builds your arc</h3>
              <p>A complete class — warm-up, build, peak, counterposes, cool-down — with breath cues, transitions, and modifications. Structured around the natural cycle every great class follows.</p>
            </div>
          </div>
          <div className={`step ${isRevealed("step-3") ? "visible" : ""}`} data-reveal-id="step-3">
            <div className="step-indicator"><span>3</span></div>
            <div className="step-content">
              <h3>Make it yours</h3>
              <p>Swap poses, adjust timing, refine cues. Save it to your library and teach it today. Come back later to evolve it — your collection grows with you.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="preview">
        <div className="preview-inner">
          <div className={`section-label reveal ${isRevealed("preview-label") ? "visible" : ""}`} data-reveal-id="preview-label">A Glimpse Inside</div>
          <h2 className={`section-heading reveal reveal-delay-1 ${isRevealed("preview-h") ? "visible" : ""}`} data-reveal-id="preview-h">
            Every pose. Every cue.<br />Ready to teach.
          </h2>
          <p className={`section-body reveal reveal-delay-2 ${isRevealed("preview-p") ? "visible" : ""}`} data-reveal-id="preview-p" style={{ margin: "0 auto", maxWidth: "620px" }}>
            Breath cues, teaching cues, and modifications — structured in the arc your class deserves.
          </p>

          <div className={`preview-card reveal reveal-delay-3 ${isRevealed("preview-card") ? "visible" : ""}`} data-reveal-id="preview-card">
            <div className="preview-example-badge">Example — Warm-Up Flow</div>
            <div className="preview-header">
              <span className="preview-phase">Warm-Up</span>
              <span className="preview-time">10 Min</span>
            </div>
            <div className="preview-divider"></div>
            <div className="preview-subtitle">Grounding and Spinal Awakening</div>
            <div className="pose-cards">
              <div className="pose-card">
                <div className="pose-icon">
                  <img src="https://xuxzhkcjdexcynvcpjka.supabase.co/storage/v1/object/public/poses//childs-pose.png" alt="Child's Pose" />
                </div>
                <div className="pose-info">
                  <h4>Child's Pose</h4>
                  <p className="pose-meta">Breath: Inhale into the back ribs</p>
                  <p className="pose-cue">Sink hips to heels and reach fingertips forward to create length through the spine. Let the forehead rest heavy — this is a moment to arrive, not to work.</p>
                </div>
                <span className="modify-tag">Modify</span>
              </div>

              <div className="pose-card">
                <div className="pose-icon">
                  <img src="https://xuxzhkcjdexcynvcpjka.supabase.co/storage/v1/object/public/poses//cat-cow.png" alt="Cat-Cow" />
                </div>
                <div className="pose-info">
                  <h4>Cat-Cow</h4>
                  <p className="pose-meta">Breath: Inhale to look up, exhale to round</p>
                  <p className="pose-cue">Move segmentally through the vertebrae, one bone at a time, syncing each movement to a breath to hydrate the spine and wake up the core.</p>
                </div>
                <span className="modify-tag">Modify</span>
              </div>

              <div className="pose-card">
                <div className="pose-icon">
                  <img src="https://xuxzhkcjdexcynvcpjka.supabase.co/storage/v1/object/public/poses//downward-facing-dog.png" alt="Downward Facing Dog" />
                </div>
                <div className="pose-info">
                  <h4>Downward Facing Dog</h4>
                  <p className="pose-meta">Breath: Exhale as you lift the hips</p>
                  <p className="pose-cue">Press firmly through the index knuckles to stabilize the shoulders, and pedal the feet to warm up the hamstrings ahead of standing work.</p>
                </div>
                <span className="modify-tag">Modify</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-section-inner">
          <div className={`section-label reveal ${isRevealed("cta-label") ? "visible" : ""}`} data-reveal-id="cta-label">Ready When You Are</div>
          <h2 className={`section-heading reveal reveal-delay-1 ${isRevealed("cta-h") ? "visible" : ""}`} data-reveal-id="cta-h">
            Your next class,<br />planned in a minute.
          </h2>
          <p className={`section-body reveal reveal-delay-2 ${isRevealed("cta-p") ? "visible" : ""}`} data-reveal-id="cta-p">
            Vinyasa, Hatha, Yin, Restorative, and more — matched to your students, your teaching style, and your class goals. Generate instantly. Save your favorites anytime with a free account.
          </p>
          <div className={`cta-section-button reveal reveal-delay-3 ${isRevealed("cta-btn") ? "visible" : ""}`} data-reveal-id="cta-btn">
            <button onClick={goToPlanner}>Plan a Class</button>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-logo">
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
        </div>
        <p>&copy; 2026 Kora. Built for instructors.</p>
      </footer>
    </div>
  );
};

export default Landing;
