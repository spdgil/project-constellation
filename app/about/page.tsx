/**
 * About page copy source: narrative_Project_Constellation.md
 * Hardcoded for prototype; no markdown parser.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Project Constellation",
  description:
    "Purpose, method, and governance for the Project Constellation dashboard.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C] mb-6">
        About Project Constellation
      </h1>

      <section className="mb-12" aria-labelledby="purpose-heading">
        <h2
          id="purpose-heading"
          className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C] mb-3"
        >
          Purpose
        </h2>
        <p className="text-sm text-[#2C2C2C] leading-relaxed mb-2">
          Project Constellation is a place-and-project system designed to support
          a project development facility. The dashboard supports that facility by
          identifying where projects stall before investment and where
          Queensland has credible economic opportunities that are not yet
          investable.
        </p>
        <p className="text-sm text-[#2C2C2C] leading-relaxed">
          It helps users see what is preventing capital from flowing, which
          constraints repeat across places and opportunity types, and which
          development actions would most efficiently move projects forward. It
          is not a reporting dashboard for its own sake; it is an instrument
          for disciplined project maturation.
        </p>
      </section>

      <section className="mb-12" aria-labelledby="organising-heading">
        <h2
          id="organising-heading"
          className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C] mb-3"
        >
          The organising idea
        </h2>
        <p className="text-sm text-[#2C2C2C] leading-relaxed">
          Queensland&apos;s economy often has the ingredients for growth, but
          projects stall before they become investable. The project development
          facility exists to close that gap.
        </p>
      </section>

      <section className="mb-12" aria-labelledby="how-to-read-heading">
        <h2
          id="how-to-read-heading"
          className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C] mb-3"
        >
          How to read the dashboard
        </h2>
        <p className="text-sm text-[#2C2C2C] leading-relaxed mb-4">
          The dashboard is organised around three objects: places (LGAs),
          opportunity types, and deals.
        </p>
        <ul className="list-none p-0 m-0 space-y-4 text-sm text-[#2C2C2C] leading-relaxed">
          <li>
            <strong className="font-normal text-[#2C2C2C]">
              Places (LGAs)
            </strong>{" "}
            — The organising unit for place-based context. An LGA view answers:
            what is true about this place, what capabilities exist, what
            constraints show up repeatedly, and what opportunity hypotheses are
            plausible. LGAs are not ranked; they are contexts.
          </li>
          <li>
            <strong className="font-normal text-[#2C2C2C]">
              Opportunity types
            </strong>{" "}
            — The mechanism for comparing like-with-like across places. An
            opportunity type view answers: what kind of opportunity is this,
            how does it typically become investable, where is it showing up
            across Queensland, and where does it stall and why.
          </li>
          <li>
            <strong className="font-normal text-[#2C2C2C]">Deals</strong> —
            The concrete units of progress. A deal view answers: what is the
            project, what stage is it at, what is the single most binding
            constraint, and what is the next action that would move it one step
            forward. Deals are evidence and work-in-progress; they are not
            endorsements.
          </li>
        </ul>
        <p className="text-sm text-[#2C2C2C] leading-relaxed mt-4">
          You can enter via the map (place-first), opportunity types
          (opportunity-first), or deal search (deal-first).
        </p>
      </section>

      <section className="mb-12" aria-labelledby="method-heading">
        <h2
          id="method-heading"
          className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C] mb-3"
        >
          Method
        </h2>
        <p className="text-sm text-[#2C2C2C] leading-relaxed mb-2">
          Two diligence pathways underpin the content:
        </p>
        <ul className="list-none p-0 m-0 space-y-1 text-sm text-[#2C2C2C] leading-relaxed mb-4">
          <li>
            <strong className="font-normal">LGA-level diligence</strong> —
            Defines opportunity hypotheses grounded in place conditions (3–7
            hypotheses per LGA, candidate deal exemplars, repeated constraints).
          </li>
          <li>
            <strong className="font-normal">Deal-level diligence</strong> —
            Matures specific deals through progressive diligence (readiness
            state, one dominant constraint, concrete next step, audit trail).
          </li>
        </ul>
        <p className="text-sm text-[#2C2C2C] leading-relaxed mb-2">
          Deals and clusters are classified on a capital readiness ladder (from
          no viable projects through to scaled and replicable). Every deal and
          cluster has exactly one dominant constraint at any moment; secondary
          issues belong in notes. The interface uses progressive disclosure:
          detail is earned on interaction.
        </p>
      </section>

      <section className="mb-12" aria-labelledby="governance-heading">
        <h2
          id="governance-heading"
          className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C] mb-3"
        >
          Governance and data
        </h2>
        <p className="text-sm text-[#2C2C2C] leading-relaxed">
          Deals are included as evidence, not endorsements. Classifications are
          updated over time and logged. Content may be incomplete and is
          designed to be improved. The dashboard is not a promise of funding, a
          ranking system for LGAs, a substitute for investment due diligence, a
          platform for lobbying or promotional content, or a forecasting
          engine.
        </p>
      </section>

      <section aria-labelledby="contact-heading">
        <h2
          id="contact-heading"
          className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C] mb-3"
        >
          Contact and contributions
        </h2>
        <p className="text-sm text-[#2C2C2C] leading-relaxed">
          Partners can suggest a deal exemplar, a missing opportunity type, or
          an evidence correction. For enquiries, use the contact details
          provided by the project development facility.
        </p>
      </section>
    </div>
  );
}
