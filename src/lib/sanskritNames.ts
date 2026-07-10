// Shared English → Sanskrit pose name lookup.
// Used by both the planner (ClassPlan.tsx) and the homepage preview (Landing.tsx).

export const SANSKRIT_NAMES: Record<string, string> = {
  "Child's Pose": "Balasana",
  "Cat-Cow": "Marjaryasana-Bitilasana",
  "Downward Facing Dog": "Adho Mukha Svanasana",
  "Low Lunge": "Anjaneyasana",
  "Wide-Legged Forward Fold": "Prasarita Padottanasana",
  "Extended Side Angle": "Utthita Parsvakonasana",
  "Bird of Paradise": "Svarga Dvijasana",
  "Mountain Pose": "Tadasana",
  "Easy Pose": "Sukhasana",
  "Corpse Pose": "Savasana",
  "Happy Baby Pose": "Ananda Balasana",
  "Reclined Butterfly": "Supta Baddha Konasana",
  "Butterfly Pose": "Baddha Konasana",
  "Thread the Needle": "Parsva Balasana",
  "Sphinx Pose": "Salamba Bhujangasana",
  "Cobra Pose": "Bhujangasana",
  "Standing Forward Fold": "Uttanasana",
  "Half Forward Fold": "Ardha Uttanasana",
  "Seated Forward Fold": "Paschimottanasana",
  "Bridge Pose": "Setu Bandha Sarvangasana",
  "Supine Twist": "Jathara Parivartanasana",
  "Fire Log Pose": "Agnistambhasana",
  "Gate Pose": "Parighasana",
  "Tree Pose": "Vrksasana",
  "Chair Pose": "Utkatasana",
  "Goddess Pose": "Utkata Konasana",
  "High Lunge": "Ashta Chandrasana",
  "Warrior I": "Virabhadrasana I",
  "Warrior II": "Virabhadrasana II",
  "Reverse Warrior": "Viparita Virabhadrasana",
  "Skandasana": "Skandasana",
  "Triangle Pose": "Trikonasana",
  "Plank Pose": "Phalakasana",
  "Upward Facing Dog": "Urdhva Mukha Svanasana",
  "Dolphin Pose": "Ardha Pincha Mayurasana",
  "Fish Pose": "Matsyasana",
  "Boat Pose": "Navasana",
  "Half Boat": "Ardha Navasana",
  "Seated Spinal Twist": "Ardha Matsyendrasana",
  "Pigeon Pose": "Eka Pada Rajakapotasana",
  "Frog Pose": "Mandukasana",
  "Lizard Pose": "Utthan Pristhasana",
  "Revolved Low Lunge": "Parivrtta Anjaneyasana",
  "Locust Pose": "Salabhasana",
  "Cow Face Arms": "Gomukhasana",
  "Side Plank": "Vasisthasana",
  "Chaturanga": "Chaturanga Dandasana",
  "Camel Pose": "Ustrasana",
  "Bow Pose": "Dhanurasana",
  "Eagle Pose": "Garudasana",
  "Revolved Triangle": "Parivrtta Trikonasana",
  "Half Moon Pose": "Ardha Chandrasana",
  "Standing Split": "Urdhva Prasarita Eka Padasana",
  "Dancer's Pose": "Natarajasana",
  "Marichyasana": "Marichyasana",
  "Crow Pose": "Bakasana",
  "Shoulder Stand": "Salamba Sarvangasana",
  "Warrior III": "Virabhadrasana III",
  "King Pigeon Pose": "Eka Pada Rajakapotasana",
  "Wheel Pose": "Urdhva Dhanurasana",
  "Forearm Stand": "Pincha Mayurasana",
  "Handstand": "Adho Mukha Vrksasana",
  "Side Crow": "Parsva Bakasana",
  "Flying Pigeon": "Eka Pada Galavasana",
  "Garland Pose": "Malasana",
};

function normalize(name: string): string {
  return name
    .replace(/\s*\((Right|Left)\)\s*$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function levenshtein(a: string, b: string): number {
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
}

/**
 * Looks up the Sanskrit name for a given English pose name, including
 * fuzzy-matching for AI-generated modification/swap names that may not
 * exactly match a canonical library name (e.g. "Supported Camel Pose"
 * still resolves to Ustrasana). Preserves a trailing (Right)/(Left) suffix.
 * Returns null if no reasonably close match is found.
 */
export function getSanskritName(englishName: string): string | null {
  const sideSuffix = englishName.match(/\s*\((Right|Left)\)\s*$/i)?.[0] || "";
  const target = normalize(englishName);
  if (!target) return null;

  // Exact match first
  for (const [key, sanskrit] of Object.entries(SANSKRIT_NAMES)) {
    if (normalize(key) === target) return sanskrit + sideSuffix;
  }

  // Fuzzy fallback
  let best: string | null = null;
  let bestDist = Infinity;
  for (const [key, sanskrit] of Object.entries(SANSKRIT_NAMES)) {
    const nKey = normalize(key);
    const dist = levenshtein(target, nKey);
    const maxLen = Math.max(target.length, nKey.length);
    if (dist <= Math.min(4, Math.floor(maxLen * 0.3)) && dist < bestDist) {
      bestDist = dist;
      best = sanskrit;
    }
    // Also check word-overlap for cases like "Supported Camel Pose" -> "Camel Pose"
    const targetWords = target.split(" ");
    const keyWords = nKey.split(" ");
    const overlap = keyWords.filter((w) => targetWords.includes(w)).length;
    if (overlap >= Math.max(1, keyWords.length - 1) && bestDist > 4) {
      best = sanskrit;
      bestDist = 4;
    }
  }

  return best ? best + sideSuffix : null;
}

export const SANSKRIT_STORAGE_KEY = "kora-show-sanskrit";
