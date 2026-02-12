import { useState, useRef } from "react";
import { toast } from "sonner";
import ClassForm from "@/components/ClassForm";
import ClassPlan from "@/components/ClassPlan";

const Index = () => {
  const [classLength, setClassLength] = useState("60");
  const [peakMovement, setPeakMovement] = useState("");
  const [classPlan, setClassPlan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
        <header className="mb-16 text-center">
          <h1 className="font-heading text-6xl font-light tracking-tight text-foreground sm:text-7xl">
            Kora
          </h1>
          <p className="mt-3 font-body text-lg text-muted-foreground tracking-wide">
            Plan less. Teach better.
          </p>
        </header>

        <ClassForm
          classLength={classLength}
          onClassLengthChange={setClassLength}
          peakMovement={peakMovement}
          onPeakMovementChange={setPeakMovement}
          onGenerate={handleGenerate}
          isLoading={isLoading}
        />

        {classPlan && <ClassPlan content={classPlan} isLoading={isLoading} />}
      </div>
    </div>
  );
};

export default Index;
