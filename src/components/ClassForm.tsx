import { useEffect, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { getSanskritName } from "@/lib/sanskritNames";

// Rotates while generating. Ordered to mirror the real build sequence first,
// then a few "behind the scenes" extras for longer waits, then holds on a
// calm closing line rather than looping back to the start.
const LOADING_MESSAGES = [
  "Warming up your sequence…",
  "Grounding into the opening poses…",
  "Building toward your peak…",
  "Layering in your transitions…",
  "Shaping your peak pose…",
  "Easing into cool-down…",
  "Settling the final stretch…",
  "Writing cues for every breath…",
  "Adding modifications for every level…",
  "Balancing your timing…",
  "Checking the flow feels right…",
  "Reviewing the arc, start to finish…",
];
const LOADING_MESSAGE_INTERVAL_MS = 4500;
const LOADING_MESSAGE_HOLD = "Almost ready for you…";

// All confirmed to exist in pose_library, so results are always accurate.
// Curated to poses that make sense as a class "peak" — arm balances,
// inversions, deep backbends, and iconic balance poses (intensity_level 4-5).
const PEAK_OPTIONS = [
  "Bird of Paradise",
  "Handstand",
  "Forearm Stand",
  "Crow Pose",
  "Side Crow",
  "Flying Pigeon",
  "King Pigeon Pose",
  "Wheel Pose",
  "Camel Pose",
  "Warrior III",
  "Half Moon Pose",
  "Dancer's Pose",
  "Standing Split",
  "Eagle Pose",
  "Shoulder Stand",
];

const YOGA_STYLE_OPTIONS = [
  "Vinyasa",
  "Hatha",
  "Yin",
  "Restorative",
  "Power",
  "Ashtanga",
];

interface ClassFormProps {
  classLength: string;
  onClassLengthChange: (v: string) => void;
  peakMovement: string;
  onPeakMovementChange: (v: string) => void;
  skillLevel: string;
  onSkillLevelChange: (v: string) => void;
  yogaStyle: string;
  onYogaStyleChange: (v: string) => void;
  inspiration: string;
  onInspirationChange: (v: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  justCompleted?: boolean;
  onScrollToResult?: () => void;
  showSanskrit?: boolean;
  onToggleSanskrit?: (v: boolean) => void;
}

const ClassForm = ({
  classLength,
  onClassLengthChange,
  peakMovement,
  onPeakMovementChange,
  skillLevel,
  onSkillLevelChange,
  yogaStyle,
  onYogaStyleChange,
  inspiration,
  onInspirationChange,
  onGenerate,
  isLoading,
  justCompleted = false,
  onScrollToResult,
  showSanskrit = false,
  onToggleSanskrit,
}: ClassFormProps) => {
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isLoading) {
      setLoadingMessageIndex(0);
      loadingIntervalRef.current = setInterval(() => {
        setLoadingMessageIndex((i) => Math.min(i + 1, LOADING_MESSAGES.length));
      }, LOADING_MESSAGE_INTERVAL_MS);
    } else if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, [isLoading]);

  const currentLoadingMessage =
    loadingMessageIndex < LOADING_MESSAGES.length
      ? LOADING_MESSAGES[loadingMessageIndex]
      : LOADING_MESSAGE_HOLD;

  const peakLabel = (englishName: string) =>
    showSanskrit ? getSanskritName(englishName) || englishName : englishName;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="font-body text-sm font-medium text-foreground tracking-wide uppercase">
          Class Length
        </label>
        <Select value={classLength} onValueChange={onClassLengthChange}>
          <SelectTrigger className="h-12 bg-card border-border font-body text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="45">45 minutes</SelectItem>
            <SelectItem value="60">60 minutes</SelectItem>
            <SelectItem value="75">75 minutes</SelectItem>
            <SelectItem value="90">90 minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <label className="font-body text-sm font-medium text-foreground tracking-wide uppercase">
            Peak Movement or Focus
          </label>
          {onToggleSanskrit && (
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="font-body text-xs font-medium normal-case" style={{ color: "#5C6B55" }}>
                Show Sanskrit Names
              </span>
              <Switch checked={showSanskrit} onCheckedChange={onToggleSanskrit} />
            </label>
          )}
        </div>
        <Select value={peakMovement} onValueChange={onPeakMovementChange}>
          <SelectTrigger className="h-12 bg-card border-border font-body text-foreground">
            <SelectValue placeholder="Select a peak pose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="None">None (General Flow)</SelectItem>
            {PEAK_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {peakLabel(opt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="font-body text-sm font-medium text-foreground tracking-wide uppercase">
          Skill Level
        </label>
        <Select value={skillLevel} onValueChange={onSkillLevelChange}>
          <SelectTrigger className="h-12 bg-card border-border font-body text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Beginner">Beginner</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="font-body text-sm font-medium text-foreground tracking-wide uppercase">
          Style of Yoga
        </label>
        <Select value={yogaStyle} onValueChange={onYogaStyleChange}>
          <SelectTrigger className="h-12 bg-card border-border font-body text-foreground">
            <SelectValue placeholder="Select a style" />
          </SelectTrigger>
          <SelectContent>
            {YOGA_STYLE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="font-body text-sm font-medium text-foreground tracking-wide uppercase">
          Inspiration or Theme <span className="normal-case text-muted-foreground">(optional)</span>
        </label>
        <Input
          className="h-12 bg-card border-border font-body text-foreground placeholder:text-muted-foreground"
          placeholder="e.g. grounding, hip-openers, Dharma Mittra"
          value={inspiration}
          onChange={(e) => onInspirationChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && onGenerate()}
        />
      </div>

      <style>{`
        @keyframes classFormMsgFadeIn {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .classform-loading-msg {
          animation: classFormMsgFadeIn 0.5s ease;
        }
      `}</style>

      <Button
        className="w-full h-12 font-body text-sm font-medium tracking-wide uppercase overflow-hidden"
        onClick={justCompleted ? onScrollToResult : onGenerate}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
            <span key={loadingMessageIndex} className="classform-loading-msg normal-case tracking-normal">
              {currentLoadingMessage}
            </span>
          </span>
        ) : justCompleted ? (
          "Click to View Your Flow ↓"
        ) : (
          "Plan This Class"
        )}
      </Button>
    </div>
  );
};

export default ClassForm;
