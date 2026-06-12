import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Use — Stock Market ROI',
  description: 'Terms of Use for Stock Market ROI.',
}

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-3 scroll-mt-20">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 py-12 space-y-10">

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Terms of Use</h1>
        <p className="text-sm text-zinc-500">Last updated: June 12, 2026</p>
        <p className="text-sm text-zinc-400 leading-relaxed">
          By accessing or using <strong className="text-zinc-200">Stock Market ROI</strong>{' '}
          (<strong className="text-zinc-200">stockmarketroi.com</strong>), you agree to be bound
          by these Terms of Use. If you do not agree, please do not use the platform.
        </p>
      </div>

      <Section id="service" title="1. Description of Service">
        <p>
          Stock Market ROI is a free, web-based platform that aggregates and displays
          publicly available financial market data, including real-time stock quotes,
          historical prices, earnings calendars, dividend information, market screeners
          and portfolio tracking tools.
        </p>
        <p>
          The service is provided &quot;as is&quot; at no charge. We reserve the right to
          modify, suspend or discontinue any feature at any time without prior notice.
        </p>
      </Section>

      <Section id="no-advice" title="2. No Financial, Investment or Legal Advice">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
          <p className="font-semibold text-amber-400">⚠ Important Disclaimer</p>
          <p className="text-zinc-400">
            All content on this platform — including quotes, charts, analysis tools,
            portfolio calculations and market data — is provided for <strong className="text-zinc-200">
            informational and educational purposes only</strong>. It does not constitute
            and must not be interpreted as financial, investment, tax or legal advice.
          </p>
          <p className="text-zinc-400">
            Past performance does not guarantee future results. Financial markets involve
            risk and you may lose some or all of your invested capital. Always consult a
            qualified and licensed financial advisor before making any investment decision.
          </p>
        </div>
      </Section>

      <Section id="data-accuracy" title="3. Data Accuracy and Availability">
        <p>
          Market data is sourced from third-party providers (Yahoo Finance, Marketstack)
          and may be delayed, incomplete or inaccurate. We make no representations or
          warranties regarding the accuracy, completeness, timeliness or reliability of
          any data displayed on this platform.
        </p>
        <p>
          We are not responsible for any actions taken — or not taken — based on
          information provided by this platform.
        </p>
      </Section>

      <Section id="acceptable-use" title="4. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1 text-zinc-500">
          <li>Use the platform for any unlawful or fraudulent purpose</li>
          <li>Scrape, crawl or systematically extract data without prior written permission</li>
          <li>Attempt to gain unauthorized access to our systems or infrastructure</li>
          <li>Transmit malicious code, viruses or any harmful software</li>
          <li>Impersonate any person or entity or misrepresent your affiliation</li>
          <li>Use the platform in any way that could damage, disable or impair our services</li>
          <li>Redistribute, resell or sublicense our data to third parties</li>
        </ul>
        <p>
          We reserve the right to block access to any user who violates these terms,
          at our sole discretion and without notice.
        </p>
      </Section>

      <Section id="intellectual-property" title="5. Intellectual Property">
        <p>
          All design, code, layout, logos, text and other content created by Stock Market ROI
          are the intellectual property of Stock Market ROI and may not be reproduced,
          distributed or used without express written permission.
        </p>
        <p>
          Market data, company names, ticker symbols and logos are the property of
          their respective owners and are used solely to provide market information.
        </p>
      </Section>

      <Section id="portfolio" title="6. Portfolio Tracker">
        <p>
          The portfolio tracker stores all data exclusively in your browser&apos;s local
          storage. We do not have access to, and are not responsible for, the accuracy
          of your portfolio entries. Portfolio calculations are for illustrative purposes
          only and do not reflect real brokerage account balances.
        </p>
        <p>
          We are not liable for any losses resulting from discrepancies between portfolio
          tool calculations and your actual investment positions.
        </p>
      </Section>

      <Section id="liability" title="7. Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, Stock Market ROI and its
          owners, developers and affiliates shall not be liable for any direct, indirect,
          incidental, consequential or punitive damages arising from your use of — or
          inability to use — this platform, including but not limited to financial losses,
          data loss or business interruption.
        </p>
      </Section>

      <Section id="third-party" title="8. Third-Party Services">
        <p>
          This platform relies on third-party data providers (Yahoo Finance, Marketstack)
          subject to their own terms of service. We are not affiliated with or endorsed
          by these providers. Links to external sites are provided for convenience; we
          do not control and are not responsible for their content or practices.
        </p>
      </Section>

      <Section id="privacy" title="9. Privacy">
        <p>
          Your use of this platform is also governed by our{' '}
          <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300">
            Privacy Policy
          </Link>
          , which is incorporated by reference into these Terms of Use.
        </p>
      </Section>

      <Section id="governing-law" title="10. Governing Law">
        <p>
          These Terms of Use are governed by the laws of the Federative Republic of
          Brazil. Any disputes shall be submitted to the exclusive jurisdiction of the
          courts of Brazil, in compliance with the Brazilian Consumer Protection Code
          (CDC — Lei nº 8.078/1990) and the LGPD (Lei nº 13.709/2018) where applicable.
        </p>
      </Section>

      <Section id="changes" title="11. Changes to These Terms">
        <p>
          We reserve the right to update these Terms at any time. The revision date is
          shown at the top of this page. Continued use of the platform following any
          changes constitutes your acceptance of the updated terms.
        </p>
      </Section>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
        Questions about these terms?{' '}
        <a href="mailto:contato@ivanlimadev.com" className="text-emerald-400 hover:text-emerald-300">
          contato@ivanlimadev.com
        </a>
        {' '}· See also our{' '}
        <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300">Privacy Policy</Link>.
      </div>
    </div>
  )
}
