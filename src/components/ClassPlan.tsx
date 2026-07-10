import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";


interface ClassPlanProps {
  content: string;
  isLoading: boolean;
  readOnly?: boolean;
  onContentChange?: (content: string) => void;
}

interface PoseMedia {
  pose_name: string;
  image_url: string;
}

interface PoseEntry {
  name: string;
  breath: string;
  cue: string;
  imageUrl?: string;
  modifications: string[];
  isSelected: boolean;
  isTransition: boolean;
  sideFlow?: 'right' | 'left';
  isSideFlowVinyasa?: boolean;
  sideFlowVinyasaLabel?: string;
  originalName?: string;
  originalCue?: string;
}

interface FlowBlock {
  blockName: string;
  duration: string;
  poses: PoseEntry[];
}

interface Section {
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

function correctPoseName(name: string, media: PoseMedia[]): string {
  const lower = name.toLowerCase().trim();

  // 1. Static typo map
  if (TYPO_CORRECTIONS[lower]) return TYPO_CORRECTIONS[lower];

  // 2. Check if it already matches a known pose well
  const normalizedLower = lower.replace(/[^a-z0-9\s]/g, "");
  for (const m of media) {
    if (m.pose_name.toLowerCase().replace(/[^a-z0-9\s]/g, "") === normalizedLower) {
      return m.pose_name; // Use canonical casing from DB
    }
  }

  // 3. Fuzzy: Levenshtein-based correction for close matches
  let bestMedia: PoseMedia | undefined;
  let bestDist = Infinity;
  for (const m of media) {
    const dist = levenshtein(normalizedLower, m.pose_name.toLowerCase().replace(/[^a-z0-9\s]/g, ""));
    const maxLen = Math.max(normalizedLower.length, m.pose_name.length);
    // Only correct if edit distance is ≤ 25% of the longer string and at most 3
    if (dist <= Math.min(3, Math.floor(maxLen * 0.25)) && dist < bestDist) {
      bestDist = dist;
      bestMedia = m;
    }
  }
  if (bestMedia) return bestMedia.pose_name;

  return name; // No correction needed
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

function findPoseImage(name: string, media: PoseMedia[]): string | undefined {
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

function parsePlan(raw: string, media: PoseMedia[]): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;
  let currentBlock: FlowBlock | null = null;
  let currentSideFlow: 'right' | 'left' | undefined;

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

    // Duration at block level
    const durMatch = trimmed.match(/^Duration:\s*(.+)/i);
    if (durMatch && currentBlock && currentBlock.poses.length === 0) {
      currentBlock.duration = durMatch[1].trim();
      continue;
    }

    // If no block exists yet, create a default one
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

    // Explicit type marker (used for transitions with real descriptive cues)
    const typeMatch = trimmed.match(/^Type:\s*(.+)/i);
    if (typeMatch && currentBlock) {
      const last = currentBlock.poses[currentBlock.poses.length - 1];
      if (last && /transition/i.test(typeMatch[1])) {
        last.isTransition = true;
      }
      continue;
    }

    // Side Flow markers
    const rightFlowMatch = trimmed.match(/^Right Side Flow:?$/i);
    if (rightFlowMatch) {
      currentSideFlow = 'right';
      continue;
    }

    const leftFlowMatch = trimmed.match(/^Left Side Flow:?$/i);
    if (leftFlowMatch) {
      currentSideFlow = 'left';
      continue;
    }

    // Vinyasa between side flows
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
      // Backward-compat: still catch the old literal placeholder if it ever appears
      if (/^transition$/i.test(last.cue.trim())) {
        last.isTransition = true;
        last.cue = ""; // don't display the bare word as a cue
      }
      continue;
    }

    if (/^Modifications:\s*$/i.test(trimmed)) continue;

    const modMatch = trimmed.match(/^-\s*(.+)/);
    if (modMatch) { last.modifications.push(modMatch[1].trim()); continue; }
  }

  return sections;
}

