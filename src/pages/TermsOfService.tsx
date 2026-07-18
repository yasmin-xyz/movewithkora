import { useEffect } from "react";
import { Link } from "react-router-dom";
import SiteNav from "@/components/SiteNav";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="font-heading text-xl tracking-tight text-foreground mb-2">{title}</h2>
    <div className="font-body text-sm text-foreground/80 leading-relaxed space-y-2">{children}</div>
  </div>
);

const TermsOfService = () => {
  // Client-side navigation doesn't reset scroll position the way a normal
  // page load does — same fix already used in Index.tsx.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-16">
        <h1 className="font-heading text-3xl tracking-tight text-foreground mb-1">Terms of Service</h1>
        <p className="font-body text-xs text-muted-foreground mb-10">Last updated July 13, 2026</p>

        <Section title="Agreement to these terms">
          <p>
            Kora (movewithkora.com) is operated by PickMeLabs, a sole proprietorship based in
            Ontario, Canada. By using Kora, you agree to these terms. If you don't agree, please don't
            use the app. Questions: <a href="mailto:hello@pickmelabs.com" className="text-primary underline underline-offset-2">hello@pickmelabs.com</a>.
          </p>
        </Section>

        <Section title="What Kora is">
          <p>
            Kora is a class-planning tool for yoga instructors. It generates class sequences from
            parameters you provide (peak pose, length, skill level, style, theme) and lets you save,
            export, and share the results. It is currently free to use.
          </p>
        </Section>

        <Section title="Your account">
          <p>
            You're responsible for keeping access to your own email/login secure. Don't share your
            account with others or use it in a way that disrupts the app for anyone else.
          </p>
        </Section>

        <Section title="Your content">
          <p>
            You own the class plans you create and save in Kora. We store them so you can access them
            again, and we don't claim any ownership over them. If you use the Share feature, you're
            choosing to make that specific class plan viewable by anyone with the link — that's your
            decision to make, and you're responsible for what you choose to include in it (e.g. a class
            theme or inspiration field).
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>Please don't use Kora to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Attempt to access another user's account or data.</li>
            <li>Probe, scan, or attempt to bypass the app's security.</li>
            <li>Automate requests in a way that places unreasonable load on the service.</li>
            <li>Submit feedback or shared content that's abusive, illegal, or infringes someone else's rights.</li>
          </ul>
        </Section>

        <Section title="Yoga is physical — please use judgment">
          <p>
            Kora generates class sequences using AI, based on a pose library and a set of sequencing
            rules — it is a planning aid for instructors, not a substitute for your own training,
            certification, or professional judgment. Yoga involves physical movement and carries
            inherent risk of injury. Before teaching or practicing any sequence Kora generates, review
            it yourself, adapt it to the real needs and abilities of the people you're teaching, and use
            your own expertise as a certified instructor. Kora is not a medical device and nothing it
            generates is medical advice — if you or a student has a health condition or injury, that
            should be guided by a qualified healthcare professional, not this app.
          </p>
        </Section>

        <Section title="No warranty">
          <p>
            Kora is provided "as is." We don't guarantee that generated class plans are error-free,
            perfectly sequenced, or suited to every skill level or body — AI-generated content can be
            wrong. We also don't guarantee the app will always be available or free of bugs.
          </p>
        </Section>

        <Section title="Limitation of liability">
          <p>
            To the fullest extent permitted by law, PickMeLabs is not liable for any injury, loss, or
            damage arising from your use of Kora or from teaching or practicing a sequence it generated.
            Since Kora is currently free, our liability in any case is limited to the greatest extent the
            law allows.
          </p>
        </Section>

        <Section title="Changes and termination">
          <p>
            We may update these terms, or change, suspend, or discontinue Kora, at any time. We'll
            update the date at the top of this page when terms change. If we ever discontinue the
            service, we'll aim to give you a reasonable chance to export your saved classes first.
          </p>
        </Section>

        <Section title="Governing law">
          <p>These terms are governed by the laws of Ontario, Canada.</p>
        </Section>

        <Section title="Contact">
          <p>
            <a href="mailto:hello@pickmelabs.com" className="text-primary underline underline-offset-2">hello@pickmelabs.com</a>
          </p>
        </Section>

        <div className="mt-16 pt-6 border-t border-border/60 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
              <circle cx="100" cy="100" r="100" fill="#5C6B55"/>
              <g transform="translate(100,100) scale(0.95) translate(-100,-42)" fill="#FFFFFF" stroke="#5C6B55" strokeWidth="2" strokeLinejoin="round">
                <path d="M100 78 C82 66, 32 52, 6 64 C4 72, 28 84, 60 86 C78 86, 94 82, 100 78Z"/>
                <path d="M100 78 C118 66, 168 52, 194 64 C196 72, 172 84, 140 86 C122 86, 106 82, 100 78Z"/>
                <path d="M100 76 C86 58, 50 24, 36 12 C30 16, 38 38, 56 56 C70 68, 88 76, 100 76Z"/>
                <path d="M100 76 C114 58, 150 24, 164 12 C170 16, 162 38, 144 56 C130 68, 112 76, 100 76Z"/>
                <path d="M100 74 C90 52, 74 18, 68 6 C64 10, 68 32, 78 50 C86 62, 96 72, 100 74Z"/>
                <path d="M100 74 C110 52, 126 18, 132 6 C136 10, 132 32, 122 50 C114 62, 104 72, 100 74Z"/>
                <path d="M100 72 C92 48, 86 16, 88 2 C92 -2, 97 10, 100 2 C103 10, 108 -2, 112 2 C114 16, 108 48, 100 72Z"/>
              </g>
            </svg>
            <span className="font-heading text-sm text-muted-foreground/70">Kora</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/privacy-policy" className="font-body text-[11px] text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
            <span aria-hidden="true" className="font-body text-[11px] text-muted-foreground/40">·</span>
            <Link to="/terms-of-service" className="font-body text-[11px] text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
