import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";

const CATEGORIES = ["Bug", "Suggestion", "Other"];

const Feedback = () => {
  const [mounted, setMounted] = useState(false);
  const [blooming, setBlooming] = useState(false);
  const [category, setCategory] = useState("Suggestion");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const t1 = setTimeout(() => setMounted(true), 20);
    const t2 = setTimeout(() => setBlooming(true), 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message before submitting.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      category,
      message: message.trim(),
      email: email.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Something went wrong. Please try again.");
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="kora-feedback min-h-screen">
      <style>{`
        .kora-feedback {
          --cream: #F5F0EB;
          --olive: #5C6B55;
          --olive-light: #6B7D63;
          --olive-muted: rgba(92, 107, 85, 0.12);
          --text-primary: #2A2A28;
          --text-secondary: #8A857E;
          --white: #FDFCFA;
          --card-border: rgba(42, 42, 40, 0.08);
          --serif: 'Playfair Display', Georgia, 'Times New Roman', serif;
          --sans: 'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--white);
          font-family: var(--sans);
        }
        .kora-feedback .fb-content {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .kora-feedback .fb-content.mounted { opacity: 1; transform: translateY(0); }
        .kora-feedback .fb-lotus { width: 90px; height: 47px; margin: 0 auto 1.25rem; }
        .kora-feedback .fb-lotus svg { width: 100%; height: 100%; overflow: visible; }
        .kora-feedback .fb-lotus .lotus-petal {
          fill: none; stroke: #66725F; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round;
          opacity: 0; transform-origin: 100px 78px; transform: scale(0.92);
          transition: opacity 1.2s ease, transform 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .kora-feedback .fb-lotus.blooming .lotus-petal { opacity: 1; transform: scale(1); }
        .kora-feedback .fb-lotus.blooming .petal-back { transition-delay: 0s; }
        .kora-feedback .fb-lotus.blooming .petal-mid { transition-delay: 0.1s; }
        .kora-feedback .fb-lotus.blooming .petal-front { transition-delay: 0.2s; }
        .kora-feedback .fb-lotus.blooming .petal-centre { transition-delay: 0.3s; }
        .kora-feedback h1 {
          font-family: var(--serif); font-size: clamp(2.5rem, 6vw, 3.5rem); font-weight: 400;
          text-align: center; color: var(--text-primary); margin: 0;
        }
        .kora-feedback .fb-tagline {
          text-align: center; color: var(--text-secondary); font-size: 1rem; margin-top: 0.5rem; max-width: 420px;
          margin-left: auto; margin-right: auto;
        }
        .kora-feedback .fb-form {
          max-width: 480px; margin: 3rem auto 6rem; padding: 0 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;
        }
        .kora-feedback .fb-category-row { display: flex; gap: 0.5rem; }
        .kora-feedback .fb-category-pill {
          flex: 1; font-family: var(--sans); font-size: 0.8rem; font-weight: 600;
          padding: 0.6rem; border-radius: 4px; border: 1px solid var(--card-border);
          background: var(--cream); color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease;
        }
        .kora-feedback .fb-category-pill.active { background: var(--olive); border-color: var(--olive); color: var(--white); }
        .kora-feedback label {
          font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
          color: var(--text-primary); margin-bottom: 0.4rem; display: block;
        }
        .kora-feedback textarea, .kora-feedback input {
          width: 100%; font-family: var(--sans); font-size: 0.95rem; padding: 0.9rem;
          border: 1px solid var(--card-border); border-radius: 4px; background: var(--cream);
          color: var(--text-primary); resize: vertical;
        }
        .kora-feedback textarea:focus, .kora-feedback input:focus { outline: 2px solid var(--olive); outline-offset: 1px; }
        .kora-feedback .fb-submit {
          font-family: var(--sans); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--white); background: var(--olive); border: none; padding: 1rem; border-radius: 4px;
          cursor: pointer; transition: all 0.25s ease;
        }
        .kora-feedback .fb-submit:hover { background: var(--olive-light); }
        .kora-feedback .fb-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .kora-feedback .fb-success {
          text-align: center; max-width: 420px; margin: 3rem auto 6rem; padding: 0 1.5rem;
        }
        .kora-feedback .fb-success p { color: var(--text-secondary); margin-top: 0.5rem; }
        .kora-feedback .fb-footer {
          background: var(--white); border-top: 1px solid var(--card-border);
          padding: 2.5rem 1.5rem; text-align: center;
        }
        .kora-feedback .fb-footer-logo { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .kora-feedback .fb-footer-logo svg { width: 20px; height: 20px; }
        .kora-feedback .fb-footer-logo span { font-family: var(--serif); font-size: 1.25rem; color: var(--text-primary); opacity: 0.5; }
        .kora-feedback .fb-footer p { font-size: 0.75rem; color: var(--text-secondary); opacity: 0.6; margin-top: 0.75rem; }
        .kora-feedback .fb-footer-links { display: flex; align-items: center; justify-content: center; gap: 0.65rem; margin-top: 1rem; }
        .kora-feedback .fb-footer-links a {
          font-size: 0.75rem; color: var(--olive); text-decoration: none; transition: color 0.2s ease;
        }
        .kora-feedback .fb-footer-links a:hover { color: var(--olive-light); text-decoration: underline; text-underline-offset: 2px; }
        .kora-feedback .fb-footer-links span { font-size: 0.75rem; color: var(--text-secondary); opacity: 0.5; }
      `}</style>

      <SiteNav />

      <div className={`fb-content ${mounted ? "mounted" : ""}`}>
        <div className="mx-auto max-w-2xl px-6 pt-28">
          <div className={`fb-lotus ${blooming ? "blooming" : ""}`}>
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
          <h1>Feedback</h1>
          <p className="fb-tagline">Found a bug, have a suggestion, or just want to share a thought? Let us know — you can leave your email if you'd like a reply, or submit anonymously.</p>
        </div>

        {submitted ? (
          <div className="fb-success">
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.5rem", color: "var(--text-primary)" }}>
              Thank you.
            </h2>
            <p>Your feedback has been received.</p>
          </div>
        ) : (
          <div className="fb-form">
            <div>
              <label>Category</label>
              <div className="fb-category-row">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    className={`fb-category-pill ${category === c ? "active" : ""}`}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label>Message</label>
              <textarea
                rows={6}
                placeholder="Tell us what's on your mind…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div>
              <label>Email (optional)</label>
              <input
                type="email"
                placeholder="you@example.com — leave blank to stay anonymous"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button className="fb-submit" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Feedback"}
            </button>
          </div>
        )}
      </div>

      <footer className="fb-footer">
        <div className="fb-footer-logo">
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
        <div className="fb-footer-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <span aria-hidden="true">·</span>
          <Link to="/terms-of-service">Terms of Service</Link>
        </div>
        <p>&copy; 2026 Kora. Built for instructors.</p>
      </footer>
    </div>
  );
};

export default Feedback;
