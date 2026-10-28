import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrow, IconScale, IconSeal, Panel, Reveal, SectionLabel, TonalChip } from "@/components/ui";

export const dynamic = "force-dynamic";

interface LegalDoc {
  slug: string;
  eyebrow: string;
  title: string;
  updated: string;
  lede: string;
  blocks: Array<{ heading: string; body: string[]; list?: string[] }>;
}

const DOCS: Record<string, LegalDoc> = {
  privacy: {
    slug: "privacy",
    eyebrow: "Policy",
    title: "Privacy, retention and deletion",
    updated: "October 2026",
    lede:
      "SG16 Identifier accepts text, links and images from strangers. This policy states the minimum we keep, how long we keep it, and how to make it go away.",
    blocks: [
      {
        heading: "What we receive",
        body: [
          "Whatever you choose to submit: pasted text, a URL, a product identifier, or an uploaded image. We also derive a fingerprint of the connection — a hash of the IP address and user agent — used only to enforce rate limits.",
        ],
      },
      {
        heading: "What we store",
        body: ["A report record with the category, verdict, confidence, summary, workflow trace, provider calls and metered cost."],
        list: [
          "Evidence rows: source URLs, publishers, stances, trust tiers and retrieval timestamps.",
          "Finding rows: each observation with its severity, weight and supporting references.",
          "A truncated copy of the submitted text (first 4,000 characters) so a result can be reviewed.",
          "A hashed connection fingerprint. Never the raw IP address, never the user agent string.",
          "Uploaded image bytes are analysed in memory and hashed with SHA-256 for deduplication. The pixels are not persisted.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Reports carry a retention expiry, 30 days by default and configurable per deployment. At expiry the report row is deleted and its evidence and finding rows cascade with it. An operator can trigger the purge manually from the admin console, and every purge is written to the audit log.",
        ],
      },
      {
        heading: "What we never do",
        body: ["We do not sell submissions, we do not publish private reports, and we do not use your input to train a model."],
        list: [
          "A report is addressed by an unguessable reference such as SG16-4KQ2-9MXT and is never indexed by search engines.",
          "Your recent checks list lives in your own browser's local storage. It never reaches the server.",
          "We do not embed third-party advertising or analytics cookies on the verification console or on report pages.",
        ],
      },
      {
        heading: "Deletion and access",
        body: [
          "Ask for deletion of a specific report reference and it is removed immediately rather than waiting for expiry. Ask for everything associated with a connection fingerprint and the matching rows are deleted. There is no account system in the first release, so there is no profile to export.",
        ],
      },
      {
        heading: "Sensitive submissions",
        body: [
          "Do not submit material you would not want a reviewer to read if you flag the result for correction. If you paste a private message, redact personal names, addresses and account numbers first — the verification does not need them, and neither do we.",
        ],
      },
    ],
  },
  terms: {
    slug: "terms",
    eyebrow: "Policy",
    title: "Terms of use",
    updated: "October 2026",
    lede:
      "Plain terms for a free public tool. Read them; they are short, and the important part is what SG16 is not.",
    blocks: [
      {
        heading: "The service",
        body: [
          "SG16 Identifier provides automated verification reports about products, claims, websites and media. It is an evidence-aggregation and analysis tool. It is free for public use without an account, subject to rate limits that exist to protect the service and its budget.",
        ],
      },
      {
        heading: "Not professional advice",
        body: [
          "A report is not legal advice, not a professional opinion, not an appraisal, and not a determination that any person or business has committed a crime or a civil wrong. Before you act on a result — refusing a refund, delisting a seller, accusing a publisher — obtain independent verification.",
        ],
      },
      {
        heading: "Acceptable use",
        body: ["You agree not to use the service to:"],
        list: [
          "Harass, defame or commercially damage an identified person or business.",
          "Probe, attack, overload or reverse-engineer the availability of the platform.",
          "Submit material you do not have the right to submit, including others' personal data.",
          "Circumvent rate limits, budget controls or the switches an operator has set.",
          "Launder a conclusion — presenting an SG16 report as an official certification.",
        ],
      },
      {
        heading: "Third-party content",
        body: [
          "Reports may quote and link to third-party sources. Those sources are the property of their publishers, are quoted for identification and commentary, and their inclusion is not an endorsement by SG16 or by the publisher of SG16.",
        ],
      },
      {
        heading: "Commercial relationships",
        body: [
          "Some outbound links are commercial and may earn SG16 a commission. They are labelled at the point of the link and logged for audit. No commercial relationship influences a verdict, a confidence figure, a ranking or a recommendation, and no payment can purchase a conclusion.",
        ],
      },
      {
        heading: "Availability and change",
        body: [
          "The service is provided as-is and as-available. Providers change pricing and access; adapters are replaced; modules are added and thresholds are recalibrated. Material changes to these terms are announced before they take effect.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "To the maximum extent permitted by law, SG16 Identifier and its operators are not liable for decisions you make on the basis of a report. The report tells you what evidence was found; the decision, and its consequences, remain yours.",
        ],
      },
    ],
  },
  limitations: {
    slug: "limitations",
    eyebrow: "Honesty",
    title: "What SG16 Identifier cannot prove",
    updated: "October 2026",
    lede:
      "This page exists because a verification service that hides its limits is worse than no service at all. Everything below is also repeated inside the reports themselves.",
    blocks: [
      {
        heading: "An identifier is not an object",
        body: [
          "A serial number, IMEI or barcode alone cannot prove that a phone is genuine. Counterfeit products copy valid identifiers from authentic ones, so a lookup that returns 'valid' is the least informative possible answer. It confirms the number is well formed and attributable — nothing about the item holding it.",
        ],
      },
      {
        heading: "No fact-check is not proof",
        body: [
          "The absence of an existing fact-check does not establish that a claim is true. It means no reviewed claim matched in the sources queried. Most claims in the world have never been reviewed by anybody, and most of them are not therefore verified.",
        ],
      },
      {
        heading: "Not on a blocklist is not safe",
        body: [
          "URL reputation feeds have incomplete coverage and a lag. A domain registered yesterday may not be classified yet, and a legitimate domain that has been compromised may be classified incorrectly. SG16 reports the lookup result and says explicitly that absence from a list is not an endorsement.",
        ],
      },
      {
        heading: "Metadata cannot authenticate a scene",
        body: [
          "C2PA and Content Credentials record who created or edited a file and with what tool. They do not establish that the depicted event happened, that the location is correct, or that the caption is accurate. A perfectly signed manifest can accompany a completely misleading caption.",
        ],
      },
      {
        heading: "AI detection is not proof of fabrication",
        body: [
          "Generative-tool signatures in metadata are real evidence about a file's history. Their absence is not evidence of a camera capture — most generators can be configured not to write metadata, and every social platform strips it on upload. Pixel-level forensic detection is not performed in this release and produces false positives and false negatives wherever it is.",
        ],
      },
      {
        heading: "The catalogue is not a manufacturer feed",
        body: [
          "Product records are an SG16-normalised starter dataset covering popular electronics. A non-match means the record is absent, not that the product does not exist. Specifications are published as ranges and should be compared against the manufacturer's own page, which every matched report links to.",
        ],
      },
      {
        heading: "Confidence is calibrated, not asserted",
        body: [
          "A confidence figure is computed from the weighted findings and the number of retrieved sources. It is not a probability that the conclusion is correct in any frequentist sense, and it is never produced by the model's own self-report. When evidence is insufficient the value is null rather than low.",
        ],
      },
      {
        heading: "Providers may be unavailable",
        body: [
          "Fact-check retrieval, commercial URL reputation, licensed search and AI analysis all require configured keys and budgets. When one is unavailable the report names it in the provider table and in the limitations panel, so you can see exactly how much of the pipeline ran.",
        ],
      },
      {
        heading: "Everything is point-in-time",
        body: [
          "DNS records, TLS certificates, page content and reputation classifications all change. A report reflects the state of the sources at the timestamp it shows. Re-run a check rather than relying on an old reference.",
        ],
      },
    ],
  },
  corrections: {
    slug: "corrections",
    eyebrow: "Accountability",
    title: "Corrections, disputes and appeals",
    updated: "October 2026",
    lede:
      "A verification service will sometimes be wrong. What matters is whether the mistake can be found, challenged and fixed in public.",
    blocks: [
      {
        heading: "How to challenge a result",
        body: [
          "Every report page carries a 'Flag this result' control. Describe what is wrong and, where you can, point at the evidence we missed. Submissions are written to the feedback table with a new status, the originating report is marked as flagged, and the item appears in the operator queue.",
        ],
      },
      {
        heading: "What happens next",
        body: ["Corrections are reviewed by a human, not by the same pipeline that produced the original result."],
        list: [
          "If the evidence was misread, the report is republished with the correction attached and the original wording preserved.",
          "If a source was misattributed, the evidence row is corrected and the affected finding re-weighted.",
          "If the conclusion stands, the reasoning is recorded so the same challenge can be answered consistently.",
          "We do not quietly delete a disputed report. Deletion happens only on a retention expiry or a legal requirement.",
        ],
      },
      {
        heading: "Named businesses and individuals",
        body: [
          "A report about a specific seller, domain or publisher describes evidence about that target at a point in time. It is not an accusation. If you operate a flagged domain or sell a flagged product and believe the assessment is wrong, submit a correction with your own evidence — registration records, manufacturer authorisation, order history — and it will be reviewed on the same terms as any other challenge.",
        ],
      },
      {
        heading: "Harmful or defamatory conclusions",
        body: [
          "Where a report could cause serious harm to an identified person or business, an operator can suspend public access to that reference pending review. Suspension is logged in the audit trail with the actor and the reason.",
        ],
      },
      {
        heading: "Reporting a security problem",
        body: [
          "If you find a vulnerability in SG16 Identifier — an SSRF bypass, an upload validation gap, an information leak — report it privately rather than demonstrating it against other users' submissions. Include enough detail to reproduce, and allow time to fix before disclosure.",
        ],
      },
    ],
  },
  disclosure: {
    slug: "disclosure",
    eyebrow: "Commercial",
    title: "Advertising and affiliate disclosure",
    updated: "October 2026",
    lede:
      "How SG16 Identifier is funded, where commercial relationships appear, and the rules that keep them away from the results.",
    blocks: [
      {
        heading: "The model in one paragraph",
        body: [
          "The public verification service is free and there is no mandatory subscription. The platform is funded by display advertising on editorial pages, by affiliate commissions on some outbound retailer links, and by paid business services that buy capacity and workflow. None of those streams can purchase a conclusion.",
        ],
      },
      {
        heading: "Affiliate links",
        body: [
          "Where a report or a guide links to a retailer, the link may be commercial. It is labelled at the point of the link, and the click is recorded with its destination, the retailer, the product reference and the report it came from. That record exists so commercial influence is auditable rather than merely denied.",
        ],
      },
      {
        heading: "Advertising",
        body: ["Display advertising is added only once the site has original editorial content, a published privacy policy and clear navigation, and only through a provider whose policies permit it."],
        list: [
          "No ad may be designed to resemble a verification result, a warning banner or a system message.",
          "No ad appears inside the evidence, findings or verdict panels of a report.",
          "No advertiser may request, purchase or preview a verification outcome.",
          "Ad placements are separated from findings by explicit labelling and visual distance.",
        ],
      },
      {
        heading: "Business services",
        body: [
          "Business customers pay for batch volume, monitoring, dashboards, exports, higher limits and support. They receive the same engine, the same adapters and the same scorer as a member of the public. The separation between what is sold and what is never sold is stated in the contract.",
        ],
      },
      {
        heading: "Provider relationships",
        body: [
          "SG16 names the external providers it queries inside each report. Where a provider requires attribution, the attribution is given. No provider relationship includes preferential treatment of that provider's own products, listings or claims inside a verification result.",
        ],
      },
      {
        heading: "Conflicts we refuse",
        body: [
          "We will not accept payment to remove a report, to soften a finding about a paying customer's competitor, to rank a seller above another, or to describe a product as genuine. If such an arrangement were ever proposed and accepted, it would end the only asset this platform actually has.",
        ],
      },
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  const page = DOCS[doc];
  if (!page) return { title: "Document not found" };
  return { title: page.title, description: page.lede.slice(0, 170) };
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const page = DOCS[doc];
  if (!page) notFound();

  return (
    <>
      <section className="relative overflow-hidden pt-14">
        <div className="grid-field pointer-events-none absolute inset-0 opacity-40" />
        <div className="noise-layer" />
        <div className="relative mx-auto max-w-[1000px] px-5 pb-8 sm:px-8">
          <Reveal>
            <div className="flex flex-wrap items-center gap-3">
              <TonalChip tone="neutral">{page.eyebrow}</TonalChip>
              <TonalChip tone="neutral">updated {page.updated}</TonalChip>
            </div>
            <h1 className="mt-6 font-display text-[clamp(2rem,4.8vw,3.6rem)] font-semibold leading-[0.99] tracking-[-0.03em] text-paper-50">
              {page.title}
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-mist-400">{page.lede}</p>
          </Reveal>
        </div>
      </section>

      <section className="relative mx-auto max-w-[1000px] px-5 pb-10 sm:px-8">
        <div className="space-y-10">
          {page.blocks.map((block, i) => (
            <Reveal key={block.heading} delay={i * 40}>
              <article>
                <div className="flex items-baseline gap-4 border-b border-mist-500/15 pb-3">
                  <span className="font-mono text-[12px] text-brand-400">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="font-display text-[clamp(1.25rem,2.4vw,1.75rem)] font-semibold leading-tight text-paper-50">
                    {block.heading}
                  </h2>
                </div>
                <div className="pt-4 space-y-4">
                  {block.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)} className="text-[15px] leading-[1.75] text-mist-400">
                      {paragraph}
                    </p>
                  ))}
                  {block.list && (
                    <ul className="space-y-2.5 rounded-sm border-l-2 border-brand-500/40 bg-ink-900/40 py-4 pl-5 pr-4">
                      {block.list.map((item) => (
                        <li key={item} className="flex gap-3 text-[14px] leading-relaxed text-mist-400">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-[1000px] px-5 pb-20 sm:px-8">
        <Reveal>
          <Panel hover={false} className="p-7">
            <div className="flex items-start gap-4">
              <IconScale className="mt-1 h-6 w-6 shrink-0 text-brand-400" />
              <div>
                <SectionLabel tone="mist">Other policies</SectionLabel>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {Object.values(DOCS)
                    .filter((other) => other.slug !== page.slug)
                    .map((other) => (
                      <Link
                        key={other.slug}
                        href={`/legal/${other.slug}`}
                        className="group inline-flex items-center gap-2 rounded-sm border border-mist-500/20 px-4 py-2.5 text-[13px] text-mist-300 transition-colors hover:border-brand-500/50 hover:text-brand-400"
                      >
                        {other.title}
                        <IconArrow className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    ))}
                </div>
                <div className="mt-7 flex items-start gap-3 border-t border-mist-500/12 pt-6">
                  <IconSeal className="mt-0.5 h-5 w-5 shrink-0 text-mist-600" />
                  <p className="text-[12.5px] leading-relaxed text-mist-600">
                    SG16 Identifier is an independent verification tool. It is not affiliated with,
                    endorsed by, or acting on behalf of any manufacturer, retailer, platform,
                    fact-checking organisation or government body named in its reports. Nothing here or
                    in any report constitutes legal advice.
                  </p>
                </div>
              </div>
            </div>
          </Panel>
        </Reveal>
      </section>
    </>
  );
}
