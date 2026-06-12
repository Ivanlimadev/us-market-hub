import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Stock Market ROI',
  description: 'Privacy Policy — LGPD, GDPR and CCPA compliance for Stock Market ROI.',
}

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-3 scroll-mt-20">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 py-12 space-y-10">

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="text-sm text-zinc-500">Last updated: June 12, 2026</p>
        <p className="text-sm text-zinc-400 leading-relaxed">
          This Privacy Policy describes how <strong className="text-zinc-200">Stock Market ROI</strong>{' '}
          (<strong className="text-zinc-200">stockmarketroi.com</strong>) collects, uses and
          protects information when you use our platform. We comply with the{' '}
          <strong className="text-zinc-200">LGPD (Lei nº 13.709/2018)</strong>,{' '}
          <strong className="text-zinc-200">GDPR (EU Regulation 2016/679)</strong> and the{' '}
          <strong className="text-zinc-200">California Consumer Privacy Act (CCPA)</strong>.
        </p>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-400">
          We do not sell your personal data. We do not store your portfolio or financial data on our servers.
        </div>
      </div>

      {/* ── 1. Controller ───────────────────────────────────────────────── */}
      <Section id="controller" title="1. Data Controller">
        <p>The controller responsible for processing your personal data is:</p>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-1">
          <p><span className="text-zinc-300 font-medium">Name:</span> Ivan Lima</p>
          <p><span className="text-zinc-300 font-medium">Email:</span>{' '}
            <a href="mailto:contato@ivanlimadev.com" className="text-emerald-400 hover:text-emerald-300">
              contato@ivanlimadev.com
            </a>
          </p>
          <p><span className="text-zinc-300 font-medium">Site:</span> stockmarketroi.com</p>
        </div>
      </Section>

      {/* ── 2. Data Collected ───────────────────────────────────────────── */}
      <Section id="data-collected" title="2. Data We Collect">
        <p>We collect the minimum data necessary to provide our service:</p>
        <div className="space-y-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-2">
            <p className="font-medium text-zinc-200">2.1 Automatically collected (server side)</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-500">
              <li>IP address (anonymized — last octet zeroed — for security and abuse prevention)</li>
              <li>Browser type and version (User-Agent header)</li>
              <li>Pages visited and HTTP status codes (aggregate, non-personal access logs)</li>
              <li>Referrer URL</li>
            </ul>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-2">
            <p className="font-medium text-zinc-200">2.2 Stored locally in your browser only</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-500">
              <li>Portfolio holdings and transactions (<code className="font-mono text-xs">localStorage</code> — never transmitted to us)</li>
              <li>Cookie consent preference</li>
              <li>UI preferences (selected period, watchlist)</li>
            </ul>
            <p className="text-xs text-zinc-600 mt-1">
              This data never leaves your device. Clear it any time via browser settings → Clear site data.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-2">
            <p className="font-medium text-zinc-200">2.3 Data we do NOT collect</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-500">
              <li>Name, email or any registration/account information</li>
              <li>Payment or financial account credentials</li>
              <li>Portfolio or investment data (stays in your browser only)</li>
              <li>Precise geolocation</li>
              <li>Biometric data</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* ── 3. Cookies ──────────────────────────────────────────────────── */}
      <Section id="cookies" title="3. Cookies and Local Storage">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-zinc-400 border-collapse">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-2 pr-4 text-zinc-300 font-semibold">Key</th>
                <th className="text-left py-2 pr-4 text-zinc-300 font-semibold">Type</th>
                <th className="text-left py-2 text-zinc-300 font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              <tr>
                <td className="py-2 pr-4 font-mono">smroi-cookie-consent</td>
                <td className="py-2 pr-4">Essential</td>
                <td className="py-2">Stores your cookie consent choice. No expiry.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono">portfolio-* (localStorage)</td>
                <td className="py-2 pr-4">Functional</td>
                <td className="py-2">Saves portfolio data in your browser only. Never sent to us.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Withdraw consent at any time by clearing your browser local storage or choosing
          &quot;Essential only&quot; in the cookie banner. No third-party tracking cookies are used.
        </p>
      </Section>

      {/* ── 4. Legal Basis ──────────────────────────────────────────────── */}
      <Section id="purpose" title="4. Purpose and Legal Basis">
        <div className="space-y-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-1">
            <p className="font-medium text-zinc-200">Legitimate Interest — LGPD Art. 7, IX / GDPR Art. 6(1)(f)</p>
            <p className="text-zinc-500">Operating the platform, providing market data, preventing abuse and fraud, maintaining security logs.</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-1">
            <p className="font-medium text-zinc-200">Consent — LGPD Art. 7, I / GDPR Art. 6(1)(a)</p>
            <p className="text-zinc-500">Non-essential cookies and analytics, only when explicitly accepted via the cookie banner. Freely withdrawable at any time.</p>
          </div>
        </div>
      </Section>

      {/* ── 5. Sharing ──────────────────────────────────────────────────── */}
      <Section id="sharing" title="5. Data Sharing — We Do Not Sell Your Data">
        <p>
          We do not sell, rent, trade or share your personal data with third parties
          for their own commercial purposes. Data may be disclosed only:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-zinc-500">
          <li>When required by a valid court order, law or government authority</li>
          <li>To protect the rights, property or safety of our users or the public</li>
          <li>In the event of a business transfer (merger, acquisition) — you will be notified</li>
        </ul>
        <p>
          Market data is fetched from Yahoo Finance and Marketstack via server-side API
          calls. These requests include no personal identifiers from your session.
        </p>
      </Section>

      {/* ── 6. Retention ────────────────────────────────────────────────── */}
      <Section id="retention" title="6. Data Retention">
        <p>
          Server access logs are retained for a maximum of{' '}
          <strong className="text-zinc-200">90 days</strong>, after which they are
          permanently deleted. Browser-stored data (localStorage) is retained until you
          clear it — we have no access to it and cannot delete it on your behalf.
        </p>
      </Section>

      {/* ── 7. Security + Breach ────────────────────────────────────────── */}
      <Section id="security" title="7. Security and Data Breach">
        <p>
          We implement technical and organizational measures including HTTPS encryption,
          server hardening and access controls to protect server-side data.
        </p>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-2">
          <p className="font-medium text-zinc-200">Breach limitation — why your financial data is safe</p>
          <p className="text-zinc-500">
            Because we do not collect, transmit or store portfolio holdings, investment
            positions, brokerage credentials or any financial data on our servers, a
            breach of our infrastructure <strong className="text-zinc-300">cannot expose
            your financial data</strong>. The only server-side data that could be exposed
            in a hypothetical breach is anonymized access logs (no names, no financial data).
          </p>
        </div>
        <p>
          In the event of a data breach involving personal data, we will notify affected
          users and the relevant data protection authority within the timeframe required
          by applicable law (LGPD Art. 48 — 72 hours to ANPD; GDPR Art. 33 — 72 hours to supervisory authority).
        </p>
      </Section>

      {/* ── 8. LGPD ─────────────────────────────────────────────────────── */}
      <Section id="lgpd" title="8. Your Rights Under LGPD — Lei nº 13.709/2018 (Brazil)">
        <p>As a data subject under LGPD Art. 18, you have the right to:</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ['Confirmation',     'Know whether we process your personal data.'],
            ['Access',           'Obtain a copy of personal data we hold about you.'],
            ['Correction',       'Request correction of inaccurate or incomplete data.'],
            ['Anonymization',    'Request anonymization, blocking or deletion of unnecessary data.'],
            ['Portability',      'Receive your data in a structured, machine-readable format.'],
            ['Deletion',         'Request deletion of data processed with your consent.'],
            ['Objection',        'Object to processing based on legitimate interest.'],
            ['Withdraw Consent', 'Withdraw consent at any time for consent-based processing.'],
          ].map(([right, desc]) => (
            <div key={right} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 space-y-1">
              <p className="text-xs font-semibold text-zinc-200">{right}</p>
              <p className="text-xs text-zinc-500">{desc}</p>
            </div>
          ))}
        </div>
        <p>
          Contact us at{' '}
          <a href="mailto:contato@ivanlimadev.com" className="text-emerald-400 hover:text-emerald-300">
            contato@ivanlimadev.com
          </a>. We will respond within <strong className="text-zinc-200">15 business days</strong>.
          You may also file a complaint with the{' '}
          <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">
            ANPD — Autoridade Nacional de Proteção de Dados
          </a>.
        </p>
      </Section>

      {/* ── 9. GDPR ─────────────────────────────────────────────────────── */}
      <Section id="gdpr" title="9. Rights Under GDPR — EU Regulation 2016/679 (European Users)">
        <p>
          If you are located in the European Economic Area (EEA), you have additional
          rights under the General Data Protection Regulation (GDPR):
        </p>
        <ul className="list-disc pl-5 space-y-1 text-zinc-500">
          <li><strong className="text-zinc-300">Right of access</strong> — obtain a copy of personal data we hold (Art. 15)</li>
          <li><strong className="text-zinc-300">Right to rectification</strong> — correct inaccurate data (Art. 16)</li>
          <li><strong className="text-zinc-300">Right to erasure (&quot;right to be forgotten&quot;)</strong> — request deletion (Art. 17)</li>
          <li><strong className="text-zinc-300">Right to restriction of processing</strong> — limit how we use your data (Art. 18)</li>
          <li><strong className="text-zinc-300">Right to data portability</strong> — receive data in a portable format (Art. 20)</li>
          <li><strong className="text-zinc-300">Right to object</strong> — object to processing based on legitimate interest (Art. 21)</li>
          <li><strong className="text-zinc-300">Rights related to automated decision-making</strong> — we do not use automated decision-making</li>
        </ul>
        <p>
          You may lodge a complaint with your local EU data protection supervisory authority.
          A list of authorities is available at{' '}
          <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">
            edpb.europa.eu
          </a>.
        </p>
      </Section>

      {/* ── 10. CCPA ────────────────────────────────────────────────────── */}
      <Section id="ccpa" title="10. California Consumer Privacy Act (CCPA) — California Residents">
        <p>
          If you are a California resident, the{' '}
          <strong className="text-zinc-200">California Consumer Privacy Act (CCPA)</strong>{' '}
          and the{' '}
          <strong className="text-zinc-200">California Privacy Rights Act (CPRA)</strong>{' '}
          grant you the following rights:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-zinc-500">
          <li><strong className="text-zinc-300">Right to Know</strong> — know what personal information we collect, use, disclose or sell</li>
          <li><strong className="text-zinc-300">Right to Delete</strong> — request deletion of personal information we have collected</li>
          <li><strong className="text-zinc-300">Right to Correct</strong> — request correction of inaccurate personal information</li>
          <li><strong className="text-zinc-300">Right to Opt-Out of Sale</strong> — we do not sell personal information; no opt-out required</li>
          <li><strong className="text-zinc-300">Right to Non-Discrimination</strong> — we will not discriminate against you for exercising your rights</li>
          <li><strong className="text-zinc-300">Right to Limit Use of Sensitive Personal Information</strong> — we do not collect sensitive personal information as defined by CCPA</li>
        </ul>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          <p className="text-xs text-zinc-500">
            <strong className="text-zinc-300">Do Not Sell or Share My Personal Information:</strong> We do not sell or share personal information
            with third parties for cross-context behavioral advertising. No opt-out mechanism is
            required because this practice does not occur.
          </p>
        </div>
        <p>
          To exercise your CCPA rights, email{' '}
          <a href="mailto:contato@ivanlimadev.com" className="text-emerald-400 hover:text-emerald-300">
            contato@ivanlimadev.com
          </a>{' '}
          with the subject line &quot;CCPA Request&quot;. We will respond within{' '}
          <strong className="text-zinc-200">45 days</strong> as required by law.
        </p>
      </Section>

      {/* ── 11. Children ────────────────────────────────────────────────── */}
      <Section id="minors" title="11. Children and Minors">
        <p>
          This platform is not directed at children under 16 years of age (or 13 in
          jurisdictions where 13 is the minimum age). We do not knowingly collect
          personal data from minors. If you believe a minor has accessed this platform,
          please contact us immediately and we will take appropriate action.
        </p>
      </Section>

      {/* ── 12. International Transfers ─────────────────────────────────── */}
      <Section id="international" title="12. International Data Transfers">
        <p>
          Our servers may be hosted outside Brazil or the EU. For transfers outside
          Brazil, we apply the safeguards required by LGPD Art. 33. For transfers
          outside the EEA, we rely on Standard Contractual Clauses (SCCs) or other
          approved mechanisms under GDPR Chapter V. Only minimal server log data is
          ever transferred — no financial or portfolio data.
        </p>
      </Section>

      {/* ── 13. Changes ─────────────────────────────────────────────────── */}
      <Section id="changes" title="13. Changes to This Policy">
        <p>
          We may update this Privacy Policy periodically. The date of the last revision
          is shown at the top. Continued use of the platform after changes constitutes
          acceptance. For material changes, we will display a notice on the platform.
        </p>
      </Section>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
        Questions about this policy?{' '}
        <a href="mailto:contato@ivanlimadev.com" className="text-emerald-400 hover:text-emerald-300">
          contato@ivanlimadev.com
        </a>
        {' '}· See also our{' '}
        <Link href="/terms" className="text-emerald-400 hover:text-emerald-300">Terms of Use</Link>.
      </div>
    </div>
  )
}
