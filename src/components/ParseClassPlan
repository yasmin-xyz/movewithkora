// Shared class-plan text parser.
// Extracted from ClassPlan.tsx so both the on-screen planner (ClassPlan.tsx)
// and the PDF export (ClassPDF.tsx) parse the AI's structured text output
// identically — no risk of the two drifting apart over time.

export interface PoseMedia {
  pose_name: string;
  image_url: string;
}

export interface PoseEntry {
  name: string;
  breath: string;
  cue: string;
  imageUrl?: string;
  modifications: string[];
  isSelected: boolean;
  isTransition: boolean;
  sideFlow?: "right" | "left";
  isSideFlowVinyasa?: boolean;
  sideFlowVinyasaLabel?: string;
  originalName?: string;
  originalCue?: string;
  originalBreath?: string;
}

export interface FlowBlock {
  blockName: string;
  duration: string;
  poses: PoseEntry[];
}

export interface Section {
  title: string;
  blocks: FlowBlock[];
}

const TYPO_CORRECTIONS: Record<string, string> = {
  "linge": "Lunge",
  "lunger": "Lunge",
  "warrior 1": "Warrior I",
  "warrior 2": "Warrior II",
  "warrior 3": "Warrior III",
  "downward dogg": "Downward Dog",
  "downward-facing dogg": "Downward-Facing Dog",
  "chatarunga": "Chaturanga",
  "chataranga": "Chaturanga",
  "chaturunga": "Chaturanga",
  "savasanna": "Savasana",
  "shavasana": "Savasana",
  "triange": "Triangle",
  "plank pose": "Plank",
  "mountian": "Mountain",
  "moutain": "Mountain",
};

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

function correctPoseName(name: string, media: PoseMedia[]): string {
  const lower = name.toLowerCase().trim();

  if (TYPO_CORRECTIONS[lower]) return TYPO_CORRECTIONS[lower];

  const normalizedLower = lower.replace(/[^a-z0-9\s]/g, "");
  for (const m of media) {
    if (m.pose_name.toLowerCase().replace(/[^a-z0-9\s]/g, "") === normalizedLower) {
      return m.pose_name;
    }
  }

  let bestMedia: PoseMedia | undefined;
  let bestDist = Infinity;
  for (const m of media) {
    const dist = levenshtein(normalizedLower, m.pose_name.toLowerCase().replace(/[^a-z0-9\s]/g, ""));
    const maxLen = Math.max(normalizedLower.length, m.pose_name.length);
    if (dist <= Math.min(3, Math.floor(maxLen * 0.25)) && dist < bestDist) {
      bestDist = dist;
      bestMedia = m;
    }
  }
  if (bestMedia) return bestMedia.pose_name;

  return name;
}

