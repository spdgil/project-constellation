import Link from "next/link";
import {
  loadLgas,
  loadDeals,
  loadOpportunityTypes,
} from "@/lib/data";
import { READINESS_LABELS, CONSTRAINT_LABELS } from "@/lib/labels";
import type { ReadinessState, Constraint } from "@/lib/types";

export default async function HomePage() {
  const [lgas, deals, opportunityTypes] = await Promise.all([
    loadLgas(),
    loadDeals(),
    loadOpportunityTypes(),
  ]);

  /* Pipeline summary */
  const readinessCounts: Record<string, number> = {};
  for (const deal of deals) {
    readinessCounts[deal.readinessState] =
      (readinessCounts[deal.readinessState] ?? 0) + 1;
  }

  /* Top constraints */
  const constraintCounts: Record<string, number> = {};
  for (const deal of deals) {
    constraintCounts[deal.dominantConstraint] =
      (constraintCounts[deal.dominantConstraint] ?? 0) + 1;
  }
  const topConstraints = Object.entries(constraintCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="max-w-5xl">
      {/* ------------------------------------------------------------ */}
      {/* Hero                                                          */}
      {/* ------------------------------------------------------------ */}
      <section className="mb-16">
        <h1 className="font-heading text-3xl sm:text-4xl font-normal leading-[1.25] text-[#2C2C2C] mb-4">
          Project Constellation
        </h1>
        <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-2xl mb-8">
          A place-and-project dashboard for Queensland&rsquo;s Greater
          Whitsunday region. Mapping opportunity patterns across{" "}
          {lgas.length} local government areas, {opportunityTypes.length}{" "}
          opportunity types, and {deals.length} deal exemplars — from
          critical minerals processing to orbital launch supply chains.
        </p>

        {/* Key figures */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E6E3] border border-[#E8E6E3]">
          <Stat value={`~$30bn`} label="Gross regional product" />
          <Stat value={String(lgas.length)} label="LGAs" />
          <Stat value={String(opportunityTypes.length)} label="Opportunity types" />
          <Stat value={String(deals.length)} label="Deal exemplars" />
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Entry points                                                  */}
      {/* ------------------------------------------------------------ */}
      <section className="mb-16">
        <h2 className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C] mb-6">
          Explore
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <EntryCard
            href="/map"
            title="Explore by map"
            description="View LGA boundaries on a Mapbox basemap. Click a boundary or deal marker to open details, edit readiness, and track constraints."
          />
          <EntryCard
            href="/opportunities"
            title="Explore by opportunity types"
            description="Browse the seven opportunity types — from renewable energy to space — with definitions, capital stack notes, and linked deals."
          />
          <EntryCard
            href="/deals"
            title="Search deals"
            description="Filter and search across all deal exemplars by name, opportunity type, LGA, stage, or constraint."
          />
          <EntryCard
            href="/state"
            title="State view"
            description="Pipeline summary by readiness, dominant constraints by opportunity type and by LGA. Aggregates update when local edits are applied."
          />
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Pipeline at a glance                                          */}
      {/* ------------------------------------------------------------ */}
      <section className="mb-16">
        <h2 className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C] mb-6">
          Pipeline at a glance
        </h2>
        <div className="grid sm:grid-cols-2 gap-8">
          {/* Readiness breakdown */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-3">
              Deals by readiness
            </p>
            <ul className="list-none p-0 m-0 space-y-2">
              {Object.entries(readinessCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([state, count]) => (
                  <li
                    key={state}
                    className="flex items-baseline justify-between gap-4 text-sm"
                  >
                    <span className="text-[#2C2C2C]">
                      {READINESS_LABELS[state as ReadinessState] ?? state}
                    </span>
                    <span className="text-[#6B6B6B] tabular-nums">{count}</span>
                  </li>
                ))}
            </ul>
          </div>

          {/* Top constraints */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-3">
              Most common constraints
            </p>
            <ul className="list-none p-0 m-0 space-y-2">
              {topConstraints.map(([constraint, count]) => (
                <li
                  key={constraint}
                  className="flex items-baseline justify-between gap-4 text-sm"
                >
                  <span className="text-[#2C2C2C]">
                    {CONSTRAINT_LABELS[constraint as Constraint] ?? constraint}
                  </span>
                  <span className="text-[#6B6B6B] tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* LGA snapshots                                                 */}
      {/* ------------------------------------------------------------ */}
      <section className="mb-16">
        <h2 className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C] mb-6">
          Greater Whitsunday LGAs
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {lgas.map((lga) => {
            const lgaDeals = deals.filter((d) => d.lgaIds.includes(lga.id));
            const hypothesesCount = lga.opportunityHypotheses?.length ?? 0;
            return (
              <div
                key={lga.id}
                className="bg-white border border-[#E8E6E3] p-5"
              >
                <h3 className="font-heading text-base font-normal leading-[1.4] text-[#2C2C2C] mb-2">
                  {lga.name}
                </h3>
                <p className="text-xs text-[#6B6B6B] leading-relaxed mb-4 line-clamp-3">
                  {lga.summary?.split(". ").slice(0, 2).join(". ")}.
                </p>
                <div className="flex items-center gap-4 text-xs text-[#6B6B6B]">
                  <span>
                    {lgaDeals.length} deal{lgaDeals.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[#E8E6E3]">|</span>
                  <span>
                    {hypothesesCount} hypothes{hypothesesCount !== 1 ? "es" : "is"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Subcomponents                                                        */
/* -------------------------------------------------------------------- */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white p-4 sm:p-5">
      <p className="font-heading text-xl sm:text-2xl font-normal text-[#2C2C2C] mb-1">
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
        {label}
      </p>
    </div>
  );
}

function EntryCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group block bg-white border border-[#E8E6E3] p-5 hover:border-[#9A9A9A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition duration-300 ease-out"
    >
      <h3 className="font-heading text-base font-normal leading-[1.4] text-[#2C2C2C] mb-1 group-hover:text-[#7A6B5A] transition duration-300 ease-out">
        {title}
      </h3>
      <p className="text-xs text-[#6B6B6B] leading-relaxed">{description}</p>
    </Link>
  );
}
