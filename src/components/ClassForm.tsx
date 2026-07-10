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
        <div className="flex items-center justify-between gap-2">
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
          placeholder="e.g. grounding, hip-openers, Dharma Mittra's inversion philosophy"
          value={inspiration}
          onChange={(e) => onInspirationChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && onGenerate()}
        />
      </div>

      <Button
        className="w-full h-12 font-body text-sm font-medium tracking-wide uppercase"
        onClick={justCompleted ? onScrollToResult : onGenerate}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Planning…
          </>
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