function normalizeForMatch(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

function wordsOf(s: string): string[] {
  return s.split(/\s+/).filter(Boolean);
}

function poseMatchScore(a: string, b: string): number {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (na === nb) return 3;
  if (na.includes(nb) || nb.includes(na)) return 2;
  const wa = wordsOf(na);
  const wb = wordsOf(nb);
  const shorter = wa.length <= wb.length ? wa : wb;
  const longer = wa.length <= wb.length ? wb : wa;
  const matched = shorter.filter((w) => longer.includes(w)).length;
  if (matched >= shorter.length) return 2;
  if (matched >= 2) return 1;
  return 0;
}

export function findPoseImage(name: string, media: PoseMedia[]): string | undefined {
  const baseName = name.replace(/\s*\(.*\)/, "").trim();
  let best: PoseMedia | undefined;
  let bestScore = 0;
  for (const m of media) {
    const score = poseMatchScore(baseName, m.pose_name);
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best?.image_url;
}

export function parsePlan(raw: string, media: PoseMedia[]): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;
  let currentBlock: FlowBlock | null = null;
  let currentSideFlow: "right" | "left" | undefined;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const sectionMatch = trimmed.match(/^(WARM-UP|BUILD|PEAK|COOL DOWN):?$/i);
    if (sectionMatch) {
      current = { title: sectionMatch[1].toUpperCase(), blocks: [] };
      sections.push(current);
      currentBlock = null;
      currentSideFlow = undefined;
      continue;
    }

    if (!current) continue;

    const blockMatch = trimmed.match(/^Block:\s*(.+)/i);
    if (blockMatch) {
      currentBlock = { blockName: blockMatch[1].trim(), duration: "", poses: [] };
      current.blocks.push(currentBlock);
      currentSideFlow = undefined;
      continue;
    }

    const durMatch = trimmed.match(/^Duration:\s*(.+)/i);
    if (durMatch && currentBlock && currentBlock.poses.length === 0) {
      currentBlock.duration = durMatch[1].trim();
      continue;
    }

    if (!currentBlock) {
      currentBlock = { blockName: current.title, duration: "", poses: [] };
      current.blocks.push(currentBlock);
    }

    const poseMatch = trimmed.match(/^Pose:\s*(.+)/i);
    if (poseMatch) {
      const rawName = poseMatch[1].trim();
      const name = correctPoseName(rawName, media);
      const imageUrl = findPoseImage(name, media);
      const isTransition = /transition/i.test(rawName) || /vinyasa/i.test(rawName);
      currentBlock.poses.push({ name, breath: "", cue: "", modifications: [], isSelected: false, isTransition, sideFlow: currentSideFlow, imageUrl });
      continue;
    }

    const typeMatch = trimmed.match(/^Type:\s*(.+)/i);
    if (typeMatch && currentBlock) {
      const last = currentBlock.poses[currentBlock.poses.length - 1];
      if (last && /transition/i.test(typeMatch[1])) {
        last.isTransition = true;
      }
      continue;
    }

    const rightFlowMatch = trimmed.match(/^Right Side Flow:?$/i);
    if (rightFlowMatch) {
      currentSideFlow = "right";
      continue;
    }

    const leftFlowMatch = trimmed.match(/^Left Side Flow:?$/i);
    if (leftFlowMatch) {
      currentSideFlow = "left";
      continue;
    }

    const vinyasaMatch = trimmed.match(/^Vinyasa:\s*(.+)/i);
    if (vinyasaMatch && currentBlock) {
      currentBlock.poses.push({
        name: vinyasaMatch[1].trim(),
        breath: "", cue: "", modifications: [], isSelected: false,
        isTransition: true, isSideFlowVinyasa: true,
        sideFlowVinyasaLabel: vinyasaMatch[1].trim(),
        imageUrl: undefined,
      });
      currentSideFlow = undefined;
      continue;
    }

    const last = currentBlock.poses[currentBlock.poses.length - 1];
    if (!last) continue;

    const breathMatch = trimmed.match(/^Breath:\s*(.+)/i);
    if (breathMatch) { last.breath = breathMatch[1].trim(); continue; }

    const cueMatch = trimmed.match(/^Cue:\s*(.+)/i);
    if (cueMatch) {
      last.cue = cueMatch[1].trim();
      if (/^transition$/i.test(last.cue.trim())) {
        last.isTransition = true;
        last.cue = "";
      }
      continue;
    }

    if (/^Modifications:\s*$/i.test(trimmed)) continue;

    const modMatch = trimmed.match(/^-\s*(.+)/);
    if (modMatch) { last.modifications.push(modMatch[1].trim()); continue; }
  }

  return sections;
}

export function serializeSections(sections: Section[]): string {
  const lines: string[] = [];
  for (const section of sections) {
    lines.push(`${section.title}:`);
    for (const block of section.blocks) {
      lines.push(`Block: ${block.blockName}`);
      if (block.duration) lines.push(`Duration: ${block.duration}`);
      let lastSideFlow: string | undefined;
      for (const pose of block.poses) {
        if (pose.sideFlow && pose.sideFlow !== lastSideFlow) {
          lines.push(pose.sideFlow === "right" ? "Right Side Flow:" : "Left Side Flow:");
        }
        lastSideFlow = pose.sideFlow;
        if (pose.isSideFlowVinyasa) {
          lines.push(`Vinyasa: ${pose.sideFlowVinyasaLabel || pose.name}`);
          if (pose.cue) lines.push(`Cue: ${pose.cue}`);
          continue;
        }
        lines.push(`Pose: ${pose.name}`);
        if (pose.isTransition) lines.push(`Type: Transition`);
        if (pose.breath) lines.push(`Breath: ${pose.breath}`);
        if (pose.cue) lines.push(`Cue: ${pose.cue}`);
        if (pose.modifications.length > 0) {
          lines.push("Modifications:");
          for (const mod of pose.modifications) {
            lines.push(`- ${mod}`);
          }
        }
        lines.push("");
      }
    }
  }
  return lines.join("\n");
}

export function parseModification(mod: string): { name: string; breath?: string; description: string } {
  const parts = mod.split("–").map((p) => p.trim());
  if (parts.length >= 3 && /^breath:/i.test(parts[1])) {
    return {
      name: parts[0],
      breath: parts[1].replace(/^breath:\s*/i, "").trim(),
      description: parts.slice(2).join(" – ").trim(),
    };
  }
  if (parts.length >= 2) {
    return { name: parts[0], description: parts.slice(1).join(" – ").trim() };
  }
  const hyphenIdx = mod.indexOf(" - ");
  if (hyphenIdx !== -1) {
    return { name: mod.slice(0, hyphenIdx).trim(), description: mod.slice(hyphenIdx + 3).trim() };
  }
  return { name: mod, description: "" };
}
