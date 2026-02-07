/**
 * About page — two-column layout matching the established design language.
 * Hero card, accordion sections (native <details>), sidebar reference cards.
 * Server Component — no client JS shipped.
 *
 * Copy source: narrative_Project_Constellation.md
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — The Constellation Development Facility",
  description:
    "Purpose, method, and governance for the Constellation Development Facility dashboard.",
};

/* ====================================================================== */
/* Constants                                                               */
/* ====================================================================== */

const CORE_OBJECTS = [
  {
    label: "Places (LGAs)",
    borderColour: "border-l-violet-400",
    summary:
      "The organising unit for place-based context. An LGA view answers: what is true about this place, what capabilities exist, what constraints show up repeatedly, and what opportunity hypotheses are plausible.",
    note: "LGAs are not ranked. They are contexts.",
  },
  {
    label: "Opportunity types",
    borderColour: "border-l-blue-400",
    summary:
      "The mechanism for comparing like-with-like across places. An opportunity type view answers: what kind of opportunity is this, how does it typically become investable, where is it showing up across Queensland, and where does it stall and why.",
    note: "Opportunity types allow replication and pattern learning.",
  },
  {
    label: "Deals",
    borderColour: "border-l-amber-400",
    summary:
      "The concrete units of progress. A deal view answers: what is the project, what stage is it at, what is the single most binding constraint, and what is the next action that would move it one step forward.",
    note: "Deals are evidence and work-in-progress, not endorsements.",
  },
] as const;

const NOT_LIST = [
  "A promise of funding",
  "A ranking system for LGAs",
  "A substitute for investment due diligence",
  "A platform for lobbying or promotional content",
  "A forecasting engine",
];

const READINESS_LADDER = [
  "No viable projects",
  "Conceptual interest",
  "Feasibility underway",
  "Structurable but stalled",
  "Investable with minor intervention",
  "Scaled and replicable",
];

const CONSTRAINT_VOCABULARY = [
  "Revenue certainty",
  "Offtake / demand aggregation",
  "Planning and approvals",
  "Sponsor capability",
  "Early risk capital",
  "Balance sheet constraints",
  "Technology risk",
  "Coordination failure",
  "Skills and workforce",
  "Common-user infrastructure gap",
];

