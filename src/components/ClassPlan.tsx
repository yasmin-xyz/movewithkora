import ReactMarkdown from "react-markdown";

interface ClassPlanProps {
  content: string;
  isLoading: boolean;
}

const ClassPlan = ({ content, isLoading }: ClassPlanProps) => {
  return (
    <div className="mt-12 border-t border-border pt-10">
      <div className="prose prose-stone max-w-none font-body text-foreground
        prose-headings:font-heading prose-headings:font-normal prose-headings:tracking-tight prose-headings:text-foreground
        prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
        prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-muted-foreground
        prose-p:text-sm prose-p:leading-relaxed prose-p:text-foreground/80
        prose-li:text-sm prose-li:text-foreground/80
        prose-ul:my-2 prose-ol:my-2
        prose-strong:text-foreground prose-strong:font-medium
      ">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
      {isLoading && (
        <div className="mt-4 flex items-center gap-2 text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <span className="font-body text-xs tracking-wide uppercase">Generating…</span>
        </div>
      )}
    </div>
  );
};

export default ClassPlan;
