import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { StateView } from "./StateView";
import type { Deal, LGA, OpportunityType } from "@/lib/types";
// deal-storage is no longer used — data comes from the database

const mockLgas: LGA[] = [
  { id: "mackay", name: "Mackay", geometryRef: "mackay", notes: [] },
  { id: "isaac", name: "Isaac", geometryRef: "isaac", notes: [] },
];

const mockOpportunityTypes: OpportunityType[] = [
  {
    id: "critical-minerals",
    name: "Critical minerals",
    definition: "",
    economicFunction: "",
    typicalCapitalStack: "",
    typicalRisks: "",
  },
  {
    id: "renewables",
    name: "Renewable energy",
    definition: "",
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
    investmentValueAmount: 0,
    investmentValueDescription: "",
    economicImpactAmount: 0,
    economicImpactDescription: "",
  },
  {
    id: "solar-project",
    name: "Solar farm proposal",
    opportunityTypeId: "renewables",
    lgaIds: ["isaac"],
    stage: "definition",
    readinessState: "conceptual-interest",
    dominantConstraint: "planning-and-approvals",
    summary: "Solar.",
    nextStep: "Site assessment.",
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

describe("StateView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders three collapsible sections", () => {
    render(
      <StateView
        opportunityTypes={mockOpportunityTypes}
        deals={mockDeals}
        lgas={mockLgas}
      />
    );

    expect(screen.getByTestId("state-view")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /state aggregation/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /pipeline summary by opportunity type/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /constraint summary by opportunity type/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /constraint summary by lga/i })
    ).toBeInTheDocument();
  });

  it("sections are collapsed by default", () => {
    render(
      <StateView
        opportunityTypes={mockOpportunityTypes}
        deals={mockDeals}
        lgas={mockLgas}
      />
    );

    expect(
      screen.getByRole("button", { name: /pipeline summary by opportunity type/i })
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("pipeline-by-ot")).not.toBeInTheDocument();
  });

  it("expanding pipeline section shows counts by readiness", () => {
    render(
      <StateView
        opportunityTypes={mockOpportunityTypes}
        deals={mockDeals}
        lgas={mockLgas}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /pipeline summary by opportunity type/i })
    );

    expect(
      screen.getByRole("button", { name: /pipeline summary by opportunity type/i })
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("pipeline-by-ot")).toBeInTheDocument();
    expect(screen.getByText("Feasibility underway: 1")).toBeInTheDocument();
    expect(screen.getByText("Conceptual interest: 1")).toBeInTheDocument();
  });

  it("expanding constraint by OT shows top constraints per type", () => {
    render(
      <StateView
        opportunityTypes={mockOpportunityTypes}
        deals={mockDeals}
        lgas={mockLgas}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /constraint summary by opportunity type/i })
    );

    const constraintByOt = screen.getByTestId("constraint-by-ot");
    expect(constraintByOt).toBeInTheDocument();
    expect(
      within(constraintByOt).getByTestId("constraint-critical-minerals-common-user-infrastructure-gap")
    ).toHaveTextContent("Common-user infrastructure gap: 1");
    expect(
      within(constraintByOt).getByTestId("constraint-renewables-planning-and-approvals")
    ).toHaveTextContent("Planning and approvals: 1");
  });

  it("expanding constraint by LGA shows top constraints per LGA", () => {
    render(
      <StateView
        opportunityTypes={mockOpportunityTypes}
        deals={mockDeals}
        lgas={mockLgas}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /constraint summary by lga/i })
    );

    expect(screen.getByTestId("constraint-by-lga")).toBeInTheDocument();
    expect(screen.getByTestId("constraint-lga-mackay")).toBeInTheDocument();
    expect(screen.getByTestId("constraint-lga-isaac")).toBeInTheDocument();
  });

  it("aggregates reflect updated deals prop (readiness)", () => {
    const updatedDeals = [
      { ...mockDeals[0], readinessState: "conceptual-interest" as const },
      mockDeals[1],
    ];

    render(
      <StateView
        opportunityTypes={mockOpportunityTypes}
        deals={updatedDeals}
        lgas={mockLgas}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /pipeline summary by opportunity type/i })
    );

    expect(screen.getByTestId("readiness-critical-minerals-conceptual-interest")).toHaveTextContent("1");
    expect(screen.queryByTestId("readiness-critical-minerals-feasibility-underway")).not.toBeInTheDocument();
  });

  it("aggregates reflect updated deals prop (constraint)", () => {
    const updatedDeals = [
      { ...mockDeals[0], dominantConstraint: "planning-and-approvals" as const },
      mockDeals[1],
    ];

    render(
      <StateView
        opportunityTypes={mockOpportunityTypes}
        deals={updatedDeals}
        lgas={mockLgas}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /constraint summary by opportunity type/i })
    );

    expect(screen.getByTestId("constraint-critical-minerals-planning-and-approvals")).toHaveTextContent("1");
  });
});
