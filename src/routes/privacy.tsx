import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Socialcraft" },
      {
        name: "description",
        content:
          "How Socialcraft processes account data and social media content when publishing on your behalf.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

const OPERATOR = "UCL Legacy";
const IMPRINT_URL = "https://ucllegacy.com/imprint";
const CONTACT_EMAIL = "support@ucllegacy.com";
const LAST_UPDATED = "8 September 2026";

function PrivacyPolicyPage() {
  return (
    <LegalShell title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p>
        This Privacy Policy explains how <strong>{OPERATOR}</strong> ("we", "us") processes personal
        data in connection with <strong>Socialcraft</strong> (the "Service"), a tool that creates and
        schedules social media content and publishes it to the social accounts you connect. The party
        responsible for processing and its full contact details are listed in our{" "}
        <a href={IMPRINT_URL} target="_blank" rel="noreferrer">
          imprint
        </a>
        .
      </p>

      <h2>1. What data we process</h2>
      <ul>
        <li>
          <strong>Account &amp; profile data:</strong> the email address and display name you use to
          sign in, and your workspace / brand profile settings.
        </li>
        <li>
          <strong>Connected social accounts:</strong> when you link a social account we store the
          account identifier, username, profile picture URL and the OAuth access / refresh tokens
          needed to publish on your behalf. Linking and token storage are handled by our publishing
          processor, <strong>Post for Me</strong> (see section 4).
        </li>
        <li>
          <strong>Content you create:</strong> captions, hashtags, titles, uploaded or generated
          images and videos, scheduling times and per-platform options (e.g. TikTok privacy level,
          Pinterest board, Instagram placement).
        </li>
        <li>
          <strong>Publishing results &amp; analytics:</strong> the status of each publish attempt and,
          where you request it, engagement metrics (views, likes, comments, reach) returned by the
          platform for posts on your connected accounts.
        </li>
        <li>
          <strong>Technical data:</strong> standard server logs (IP address, timestamp, user agent)
          for security and troubleshooting.
        </li>
      </ul>

      <h2>2. Why we process it and on what legal basis</h2>
      <ul>
        <li>
          <strong>To provide the Service</strong> — creating, scheduling and publishing your content
          and showing you the results (performance of a contract, Art. 6(1)(b) GDPR).
        </li>
        <li>
          <strong>To secure and maintain the Service</strong> — logging, abuse prevention, debugging
          (legitimate interest, Art. 6(1)(f) GDPR).
        </li>
        <li>
          <strong>To comply with legal obligations</strong> where applicable (Art. 6(1)(c) GDPR).
        </li>
      </ul>
      <p>We do not sell personal data and we do not use it for advertising or profiling.</p>

      <h2>3. Social platform data (TikTok, Meta, Pinterest, LinkedIn, X, YouTube and others)</h2>
      <p>
        When you connect a platform account, that platform grants Socialcraft (through Post for Me) a
        scoped access token. We use it <em>only</em> to:
      </p>
      <ul>
        <li>publish or schedule the posts you explicitly create in Socialcraft;</li>
        <li>read back the status and, if you ask for it, the public metrics of those posts;</li>
        <li>show your account name and avatar inside the app so you can pick the right target.</li>
      </ul>
      <p>
        We do not read your private messages, we do not post without an explicit action from you, and
        we do not share platform data with any third party other than the processor named below.
        Platform data obtained via their APIs is used in accordance with the respective platform's
        developer terms, including the TikTok Developer Terms of Service and Meta Platform Terms. You
        can revoke access at any time (section 6).
      </p>

      <h2>4. Processors and sub-processors</h2>
      <ul>
        <li>
          <strong>Post for Me</strong> (api.postforme.dev) — performs the OAuth connection, stores the
          access tokens, and executes the publishing and analytics calls to each platform on our
          instruction.
        </li>
        <li>
          <strong>Our hosting and storage providers</strong> — run the application servers and store
          the media you upload for publishing. Uploaded media is retained only as long as needed to
          publish the associated post.
        </li>
      </ul>
      <p>
        Processors act only on our documented instructions under a data processing agreement. Where
        data is transferred outside the EEA, it is protected by an adequacy decision or the EU
        Standard Contractual Clauses.
      </p>

      <h2>5. Retention</h2>
      <ul>
        <li>Connected-account tokens: until you disconnect the account or delete your workspace.</li>
        <li>Content and scheduling data: until you delete it or close your account.</li>
        <li>Uploaded media for publishing: deleted after the post is published, or within 24 hours if unused.</li>
        <li>Server logs: a rolling short retention period, then deleted or anonymised.</li>
      </ul>

      <h2>6. Your choices and rights</h2>
      <ul>
        <li>
          <strong>Disconnect a platform</strong> at any time in the app; this removes the stored token.
          You can also revoke Socialcraft's access from the platform's own settings (e.g. TikTok:
          Settings → Security &amp; permissions → Apps; similar for Meta, Pinterest, LinkedIn, X,
          Google/YouTube).
        </li>
        <li>
          <strong>Access, rectification, erasure, restriction, portability and objection</strong> — you
          may exercise these GDPR rights by contacting us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </li>
        <li>
          <strong>Delete your account</strong> — contact us and we will erase your workspace, content
          and connected-account data, subject to any legal retention duties.
        </li>
        <li>
          <strong>Complaint</strong> — you may lodge a complaint with your local supervisory authority.
        </li>
      </ul>

      <h2>7. Security</h2>
      <p>
        Access tokens and credentials are stored by our processor with encryption in transit and at
        rest. Access to production systems is restricted and logged. No method of transmission or
        storage is completely secure, but we take reasonable measures appropriate to the risk.
      </p>

      <h2>8. Children</h2>
      <p>The Service is not directed to children under 16 and we do not knowingly process their data.</p>

      <h2>9. Changes</h2>
      <p>
        We may update this policy; the "last updated" date above reflects the current version. Material
        changes will be communicated in the app.
      </p>

      <h2>10. Contact</h2>
      <p>
        {OPERATOR} — <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Postal address and legal
        representative:{" "}
        <a href={IMPRINT_URL} target="_blank" rel="noreferrer">
          {IMPRINT_URL}
        </a>
        .
      </p>
    </LegalShell>
  );
}

export function LegalShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Socialcraft
        </Link>
        <h1 className="mt-6 text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        <div className="legal-body mt-8 space-y-4 text-sm leading-relaxed text-foreground/90">
          {children}
        </div>
        <div className="mt-12 flex gap-4 border-t border-border pt-6 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-foreground">
            Terms of Service
          </Link>
          <a href="https://ucllegacy.com/imprint" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Imprint
          </a>
        </div>
      </div>
      <style>{`
        .legal-body h2 { font-size: 1.05rem; font-weight: 700; margin-top: 1.75rem; }
        .legal-body ul { list-style: disc; padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.35rem; }
        .legal-body a { color: var(--color-primary-bright, #ff8038); text-decoration: underline; }
      `}</style>
    </div>
  );
}
