import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const PEAK_OPTIONS = [
  "Bird of Paradise",
  "Handstand",
  "Crow Pose",
  "Side Crow",
  "King Pigeon",
  "Custom",
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
}: ClassFormProps) => {
  const [peakSelect, setPeakSelect] = useState(
    PEAK_OPTIONS.includes(peakMovement) ? peakMovement : peakMovement ? "Custom" : ""
  );
  const [customValue, setCustomValue] = useState(
    PEAK_OPTIONS.includes(peakMovement) ? "" : peakMovement
  );

  useEffect(() => {
    if (PEAK_OPTIONS.includes(peakMovement)) {
      setPeakSelect(peakMovement);
      setCustomValue("");
    } else if (peakMovement) {
      setPeakSelect("Custom");
      setCustomValue(peakMovement);
    } else {
      setPeakSelect("");
      setCustomValue("");
    }
  }, [peakMovement]);

  const handleSelectChange = (value: string) => {
    setPeakSelect(value);
    if (value !== "Custom") {
      setCustomValue("");
      onPeakMovementChange(value);
    } else {
      onPeakMovementChange(customValue);
    }
  };

  const handleCustomChange = (value: string) => {
    setCustomValue(value);
    onPeakMovementChange(value);
  };

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
            <SelectItem value="90">90 minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="font-body text-sm font-medium text-foreground tracking-wide uppercase">
          Peak Movement or Focus
        </label>
        <Select value={peakSelect} onValueChange={handleSelectChange}>
          <SelectTrigger className="h-12 bg-card border-border font-body text-foreground">
            <SelectValue placeholder="Select a peak pose" />
          </SelectTrigger>
          <SelectContent>
            {PEAK_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {peakSelect === "Custom" && (
          <Input
            className="h-12 bg-card border-border font-body text-foreground placeholder:text-muted-foreground"
            placeholder="Enter your peak pose"
            value={customValue}
            onChange={(e) => handleCustomChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && onGenerate()}
          />
        )}
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
