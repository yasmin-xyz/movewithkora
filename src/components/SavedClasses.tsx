import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import ClassPlan from "@/components/ClassPlan";

interface SavedClass {
  id: string;
  peak_pose: string | null;
  class_length: number | null;
  class_content: string | null;
  created_at: string | null;
}

const SavedClasses = () => {
  const [classes, setClasses] = useState<SavedClass[]>([]);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const fetchClasses = () => {
    supabase
      .from("saved_classes")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setClasses(data as SavedClass[]);
      });
  };

  useEffect(() => {
    fetchClasses();
  }, []);

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

  const viewedClass = viewingId
    ? classes.find((c) => c.id === viewingId)
    : null;

  if (classes.length === 0) return null;

  return (
    <div className="mt-16 border-t border-border pt-10">
      <h2 className="font-heading text-2xl tracking-tight text-foreground mb-6">
        Saved Classes
      </h2>

      <div className="space-y-3">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
          >
            <div className="min-w-0 space-y-0.5">
              <p className="font-body text-sm font-medium text-foreground truncate">
                {cls.peak_pose || "Untitled"}
              </p>
              <p className="font-body text-xs text-muted-foreground">
                {cls.class_length} min · {formatDate(cls.created_at)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="font-body text-xs tracking-wide uppercase flex-shrink-0"
              onClick={() =>
                setViewingId(viewingId === cls.id ? null : cls.id)
              }
            >
              {viewingId === cls.id ? "Hide" : "View"}
            </Button>
          </div>
        ))}
      </div>

      {viewedClass?.class_content && (
        <ClassPlan content={viewedClass.class_content} isLoading={false} />
      )}
    </div>
  );
};

export default SavedClasses;
