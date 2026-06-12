import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Stock Market ROI',
  description: 'Privacy Policy and LGPD compliance information for Stock Market ROI.',
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
          protects information when you use our platform. We are committed to full compliance
          with the <strong className="text-zinc-200">Lei Geral de Proteção de Dados — LGPD (Lei nº 13.709/2018)</strong>.
        </p>
      </div>

      <Section id="controller" title="1. Data Controller">
        <p>
          The controller responsible for processing your personal data is:
        </p>
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

      <Section id="data-collected" title="2. Data We Collect">
        <p>We collect the minimum data necessary to provide our service:</p>
        <div className="space-y-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-2">
            <p className="font-medium text-zinc-200">2.1 Automatically collected data</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-500">
              <li>IP address (anonymized for security and abuse prevention)</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent (aggregate analytics only)</li>
              <li>Referrer URL</li>
            </ul>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-2">
            <p className="font-medium text-zinc-200">2.2 Data stored locally in your browser</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-500">
              <li>Portfolio holdings and transactions (localStorage — never sent to our servers)</li>
              <li>Cookie consent preference</li>
              <li>UI preferences (theme, selected period, watchlist)</li>
            </ul>
            <p className="text-xs text-zinc-600 mt-2">
              This data never leaves your device and is under your full control.
              You can clear it at any time via your browser settings.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-2">
            <p className="font-medium text-zinc-200">2.3 Data we do NOT collect</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-500">
              <li>Name, email address or any registration data</li>
              <li>Payment or financial account information</li>
              <li>Real investment portfolio data (stored only in your browser)</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section id="cookies" title="3. Cookies">
        <p>We use strictly necessary cookies and, with your consent, functional cookies:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-zinc-400 border-collapse">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-2 pr-4 text-zinc-300 font-semibold">Cookie</th>
                <th className="text-left py-2 pr-4 text-zinc-300 font-semibold">Type</th>
                <th className="text-left py-2 text-zinc-300 font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              <tr>
                <td className="py-2 pr-4 font-mono">smroi-cookie-consent</td>
                <td className="py-2 pr-4">Essential</td>
                <td className="py-2">Stores your cookie consent choice</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono">portfolio (localStorage)</td>
                <td className="py-2 pr-4">Functional</td>
                <td className="py-2">Saves your portfolio locally in your browser</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          You can withdraw consent at any time by clearing your browser&apos;s local storage
          or by using the &quot;Essential only&quot; option in the cookie banner.
        </p>
      </Section>

      <Section id="purpose" title="4. Purpose and Legal Basis (LGPD Art. 7)">
        <div className="space-y-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-1">
            <p className="font-medium text-zinc-200">Legitimate Interest (Art. 7, IX)</p>
            <p className="text-zinc-500">Providing real-time market data, operating the platform, preventing abuse and fraud.</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-1">
            <p className="font-medium text-zinc-200">Consent (Art. 7, I)</p>
            <p className="text-zinc-500">Non-essential cookies and analytics, only when explicitly accepted via the cookie banner.</p>
          </div>
        </div>
      </Section>

      <Section id="sharing" title="5. Data Sharing and Third Parties">
        <p>
          We do not sell, rent or trade your personal data to third parties.
          Data may be shared only in the following cases:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-zinc-500">
          <li>When required by law, court order or government authority</li>
          <li>To protect the rights, property or safety of our users or the public</li>
        </ul>
        <p className="text-zinc-500">
          Market data is retrieved from Yahoo Finance and Marketstack via server-side API
          calls. These requests do not transmit your personal data.
        </p>
      </Section>

      <Section id="retention" title="6. Data Retention">
        <p>
          Server access logs are retained for a maximum of <strong className="text-zinc-200">90 days</strong>,
          after which they are permanently deleted. Data stored in your browser (localStorage) is
          retained until you manually clear it. We have no control over and no access to this
          locally stored data.
        </p>
      </Section>

      <Section id="security" title="7. Security">
        <p>
          We adopt technical and organizational measures to protect data against unauthorized
          access, alteration, disclosure or destruction, including HTTPS encryption for all
          communications.
        </p>
      </Section>

      <Section id="lgpd" title="8. Your Rights Under LGPD (Art. 18)">
        <p>
          As a data subject under Brazilian Law nº 13.709/2018 (LGPD), you have the
          following rights:
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ['Confirmation',    'Know whether we process your personal data.'],
            ['Access',          'Obtain a copy of the personal data we hold about you.'],
            ['Correction',      'Request correction of incomplete or inaccurate data.'],
            ['Anonymization',   'Request anonymization, blocking or deletion of unnecessary data.'],
            ['Portability',     'Receive your data in a structured, machine-readable format.'],
            ['Deletion',        'Request deletion of data processed with your consent.'],
            ['Objection',       'Object to processing based on legitimate interest.'],
            ['Withdraw Consent','Withdraw consent at any time for consent-based processing.'],
          ].map(([right, desc]) => (
            <div key={right} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 space-y-1">
              <p className="text-xs font-semibold text-zinc-200">{right}</p>
              <p className="text-xs text-zinc-500">{desc}</p>
            </div>
          ))}
        </div>
        <p>
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:contato@ivanlimadev.com" className="text-emerald-400 hover:text-emerald-300">
            contato@ivanlimadev.com
          </a>. We will respond within <strong className="text-zinc-200">15 business days</strong>.
        </p>
        <p className="text-xs text-zinc-600">
          You also have the right to file a complaint with the Autoridade Nacional de Proteção
          de Dados — ANPD (<a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-400">gov.br/anpd</a>).
        </p>
      </Section>

      <Section id="minors" title="9. Children and Minors">
        <p>
          This platform is not directed at children under 18 years of age. We do not
          knowingly collect personal data from minors. If you believe a minor has provided
          us with personal data, please contact us immediately.
        </p>
      </Section>

      <Section id="international" title="10. International Data Transfers">
        <p>
          Our servers may be located outside Brazil. In such cases, we ensure that appropriate
          safeguards are in place in accordance with LGPD Art. 33, including contractual
          clauses that guarantee a level of protection equivalent to that provided by the LGPD.
        </p>
      </Section>

      <Section id="changes" title="11. Changes to This Policy">
        <p>
          We may update this Privacy Policy periodically. The date of the last revision is
          shown at the top of this page. Continued use of the platform after changes
          constitutes acceptance of the updated policy.
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
