import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ClassForm from "@/components/ClassForm";
import ClassPlan from "@/components/ClassPlan";
import SavedClasses from "@/components/SavedClasses";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LoginDialog, MagicLinkForm } from "@/components/Auth";

const Index = () => {
  const navigate = useNavigate();
  const [classLength, setClassLength] = useState("60");
  const [peakMovement, setPeakMovement] = useState("");
  const [skillLevel, setSkillLevel] = useState("Intermediate");
  const [yogaStyle, setYogaStyle] = useState("");
  const [inspiration, setInspiration] = useState("");
  const [classPlan, setClassPlan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isViewingLoaded, setIsViewingLoaded] = useState(false);
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const { user } = useAuth();
  const abortRef = useRef<AbortController | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  const [mounted, setMounted] = useState(false);
  const [blooming, setBlooming] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), 20);
    const t2 = setTimeout(() => setBlooming(true), 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleLoadClass = (
    peakPose: string,
    length: number,
    content: string,
    date: string | null,
    loadedYogaStyle?: string | null,
    loadedInspiration?: string | null
  ) => {
    setClassLength(String(length));
    setPeakMovement(peakPose);
    setClassPlan(content);
    setLoadedDate(date);
    setYogaStyle(loadedYogaStyle || "");
    setInspiration(loadedInspiration || "");
    setIsViewingLoaded(true);
    headerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleBackToLibrary = () => {
    setIsViewingLoaded(false);
    setClassPlan("");
    setLoadedDate(null);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleGenerate = async () => {
    if (!peakMovement.trim()) {
      toast.error("Please enter a peak movement or focus");
      return;
    }

    setIsLoading(true);
    setClassPlan("");
    abortRef.current = new AbortController();

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-class`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            classLength: parseInt(classLength),
            peakMovement: peakMovement.trim(),
            skillLevel,
            yogaStyle: yogaStyle || null,
            inspiration: inspiration.trim() || null,
          }),
          signal: abortRef.current.signal,
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed to generate class plan");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setClassPlan(fullText);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast.error(e.message || "Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      setLoginOpen(true);
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.from("saved_classes").insert({
      peak_pose: peakMovement.trim(),
      class_length: parseInt(classLength),
      class_content: classPlan,
      user_id: user.id,
      yoga_style: yogaStyle || null,
      inspiration: inspiration.trim() || null,
    });
    setIsSaving(false);

    if (error) {
      toast.error("Failed to save class.");
    } else {
      toast.success("Class saved successfully.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    handleBackToLibrary();
  };


  return (
    <div className="kora-planner min-h-screen">
      <style>{`
        .kora-planner {
          --cream: #F5F0EB;
          --olive: #5C6B55;
          --olive-light: #6B7D63;
          --text-primary: #2A2A28;
          --text-secondary: #8A857E;
          --white: #FDFCFA;
          --serif: 'Playfair Display', Georgia, 'Times New Roman', serif;
          --sans: 'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--white);
          font-family: var(--sans);
        }
        .kora-planner .planner-content {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .kora-planner .planner-content.mounted {
          opacity: 1;
          transform: translateY(0);
        }
        .kora-planner .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-family: var(--sans);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-secondary);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .kora-planner .back-link:hover {
          color: var(--olive);
          transform: translateX(-2px);
        }
        .kora-planner .planner-heading {
          font-family: var(--serif) !important;
        }
        .kora-planner .planner-lotus {
          width: 110px;
          height: 58px;
          margin: 0 auto 1.5rem;
        }
        .kora-planner .planner-lotus svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }
        .kora-planner .planner-lotus .lotus-petal {
          fill: none;
          stroke: #66725F;
          stroke-width: 2.4;
          stroke-linecap: round;
          stroke-linejoin: round;
          opacity: 0;
          transform-origin: 100px 78px;
          transition: opacity 1.2s ease, transform 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          transform: scale(0.92);
        }
        .kora-planner .planner-lotus.blooming .lotus-petal {
          opacity: 1;
          transform: scale(1);
        }
        .kora-planner .planner-lotus.blooming .petal-back { transition-delay: 0s; }
        .kora-planner .planner-lotus.blooming .petal-mid { transition-delay: 0.1s; }
        .kora-planner .planner-lotus.blooming .petal-front { transition-delay: 0.2s; }
        .kora-planner .planner-lotus.blooming .petal-centre { transition-delay: 0.3s; }
      `}</style>

      <div className={`planner-content ${mounted ? "mounted" : ""}`}>
        <div className="mx-auto max-w-2xl px-6 pt-8">
          <button className="back-link" onClick={() => navigate("/")}>
            ← Back to Homepage
          </button>
        </div>

        <div className="mx-auto max-w-2xl px-6 pb-16 pt-8 sm:pb-24">
          <header ref={headerRef} className="mb-16 text-center">
            <div className={`planner-lotus ${blooming ? "blooming" : ""}`}>
              <svg viewBox="0 0 200 105" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path className="lotus-petal petal-back" d="M100 78 C82 66, 32 52, 6 64 C4 72, 28 84, 60 86 C78 86, 94 82, 100 78Z"/>
                <path className="lotus-petal petal-back" d="M100 78 C118 66, 168 52, 194 64 C196 72, 172 84, 140 86 C122 86, 106 82, 100 78Z"/>
                <path className="lotus-petal petal-mid" d="M100 76 C86 58, 50 24, 36 12 C30 16, 38 38, 56 56 C70 68, 88 76, 100 76Z"/>
                <path className="lotus-petal petal-mid" d="M100 76 C114 58, 150 24, 164 12 C170 16, 162 38, 144 56 C130 68, 112 76, 100 76Z"/>
                <path className="lotus-petal petal-front" d="M100 74 C90 52, 74 18, 68 6 C64 10, 68 32, 78 50 C86 62, 96 72, 100 74Z"/>
                <path className="lotus-petal petal-front" d="M100 74 C110 52, 126 18, 132 6 C136 10, 132 32, 122 50 C114 62, 104 72, 100 74Z"/>
                <path className="lotus-petal petal-centre" d="M100 72 C92 48, 86 16, 88 2 C92 -2, 97 10, 100 2 C103 10, 108 -2, 112 2 C114 16, 108 48, 100 72Z"/>
              </svg>
            </div>
            <h1 className="planner-heading text-6xl font-light tracking-tight text-foreground sm:text-7xl">
              Kora
            </h1>
            <p className="mt-3 font-body text-lg text-muted-foreground tracking-wide">
              Plan less. Teach better.
            </p>
          </header>

          {isViewingLoaded ? (
            <>
              <button
                onClick={handleBackToLibrary}
                className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 mb-6 flex items-center gap-1"
              >
                ← Back to Saved Classes
              </button>
              <div className="mb-8 space-y-1">
                <h2 className="font-heading text-3xl tracking-tight text-foreground">
                  {peakMovement || "Untitled"}
                </h2>
                <p className="font-body text-sm text-muted-foreground">
                  {classLength} min
                  {yogaStyle ? ` · ${yogaStyle}` : ""}
                  {loadedDate ? ` · Saved ${formatDate(loadedDate)}` : ""}
                </p>
                {inspiration && (
                  <p className="font-body text-sm text-muted-foreground italic">
                    "{inspiration}"
                  </p>
                )}
              </div>
              <ClassPlan content={classPlan} isLoading={false} onContentChange={setClassPlan} />
            </>
          ) : (
            <>
              <ClassForm
                classLength={classLength}
                onClassLengthChange={setClassLength}
                peakMovement={peakMovement}
                onPeakMovementChange={setPeakMovement}
                skillLevel={skillLevel}
                onSkillLevelChange={setSkillLevel}
                yogaStyle={yogaStyle}
                onYogaStyleChange={setYogaStyle}
                inspiration={inspiration}
                onInspirationChange={setInspiration}
                onGenerate={handleGenerate}
                isLoading={isLoading}
              />

              {classPlan && <ClassPlan content={classPlan} isLoading={isLoading} onContentChange={setClassPlan} />}

              {classPlan && !isLoading && (
                <div className="mt-8">
                  <Button
                    variant="outline"
                    className="w-full h-12 font-body text-sm font-medium tracking-wide uppercase"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving…" : "Save Class"}
                  </Button>
                </div>
              )}

              <div className="mt-16 border-t border-border pt-10">
                {user ? (
                  <>
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <p className="font-body text-xs text-muted-foreground truncate">
                        Signed in as{" "}
                        <span className="font-medium text-foreground">{user.email}</span>
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-body text-xs tracking-wide uppercase flex-shrink-0"
                        onClick={handleLogout}
                      >
                        Log out
                      </Button>
                    </div>
                    <SavedClasses onLoadClass={handleLoadClass} />
                  </>
                ) : (
                  <div className="mx-auto max-w-sm">
                    <MagicLinkForm
                      title="Save your classes"
                      subtitle="Sign in with your email to save classes and revisit them anytime. We'll send a magic link — no password needed."
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
};

export default Index;
