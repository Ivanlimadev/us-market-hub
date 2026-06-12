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
          by these Terms of Use in their entirety. If you do not agree, do not use this platform.
        </p>
      </div>

      {/* ── 1. Service ──────────────────────────────────────────────────── */}
      <Section id="service" title="1. Description of Service">
        <p>
          Stock Market ROI is a free, web-based platform that aggregates and displays
          publicly available financial market data, including real-time stock quotes,
          historical prices, earnings calendars, dividend information, market screeners
          and a client-side portfolio tracking tool.
        </p>
        <p>
          The service is provided at no charge. We reserve the right to modify, suspend
          or discontinue any feature at any time without prior notice or liability.
        </p>
      </Section>

      {/* ── 2. No Advice ────────────────────────────────────────────────── */}
      <Section id="no-advice" title="2. No Financial, Investment or Legal Advice — SEC / FINRA Notice">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
          <p className="font-semibold text-amber-400">⚠ Important — Read Carefully</p>
          <p>
            <strong className="text-zinc-200">Stock Market ROI is not registered as an
            investment adviser, broker-dealer, financial planner or any other financial
            professional</strong> with the U.S. Securities and Exchange Commission (SEC),
            the Financial Industry Regulatory Authority (FINRA), or any state or foreign
            securities regulator.
          </p>
          <p>
            All content on this platform — including but not limited to stock quotes,
            charts, screener results, rankings, portfolio calculations, earnings data and
            market commentary — is provided for <strong className="text-zinc-200">
            informational and educational purposes only</strong>. Nothing on this platform
            constitutes, or should be interpreted as, a recommendation, solicitation or
            offer to buy or sell any security, financial instrument or investment product.
          </p>
          <p>
            Past performance of any security or market does not guarantee future results.
            Investing in financial markets involves significant risk, including the
            possible loss of all capital invested. Always consult a qualified, licensed
            financial advisor before making any investment decision.
          </p>
        </div>
      </Section>

      {/* ── 3. Data Accuracy ────────────────────────────────────────────── */}
      <Section id="data-accuracy" title="3. Data Accuracy and Availability">
        <p>
          Market data is sourced from third-party providers (Yahoo Finance, Marketstack)
          and may be delayed, incomplete, inaccurate or unavailable. We make{' '}
          <strong className="text-zinc-200">no representations or warranties</strong> —
          express or implied — regarding the accuracy, completeness, timeliness,
          reliability or fitness for any purpose of any data displayed on this platform.
        </p>
        <p>
          We are not responsible for any actions taken or omitted based on information
          provided by this platform, nor for any losses, damages or costs arising therefrom.
        </p>
      </Section>

      {/* ── 4. AS IS Warranty Disclaimer ────────────────────────────────── */}
      <Section id="warranty" title="4. Disclaimer of Warranties — &quot;AS IS&quot;">
        <p>
          THE PLATFORM AND ALL ITS CONTENT ARE PROVIDED{' '}
          <strong className="text-zinc-200">&quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;</strong>{' '}
          WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT
          LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
          PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY OR SYSTEM INTEGRATION.
        </p>
        <p>
          We do not warrant that: (a) the platform will be uninterrupted, error-free
          or free of viruses; (b) defects will be corrected; (c) data will be accurate
          or up to date; or (d) results obtained from use of the platform will be reliable.
          You use the platform entirely at your own risk.
        </p>
      </Section>

      {/* ── 5. Acceptable Use ───────────────────────────────────────────── */}
      <Section id="acceptable-use" title="5. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1 text-zinc-500">
          <li>Use the platform for any unlawful, fraudulent or harmful purpose</li>
          <li>Scrape, crawl or systematically extract data without prior written permission</li>
          <li>Attempt to gain unauthorized access to our systems or infrastructure</li>
          <li>Transmit malicious code, viruses or any harmful software</li>
          <li>Impersonate any person or entity or misrepresent your affiliation</li>
          <li>Use the platform in any way that could damage, disable or impair our services</li>
          <li>Redistribute, resell or sublicense market data to third parties</li>
          <li>Use automated tools or bots to access the platform at a rate that burdens our infrastructure</li>
        </ul>
        <p>
          We reserve the right to block access to any user or IP address that violates
          these terms, at our sole discretion and without notice.
        </p>
      </Section>

      {/* ── 6. Intellectual Property ────────────────────────────────────── */}
      <Section id="intellectual-property" title="6. Intellectual Property">
        <p>
          All design, code, layout, text and other original content on Stock Market ROI
          are protected by copyright and may not be reproduced, distributed or used without
          express written permission.
        </p>
        <p>
          Market data, company names, ticker symbols and logos are the property of their
          respective owners and are used solely for the purpose of providing publicly
          available market information.
        </p>
      </Section>

      {/* ── 7. Portfolio Tracker ────────────────────────────────────────── */}
      <Section id="portfolio" title="7. Portfolio Tracker">
        <p>
          The portfolio tracker stores all data exclusively in your browser&apos;s local
          storage. We do not transmit, access, store or process your portfolio data on
          our servers. Portfolio calculations are illustrative only and do not reflect
          actual brokerage account balances, commissions or taxes.
        </p>
        <p>
          We are not liable for any losses resulting from data loss (e.g., cleared
          browser storage), calculation discrepancies or reliance on portfolio tool output.
        </p>
      </Section>

      {/* ── 8. Limitation of Liability ──────────────────────────────────── */}
      <Section id="liability" title="8. Limitation of Liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, STOCK MARKET ROI AND ITS
          OWNERS, DEVELOPERS AND AFFILIATES SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY OR PUNITIVE DAMAGES ARISING FROM
          OR RELATED TO YOUR USE OF — OR INABILITY TO USE — THIS PLATFORM, INCLUDING BUT
          NOT LIMITED TO:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-zinc-500">
          <li>Financial losses or investment decisions based on platform data</li>
          <li>Loss or corruption of portfolio data stored in your browser</li>
          <li>Platform downtime, API failures or data inaccuracies</li>
          <li>Unauthorized access to your device or local data by third parties</li>
          <li>Any other matter beyond our reasonable control</li>
        </ul>
        <p>
          IN NO EVENT SHALL OUR AGGREGATE LIABILITY EXCEED THE AMOUNT YOU PAID (IF ANY)
          TO USE THE PLATFORM IN THE TWELVE MONTHS PRECEDING THE CLAIM.
        </p>
      </Section>

      {/* ── 9. Indemnification ──────────────────────────────────────────── */}
      <Section id="indemnification" title="9. Indemnification">
        <p>
          You agree to defend, indemnify and hold harmless Stock Market ROI and its
          owners, developers, contractors and affiliates from and against any claims,
          liabilities, damages, judgments, awards, losses, costs, expenses or fees
          (including reasonable attorneys&apos; fees) arising out of or relating to:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-zinc-500">
          <li>Your violation of these Terms of Use</li>
          <li>Your use of the platform in a manner not authorized herein</li>
          <li>Your violation of any third-party rights, including intellectual property rights</li>
          <li>Any investment or financial decision you make based on platform data</li>
        </ul>
      </Section>

      {/* ── 10. Data Breach ─────────────────────────────────────────────── */}
      <Section id="data-breach" title="10. Data Breach Limitation">
        <p>
          Stock Market ROI does not collect, transmit or store any sensitive personal
          information, financial account credentials or investment data on its servers.
          Portfolio data is stored exclusively in your browser&apos;s local storage and
          is never transmitted to us.
        </p>
        <p>
          Because we do not hold your financial or investment data, a breach of our
          infrastructure cannot expose such data. Nevertheless, we implement reasonable
          security measures (HTTPS, server hardening) to protect any server-side data
          we do process (e.g., anonymized access logs).
        </p>
        <p>
          <strong className="text-zinc-200">You are solely responsible</strong> for the
          security of your own device and browser storage. We strongly recommend using
          updated browsers and maintaining good device security practices.
        </p>
      </Section>

      {/* ── 11. DMCA ────────────────────────────────────────────────────── */}
      <Section id="dmca" title="11. DMCA — Copyright Infringement Notice">
        <p>
          We respect intellectual property rights. If you believe that content on this
          platform infringes your copyright under the{' '}
          <strong className="text-zinc-200">Digital Millennium Copyright Act (DMCA)</strong>,
          please send a written notice to{' '}
          <a href="mailto:contato@ivanlimadev.com" className="text-emerald-400 hover:text-emerald-300">
            contato@ivanlimadev.com
          </a>{' '}
          containing:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-zinc-500">
          <li>Identification of the copyrighted work claimed to be infringed</li>
          <li>The URL or location of the allegedly infringing material</li>
          <li>Your contact information (name, address, phone, email)</li>
          <li>A statement that you have a good faith belief that the use is unauthorized</li>
          <li>A statement, under penalty of perjury, that the information is accurate and you are authorized to act</li>
          <li>Your physical or electronic signature</li>
        </ul>
        <p>
          We will investigate and, where appropriate, remove or disable access to the
          infringing content in accordance with applicable law.
        </p>
      </Section>

      {/* ── 12. Arbitration + Class Action Waiver ───────────────────────── */}
      <Section id="arbitration" title="12. Dispute Resolution — Arbitration and Class Action Waiver">
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 space-y-3">
          <p className="font-semibold text-zinc-200">12.1 Binding Arbitration</p>
          <p>
            Any dispute, claim or controversy arising out of or relating to these Terms
            or your use of the platform that cannot be resolved informally shall be
            resolved by binding arbitration rather than in court, except that you may
            assert claims in small claims court if they qualify. The arbitration shall
            be conducted under the rules of a mutually agreed arbitral institution.
          </p>
          <p className="font-semibold text-zinc-200">12.2 Class Action Waiver</p>
          <p>
            <strong className="text-zinc-200">YOU AND STOCK MARKET ROI AGREE THAT EACH
            MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY,
            AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE
            PROCEEDING.</strong> No arbitration or proceeding shall be combined with another
            without the prior written consent of all parties to all affected arbitrations
            or proceedings.
          </p>
          <p className="font-semibold text-zinc-200">12.3 Informal Resolution First</p>
          <p>
            Before initiating arbitration, you agree to contact us at{' '}
            <a href="mailto:contato@ivanlimadev.com" className="text-emerald-400 hover:text-emerald-300">
              contato@ivanlimadev.com
            </a>{' '}
            and attempt to resolve the dispute informally for at least 30 days.
          </p>
        </div>
      </Section>

      {/* ── 13. Force Majeure ───────────────────────────────────────────── */}
      <Section id="force-majeure" title="13. Force Majeure">
        <p>
          We shall not be liable for any failure or delay in providing the service
          resulting from causes beyond our reasonable control, including but not limited
          to: acts of God, natural disasters, war, terrorism, civil unrest, government
          actions, internet or telecommunications failures, cyberattacks, third-party
          API outages (including Yahoo Finance or Marketstack), power failures or
          pandemic-related restrictions.
        </p>
      </Section>

      {/* ── 14. Third-Party Services ────────────────────────────────────── */}
      <Section id="third-party" title="14. Third-Party Services">
        <p>
          This platform relies on third-party data providers (Yahoo Finance, Marketstack)
          subject to their own terms of service and privacy policies. We are not
          affiliated with or endorsed by these providers. Links to external sites are
          provided for convenience only; we do not control and are not responsible for
          their content, practices or availability.
        </p>
      </Section>

      {/* ── 15. Privacy ─────────────────────────────────────────────────── */}
      <Section id="privacy" title="15. Privacy">
        <p>
          Your use of this platform is also governed by our{' '}
          <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300">
            Privacy Policy
          </Link>
          , which is incorporated by reference into these Terms. The Privacy Policy covers
          compliance with LGPD (Brazil), GDPR (EU) and CCPA (California).
        </p>
      </Section>

      {/* ── 16. Governing Law ───────────────────────────────────────────── */}
      <Section id="governing-law" title="16. Governing Law">
        <p>
          These Terms are governed by the laws of the Federative Republic of Brazil.
          For users located in the United States, to the extent applicable, the laws of
          the state in which the user resides may also apply. These Terms do not waive
          any non-waivable consumer rights you may have under your local law.
        </p>
        <p>
          Applicable Brazilian statutes include: LGPD (Lei nº 13.709/2018), Consumer
          Protection Code (CDC — Lei nº 8.078/1990) and the Marco Civil da Internet
          (Lei nº 12.965/2014).
        </p>
      </Section>

      {/* ── 17. Changes ─────────────────────────────────────────────────── */}
      <Section id="changes" title="17. Changes to These Terms">
        <p>
          We reserve the right to update these Terms at any time. The revision date is
          shown at the top of this page. Continued use of the platform following any
          posted changes constitutes your acceptance of the updated Terms.
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
