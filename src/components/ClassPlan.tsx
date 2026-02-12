import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClassPlanProps {
  content: string;
  isLoading: boolean;
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
}

interface Section {
  title: string;
  poses: PoseEntry[];
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
        const img = media.find(
          (m) => m.pose_name.toLowerCase() === name.toLowerCase()
        );
        current.poses.push({ name, duration: "", breath: "", cue: "", imageUrl: img?.image_url });
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
    }
  }

  return sections;
}

const ClassPlan = ({ content, isLoading }: ClassPlanProps) => {
  const [media, setMedia] = useState<PoseMedia[]>([]);

  useEffect(() => {
    supabase
      .from("pose_media")
      .select("pose_name, image_url")
      .then(({ data }) => {
        if (data) setMedia(data);
      });
  }, []);

  const sections = parsePlan(content, media);

  return (
    <div className="mt-12 border-t border-border pt-10 space-y-10">
      {sections.map((section) => (
        <div key={section.title}>
          <h2 className="font-heading text-2xl tracking-tight text-foreground border-b border-border pb-2 mb-5">
            {section.title}
          </h2>
          <div className="space-y-4">
            {section.poses.map((pose, i) => (
              <div
                key={`${section.title}-${i}`}
                className="rounded-lg border border-border bg-card overflow-hidden"
              >
                {pose.imageUrl && (
                  <img
                    src={pose.imageUrl}
                    alt={pose.name}
                    className="w-full h-36 object-cover"
                  />
                )}
                <div className="p-4 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-body text-base font-medium text-foreground">
                      {pose.name}
                    </p>
                    {pose.duration && (
                      <span className="font-body text-xs text-muted-foreground whitespace-nowrap">
                        {pose.duration}
                      </span>
                    )}
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
            ))}
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
