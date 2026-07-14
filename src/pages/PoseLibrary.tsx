import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { getSanskritName, SANSKRIT_STORAGE_KEY } from "@/lib/sanskritNames";
import SiteNav from "@/components/SiteNav";

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

// Well-known poses NOT currently in the curated library, tagged with the
// family they'd belong to — lets us suggest genuinely similar poses even
// when the exact searched pose isn't something we teach yet.
const KNOWN_POSES_NOT_IN_LIBRARY: { name: string; family: string }[] = [
  { name: "Peacock Pose", family: "arm_balance" },
  { name: "Firefly Pose", family: "arm_balance" },
  { name: "Grasshopper Pose", family: "arm_balance" },
  { name: "One-Legged Crow Pose", family: "arm_balance" },
  { name: "Scale Pose", family: "arm_balance" },
  { name: "Rooster Pose", family: "arm_balance" },
  { name: "Eight-Angle Pose", family: "arm_balance" },
  { name: "Scorpion Pose", family: "inversion" },
  { name: "Feathered Peacock Pose", family: "inversion" },
  { name: "Tripod Headstand", family: "inversion" },
  { name: "Lotus Pose", family: "seated" },
  { name: "Turtle Pose", family: "seated" },
  { name: "Sleeping Turtle Pose", family: "fold" },
  { name: "Compass Pose", family: "twist" },
  { name: "Revolved Head-to-Knee Pose", family: "twist" },
  { name: "Noose Pose", family: "twist" },
  { name: "Superman Pose", family: "backbend" },
  { name: "Frog Backbend", family: "backbend" },
  { name: "Scorpion Handstand", family: "backbend" },
  { name: "Splits", family: "lunge" },
  { name: "Monkey Pose", family: "lunge" },
  { name: "Star Pose", family: "standing_pose" },
  { name: "Toe Stand", family: "standing_pose" },
  { name: "Reverse Prayer Pose", family: "bind" },
  { name: "Cow Face Pose", family: "bind" },
  { name: "Anantasana", family: "side_bend" },
  { name: "Crocodile Pose", family: "rest" },
  { name: "Yogic Sleep Pose", family: "rest" },
];

// Recognizable category words mapped to a family value — lets a search like
// "twist" or "backbend" surface relevant poses even with no specific pose name typed.
const CATEGORY_KEYWORDS: { keywords: string[]; family: string }[] = [
  { keywords: ["hip opener", "hip", "groin"], family: "hip_opener" },
  { keywords: ["standing"], family: "standing_pose" },
  { keywords: ["backbend", "back bend", "heart opener", "chest opener"], family: "backbend" },
  { keywords: ["twist", "spinal twist", "rotation"], family: "twist" },
  { keywords: ["arm balance", "arm balancing"], family: "arm_balance" },
  { keywords: ["inversion", "invert", "upside down"], family: "inversion" },
  { keywords: ["core", "abs", "abdominal"], family: "core" },
  { keywords: ["seated", "sitting"], family: "seated" },
  { keywords: ["forward fold", "fold", "forward bend"], family: "fold" },
  { keywords: ["lunge"], family: "lunge" },
  { keywords: ["bind", "binding"], family: "bind" },
  { keywords: ["side bend", "side stretch"], family: "side_bend" },
  { keywords: ["rest", "restorative", "relax", "calming"], family: "rest" },
  { keywords: ["balance", "balancing"], family: "standing_pose" },
];


