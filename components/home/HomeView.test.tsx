import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { HomeView } from "./HomeView";
import type { Deal, LGA, OpportunityType } from "@/lib/types";

const mockLgas: LGA[] = [
  {
    id: "mackay",
    name: "Mackay",
    geometryRef: "mackay",
    notes: [],
    summary: "Mining hub.",
    opportunityHypotheses: [
      { id: "h1", name: "Critical minerals", summary: "", dominantConstraint: "common-user-infrastructure-gap" },
    ],
  },
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
    investmentValueAmount: 5_000_000,
    investmentValueDescription: "$5M",
    economicImpactAmount: 10_000_000,
    economicImpactDescription: "$10M GDP",
    economicImpactJobs: 120,
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
    investmentValueAmount: 3_000_000,
    investmentValueDescription: "$3M",
    economicImpactAmount: 7_000_000,
    economicImpactDescription: "$7M GDP",
    economicImpactJobs: 80,
  },
];

describe("HomeView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders two tabs: Overview and Map", () => {
    render(
      <HomeView
        opportunityTypes={mockOpportunityTypes}
        deals={mockDeals}
        lgas={mockLgas}
      />,
    );

    expect(screen.getByTestId("home-view")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /map/i })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /aggregation/i })).not.toBeInTheDocument();
  });

  it("defaults to Overview tab", () => {
    render(
      <HomeView
        opportunityTypes={mockOpportunityTypes}
        deals={mockDeals}
        lgas={mockLgas}
      />,
    );

    expect(screen.getByTestId("overview-tab")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /overview/i })).toHaveAttribute("aria-selected", "true");
  });

  it("renders dynamic key metrics computed from deals", () => {
    render(
      <HomeView
        opportunityTypes={mockOpportunityTypes}
        deals={mockDeals}
        lgas={mockLgas}
      />,
    );

    expect(screen.getByText("Deals")).toBeInTheDocument();
    expect(screen.getByText("Investment")).toBeInTheDocument();
    expect(screen.getByText("Economic impact")).toBeInTheDocument();
    expect(screen.getByText("Jobs")).toBeInTheDocument();
    expect(screen.getByText(/Active LGAs/)).toBeInTheDocument();
    // $5M + $3M = $8.0M investment, $10M + $7M = $17.0M impact, 120 + 80 = 200 jobs
    expect(screen.getByText("$8.0M")).toBeInTheDocument();
    expect(screen.getByText("$17.0M")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("renders the pipeline readiness section with legend", () => {
    render(
      <HomeView
        opportunityTypes={mockOpportunityTypes}
        deals={mockDeals}
        lgas={mockLgas}
      />,
    );

    const pipeline = screen.getByTestId("pipeline-section");
    expect(within(pipeline).getByText("Pipeline readiness")).toBeInTheDocument();
    expect(within(pipeline).getByRole("img", { name: /readiness distribution/i })).toBeInTheDocument();
    // Legend shows states that have deals
    expect(within(pipeline).getByText("Feasibility underway")).toBeInTheDocument();
    expect(within(pipeline).getByText("Conceptual interest")).toBeInTheDocument();
  });

  it("renders opportunity type cards with deal counts and investment", () => {
    render(
      <HomeView
        opportunityTypes={mockOpportunityTypes}
        deals={mockDeals}
        lgas={mockLgas}
      />,
    );

    const otSection = screen.getByTestId("ot-section");
    expect(within(otSection).getByText("Critical minerals")).toBeInTheDocument();
    expect(within(otSection).getByText("Renewable energy")).toBeInTheDocument();
    // Each OT card shows "1 deal"
    expect(within(otSection).getAllByText(/1 deal\b/).length).toBe(2);
  });

  it("renders OT cards with top constraint chips", () => {
    render(
      <HomeView
        opportunityTypes={mockOpportunityTypes}
        deals={mockDeals}
        lgas={mockLgas}
      />,
    );

    const otSection = screen.getByTestId("ot-section");
    expect(within(otSection).getByText("Common-user infrastructure gap")).toBeInTheDocument();
    expect(within(otSection).getByText("Planning and approvals")).toBeInTheDocument();
  });

  it("renders GW LGA cards only for LGAs with summaries", () => {
    render(
      <HomeView
        opportunityTypes={mockOpportunityTypes}
        deals={mockDeals}
        lgas={mockLgas}
      />,
    );

    const lgaSection = screen.getByTestId("lga-section");
    expect(within(lgaSection).getByText("Greater Whitsunday")).toBeInTheDocument();
    expect(within(lgaSection).getByRole("heading", { name: "Mackay" })).toBeInTheDocument();
    expect(within(lgaSection).getByText(/1 hypothesis/i)).toBeInTheDocument();
    // Isaac has no summary → not shown
    expect(screen.queryByRole("heading", { name: "Isaac" })).not.toBeInTheDocument();
  });

  it("stats recompute when deals change", () => {
    const singleDeal = [mockDeals[0]];

    const { rerender } = render(
      <HomeView
        opportunityTypes={mockOpportunityTypes}
        deals={singleDeal}
        lgas={mockLgas}
      />,
    );

    // Single deal: total investment $5.0M appears in both top metric and OT card.
    // Check the top metric card label is present.
    expect(screen.getByText("Investment")).toBeInTheDocument();
    // The value $5.0M will appear twice (top metric + OT card), so use getAllByText
    expect(screen.getAllByText("$5.0M").length).toBeGreaterThanOrEqual(1);

    // Re-render with both deals → top investment becomes $8.0M
    rerender(
      <HomeView
        opportunityTypes={mockOpportunityTypes}
        deals={mockDeals}
        lgas={mockLgas}
      />,
    );

    expect(screen.getByText("$8.0M")).toBeInTheDocument();
  });

  it("renders quick action links", () => {
    render(
      <HomeView
        opportunityTypes={mockOpportunityTypes}
        deals={mockDeals}
        lgas={mockLgas}
      />,
    );

    expect(screen.getByRole("link", { name: /view all deals/i })).toHaveAttribute("href", "/deals");
    expect(screen.getByRole("link", { name: /new deal from document/i })).toHaveAttribute("href", "/deals/memo");
  });

  it("respects initialTab=map", () => {
    render(
      <HomeView
        opportunityTypes={mockOpportunityTypes}
        deals={mockDeals}
        lgas={mockLgas}
        initialTab="map"
      />,
    );

    expect(screen.getByRole("tab", { name: /map/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByTestId("overview-tab")).not.toBeInTheDocument();
  });
});