/* ====================================================================== */
/* Page                                                                    */
/* ====================================================================== */

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Two-column grid: main + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============================================================ */}
        {/* Main content (2/3)                                            */}
        {/* ============================================================ */}
        <div className="lg:col-span-2 flex flex-col gap-0">
          {/* Hero card */}
          <section
            className="bg-white border border-[#E8E6E3] border-t-[3px] border-t-[#7A6B5A] p-6 space-y-5"
            aria-label="About overview"
          >
            <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
              About the Constellation Development Facility
            </h1>
            <p className="text-sm text-[#2C2C2C] leading-relaxed">
              A place-and-project system that identifies where Queensland has
              credible economic opportunities that are not yet investable, and
              supports a project development facility to close that gap.
            </p>

            <div className="border-t border-[#E8E6E3]" />

            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">
                The organising idea
              </p>
              <p className="mt-1 text-sm text-[#2C2C2C] leading-relaxed">
                Queensland&rsquo;s economy often has the ingredients for growth,
                but projects stall before they become investable. The project
                development facility exists to close that gap. This dashboard is
                its instrument: it surfaces where capital is not flowing, which
                constraints repeat, and which actions would most efficiently move
                projects forward.
              </p>
            </div>
          </section>

          {/* Accordion sections — progressive disclosure */}
          <div className="bg-white border border-t-0 border-[#E8E6E3] px-6">
            {/* How to read the dashboard */}
            <AccordionBlock title="How to read the dashboard" defaultOpen>
              <p className="text-sm text-[#2C2C2C] leading-relaxed mb-4">
                The dashboard is organised around three objects. You can enter
                via the map (place-first), opportunity types
                (opportunity-first), or deal search (deal-first).
              </p>
              <div className="space-y-3">
                {CORE_OBJECTS.map((obj) => (
                  <div
                    key={obj.label}
                    className={`border border-[#E8E6E3] border-l-[3px] ${obj.borderColour} bg-[#FAF9F7] p-4 space-y-1`}
                  >
                    <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">
                      {obj.label}
                    </p>
                    <p className="text-sm text-[#2C2C2C] leading-relaxed">
                      {obj.summary}
                    </p>
                    <p className="text-xs text-[#6B6B6B] leading-relaxed italic">
                      {obj.note}
                    </p>
                  </div>
                ))}
              </div>
            </AccordionBlock>

            {/* Method */}
            <AccordionBlock title="Method">
              <p className="text-sm text-[#2C2C2C] leading-relaxed mb-3">
                Two diligence pathways underpin the content:
              </p>
              <div className="space-y-3 mb-4">
                <div className="border border-[#E8E6E3] border-l-[3px] border-l-emerald-400 bg-[#FAF9F7] p-4 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">
                    LGA-level diligence
                  </p>
                  <p className="text-sm text-[#2C2C2C] leading-relaxed">
                    Defines opportunity hypotheses grounded in place conditions:
                    3&ndash;7 hypotheses per LGA, candidate deal exemplars, and
                    repeated constraints observed locally.
                  </p>
                </div>
                <div className="border border-[#E8E6E3] border-l-[3px] border-l-blue-400 bg-[#FAF9F7] p-4 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">
                    Deal-level diligence
                  </p>
                  <p className="text-sm text-[#2C2C2C] leading-relaxed">
                    Matures specific deals through progressive diligence:
                    readiness state on a shared ladder, one dominant constraint,
                    a concrete next step, and an audit trail.
                  </p>
                </div>
              </div>
              <p className="text-sm text-[#2C2C2C] leading-relaxed">
                Deals and clusters are classified on a capital readiness ladder
                (from no viable projects through to scaled and replicable).
                Every deal has exactly one dominant constraint at any moment;
                secondary issues belong in notes. The interface uses progressive
                disclosure: detail is earned on interaction.
              </p>
            </AccordionBlock>

            {/* Governance and data */}
            <AccordionBlock title="Governance and data">
              <div className="space-y-3">
                <p className="text-sm text-[#2C2C2C] leading-relaxed">
                  Deals are included as evidence, not endorsements.
                  Classifications are updated over time and logged. Content may
                  be incomplete and is designed to be improved.
                </p>
                <div className="border border-[#E8E6E3] bg-[#FAF9F7] p-4">
                  <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium mb-2">
                    This dashboard is not
                  </p>
                  <ul className="list-none p-0 m-0 space-y-1">
                    {NOT_LIST.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-[#2C2C2C] leading-relaxed"
                      >
                        <span
                          className="shrink-0 mt-0.5 text-[#9A9A9A]"
                          aria-hidden="true"
                        >
                          &mdash;
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AccordionBlock>

            {/* Known limitations */}
            <AccordionBlock title="Known limitations">
              <p className="text-sm text-[#2C2C2C] leading-relaxed">
                This prototype uses static data and optional local overrides.
                Map boundaries are simplified. Deal and LGA content may be
                incomplete. The dashboard is not a substitute for investment due
                diligence.
              </p>
            </AccordionBlock>

            {/* Contact and contributions */}
            <AccordionBlock title="Contact and contributions">
              <p className="text-sm text-[#2C2C2C] leading-relaxed">
                Partners can suggest a deal exemplar, a missing opportunity
                type, or an evidence correction. For enquiries, use the contact
                details provided by the project development facility.
              </p>
            </AccordionBlock>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Sidebar (1/3)                                                  */}
        {/* ============================================================ */}
        <aside
          className="space-y-4 lg:sticky lg:top-6 lg:self-start"
          aria-label="Quick reference"
        >
          {/* Explore the dashboard */}
          <div className="bg-white border border-[#E8E6E3] p-5 space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">
              Explore the dashboard
            </p>
            <div className="space-y-2">
              <SidebarNavLink
                href="/lga/map"
                label="Map"
                sub="Browse LGAs and deal markers"
              />
              <SidebarNavLink
                href="/sectors"
                label="Sectors"
                sub="Opportunity types across Queensland"
              />
              <SidebarNavLink
                href="/deals"
                label="Deals"
                sub="Search the project pipeline"
              />
            </div>
          </div>

          {/* Capital readiness ladder */}
          <div className="bg-white border border-[#E8E6E3] border-l-[3px] border-l-emerald-400 p-5 space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">
              Capital readiness ladder
            </p>
            <ol className="list-none p-0 m-0 space-y-1.5">
              {READINESS_LADDER.map((step, i) => (
                <li
                  key={step}
                  className="flex items-start gap-2 text-xs text-[#2C2C2C] leading-relaxed"
                >
                  <span className="shrink-0 text-[10px] text-[#9A9A9A] font-medium w-3 text-right">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Constraint vocabulary */}
          <div className="bg-white border border-[#E8E6E3] border-l-[3px] border-l-amber-400 p-5 space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">
              Dominant constraints
            </p>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Every deal has exactly one dominant constraint &mdash; the reason
              capital is not flowing today.
            </p>
            <ul className="list-none p-0 m-0 space-y-1">
              {CONSTRAINT_VOCABULARY.map((c) => (
                <li
                  key={c}
                  className="text-xs text-[#2C2C2C] leading-relaxed"
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* Sub-components (file-local, server-compatible)                          */
/* ====================================================================== */

/**
 * Server-compatible accordion block using native <details>/<summary>.
 * Visually matches the AccordionSection component without shipping JS.
 */
function AccordionBlock({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="border-t border-[#E8E6E3] group" open={defaultOpen}>
      <summary className="flex w-full items-center justify-between gap-2 py-4 cursor-pointer list-none text-left [&::-webkit-details-marker]:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]">
        <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">
          {title}
        </span>
        <svg
          className="h-4 w-4 shrink-0 text-[#9A9A9A] transition-transform duration-300 ease-out group-open:rotate-90"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}

function SidebarNavLink({
  href,
  label,
  sub,
}: {
  href: string;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="group block border border-[#E8E6E3] bg-[#FAF9F7] p-3 space-y-0.5
                 hover:border-[#7A6B5A] hover:bg-white
                 transition duration-300 ease-out
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
    >
      <span className="text-xs font-medium text-[#2C2C2C] group-hover:text-[#7A6B5A] transition duration-300 ease-out block">
        {label}{" "}
        <span
          aria-hidden="true"
          className="text-[#9A9A9A] group-hover:text-[#7A6B5A]"
        >
          &rarr;
        </span>
      </span>
      <span className="text-[10px] text-[#9A9A9A] block">{sub}</span>
    </Link>
  );
}
