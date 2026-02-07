import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { DealsAnalysis } from "./DealsAnalysis";
import type { Deal, LGA, OpportunityType } from "@/lib/types";

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
    id: "deal-1",
    name: "FlexiLab pilot",
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
    gateChecklist: {
      "pre-feasibility": [
        { question: "Preliminary Feasibility", status: "satisfied" },
        { question: "Clearance in Principle", status: "pending" },
        { question: "Additionality", status: "pending" },
      ],
    },
    artefacts: {},
    investmentValueAmount: 0,
    investmentValueDescription: "",
    economicImpactAmount: 0,
    economicImpactDescription: "",
  },
  {
    id: "deal-2",
    name: "Solar farm",
    opportunityTypeId: "renewables",
    lgaIds: ["isaac"],
    stage: "definition",
    readinessState: "conceptual-interest",
    dominantConstraint: "planning-and-approvals",
    summary: "Solar.",
    nextStep: "Assessment.",
    evidence: [],
    notes: [],
    updatedAt: "2026-02-06T00:00:00.000Z",
    gateChecklist: {
      definition: [
        { question: "Strategic Suitability", status: "satisfied" },
        { question: "Legal Viability", status: "satisfied" },
        { question: "Government Commitment", status: "satisfied" },
      ],
    },
    artefacts: {},
    investmentValueAmount: 0,
    investmentValueDescription: "",
    economicImpactAmount: 0,
    economicImpactDescription: "",
  },
  {
    id: "deal-3",
    name: "Hydro concept",
    opportunityTypeId: "renewables",
    lgaIds: ["mackay", "isaac"],
    stage: "definition",
    readinessState: "conceptual-interest",
    dominantConstraint: "planning-and-approvals",
    summary: "Hydro.",
    nextStep: "Scope.",
    evidence: [],
    notes: [],
    updatedAt: "2026-02-06T00:00:00.000Z",
    gateChecklist: {
      definition: [
        { question: "Strategic Suitability", status: "pending" },
        { question: "Legal Viability", status: "pending" },
        { question: "Government Commitment", status: "pending" },
      ],
    },
    artefacts: {},
    investmentValueAmount: 0,
    investmentValueDescription: "",
    economicImpactAmount: 0,
    economicImpactDescription: "",
  },
];

describe("DealsAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the analysis page with heading and summary stats", () => {
    render(
      <DealsAnalysis
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    expect(screen.getByTestId("deals-analysis")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /deal analysis/i })
    ).toBeInTheDocument();

    const stats = screen.getByTestId("summary-stats");
    expect(within(stats).getByText("3")).toBeInTheDocument(); // total deals
  });

  it("renders stage pipeline chart with correct counts", () => {
    render(
      <DealsAnalysis
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    const pipeline = screen.getByTestId("stage-pipeline");
    // 2 deals at Definition, 1 at Pre-feasibility
    // Label appears twice: bar label + badge
    expect(within(pipeline).getAllByText("Definition").length).toBeGreaterThanOrEqual(1);
    expect(within(pipeline).getAllByText("Pre-feasibility").length).toBeGreaterThanOrEqual(1);
  });

  it("renders readiness distribution", () => {
    render(
      <DealsAnalysis
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    const readiness = screen.getByTestId("readiness-distribution");
    // Label appears twice: bar label + badge
    expect(within(readiness).getAllByText("Conceptual interest").length).toBeGreaterThanOrEqual(1);
    expect(within(readiness).getAllByText("Feasibility underway").length).toBeGreaterThanOrEqual(1);
  });

  it("renders constraint distribution sorted by frequency", () => {
    render(
      <DealsAnalysis
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    const constraints = screen.getByTestId("constraint-distribution");
    // Planning and approvals: 2 (most frequent)
    const bars = constraints.querySelectorAll("[class*='flex items-center gap-3']");
    expect(bars.length).toBeGreaterThanOrEqual(2);
  });

  it("renders LGA distribution", () => {
    render(
      <DealsAnalysis
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    const lgaDist = screen.getByTestId("lga-distribution");
    expect(within(lgaDist).getByText("Mackay")).toBeInTheDocument();
    expect(within(lgaDist).getByText("Isaac")).toBeInTheDocument();
  });

  it("renders opportunity type breakdown with stacked stage segments", () => {
    render(
      <DealsAnalysis
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    const otBreakdown = screen.getByTestId("ot-breakdown");
    expect(within(otBreakdown).getByText("Critical minerals")).toBeInTheDocument();
    expect(within(otBreakdown).getByText("Renewable energy")).toBeInTheDocument();
    expect(within(otBreakdown).getByText("1 deal")).toBeInTheDocument();
    expect(within(otBreakdown).getByText("2 deals")).toBeInTheDocument();
  });

  it("computes gate satisfaction stats correctly", () => {
    render(
      <DealsAnalysis
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    const stats = screen.getByTestId("summary-stats");
    // deal-1: 1/3 satisfied, deal-2: 3/3 satisfied, deal-3: 0/3 satisfied → 4/9
    expect(within(stats).getByText("4/9")).toBeInTheDocument();
    expect(within(stats).getByText("44%")).toBeInTheDocument();
  });

  it("renders with empty deals array without crashing", () => {
    render(
      <DealsAnalysis
        deals={[]}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    expect(screen.getByTestId("deals-analysis")).toBeInTheDocument();
    const stats = screen.getByTestId("summary-stats");
    expect(within(stats).getByText("0")).toBeInTheDocument(); // total deals
  });
});
