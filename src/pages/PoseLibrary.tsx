import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { getSanskritName, SANSKRIT_STORAGE_KEY } from "@/lib/sanskritNames";

interface Pose {
  pose_name: string;
  family: string;
  difficulty_level: string;
  how_to_cue: string | null;
  purpose_value: string | null;
  image_url?: string;
}

const FAMILY_FILTERS: { label: string; values: string[] }[] = [
  { label: "Hip Openers", values: ["hip_opener"] },
  { label: "Standing Poses", values: ["standing_pose"] },
  { label: "Backbends", values: ["backbend"] },
  { label: "Twists", values: ["twist"] },
  { label: "Arm Balances", values: ["arm_balance"] },
  { label: "Inversions", values: ["inversion"] },
  { label: "Core", values: ["core"] },
  { label: "Seated Poses", values: ["seated"] },
  { label: "Forward Folds", values: ["fold"] },
  { label: "Lunges", values: ["lunge"] },
  { label: "Binds", values: ["bind"] },
  { label: "Side Bends", values: ["side_bend"] },
  { label: "Rest & Restorative", values: ["rest", "restorative"] },
];

const SKILL_FILTERS = ["Beginner", "Intermediate", "Advanced"];

const PoseLibrary = () => {
  const navigate = useNavigate();
  const [poses, setPoses] = useState<Pose[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [blooming, setBlooming] = useState(false);
  const [activeFamilies, setActiveFamilies] = useState<Set<string>>(new Set());
  const [activeSkills, setActiveSkills] = useState<Set<string>>(new Set());
  const [showSanskrit, setShowSanskrit] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SANSKRIT_STORAGE_KEY) === "true";
  });

  useEffect(() => {
    localStorage.setItem(SANSKRIT_STORAGE_KEY, String(showSanskrit));
  }, [showSanskrit]);

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), 20);
    const t2 = setTimeout(() => setBlooming(true), 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      const [{ data: library }, { data: media }] = await Promise.all([
        supabase
          .from("pose_library")
          .select("pose_name, family, difficulty_level, how_to_cue, purpose_value")
          .order("pose_name"),
        supabase.from("pose_media").select("pose_name, image_url"),
      ]);

      const mediaMap = new Map((media || []).map((m: any) => [m.pose_name.toLowerCase(), m.image_url]));
      const merged = (library || []).map((p: any) => ({
        ...p,
        image_url: mediaMap.get(p.pose_name.toLowerCase()),
      }));
      setPoses(merged);
      setLoading(false);
    };
    load();
  }, []);

  const displayName = (name: string) => {
    if (!showSanskrit) return name;
    return getSanskritName(name) || name;
  };

  const toggleFamily = (label: string) => {
    setActiveFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const toggleSkill = (skill: string) => {
    setActiveSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  };

  const filteredPoses = poses.filter((p) => {
    const familyMatch =
      activeFamilies.size === 0 ||
      Array.from(activeFamilies).some((label) => {
        const filter = FAMILY_FILTERS.find((f) => f.label === label);
        return filter?.values.includes(p.family);
      });
    const skillMatch = activeSkills.size === 0 || activeSkills.has(p.difficulty_level);
    return familyMatch && skillMatch;
  });

  return (
    <div className="kora-pose-library min-h-screen">
      <style>{`
        .kora-pose-library {
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
          background: var(--cream);
          font-family: var(--sans);
        }
        .kora-pose-library .plib-content {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .kora-pose-library .plib-content.mounted {
          opacity: 1;
          transform: translateY(0);
        }
        .kora-pose-library .back-link {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-family: var(--sans); font-size: 0.75rem; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-secondary);
          background: none; border: none; cursor: pointer; padding: 0;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .kora-pose-library .back-link:hover { color: var(--olive); transform: translateX(-2px); }
        .kora-pose-library .plib-lotus { width: 90px; height: 47px; margin: 0 auto 1.25rem; }
        .kora-pose-library .plib-lotus svg { width: 100%; height: 100%; overflow: visible; }
        .kora-pose-library .plib-lotus .lotus-petal {
          fill: none; stroke: #66725F; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round;
          opacity: 0; transform-origin: 100px 78px; transform: scale(0.92);
          transition: opacity 1.2s ease, transform 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .kora-pose-library .plib-lotus.blooming .lotus-petal { opacity: 1; transform: scale(1); }
        .kora-pose-library .plib-lotus.blooming .petal-back { transition-delay: 0s; }
        .kora-pose-library .plib-lotus.blooming .petal-mid { transition-delay: 0.1s; }
        .kora-pose-library .plib-lotus.blooming .petal-front { transition-delay: 0.2s; }
        .kora-pose-library .plib-lotus.blooming .petal-centre { transition-delay: 0.3s; }
        .kora-pose-library h1 {
          font-family: var(--serif); font-size: clamp(2.5rem, 6vw, 3.5rem); font-weight: 400;
          text-align: center; color: var(--text-primary); margin: 0;
        }
        .kora-pose-library .plib-tagline {
          text-align: center; color: var(--text-secondary); font-size: 1rem; margin-top: 0.5rem;
        }
        .kora-pose-library .plib-toggle-row {
          display: flex; justify-content: center; margin-top: 1.5rem;
        }
        .kora-pose-library .sanskrit-toggle {
          display: flex; align-items: center; gap: 0.6rem; cursor: pointer;
          font-size: 0.75rem; font-weight: 600; color: var(--olive);
        }
        .kora-pose-library .filters {
          max-width: 900px; margin: 2.5rem auto 0; display: flex; flex-direction: column; gap: 0.75rem;
        }
        .kora-pose-library .filter-row { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
        .kora-pose-library .filter-pill {
          font-family: var(--sans); font-size: 0.75rem; font-weight: 500; letter-spacing: 0.02em;
          padding: 0.45rem 1rem; border-radius: 999px; border: 1px solid var(--card-border);
          background: var(--white); color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease;
        }
        .kora-pose-library .filter-pill.active {
          background: var(--olive); border-color: var(--olive); color: var(--white);
        }
        .kora-pose-library .plib-grid {
          max-width: 1100px; margin: 3rem auto 6rem; padding: 0 1.5rem;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .kora-pose-library .plib-grid { grid-template-columns: 1fr; }
        }
        .kora-pose-library .pose-card {
          background: var(--white); border: 1px solid var(--card-border); border-radius: 6px;
          padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;
        }
        .kora-pose-library .pose-card img {
          width: 100%; height: 160px; object-fit: contain; background: var(--cream); border-radius: 4px;
        }
        .kora-pose-library .pose-card-name {
          font-family: var(--serif); font-size: 1.25rem; color: var(--text-primary); margin: 0;
        }
        .kora-pose-library .pose-card-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .kora-pose-library .pose-card-tag {
          font-size: 0.65rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--olive); background: var(--olive-muted); padding: 0.25rem 0.6rem; border-radius: 2px;
        }
        .kora-pose-library .pose-card-section-label {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--text-primary); margin-top: 0.5rem;
        }
        .kora-pose-library .pose-card-text {
          font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin: 0.25rem 0 0;
        }
        .kora-pose-library .plib-empty {
          text-align: center; color: var(--text-secondary); padding: 4rem 1.5rem; grid-column: 1 / -1;
        }
      `}</style>

      <div className={`plib-content ${mounted ? "mounted" : ""}`}>
        <div className="mx-auto max-w-6xl px-6 pt-8">
          <button className="back-link" onClick={() => navigate("/")}>
            ← Back to Homepage
          </button>
        </div>

        <div className="mx-auto max-w-2xl px-6 pt-10 text-center">
          <div className={`plib-lotus ${blooming ? "blooming" : ""}`}>
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
          <h1>Pose Library</h1>
          <p className="plib-tagline">Every pose Kora knows, ready to browse.</p>
          <div className="plib-toggle-row">
            <label className="sanskrit-toggle">
              <span>Show Sanskrit Names</span>
              <Switch checked={showSanskrit} onCheckedChange={setShowSanskrit} />
            </label>
          </div>
        </div>

        <div className="filters">
          <div className="filter-row">
            {FAMILY_FILTERS.map((f) => (
              <button
                key={f.label}
                className={`filter-pill ${activeFamilies.has(f.label) ? "active" : ""}`}
                onClick={() => toggleFamily(f.label)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="filter-row">
            {SKILL_FILTERS.map((s) => (
              <button
                key={s}
                className={`filter-pill ${activeSkills.has(s) ? "active" : ""}`}
                onClick={() => toggleSkill(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="plib-grid">
          {loading ? (
            <div className="plib-empty">Loading poses…</div>
          ) : filteredPoses.length === 0 ? (
            <div className="plib-empty">No poses match these filters.</div>
          ) : (
            filteredPoses.map((pose) => (
              <div className="pose-card" key={pose.pose_name}>
                {pose.image_url && <img src={pose.image_url} alt={displayName(pose.pose_name)} />}
                <h3 className="pose-card-name">{displayName(pose.pose_name)}</h3>
                <div className="pose-card-tags">
                  <span className="pose-card-tag">{pose.family.replace(/_/g, " ")}</span>
                  <span className="pose-card-tag">{pose.difficulty_level}</span>
                </div>
                {pose.how_to_cue && (
                  <>
                    <p className="pose-card-section-label">How to Cue</p>
                    <p className="pose-card-text">{pose.how_to_cue}</p>
                  </>
                )}
                {pose.purpose_value && (
                  <>
                    <p className="pose-card-section-label">Purpose / Value</p>
                    <p className="pose-card-text">{pose.purpose_value}</p>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PoseLibrary;
