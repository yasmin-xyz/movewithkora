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

interface ClassFormProps {
  classLength: string;
  onClassLengthChange: (v: string) => void;
  peakMovement: string;
  onPeakMovementChange: (v: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const ClassForm = ({
  classLength,
  onClassLengthChange,
  peakMovement,
  onPeakMovementChange,
  onGenerate,
  isLoading,
}: ClassFormProps) => {
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
        <Input
          className="h-12 bg-card border-border font-body text-foreground placeholder:text-muted-foreground"
          placeholder="Example: Bird of Paradise"
          value={peakMovement}
          onChange={(e) => onPeakMovementChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && onGenerate()}
        />
      </div>

      <Button
        className="w-full h-12 font-body text-sm font-medium tracking-wide uppercase"
        onClick={onGenerate}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating…
          </>
        ) : (
          "Generate Class"
        )}
      </Button>
    </div>
  );
};

export default ClassForm;
