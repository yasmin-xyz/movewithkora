import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, Download, Share2, Check, Loader2, Pencil, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getSanskritName, SANSKRIT_STORAGE_KEY } from "@/lib/sanskritNames";
import {
  parsePlan,
  serializeSections,
  parseModification,
  findPoseImage,
  type PoseMedia,
  type PoseEntry,
  type Section,
} from "@/lib/parseClassPlan";
import { downloadClassPDF } from "@/components/ClassPDF";

interface ClassPlanProps {
  content: string;
  isLoading: boolean;
  readOnly?: boolean;
  onContentChange?: (content: string) => void;
  showSanskrit?: boolean;
  onToggleSanskrit?: (v: boolean) => void;
  // New, all optional. Export PDF only ever needs `content` + `media`.
  // Share needs none of these to be *enabled* (it works for anyone,
  // logged in or not) — they're used to label the shared page/PDF nicely.
  classId?: string | null;
  classTitle?: string;
  peakMovement?: string;
  classLength?: number | null;
  yogaStyle?: string | null;
  skillLevel?: string | null;
  inspiration?: string | null;
}

const ClassPlan = ({
  content,
  isLoading,
  readOnly = false,
  onContentChange,
  showSanskrit: showSanskritProp,
  onToggleSanskrit,
  classId,
  classTitle,
  peakMovement,
  classLength,
  yogaStyle,
  skillLevel,
  inspiration,
}: ClassPlanProps) => {
  const [media, setMedia] = useState<PoseMedia[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const [internalShowSanskrit, setInternalShowSanskrit] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SANSKRIT_STORAGE_KEY) === "true";
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [manualShareUrl, setManualShareUrl] = useState<string | null>(null);

  const showSanskrit = showSanskritProp ?? internalShowSanskrit;
  const setShowSanskrit = onToggleSanskrit ?? setInternalShowSanskrit;

  useEffect(() => {
    if (showSanskritProp === undefined) {
      localStorage.setItem(SANSKRIT_STORAGE_KEY, String(internalShowSanskrit));
    }
  }, [internalShowSanskrit, showSanskritProp]);

  const displayName = (name: string) => {
    if (!showSanskrit) return name;
    return getSanskritName(name) || name;
  };

  useEffect(() => {
    supabase
      .from("pose_media")
      .select("pose_name, image_url")
      .then(({ data }) => {
        if (data) setMedia(data);
      });
  }, []);

  const lastSerializedRef = useRef("");
  useEffect(() => {
    if (content !== lastSerializedRef.current) {
      setSections(parsePlan(content, media));
      setOpenKeys(new Set());
    }
  }, [content, media]);

  const resolvedTitle = classTitle || (sections.length > 0 ? "Yoga Class" : "Yoga Class");

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      await downloadClassPDF({
        content,
        media,
        showSanskrit,
        title: resolvedTitle,
        peakMovement,
        classLength,
        yogaStyle,
        skillLevel,
        inspiration,
      });
    } catch (err: any) {
      toast.error(err?.message || "Couldn't export the PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [content, media, showSanskrit, resolvedTitle, peakMovement, classLength, yogaStyle, skillLevel, inspiration]);

  // Tracks a share already created for the content currently on screen, so
  // re-clicking Share re-copies the same link instead of minting a new row
  // each time. If the content changes (e.g. a pose swap) after sharing, a
  // fresh share is created on next click rather than reusing the stale one.
  const sharedRef = useRef<{ content: string; token: string } | null>(null);

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    setManualShareUrl(null);
    try {
      // Resolves the share URL — reuses a cached token if this exact content
      // was already shared this session, otherwise creates a new public
      // shared_classes row.
      const getUrl = async () => {
        let token: string;
        if (sharedRef.current && sharedRef.current.content === content) {
          token = sharedRef.current.token;
        } else {
          const { data, error } = await supabase
            .from("shared_classes")
            .insert({
              peak_pose: peakMovement || null,
              class_length: classLength ?? null,
              class_content: content,
              yoga_style: yogaStyle || null,
              inspiration: inspiration || null,
              skill_level: skillLevel || null,
              saved_class_id: classId || null,
            })
            .select("share_token")
            .single();
          if (error || !data) throw error || new Error("Failed to create share");
          token = data.share_token;
          sharedRef.current = { content, token };
        }
        return `${window.location.origin}/shared/${token}`;
      };

      // Safari (and some mobile browsers) reject a clipboard write that
      // happens after an `await` inside a click handler — the network call
      // above breaks the "direct user gesture" Safari requires. The fix
      // WebKit itself recommends: call clipboard.write() synchronously with
      // a ClipboardItem whose data is a Promise, so the async work can
      // finish *after* the write call has already been accepted as part of
      // the original tap.
      let copied = false;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": getUrl().then((url) => new Blob([url], { type: "text/plain" })),
          }),
        ]);
        copied = true;
      } catch {
        // Falls through to a plain writeText attempt below.
      }

      if (!copied) {
        const url = await getUrl();
        try {
          await navigator.clipboard.writeText(url);
          copied = true;
        } catch {
          // Final fallback — this browser won't let us copy programmatically
          // at all. Show the link so the user can copy it manually instead
          // of hitting a dead end.
          setManualShareUrl(url);
        }
      }

      if (copied) {
        setJustCopied(true);
        setTimeout(() => setJustCopied(false), 2000);
      }
    } catch (err: any) {
      toast.error(err?.message || "Couldn't create the share link. Please try again.");
    } finally {
      setIsSharing(false);
    }
  }, [content, peakMovement, classLength, yogaStyle, inspiration, skillLevel, classId]);

  const handleManualCopy = useCallback(async () => {
    if (!manualShareUrl) return;
    try {
      await navigator.clipboard.writeText(manualShareUrl);
      setJustCopied(true);
      setManualShareUrl(null);
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy automatically — tap and hold the link above to copy it manually.");
    }
  }, [manualShareUrl]);

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
                        const { name, breath, description } = parseModification(mod);
                        const oldLabel = p.breath
                          ? `${p.name} – Breath: ${p.breath} – ${p.cue}`
                          : (p.cue ? `${p.name} – ${p.cue}` : p.name);
                        const newMods = p.modifications.filter((m) => m !== mod);
                        newMods.push(oldLabel);
                        const imageUrl = findPoseImage(name, media);
                        return {
                          ...p,
                          name,
                          breath: breath ?? p.breath,
                          cue: description || p.cue,
                          modifications: newMods,
                          isSelected: true,
                          originalName: p.originalName || p.name,
                          originalCue: p.originalCue ?? p.cue,
                          originalBreath: p.originalBreath ?? p.breath,
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
                        const currentLabel = p.breath
                          ? `${p.name} – Breath: ${p.breath} – ${p.cue}`
                          : (p.cue ? `${p.name} – ${p.cue}` : p.name);
                        const originalLabel = p.originalBreath
                          ? `${p.originalName} – Breath: ${p.originalBreath} – ${p.originalCue}`
                          : (p.originalCue ? `${p.originalName} – ${p.originalCue}` : p.originalName);
                        const newMods = p.modifications.filter((m) => m !== originalLabel);
                        newMods.push(currentLabel);
                        const imageUrl = findPoseImage(p.originalName, media);
                        return {
                          ...p,
                          name: p.originalName,
                          breath: p.originalBreath ?? p.breath,
                          cue: p.originalCue || "",
                          modifications: newMods,
                          isSelected: false,
                          originalName: undefined,
                          originalCue: undefined,
                          originalBreath: undefined,
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

  // --- Block duration editing ---
  const [editingBlockKey, setEditingBlockKey] = useState<string | null>(null);
  const [blockDurationDraft, setBlockDurationDraft] = useState("");

  const startEditBlockDuration = (blockKey: string, currentDuration: string) => {
    const match = currentDuration.match(/(\d+)/);
    setBlockDurationDraft(match ? match[1] : "");
    setEditingBlockKey(blockKey);
  };

  const cancelEditBlockDuration = () => {
    setEditingBlockKey(null);
    setBlockDurationDraft("");
  };

  const saveBlockDuration = useCallback((sectionIdx: number, blockIdx: number) => {
    const minutes = parseInt(blockDurationDraft, 10);
    if (!minutes || minutes <= 0) {
      cancelEditBlockDuration();
      return;
    }
    setSections((prev) => {
      const next = prev.map((s, si) =>
        si !== sectionIdx
          ? s
          : {
              ...s,
              blocks: s.blocks.map((b, bi) =>
                bi !== blockIdx ? b : { ...b, duration: `${minutes} minutes` }
              ),
            }
      );
      const serialized = serializeSections(next);
      lastSerializedRef.current = serialized;
      onContentChange?.(serialized);
      return next;
    });
    setEditingBlockKey(null);
    setBlockDurationDraft("");
  }, [blockDurationDraft, onContentChange]);

  // --- Pose breath/cue editing ---
  const [editingPoseKey, setEditingPoseKey] = useState<string | null>(null);
  const [poseEditDraft, setPoseEditDraft] = useState<{ breath: string; cue: string }>({ breath: "", cue: "" });

  const startEditPose = (key: string, pose: PoseEntry) => {
    setPoseEditDraft({ breath: pose.breath, cue: pose.cue });
    setEditingPoseKey(key);
  };

  const cancelEditPose = () => {
    setEditingPoseKey(null);
  };

  const savePoseEdit = useCallback((sectionIdx: number, blockIdx: number, poseIdx: number) => {
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
                      poses: b.poses.map((p, pi) =>
                        pi !== poseIdx ? p : { ...p, breath: poseEditDraft.breath, cue: poseEditDraft.cue }
                      ),
                    }
              ),
            }
      );
      const serialized = serializeSections(next);
      lastSerializedRef.current = serialized;
      onContentChange?.(serialized);
      return next;
    });
    setEditingPoseKey(null);
  }, [poseEditDraft, onContentChange]);

  const [openBlocks, setOpenBlocks] = useState<Set<string>>(new Set());

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
      {sections.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 -mt-4">
          <div className="flex items-center gap-2">
            <span className="font-body text-xs font-medium" style={{ color: "#5C6B55" }}>Show Sanskrit Names</span>
            <Switch checked={showSanskrit} onCheckedChange={setShowSanskrit} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="font-body text-xs tracking-wide uppercase h-7 px-2.5"
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              <span className="ml-1.5">Export PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="font-body text-xs tracking-wide uppercase h-7 px-2.5"
              onClick={handleShare}
              disabled={isSharing}
            >
              {justCopied ? (
                <Check className="h-3 w-3" />
              ) : isSharing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Share2 className="h-3 w-3" />
              )}
              <span className="ml-1.5">{justCopied ? "Link Copied" : "Share"}</span>
            </Button>
          </div>
          {manualShareUrl && (
            <div className="flex w-full items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 mt-1">
              <input
                readOnly
                value={manualShareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-w-0 bg-transparent font-body text-xs text-foreground outline-none"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[11px] font-body flex-shrink-0"
                onClick={handleManualCopy}
              >
                Copy
              </Button>
              <button
                onClick={() => setManualShareUrl(null)}
                className="text-muted-foreground/60 hover:text-foreground text-xs flex-shrink-0"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
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
                    <div className="w-full flex items-baseline justify-between mb-3 group">
                      <button
                        onClick={() => toggleBlock(blockKey)}
                        className="flex-1 min-w-0 text-left cursor-pointer"
                      >
                        <h3 className="font-body text-base font-normal text-foreground/70 tracking-wide">
                          {block.blockName}
                        </h3>
                      </button>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {editingBlockKey === blockKey ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              value={blockDurationDraft}
                              onChange={(e) => setBlockDurationDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveBlockDuration(si, bi);
                                if (e.key === "Escape") cancelEditBlockDuration();
                              }}
                              autoFocus
                              className="w-14 h-7 rounded border border-border bg-background px-1.5 text-xs font-body text-foreground text-right"
                            />
                            <span className="font-body text-xs text-muted-foreground pr-0.5">min</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => saveBlockDuration(si, bi)}
                                  className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
                                  aria-label="Save duration"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Save</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={cancelEditBlockDuration}
                                  className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
                                  aria-label="Cancel"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Cancel</TooltipContent>
                            </Tooltip>
                          </div>
                        ) : (
                          <>
                            {block.duration && (
                              <button onClick={() => toggleBlock(blockKey)} className="cursor-pointer">
                                <span className="font-body text-xs font-normal text-muted-foreground">
                                  {block.duration}
                                </span>
                              </button>
                            )}
                            {!readOnly && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => startEditBlockDuration(blockKey, block.duration)}
                                    className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground/50 hover:text-foreground transition-colors"
                                    aria-label="Edit duration"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Edit duration</TooltipContent>
                              </Tooltip>
                            )}
                            <button onClick={() => toggleBlock(blockKey)} className="h-6 w-6 flex items-center justify-center">
                              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isBlockOpen ? "rotate-180" : ""}`} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {block.note && (
                      <p className="font-body text-xs text-muted-foreground/80 italic -mt-2 mb-3">
                        {block.note}
                      </p>
                    )}
                    {isBlockOpen && (
                      <div className="space-y-3">
                        {(() => {
                          const elements: React.ReactNode[] = [];
                          let lastSideFlow: string | undefined;

                          block.poses.forEach((pose, pi) => {
                            const key = `${si}-${bi}-${pi}`;

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

                            if (pose.isSideFlowVinyasa) {
                              elements.push(
                                <div key={key} className="py-1.5 px-3">
                                  <div className="border-t border-border/40 mb-1.5" />
                                  <p className="font-body text-[12px] font-medium text-muted-foreground/70">
                                    Vinyasa: {displayName(pose.sideFlowVinyasaLabel || pose.name)}
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
                                    Transition: {displayName(pose.name)}
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
                                  <div className={`rounded-lg border border-border overflow-hidden ${pose.modifications.length === 0 ? "bg-muted/20" : "bg-card"}`}>
                                    <div className="flex items-start gap-2.5 p-2.5 sm:gap-4 sm:p-3">
                                      {pose.imageUrl && (
                                        <img
                                          src={pose.imageUrl}
                                          alt={displayName(pose.name)}
                                          className="w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-md object-contain bg-muted/20 flex-shrink-0"
                                        />
                                      )}
                                      <div className="space-y-1 min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                                            <p className="font-body text-base font-medium text-foreground">
                                              {displayName(pose.name)}
                                              {showSanskrit && getSanskritName(pose.name) && (
                                                <span className="italic font-normal text-sm text-muted-foreground whitespace-nowrap">
                                                  {" "}({pose.name.replace(/\s*\((Right|Left)\)\s*$/i, "")})
                                                </span>
                                              )}
                                              {!showSanskrit && pose.name.replace(/\s*\((Right|Left)\)\s*$/i, "") === "Corpse Pose" && (
                                                <span className="italic font-normal text-sm text-muted-foreground whitespace-nowrap"> (Savasana)</span>
                                              )}
                                            </p>
                                            {pose.isSelected && (
                                              <span className="inline-flex items-center rounded-full bg-accent text-accent-foreground text-[10px] font-body font-medium px-2 py-0.5 shrink-0">
                                                Selected
                                              </span>
                                            )}
                                          </div>
                                          {!readOnly && (
                                            <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); startEditPose(key, pose); }}
                                                    className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
                                                    aria-label="Edit breath and cue"
                                                  >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                  </button>
                                                </TooltipTrigger>
                                                <TooltipContent>Edit breath & cue</TooltipContent>
                                              </Tooltip>
                                              {pose.modifications.length > 0 && (
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
                                          )}
                                        </div>
                                        {editingPoseKey === key ? (
                                          <div className="space-y-2 mt-1" onClick={(e) => e.stopPropagation()}>
                                            <div>
                                              <label className="font-body text-[11px] font-medium text-foreground/70 uppercase tracking-wide">
                                                Breath
                                              </label>
                                              <input
                                                value={poseEditDraft.breath}
                                                onChange={(e) => setPoseEditDraft((d) => ({ ...d, breath: e.target.value }))}
                                                className="w-full mt-1 h-9 rounded-md border border-border bg-background px-2.5 text-sm font-body text-foreground"
                                              />
                                            </div>
                                            <div>
                                              <label className="font-body text-[11px] font-medium text-foreground/70 uppercase tracking-wide">
                                                Cue
                                              </label>
                                              <textarea
                                                value={poseEditDraft.cue}
                                                onChange={(e) => setPoseEditDraft((d) => ({ ...d, cue: e.target.value }))}
                                                rows={3}
                                                className="w-full mt-1 rounded-md border border-border bg-background px-2.5 py-2 text-sm font-body text-foreground resize-none"
                                              />
                                            </div>
                                            <div className="flex items-center gap-2 justify-end pt-0.5">
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 px-3 text-xs font-body"
                                                    onClick={() => savePoseEdit(si, bi, pi)}
                                                  >
                                                    <Check className="h-3.5 w-3.5 mr-1" /> Save
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Save changes</TooltipContent>
                                              </Tooltip>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 px-3 text-xs font-body text-muted-foreground"
                                                    onClick={cancelEditPose}
                                                  >
                                                    <X className="h-3.5 w-3.5 mr-1" /> Cancel
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Discard changes</TooltipContent>
                                              </Tooltip>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
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
                                          </>
                                        )}
                                        {!readOnly && (
                                          <div className="flex sm:hidden items-center justify-end gap-3 pt-1">
                                            {pose.isSelected && pose.modifications.length > 0 && (
                                              <button
                                                onClick={(e) => { e.stopPropagation(); handleReset(si, bi, pi); }}
                                                className="font-body text-[10px] text-muted-foreground/60 hover:text-foreground/70 hover:underline underline-offset-2 transition-colors duration-150 whitespace-nowrap"
                                              >
                                                Reset
                                              </button>
                                            )}
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); startEditPose(key, pose); }}
                                                  className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
                                                  aria-label="Edit breath and cue"
                                                >
                                                  <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                              </TooltipTrigger>
                                              <TooltipContent>Edit breath & cue</TooltipContent>
                                            </Tooltip>
                                            {pose.modifications.length > 0 && (
                                              <CollapsibleTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-7 px-2 text-[11px] font-body text-muted-foreground hover:text-foreground"
                                                >
                                                  Modify
                                                </Button>
                                              </CollapsibleTrigger>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <CollapsibleContent>
                                      <div className="border-t border-border px-4 py-2 bg-muted/30 space-y-0.5">
                                        {pose.modifications.length > 0 ? (
                                          <>
                                            {pose.modifications.map((mod, mi) => {
                                              const { name, description } = parseModification(mod);
                                              const modLabel = description
                                                ? `${displayName(name)} – ${description}`
                                                : displayName(name);
                                              return (
                                                <button
                                                  key={mi}
                                                  onClick={() => handleModClick(si, bi, pi, mod)}
                                                  aria-label={`Swap with ${name}`}
                                                  className="group w-full rounded-md px-2.5 py-1.5 font-body text-sm text-muted-foreground hover:bg-secondary/60 transition-all duration-150 cursor-pointer flex items-center justify-between"
                                                >
                                                  <span className="text-left">• {modLabel}</span>
                                                  <span className="font-body text-[11px] font-medium text-muted-foreground/70 group-hover:text-muted-foreground transition-opacity duration-150 shrink-0 ml-3">
                                                    Swap
                                                  </span>
                                                </button>
                                              );
                                            })}
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