function serializeSections(sections: Section[]): string {
  const lines: string[] = [];
  for (const section of sections) {
    lines.push(`${section.title}:`);
    for (const block of section.blocks) {
      lines.push(`Block: ${block.blockName}`);
      if (block.duration) lines.push(`Duration: ${block.duration}`);
      let lastSideFlow: string | undefined;
      for (const pose of block.poses) {
        if (pose.sideFlow && pose.sideFlow !== lastSideFlow) {
          lines.push(pose.sideFlow === 'right' ? 'Right Side Flow:' : 'Left Side Flow:');
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

function parseModification(mod: string): { name: string; description: string } {
  const dashIdx = mod.indexOf("–");
  const hyphenIdx = mod.indexOf(" - ");
  if (dashIdx !== -1) {
    return { name: mod.slice(0, dashIdx).trim(), description: mod.slice(dashIdx + 1).trim() };
  }
  if (hyphenIdx !== -1) {
    return { name: mod.slice(0, hyphenIdx).trim(), description: mod.slice(hyphenIdx + 3).trim() };
  }
  return { name: mod, description: "" };
}

const ClassPlan = ({ content, isLoading, readOnly = false, onContentChange }: ClassPlanProps) => {
  const [media, setMedia] = useState<PoseMedia[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase
      .from("pose_media")
      .select("pose_name, image_url")
      .then(({ data }) => {
        if (data) setMedia(data);
      });
  }, []);

  // Only re-parse when content changes from outside (not from our own edits)
  const lastSerializedRef = useRef("");
  useEffect(() => {
    if (content !== lastSerializedRef.current) {
      setSections(parsePlan(content, media));
      setOpenKeys(new Set());
    }
  }, [content, media]);

  const handleModClick = useCallback((sectionIdx: number, blockIdx: number, poseIdx: number, mod: string) => {
    setSections((prev) => {
      const next = prev.map((s, si) =>
        si !== sectionIdx
          ? s
          : {
              ...s,
              blocks: s.blocks.map((b, bi) =>
                bi !== blockIdx
                  ? b
                  : {
                      ...b,
                      poses: b.poses.map((p, pi) => {
                        if (pi !== poseIdx) return p;
                        const { name, description } = parseModification(mod);
                        const oldLabel = p.cue ? `${p.name} – ${p.cue}` : p.name;
                        const newMods = p.modifications.filter((m) => m !== mod);
                        newMods.push(oldLabel);
                        const imageUrl = findPoseImage(name, media);
                        return {
                          ...p,
                          name,
                          cue: description || p.cue,
                          modifications: newMods,
                          isSelected: true,
                          originalName: p.originalName || p.name,
                          originalCue: p.originalCue ?? p.cue,
                          imageUrl,
                        };
                      }),
                    }
              ),
            }
      );
      const serialized = serializeSections(next);
      lastSerializedRef.current = serialized;
      onContentChange?.(serialized);
      return next;
    });
    setOpenKeys((prev) => {
      const key = `${sectionIdx}-${blockIdx}-${poseIdx}`;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, [onContentChange, media]);

  const handleReset = useCallback((sectionIdx: number, blockIdx: number, poseIdx: number) => {
    setSections((prev) => {
      const next = prev.map((s, si) =>
        si !== sectionIdx
          ? s
          : {
              ...s,
              blocks: s.blocks.map((b, bi) =>
                bi !== blockIdx
                  ? b
                  : {
                      ...b,
                      poses: b.poses.map((p, pi) => {
                        if (pi !== poseIdx || !p.originalName) return p;
                        const currentLabel = p.cue ? `${p.name} – ${p.cue}` : p.name;
                        const newMods = p.modifications.filter((m) => m !== (p.originalCue ? `${p.originalName} – ${p.originalCue}` : p.originalName));
                        newMods.push(currentLabel);
                        const imageUrl = findPoseImage(p.originalName, media);
                        return {
                          ...p,
                          name: p.originalName,
                          cue: p.originalCue || "",
                          modifications: newMods,
                          isSelected: false,
                          originalName: undefined,
                          originalCue: undefined,
                          imageUrl,
                        };
                      }),
                    }
              ),
            }
      );
      const serialized = serializeSections(next);
      lastSerializedRef.current = serialized;
      onContentChange?.(serialized);
      return next;
    });
  }, [onContentChange, media]);

  const toggleOpen = (key: string, open: boolean) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (open) next.add(key); else next.delete(key);
      return next;
    });
  };

  const [openBlocks, setOpenBlocks] = useState<Set<string>>(new Set());

  // Default all blocks to expanded when sections change
  useEffect(() => {
    const allBlockKeys = new Set<string>();
    sections.forEach((s, si) => s.blocks.forEach((_, bi) => allBlockKeys.add(`block-${si}-${bi}`)));
    setOpenBlocks(allBlockKeys);
  }, [sections]);

  const toggleBlock = (key: string) => {
    setOpenBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className="mt-12 border-t border-border pt-10 space-y-12">
      {sections.map((section, si) => {
        const sectionMinutes = section.blocks.reduce((sum, b) => {
          const m = b.duration.match(/(\d+)/);
          return sum + (m ? parseInt(m[1]) : 0);
        }, 0);
        return (
          <div key={section.title}>
            <div className="flex items-baseline justify-between border-b-2 border-foreground/20 pb-2 mb-6">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground uppercase">
                {section.title}
              </h2>
              {sectionMinutes > 0 && (
                <span className="font-heading text-sm font-bold text-foreground uppercase tracking-wider">
                  {sectionMinutes} MIN
                </span>
              )}
            </div>
            <div className="space-y-6">
              {section.blocks.map((block, bi) => {
                const blockKey = `block-${si}-${bi}`;
                const isBlockOpen = openBlocks.has(blockKey);
                return (
                  <div key={blockKey}>
                    <button
                      onClick={() => toggleBlock(blockKey)}
                      className="w-full flex items-baseline justify-between mb-3 group cursor-pointer"
                    >
                      <h3 className="font-body text-base font-normal text-foreground/70 tracking-wide">
                        {block.blockName}
                      </h3>
                      <div className="flex items-center gap-2">
                        {block.duration && (
                          <span className="font-body text-xs font-normal text-muted-foreground">
                            {block.duration}
                          </span>
                        )}
                        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isBlockOpen ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    {isBlockOpen && (
                      <div className="space-y-3">
                        {(() => {
                          const elements: React.ReactNode[] = [];
                          let lastSideFlow: string | undefined;

                          block.poses.forEach((pose, pi) => {
                            const key = `${si}-${bi}-${pi}`;

                            // Side flow header
                            if (pose.sideFlow && pose.sideFlow !== lastSideFlow) {
                              elements.push(
                                <div key={`sf-header-${key}`} className="pt-2 pb-1">
                                  <p className="font-body text-[12px] font-medium text-foreground/50 uppercase tracking-wider pl-1">
                                    {pose.sideFlow === 'right' ? 'Right Side Flow' : 'Left Side Flow'}
                                  </p>
                                </div>
                              );
                            }
                            lastSideFlow = pose.sideFlow;

                            // Side flow vinyasa
                            if (pose.isSideFlowVinyasa) {
                              elements.push(
                                <div key={key} className="py-1.5 px-3">
                                  <div className="border-t border-border/40 mb-1.5" />
                                  <p className="font-body text-[12px] font-medium text-muted-foreground/70">
                                    Vinyasa: {pose.sideFlowVinyasaLabel || pose.name}
                                  </p>
                                  {pose.cue && (
                                    <p className="font-body text-[11px] text-muted-foreground/60 mt-0.5">
                                      {pose.cue}
                                    </p>
                                  )}
                                  <div className="border-b border-border/40 mt-1.5" />
                                </div>
                              );
                              return;
                            }

                            if (pose.isTransition) {
                              elements.push(
                                <div key={key} className="py-1.5 px-3">
                                  <div className="border-t border-border/40 mb-1.5" />
                                  <p className="font-body text-[12px] font-medium text-muted-foreground/70">
                                    Transition: {pose.name}
                                  </p>
                                  {pose.breath && (
                                    <p className="font-body text-[11px] text-muted-foreground/60 mt-0.5">
                                      Breath: {pose.breath}
                                    </p>
                                  )}
                                  {pose.cue && (
                                    <p className="font-body text-[11px] text-muted-foreground/60 mt-0.5">
                                      {pose.cue}
                                    </p>
                                  )}
                                  <div className="border-b border-border/40 mt-1.5" />
                                </div>
                              );
                              return;
                            }

                            elements.push(
                              <div key={key}>
                                <Collapsible
                                  open={openKeys.has(key)}
                                  onOpenChange={(open) => toggleOpen(key, open)}
                                >
                                  <div className={`rounded-lg border border-border bg-card overflow-hidden ${pose.sideFlow ? 'ml-3' : ''}`}>
                                    <div className="flex items-center gap-4 p-3">
                                      {pose.imageUrl && (
                                        <img
                                          src={pose.imageUrl}
                                          alt={pose.name}
                                          className="w-[72px] h-[72px] rounded-md object-contain bg-muted/20 flex-shrink-0"
                                        />
                                      )}
                                      <div className="space-y-1 min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-2">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <p className="font-body text-base font-medium text-foreground truncate">
                                              {pose.name}
                                            </p>
                                            {pose.isSelected && (
                                              <span className="inline-flex items-center rounded-full bg-accent text-accent-foreground text-[10px] font-body font-medium px-2 py-0.5 shrink-0">
                                                Selected
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 flex-shrink-0">
                                            {!readOnly && (
                                              <>
                                                <CollapsibleTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-2 text-[11px] font-body text-muted-foreground hover:text-foreground"
                                                  >
                                                    Modify
                                                  </Button>
                                                </CollapsibleTrigger>
                                                {pose.isSelected && (
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); handleReset(si, bi, pi); }}
                                                    className="font-body text-[10px] text-muted-foreground/60 hover:text-foreground/70 hover:underline underline-offset-2 transition-colors duration-150 whitespace-nowrap"
                                                  >
                                                    Reset
                                                  </button>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        {pose.breath && (
                                          <p className="font-body text-sm text-muted-foreground">
                                            <span className="font-medium text-foreground/70">Breath:</span>{" "}
                                            {pose.breath}
                                          </p>
                                        )}
                                        {pose.cue && (
                                          <p className="font-body text-sm text-muted-foreground">
                                            <span className="font-medium text-foreground/70">Cue:</span>{" "}
                                            {pose.cue}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <CollapsibleContent>
                                      <div className="border-t border-border px-4 py-2 bg-muted/30 space-y-0.5">
                                        {pose.modifications.length > 0 ? (
                                          <>
                                            {pose.modifications.map((mod, mi) => (
                                              <button
                                                key={mi}
                                                onClick={() => handleModClick(si, bi, pi, mod)}
                                                aria-label={`Swap with ${parseModification(mod).name}`}
                                                className="group w-full rounded-md px-2.5 py-1.5 font-body text-sm text-muted-foreground hover:bg-secondary/60 transition-all duration-150 cursor-pointer flex items-center justify-between"
                                              >
                                                <span className="text-left">• {mod}</span>
                                                <span className="font-body text-[11px] font-medium text-muted-foreground/70 group-hover:text-muted-foreground transition-opacity duration-150 shrink-0 ml-3">
                                                  Swap
                                                </span>
                                              </button>
                                            ))}
                                          </>
                                        ) : (
                                          <p className="font-body text-xs text-muted-foreground">
                                            No modifications available.
                                          </p>
                                        )}
                                      </div>
                                    </CollapsibleContent>
                                  </div>
                                </Collapsible>
                              </div>
                            );
                          });

                          return elements;
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {sections.length === 0 && content && (
        <pre className="font-body text-sm text-foreground/80 whitespace-pre-wrap">
          {content}
        </pre>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <span className="font-body text-xs tracking-wide uppercase">
            Generating…
          </span>
        </div>
      )}
    </div>
  );
};

export default ClassPlan;
