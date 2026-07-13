import SiteNav from "@/components/SiteNav";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="font-heading text-xl tracking-tight text-foreground mb-2">{title}</h2>
    <div className="font-body text-sm text-foreground/80 leading-relaxed space-y-2">{children}</div>
  </div>
);

const PrivacyPolicy = () => {
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
      </div>
    </div>
  );
};

export default PrivacyPolicy;
