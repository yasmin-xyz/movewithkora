import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ClassPlan from "@/components/ClassPlan";

interface SavedClass {
  id: string;
  peak_pose: string | null;
  class_length: number | null;
  class_content: string | null;
  created_at: string | null;
  archived: boolean | null;
  yoga_style: string | null;
  inspiration: string | null;
}

interface SavedClassesProps {
  onLoadClass?: (
    peakPose: string,
    length: number,
    content: string,
    date: string | null,
    yogaStyle?: string | null,
    inspiration?: string | null
  ) => void;
}

const SavedClasses = ({ onLoadClass }: SavedClassesProps) => {
  const [classes, setClasses] = useState<SavedClass[]>([]);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const fetchClasses = (archived: boolean) => {
    supabase
      .from("saved_classes")
      .select("*")
      .eq("archived", archived)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setClasses(data as SavedClass[]);
      });
  };

  useEffect(() => {
    fetchClasses(showArchived);
  }, [showArchived]);

  const handleArchive = async (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    if (viewingId === id) setViewingId(null);
    await supabase.from("saved_classes").update({ archived: true }).eq("id", id);
  };

  const handleUnarchive = async (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    if (viewingId === id) setViewingId(null);
    await supabase.from("saved_classes").update({ archived: false }).eq("id", id);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const viewedClass = viewingId ? classes.find((c) => c.id === viewingId) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl tracking-tight text-foreground">
          Saved Classes
        </h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="font-body text-xs text-muted-foreground">Show Archived</span>
          <Switch checked={showArchived} onCheckedChange={setShowArchived} />
        </label>
      </div>

      {classes.length === 0 && (
        <p className="font-body text-sm text-muted-foreground">
          {showArchived ? "No archived classes." : "No saved classes yet."}
        </p>
      )}

      <div className="space-y-3">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="relative rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-0.5">
                <p className="font-body text-sm font-medium text-foreground truncate">
                  {cls.peak_pose || "Untitled"}
                </p>
                <p className="font-body text-xs text-muted-foreground">
                  {cls.class_length} min
                  {cls.yoga_style ? ` · ${cls.yoga_style}` : ""}
                  {" · "}
                  {formatDate(cls.created_at)}
                </p>
                {cls.inspiration && (
                  <p className="font-body text-xs text-muted-foreground/80 italic truncate">
                    "{cls.inspiration}"
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-body text-xs tracking-wide uppercase"
                  onClick={() => setViewingId(cls.id)}
                >
                  Preview
                </Button>
                {!showArchived && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-body text-xs tracking-wide uppercase"
                    onClick={() =>
                      onLoadClass?.(
                        cls.peak_pose || "",
                        cls.class_length || 60,
                        cls.class_content || "",
                        cls.created_at,
                        cls.yoga_style,
                        cls.inspiration
                      )
                    }
                  >
                    Load
                  </Button>
                )}
                <button
                  onClick={() => showArchived ? handleUnarchive(cls.id) : handleArchive(cls.id)}
                  className="font-body text-[10px] text-muted-foreground/60 hover:text-foreground/70 hover:underline underline-offset-2 transition-colors duration-150 whitespace-nowrap"
                >
                  {showArchived ? "Restore" : "Archive"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!viewedClass} onOpenChange={(open) => { if (!open) setViewingId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 shadow-2xl rounded-xl">
          {viewedClass && (
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-1.5">
                  <h3 className="font-heading text-2xl tracking-tight text-foreground">
                    {viewedClass.peak_pose || "Untitled"}
                  </h3>
                  <p className="font-body text-sm text-foreground/80">
                    {viewedClass.class_length} minutes
                    {viewedClass.yoga_style ? ` · ${viewedClass.yoga_style}` : ""}
                  </p>
                  {viewedClass.inspiration && (
                    <p className="font-body text-xs text-muted-foreground italic">
                      "{viewedClass.inspiration}"
                    </p>
                  )}
                  <p className="font-body text-[11px] font-light text-muted-foreground/70">
                    Saved {formatDate(viewedClass.created_at)}
                  </p>
                </div>
                <div className="flex flex-col items-end shrink-0 mt-1">
                  <span className="inline-flex items-center rounded-full bg-accent text-accent-foreground text-[10px] font-body font-medium px-2.5 py-0.5">
                    Preview Mode
                  </span>
                  <span className="font-body text-[10px] text-muted-foreground/60 mt-1">
                    Read-only view
                  </span>
                </div>
              </div>
              {viewedClass.class_content && (
                <ClassPlan content={viewedClass.class_content} isLoading={false} readOnly />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavedClasses;