const PoseLibrary = () => {
  const [poses, setPoses] = useState<Pose[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [blooming, setBlooming] = useState(false);
  const [activeFamilies, setActiveFamilies] = useState<Set<string>>(new Set());
  const [activeSkills, setActiveSkills] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const filterWrapRef = useRef<HTMLDivElement>(null);
  const [showSanskrit, setShowSanskrit] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SANSKRIT_STORAGE_KEY) === "true";
  });

  useEffect(() => {
    localStorage.setItem(SANSKRIT_STORAGE_KEY, String(showSanskrit));
  }, [showSanskrit]);

  // Only begin the entrance fade once poses have actually finished loading —
  // ties the animation to real readiness instead of a fixed guess-timer.
  useEffect(() => {
    if (!loading) {
      const t1 = setTimeout(() => setMounted(true), 20);
      const t2 = setTimeout(() => setBlooming(true), 250);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [loading]);

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

      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
      const mediaMap = new Map((media || []).map((m: any) => [normalize(m.pose_name), m.image_url]));
      const merged = (library || []).map((p: any) => ({
        ...p,
        image_url: mediaMap.get(normalize(p.pose_name)),
      }));
      setPoses(merged);
      setLoading(false);
    };
    load();
  }, []);

  // Close the filter dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterWrapRef.current && !filterWrapRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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

  const resetFilters = () => {
    setActiveFamilies(new Set());
    setActiveSkills(new Set());
  };

  const activeFilterCount = activeFamilies.size + activeSkills.size;

  const normalizeSearch = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

  const levenshtein = (a: string, b: string): number => {
    const m = a.length, n = b.length;
    const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      let prev = i - 1;
      dp[0] = i;
      for (let j = 1; j <= n; j++) {
        const temp = dp[j];
        dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
        prev = temp;
      }
    }
    return dp[n];
  };

  const poseMatchesSearch = (p: Pose, query: string): boolean => {
    const nq = normalizeSearch(query);
    if (!nq) return true;
    const nName = normalizeSearch(p.pose_name);
    const sanskrit = getSanskritName(p.pose_name);
    const nSanskrit = sanskrit ? normalizeSearch(sanskrit) : "";
    // Direct substring match (covers partial typing, which is most searches)
    if (nName.includes(nq) || nq.includes(nName) || (nSanskrit && (nSanskrit.includes(nq) || nq.includes(nSanskrit)))) {
      return true;
    }
    // Fuzzy fallback for typos / close spelling
    const dist = Math.min(levenshtein(nq, nName), nSanskrit ? levenshtein(nq, nSanskrit) : Infinity);
    const maxLen = Math.max(nq.length, nName.length);
    return dist <= Math.min(3, Math.floor(maxLen * 0.3));
  };

  const filteredPoses = poses.filter((p) => {
    const familyMatch =
      activeFamilies.size === 0 ||
      Array.from(activeFamilies).some((label) => {
        const filter = FAMILY_FILTERS.find((f) => f.label === label);
        return filter?.values.includes(p.family);
      });
    const skillMatch = activeSkills.size === 0 || activeSkills.has(p.difficulty_level);
    const searchMatch = poseMatchesSearch(p, searchQuery);
    return familyMatch && skillMatch && searchMatch;
  });

  // When search comes up empty, suggest the closest-spelled poses anyway,
  // regardless of the stricter match threshold used for the main results.
  const suggestedPoses = (() => {
    const nq = normalizeSearch(searchQuery);
    if (!nq || filteredPoses.length > 0) return [];

    const posesInFamily = (family: string, limit: number) =>
      poses.filter((p) => p.family === family).slice(0, limit);

    // Priority 1: does the search match a well-known pose we don't teach?
    // If so, suggest our poses from that same family.
    let bestKnown: { name: string; family: string } | null = null;
    let bestKnownDist = Infinity;
    for (const known of KNOWN_POSES_NOT_IN_LIBRARY) {
      const nKnown = normalizeSearch(known.name);
      const dist = nKnown.includes(nq) || nq.includes(nKnown) ? 0 : levenshtein(nq, nKnown);
      const maxLen = Math.max(nq.length, nKnown.length);
      if (dist <= Math.min(3, Math.floor(maxLen * 0.35)) && dist < bestKnownDist) {
        bestKnownDist = dist;
        bestKnown = known;
      }
    }
    if (bestKnown) {
      const matches = posesInFamily(bestKnown.family, 3);
      if (matches.length > 0) return matches;
    }

    // Priority 2: does the search contain a recognizable category keyword?
    for (const cat of CATEGORY_KEYWORDS) {
      if (cat.keywords.some((kw) => nq.includes(normalizeSearch(kw)))) {
        const matches = posesInFamily(cat.family, 3);
        if (matches.length > 0) return matches;
      }
    }

    // Priority 3: fall back to pure spelling-distance against our own library.
    return poses
      .map((p) => ({ pose: p, dist: levenshtein(nq, normalizeSearch(p.pose_name)) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3)
      .map((x) => x.pose);
  })();

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
          background: var(--white);
          font-family: var(--sans);
        }
        .kora-pose-library .plib-content {
          opacity: 0;
          transform: translateY(35px);
          transition: opacity 0.9s ease, transform 0.9s ease;
        }
        .kora-pose-library .plib-content.mounted {
          opacity: 1;
          transform: translateY(0);
        }
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
        .kora-pose-library .controls-row {
          max-width: 1100px; margin: 2.5rem auto 0; padding: 0 1.5rem;
          display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1rem;
        }
        .kora-pose-library .filters-bar-left { display: flex; align-items: center; gap: 0.75rem; position: relative; order: 1; }
        .kora-pose-library .search-wrap { order: 2; margin-left: auto; position: relative; }
        .kora-pose-library .search-input {
          font-family: var(--sans); font-size: 0.85rem; color: var(--text-primary);
          background: var(--white); border: 1px solid var(--card-border); border-radius: 999px;
          padding: 0.55rem 1.1rem 0.55rem 2.1rem; width: 220px; transition: border-color 0.2s ease, width 0.2s ease;
        }
        .kora-pose-library .search-input:focus { outline: none; border-color: var(--olive); width: 260px; }
        .kora-pose-library .search-icon {
          position: absolute; left: 0.8rem; top: 50%; transform: translateY(-50%);
          font-size: 0.8rem; color: var(--text-secondary); pointer-events: none;
        }
        .kora-pose-library .sanskrit-wrap { order: 3; flex-basis: 100%; display: flex; justify-content: flex-end; }
        @media (max-width: 767px) {
          .kora-pose-library .search-wrap { order: 0; flex-basis: 100%; margin-left: 0; }
          .kora-pose-library .search-input { width: 100%; }
          .kora-pose-library .search-input:focus { width: 100%; }
          .kora-pose-library .filters-bar-left { order: 1; margin-right: auto; }
          .kora-pose-library .sanskrit-wrap { order: 2; flex-basis: auto; margin-left: auto; }
        }
        .kora-pose-library .filters-toggle {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-family: var(--sans); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--olive); background: var(--olive-muted); border: 1px solid transparent;
          padding: 0.6rem 1.3rem; border-radius: 2px; cursor: pointer; transition: all 0.25s ease;
        }
        .kora-pose-library .filters-toggle:hover { background: var(--white); border-color: var(--olive); }
        .kora-pose-library .filters-count-badge {
          background: var(--olive); color: var(--white); font-size: 0.65rem; font-weight: 700;
          border-radius: 999px; padding: 0.1rem 0.5rem;
        }
        .kora-pose-library .filters-reset {
          font-family: var(--sans); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em;
          color: var(--text-secondary); background: none; border: none; cursor: pointer; text-decoration: underline;
          text-underline-offset: 2px; transition: color 0.2s ease;
        }
        .kora-pose-library .filters-reset:hover { color: var(--olive); }
        .kora-pose-library .sanskrit-toggle {
          display: flex; align-items: center; gap: 0.6rem; cursor: pointer;
          font-size: 0.75rem; font-weight: 600; color: var(--olive);
        }
        .kora-pose-library .filters-dropdown {
          position: absolute; top: 100%; left: 0; margin-top: 0.5rem; z-index: 50;
          width: 320px; max-height: 360px; overflow-y: auto;
          background: var(--white); border: 1px solid var(--card-border); border-radius: 6px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.1); padding: 1.25rem;
        }
        .kora-pose-library .filters-group-label {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--text-primary); margin: 0.75rem 0 0.5rem;
        }
        .kora-pose-library .filters-group-label:first-child { margin-top: 0; }
        .kora-pose-library .filter-checkbox-row {
          display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 0; cursor: pointer;
        }
        .kora-pose-library .filter-checkbox-row input { accent-color: var(--olive); width: 15px; height: 15px; cursor: pointer; }
        .kora-pose-library .filter-checkbox-row span { font-size: 0.85rem; color: var(--text-primary); }
        .kora-pose-library .plib-grid-wrap {
          max-width: 1100px; margin: 3rem auto 6rem; padding: 0 1.5rem;
          min-height: 50vh;
        }
        .kora-pose-library .plib-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .kora-pose-library .plib-grid { grid-template-columns: 1fr; }
        }
        .kora-pose-library .pose-card {
          background: var(--cream); border: 1px solid var(--card-border); border-radius: 6px;
          padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;
        }
        @media (max-width: 480px) {
          .kora-pose-library .pose-card { padding: 1.1rem; }
        }
        .kora-pose-library .pose-card img {
          width: 100%; height: 160px; object-fit: contain; background: var(--white); border-radius: 4px;
        }
        .kora-pose-library .pose-card-name {
          font-family: var(--serif); font-size: 1.25rem; color: var(--text-primary); margin: 0; line-height: 1.25;
        }
        .kora-pose-library .pose-card-name .english-aside {
          display: block; font-style: italic; font-weight: 400; font-size: 0.85rem; color: var(--text-secondary);
          margin-top: 0.05rem; margin-bottom: 0.35rem; line-height: 1.3;
        }
        .kora-pose-library .pose-card-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .kora-pose-library .pose-card-tag {
          font-size: 0.65rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--olive); background: var(--olive-muted); padding: 0.25rem 0.6rem; border-radius: 2px;
        }
        .kora-pose-library .pose-card-block { display: flex; flex-direction: column; }
        .kora-pose-library .pose-card-section-label {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--text-primary);
        }
        .kora-pose-library .pose-card-text {
          font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin: 0.2rem 0 0;
        }
        .kora-pose-library .pose-card-text-cue {
          min-height: 5.6em;
        }
        .kora-pose-library .plib-empty {
          text-align: center; color: var(--text-secondary); padding: 4rem 1.5rem; grid-column: 1 / -1;
        }
        .kora-pose-library .plib-no-results {
          grid-column: 1 / -1; text-align: center; padding: 4rem 1.5rem; max-width: 480px; margin: 0 auto;
        }
        .kora-pose-library .plib-no-results-title {
          font-family: var(--serif); font-size: 1.4rem; color: var(--text-primary); margin: 0 0 0.75rem;
        }
        .kora-pose-library .plib-no-results-text {
          color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6;
        }
        .kora-pose-library .plib-inline-link {
          color: var(--olive); font-weight: 600; text-decoration: underline; text-underline-offset: 2px;
        }
        .kora-pose-library .plib-suggestions {
          display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-top: 1.25rem;
        }
        .kora-pose-library .plib-suggestion-pill {
          font-family: var(--sans); font-size: 0.8rem; font-weight: 500;
          background: var(--cream); border: 1px solid var(--card-border); border-radius: 999px;
          padding: 0.5rem 1.1rem; cursor: pointer; color: var(--text-primary); transition: all 0.2s ease;
        }
        .kora-pose-library .plib-suggestion-pill:hover { background: var(--olive-muted); border-color: var(--olive); }
        .kora-pose-library .plib-footer {
          background: var(--white); border-top: 1px solid var(--card-border);
          padding: 2.5rem 1.5rem; text-align: center;
        }
        .kora-pose-library .plib-footer-logo { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .kora-pose-library .plib-footer-logo svg { width: 20px; height: 20px; }
        .kora-pose-library .plib-footer-logo span { font-family: var(--serif); font-size: 1.25rem; color: var(--text-primary); opacity: 0.5; }
        .kora-pose-library .plib-footer p { font-size: 0.75rem; color: var(--text-secondary); opacity: 0.6; margin-top: 0.75rem; }
        .kora-pose-library .back-to-top {
          position: fixed; bottom: 2rem; right: 2rem; z-index: 90;
          width: 44px; height: 44px; border-radius: 50%;
          background: var(--olive); color: var(--white); border: none;
          display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
          cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          opacity: 0; pointer-events: none; transform: translateY(10px);
          transition: opacity 0.3s ease, transform 0.3s ease, background 0.2s ease;
        }
        .kora-pose-library .back-to-top.visible {
          opacity: 1; pointer-events: auto; transform: translateY(0);
        }
        .kora-pose-library .back-to-top:hover { background: var(--olive-light); }
      `}</style>

      <SiteNav />

      <div className={`plib-content ${mounted ? "mounted" : ""}`}>
        <div className="mx-auto max-w-2xl px-6 pt-28 text-center">
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
          <p className="plib-tagline">The poses behind every flow — how to teach them, and why they matter.</p>
        </div>

        <div className="controls-row">
          <div className="filters-bar-left" ref={filterWrapRef}>
            <button className="filters-toggle" onClick={() => setFiltersOpen((v) => !v)}>
              {filtersOpen ? "Hide Filters" : "Show Filters"}
              {activeFilterCount > 0 && <span className="filters-count-badge">{activeFilterCount}</span>}
            </button>
            {activeFilterCount > 0 && (
              <button className="filters-reset" onClick={resetFilters}>
                Reset Filters
              </button>
            )}

            {filtersOpen && (
              <div className="filters-dropdown">
                <p className="filters-group-label">Pose Family</p>
                {FAMILY_FILTERS.map((f) => (
                  <label className="filter-checkbox-row" key={f.label}>
                    <input
                      type="checkbox"
                      checked={activeFamilies.has(f.label)}
                      onChange={() => toggleFamily(f.label)}
                    />
                    <span>{f.label}</span>
                  </label>
                ))}
                <p className="filters-group-label">Skill Level</p>
                {SKILL_FILTERS.map((s) => (
                  <label className="filter-checkbox-row" key={s}>
                    <input
                      type="checkbox"
                      checked={activeSkills.has(s)}
                      onChange={() => toggleSkill(s)}
                    />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="search-wrap">
            <span className="search-icon">⚲</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search poses…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="sanskrit-wrap">
            <label className="sanskrit-toggle">
              <span>Show Sanskrit Names</span>
              <Switch checked={showSanskrit} onCheckedChange={setShowSanskrit} />
            </label>
          </div>
        </div>

        <div className="plib-grid-wrap">
          <div className="plib-grid">
            {loading ? (
              <div className="plib-empty">Loading poses…</div>
            ) : filteredPoses.length === 0 && searchQuery.trim() ? (
              <div className="plib-no-results">
                <p className="plib-no-results-title">"{searchQuery}" isn't in our library yet.</p>
                <p className="plib-no-results-text">
                  Feel free to{" "}
                  <Link to="/feedback" className="plib-inline-link">suggest it here</Link>
                  {suggestedPoses.length > 0 && " — or maybe you'll like one of these in the meantime:"}
                </p>
                {suggestedPoses.length > 0 && (
                  <div className="plib-suggestions">
                    {suggestedPoses.map((p) => (
                      <button key={p.pose_name} className="plib-suggestion-pill" onClick={() => setSearchQuery(p.pose_name)}>
                        {p.pose_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : filteredPoses.length === 0 ? (
              <div className="plib-empty">No poses match these filters.</div>
            ) : (
              filteredPoses.map((pose) => (
                <div className="pose-card" key={pose.pose_name}>
                  {pose.image_url && <img src={pose.image_url} alt={pose.pose_name} />}
                  <h3 className="pose-card-name">
                    {displayName(pose.pose_name)}
                    {showSanskrit && getSanskritName(pose.pose_name) && (
                      <span className="english-aside">({pose.pose_name})</span>
                    )}
                  </h3>
                  <div className="pose-card-tags">
                    <span className="pose-card-tag">{pose.family.replace(/_/g, " ")}</span>
                    <span className="pose-card-tag">{pose.difficulty_level}</span>
                  </div>
                  {pose.how_to_cue && (
                    <div className="pose-card-block">
                      <p className="pose-card-section-label">How to Cue</p>
                      <p className="pose-card-text pose-card-text-cue">{pose.how_to_cue}</p>
                    </div>
                  )}
                  {pose.purpose_value && (
                    <div className="pose-card-block">
                      <p className="pose-card-section-label">Purpose / Value</p>
                      <p className="pose-card-text">{pose.purpose_value}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <footer className="plib-footer">
        <div className="plib-footer-logo">
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

      <button
        className={`back-to-top ${showBackToTop ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        ↑
      </button>
    </div>
  );
};

export default PoseLibrary;
