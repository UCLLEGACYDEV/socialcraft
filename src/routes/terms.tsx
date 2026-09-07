import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "./privacy";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Socialcraft" },
      {
        name: "description",
        content: "The terms that govern your use of Socialcraft.",
      },
    ],
  }),
  component: TermsPage,
});

const OPERATOR = "UCL Legacy";
const IMPRINT_URL = "https://ucllegacy.com/imprint";
const CONTACT_EMAIL = "support@ucllegacy.com";
const LAST_UPDATED = "8 September 2026";

function TermsPage() {
  return (
    <LegalShell title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <p>
        These Terms of Service ("Terms") govern your use of <strong>Socialcraft</strong> (the
        "Service"), operated by <strong>{OPERATOR}</strong>. By creating an account or using the
        Service you agree to these Terms. Operator details are in our{" "}
        <a href={IMPRINT_URL} target="_blank" rel="noreferrer">
          imprint
        </a>
        .
      </p>

      <h2>1. The Service</h2>
      <p>
        Socialcraft lets you create, schedule and publish social media content to social accounts you
        connect (including TikTok, Instagram, Facebook, Pinterest, LinkedIn, X, YouTube, Threads and
        Bluesky). Publishing is carried out through our processor Post for Me. Availability of any
        given platform depends on that platform's API and may change.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You must provide accurate information and keep your credentials secure.</li>
        <li>You are responsible for all activity under your account.</li>
        <li>You must be at least 16 years old and legally able to enter into these Terms.</li>
      </ul>

      <h2>3. Connected platform accounts</h2>
      <ul>
        <li>
          You may only connect accounts you own or are authorised to manage. You grant Socialcraft
          permission to publish and to read post status and metrics on those accounts on your behalf.
        </li>
        <li>
          Your use of each platform through Socialcraft is also subject to that platform's own terms
          and policies, including the{" "}
          <a href="https://www.tiktok.com/legal/page/global/terms-of-service/en" target="_blank" rel="noreferrer">
            TikTok Terms of Service
          </a>
          , TikTok's Community Guidelines, and the equivalent terms of Meta, Pinterest, LinkedIn, X,
          Google/YouTube and others. You must comply with them.
        </li>
        <li>
          You can disconnect an account at any time, which revokes Socialcraft's stored access token.
        </li>
      </ul>

      <h2>4. Your content</h2>
      <ul>
        <li>
          You retain ownership of the content you create. You grant us the limited rights needed to
          store, process and transmit it to the platforms you choose, for as long as needed to provide
          the Service.
        </li>
        <li>
          You are solely responsible for your content and confirm you hold all necessary rights and
          consents (including for any people, trademarks or music featured).
        </li>
        <li>
          You must not use the Service to publish content that is unlawful, infringing, deceptive,
          hateful, sexually exploitative, or that violates a platform's rules, and you must not use it
          for spam, bulk unsolicited posting, or automated engagement manipulation.
        </li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>You must not:</p>
      <ul>
        <li>attempt to circumvent platform rate limits, review requirements or security controls;</li>
        <li>reverse engineer, resell or provide the Service to third parties except as permitted;</li>
        <li>interfere with the Service's operation or other users' use of it.</li>
      </ul>

      <h2>6. AI-generated content</h2>
      <p>
        The Service can generate images, video and text with AI. You are responsible for reviewing AI
        output before publishing and for disclosing AI-generated or AI-assisted content where a
        platform requires it (Socialcraft provides the relevant toggles, e.g. TikTok's AI-generated
        content flag).
      </p>

      <h2>7. Availability and changes</h2>
      <p>
        We aim for high availability but do not guarantee uninterrupted service. We may modify or
        discontinue features, and may update these Terms; continued use after changes take effect
        constitutes acceptance.
      </p>

      <h2>8. Termination</h2>
      <p>
        You may stop using the Service and delete your account at any time. We may suspend or
        terminate access for breach of these Terms or platform policies, or where required by law.
      </p>

      <h2>9. Disclaimers and liability</h2>
      <p>
        The Service is provided "as is". To the extent permitted by law, we exclude implied
        warranties and are not liable for indirect or consequential damages, or for platform actions
        affecting your accounts (e.g. content rejection, rate limiting, account restrictions). Nothing
        in these Terms limits liability that cannot be limited by law.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These Terms are governed by the law of the operator's registered seat as stated in the
        imprint, without prejudice to mandatory consumer protections in your country of residence.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalShell>
  );
}
