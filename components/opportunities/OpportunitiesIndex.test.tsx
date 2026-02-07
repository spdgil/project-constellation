import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { OpportunitiesIndex } from "./OpportunitiesIndex";
import type { Deal, LGA, OpportunityType } from "@/lib/types";
// deal-storage is no longer used — data comes from the database

const mockLgas: LGA[] = [
  { id: "mackay", name: "Mackay", geometryRef: "mackay", notes: [] },
];

const mockOpportunityTypes: OpportunityType[] = [
  {
    id: "critical-minerals",
    name: "Critical minerals",
    definition: "Value chain adjacency.",
    economicFunction: "",
    typicalCapitalStack: "",
    typicalRisks: "",
  },
];

const mockDeals: Deal[] = [
  {
    id: "demo-flexilab",
    name: "RCOE FlexiLab pilot",
    opportunityTypeId: "critical-minerals",
    lgaIds: ["mackay"],
    stage: "pre-feasibility",
    readinessState: "feasibility-underway",
    dominantConstraint: "common-user-infrastructure-gap",
    summary: "Pilot.",
    nextStep: "Secure offtake.",
    evidence: [],
    notes: [],
    updatedAt: "2026-02-06T00:00:00.000Z",
    gateChecklist: {},
    artefacts: {},
  },
];

describe("OpportunitiesIndex", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // no localStorage to clear
  });

  it("renders opportunity types list with deal counts and constraints", () => {
    render(
      <OpportunitiesIndex
        opportunityTypes={mockOpportunityTypes}
        deals={mockDeals}
        lgas={mockLgas}
      />
    );

    expect(
      screen.getByRole("heading", { name: /opportunity types/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("opportunity-types-list")).toBeInTheDocument();
    expect(screen.getByText("Critical minerals")).toBeInTheDocument();
    expect(screen.getByText(/Feasibility underway \(1\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/Common-user infrastructure gap \(1\)/)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /critical minerals/i })).toHaveAttribute(
      "href",
      "/opportunities/critical-minerals"
    );
  });

  it("reflects updated deals from database", () => {
    const updatedDeals = [
      {
        ...mockDeals[0],
        readinessState: "conceptual-interest" as const,
        dominantConstraint: "planning-and-approvals" as const,
      },
    ];

    render(
      <OpportunitiesIndex
        opportunityTypes={mockOpportunityTypes}
        deals={updatedDeals}
        lgas={mockLgas}
      />
    );

    expect(screen.getByText(/Conceptual interest \(1\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/Planning and approvals \(1\)/)
    ).toBeInTheDocument();
  });
});
