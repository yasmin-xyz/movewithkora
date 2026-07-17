import { useEffect } from "react";
import { Link } from "react-router-dom";
import SiteNav from "@/components/SiteNav";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="font-heading text-xl tracking-tight text-foreground mb-2">{title}</h2>
    <div className="font-body text-sm text-foreground/80 leading-relaxed space-y-2">{children}</div>
  </div>
);

const PrivacyPolicy = () => {
  // Client-side navigation doesn't reset scroll position the way a normal
  // page load does — same fix already used in Index.tsx.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-16">
        <h1 className="font-heading text-3xl tracking-tight text-foreground mb-1">Privacy Policy</h1>
        <p className="font-body text-xs text-muted-foreground mb-10">Last updated July 13, 2026</p>

        <Section title="Who operates Kora">
          <p>
            Kora (movewithkora.vercel.app) is operated by PickMeLabs, a sole proprietorship based in
            Ontario, Canada. Throughout this policy, "we," "us," and "our" refer to PickMeLabs. If you
            have questions about this policy or your data, contact us at{" "}
            <a href="mailto:hello@pickmelabs.com" className="text-primary underline underline-offset-2">
              hello@pickmelabs.com
            </a>.
          </p>
        </Section>

        <Section title="What we collect">
          <p>We keep this deliberately minimal. Here's everything Kora collects:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Your email address</strong>, if you sign in — Kora uses passwordless magic-link
              authentication, so we never see or store a password.
            </li>
            <li>
              <strong>Class plans you save</strong> — peak pose, class length, skill level, yoga style,
              theme/inspiration, and the generated class content — tied to your account so you can
              return to them later.
            </li>
            <li>
              <strong>Feedback you submit</strong> through the Feedback page, including an email address
              only if you choose to provide one.
            </li>
            <li>
              <strong>Basic technical data</strong> (like your general region, via your IP address)
              that's inherent to how the web works and how our hosting provider (Vercel) and database
              provider (Supabase) operate.
            </li>
          </ul>
          <p>We do not collect payment information — Kora doesn't currently have any paid features.</p>
        </Section>

        <Section title="Product analytics">
          <p>
            We use, or plan to use, PostHog — a product analytics tool — to understand in aggregate how
            people use Kora (e.g. which pages get visited, which features get used) so we can improve
            it. This is analytics, not advertising: we do not run ad campaigns, retargeting, or
            behavioral advertising of any kind, and we do not sell or share your data with advertisers.
          </p>
        </Section>

        <Section title="Shared class links">
          <p>
            If you use the "Share" feature, a copy of that specific class plan becomes viewable by
            anyone who has the link — no login required on their end. Please be thoughtful about what
            you type into fields like the class theme/inspiration before sharing, since that text
            becomes part of the shared page. Currently, once a class is shared, there is no way to
            revoke or unshare that specific link — if you need a link taken down, contact us at{" "}
            <a href="mailto:hello@pickmelabs.com" className="text-primary underline underline-offset-2">
              hello@pickmelabs.com
            </a>{" "}
            and we'll remove it manually.
          </p>
        </Section>

        <Section title="How we use what we collect">
          <p>
            To run the core features of Kora: generating class plans, saving them to your account,
            letting you export or share them, and responding to feedback you send us. We do not use your
            data to train third-party AI models, and we do not sell your personal information to anyone,
            for any purpose.
          </p>
        </Section>

        <Section title="Who else sees your data">
          <p>
            Kora is built on a small set of infrastructure providers who process data on our behalf in
            order for the app to function at all:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> — our database, authentication, and file storage provider.</li>
            <li><strong>Vercel</strong> — our hosting provider.</li>
            <li>
              An AI provider, accessed through Lovable's AI gateway — used only to generate the text of
              your class plan based on the parameters you provide (peak pose, length, style, etc.). We
              do not send your account email or saved-class history to this provider — only the
              parameters for the specific class being generated in that moment.
            </li>
          </ul>
          <p>We do not otherwise share your personal information with third parties.</p>
        </Section>

        <Section title="Data retention and deletion">
          <p>
            Your saved classes remain in our database until you delete them or your account. If you'd
            like your account and associated data deleted, email{" "}
            <a href="mailto:hello@pickmelabs.com" className="text-primary underline underline-offset-2">
              hello@pickmelabs.com
            </a>{" "}
            and we'll process the request. Note that a class you previously shared via a public link may
            have already been viewed or saved by others before deletion, and we can't retract copies made
            outside our systems.
          </p>
        </Section>

        <Section title="Children's privacy">
          <p>
            Kora is intended for yoga instructors and is not directed at children. We do not knowingly
            collect personal information from anyone under the age of 13.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we make material changes to this policy, we'll update the date at the top of this page.
            Continuing to use Kora after changes are posted means you accept the updated policy.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions, concerns, or data requests: <a href="mailto:hello@pickmelabs.com" className="text-primary underline underline-offset-2">hello@pickmelabs.com</a>.
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

export default PrivacyPolicy;
