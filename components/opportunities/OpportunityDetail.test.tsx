import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { OpportunityDetail } from "./OpportunityDetail";
import type { Deal, LGA, OpportunityType } from "@/lib/types";
// deal-storage is no longer used — data comes from the database

const mockLgas: LGA[] = [
  { id: "mackay", name: "Mackay", geometryRef: "mackay", notes: [] },
];

const mockOpportunityType: OpportunityType = {
  id: "critical-minerals",
  name: "Critical minerals",
  definition: "Value chain adjacency; common-user processing.",
  economicFunction: "Diversification from METS base.",
  typicalCapitalStack: "Government and industry co-investment.",
  typicalRisks: "Feedstock certainty; technology scale-up.",
};

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
    investmentValueAmount: 0,
    investmentValueDescription: "",
    economicImpactAmount: 0,
    economicImpactDescription: "",
  },
];

describe("OpportunityDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // no localStorage to clear — data comes from the database
  });

  it("renders opportunity type definition and deals", () => {
    render(
      <OpportunityDetail
        opportunityType={mockOpportunityType}
        deals={mockDeals}
        lgas={mockLgas}
      />
    );

    expect(screen.getByTestId("opportunity-detail")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Critical minerals" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Value chain adjacency; common-user processing.")
    ).toBeInTheDocument();
    expect(screen.getByTestId("deals-list")).toBeInTheDocument();
    expect(screen.getByText("RCOE FlexiLab pilot")).toBeInTheDocument();
    expect(screen.getByText(/Mackay/)).toBeInTheDocument();
  });

  it("renders readiness and constraint distribution", () => {
    render(
      <OpportunityDetail
        opportunityType={mockOpportunityType}
        deals={mockDeals}
        lgas={mockLgas}
      />
    );

    expect(screen.getByTestId("readiness-distribution")).toBeInTheDocument();
    expect(screen.getByText("Feasibility underway: 1")).toBeInTheDocument();
    expect(screen.getByTestId("constraint-distribution")).toBeInTheDocument();
    expect(
      screen.getByText(/Common-user infrastructure gap: 1/)
    ).toBeInTheDocument();
  });

  it("renders replication signals section", () => {
    render(
      <OpportunityDetail
        opportunityType={mockOpportunityType}
        deals={mockDeals}
        lgas={mockLgas}
      />
    );

    expect(
      screen.getByRole("heading", { name: /replication signals/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Repeated constraint across LGAs/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Multiple deals at same readiness/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/None \(constraint in 2\+ LGAs\)/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/None \(2\+ deals at same stage\)/)
    ).toBeInTheDocument();
  });

  it("reflects updated deals prop from database", () => {
    const updatedDeals = [
      {
        ...mockDeals[0],
        readinessState: "conceptual-interest" as const,
        dominantConstraint: "planning-and-approvals" as const,
      },
    ];

    render(
      <OpportunityDetail
        opportunityType={mockOpportunityType}
        deals={updatedDeals}
        lgas={mockLgas}
      />
    );

    expect(screen.getByText("Conceptual interest: 1")).toBeInTheDocument();
    expect(screen.getByText("Planning and approvals: 1")).toBeInTheDocument();
  });
});
