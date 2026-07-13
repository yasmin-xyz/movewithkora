import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteNav from "@/components/SiteNav";
import ClassPlan from "@/components/ClassPlan";

interface SharedClassRow {
  id: string;
  peak_pose: string | null;
  class_length: number | null;
  class_content: string | null;
  yoga_style: string | null;
  inspiration: string | null;
  skill_level: string | null;
  created_at: string | null;
}

const SharedClass = () => {
  const { token } = useParams<{ token: string }>();
  const [row, setRow] = useState<SharedClassRow | null>(null);
  const [status, setStatus] = useState<"loading" | "found" | "not-found">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("not-found");
      return;
    }
    supabase
      .from("shared_classes")
      .select("id, peak_pose, class_length, class_content, yoga_style, inspiration, skill_level, created_at")
      .eq("share_token", token)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setStatus("not-found");
          return;
        }
        setRow(data as SharedClassRow);
        setStatus("found");
      });
  }, [token]);

  const title = row
    ? (row.peak_pose === "None" ? "General Flow" : (row.peak_pose || "Untitled Class"))
    : "";

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-3xl mx-auto px-6 py-12">
        {status === "loading" && (
          <p className="font-body text-sm text-muted-foreground">Loading class…</p>
        )}

        {status === "not-found" && (
          <div className="text-center py-20 space-y-3">
            <h1 className="font-heading text-2xl tracking-tight text-foreground">
              This link isn't available
            </h1>
            <p className="font-body text-sm text-muted-foreground">
              The link may be incorrect, or the class it pointed to no longer exists.
            </p>
            <Link
              to="/"
              className="inline-block font-body text-xs tracking-wide uppercase text-primary hover:underline underline-offset-2 mt-2"
            >
              Go to Kora
            </Link>
          </div>
        )}

        {status === "found" && row && (
          <>
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="space-y-1.5">
                <h1 className="font-heading text-3xl tracking-tight text-foreground">
                  {title}
                </h1>
                <p className="font-body text-sm text-foreground/80">
                  {row.class_length ? `${row.class_length} minutes` : ""}
                  {row.yoga_style ? ` · ${row.yoga_style}` : ""}
                  {row.skill_level ? ` · ${row.skill_level}` : ""}
                </p>
                {row.inspiration && (
                  <p className="font-body text-xs text-muted-foreground italic">
                    "{row.inspiration}"
                  </p>
                )}
              </div>
              <span className="inline-flex items-center rounded-full bg-accent text-accent-foreground text-[10px] font-body font-medium px-2.5 py-0.5 shrink-0 mt-1">
                Shared Class
              </span>
            </div>

            {row.class_content && (
              <ClassPlan
                content={row.class_content}
                isLoading={false}
                readOnly
                classTitle={title}
                peakMovement={row.peak_pose || undefined}
                classLength={row.class_length}
                yogaStyle={row.yoga_style}
                skillLevel={row.skill_level}
                inspiration={row.inspiration}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SharedClass;
