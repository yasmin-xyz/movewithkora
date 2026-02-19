import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";


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
  duration: string;
  breath: string;
  cue: string;
  imageUrl?: string;
  modifications: string[];
  isSelected: boolean;
  originalName?: string;
  originalCue?: string;
}

interface Section {
  title: string;
  poses: PoseEntry[];
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

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const sectionMatch = trimmed.match(/^(WARM-UP|BUILD|PEAK|COOL DOWN):?$/i);
    if (sectionMatch) {
      current = { title: sectionMatch[1].toUpperCase(), poses: [] };
      sections.push(current);
      continue;
    }

    if (current) {
      const poseMatch = trimmed.match(/^Pose:\s*(.+)/i);
      if (poseMatch) {
        const name = poseMatch[1].trim();
        const imageUrl = findPoseImage(name, media);
        current.poses.push({ name, duration: "", breath: "", cue: "", modifications: [], isSelected: false, imageUrl });
        continue;
      }

      const last = current.poses[current.poses.length - 1];
      if (!last) continue;

      const durMatch = trimmed.match(/^Duration:\s*(.+)/i);
      if (durMatch) { last.duration = durMatch[1].trim(); continue; }

      const breathMatch = trimmed.match(/^Breath:\s*(.+)/i);
      if (breathMatch) { last.breath = breathMatch[1].trim(); continue; }

      const cueMatch = trimmed.match(/^Cue:\s*(.+)/i);
      if (cueMatch) { last.cue = cueMatch[1].trim(); continue; }

      if (/^Modifications:\s*$/i.test(trimmed)) continue;

      const modMatch = trimmed.match(/^-\s*(.+)/);
      if (modMatch) { last.modifications.push(modMatch[1].trim()); continue; }
    }
  }

  return sections;
}

function serializeSections(sections: Section[]): string {
  const lines: string[] = [];
  for (const section of sections) {
    lines.push(`${section.title}:`);
    for (const pose of section.poses) {
      lines.push(`Pose: ${pose.name}`);
      if (pose.duration) lines.push(`Duration: ${pose.duration}`);
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

  const handleModClick = useCallback((sectionIdx: number, poseIdx: number, mod: string) => {
    setSections((prev) => {
      const next = prev.map((s, si) =>
        si !== sectionIdx
          ? s
          : {
              ...s,
              poses: s.poses.map((p, pi) => {
                if (pi !== poseIdx) return p;
                const { name, description } = parseModification(mod);
                const oldLabel = p.cue ? `${p.name} – ${p.cue}` : p.name;
                const newMods = p.modifications.filter((m) => m !== mod);
                newMods.push(oldLabel);
                return {
                  ...p,
                  name,
                  cue: description || p.cue,
                  modifications: newMods,
                  isSelected: true,
                  originalName: p.originalName || p.name,
                  originalCue: p.originalCue ?? p.cue,
                };
              }),
            }
      );
      const serialized = serializeSections(next);
      lastSerializedRef.current = serialized;
      onContentChange?.(serialized);
      return next;
    });
    setOpenKeys((prev) => {
      const key = `${sectionIdx}-${poseIdx}`;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, [onContentChange]);

  const handleReset = useCallback((sectionIdx: number, poseIdx: number) => {
    setSections((prev) => {
      const next = prev.map((s, si) =>
        si !== sectionIdx
          ? s
          : {
              ...s,
              poses: s.poses.map((p, pi) => {
                if (pi !== poseIdx || !p.originalName) return p;
                const currentLabel = p.cue ? `${p.name} – ${p.cue}` : p.name;
                const newMods = p.modifications.filter((m) => m !== (p.originalCue ? `${p.originalName} – ${p.originalCue}` : p.originalName));
                newMods.push(currentLabel);
                return {
                  ...p,
                  name: p.originalName,
                  cue: p.originalCue || "",
                  modifications: newMods,
                  isSelected: false,
                  originalName: undefined,
                  originalCue: undefined,
                };
              }),
            }
      );
      const serialized = serializeSections(next);
      lastSerializedRef.current = serialized;
      onContentChange?.(serialized);
      return next;
    });
  }, [onContentChange]);

  const toggleOpen = (key: string, open: boolean) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (open) next.add(key); else next.delete(key);
      return next;
    });
  };

  return (
    <div className="mt-12 border-t border-border pt-10 space-y-10">
      {sections.map((section, si) => (
        <div key={section.title}>
          <h2 className="font-heading text-2xl tracking-tight text-foreground border-b border-border pb-2 mb-5">
            {section.title}
          </h2>
          <div className="space-y-4">
            {section.poses.map((pose, i) => {
              const key = `${si}-${i}`;
              return (
                <Collapsible
                  key={key}
                  open={openKeys.has(key)}
                  onOpenChange={(open) => toggleOpen(key, open)}
                >
                  <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="flex items-center gap-4 p-3">
                      {pose.imageUrl && (
                        <img
                          src={pose.imageUrl}
                          alt={pose.name}
                          className="w-[72px] h-[72px] rounded-md object-cover flex-shrink-0"
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
                            {pose.duration && (
                              <span className="font-body text-xs text-muted-foreground whitespace-nowrap">
                                {pose.duration}
                              </span>
                            )}
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
                                    onClick={(e) => { e.stopPropagation(); handleReset(si, i); }}
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
                                onClick={() => handleModClick(si, i, mod)}
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
              );
            })}
          </div>
        </div>
      ))}

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
