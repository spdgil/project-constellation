import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { DealsSearch } from "./DealsSearch";
import type { Deal, LGA, OpportunityType } from "@/lib/types";

/* Mock next/navigation */
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

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
    gateChecklist: {
      "pre-feasibility": [
        { question: "Preliminary Feasibility", status: "pending" },
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
    gateChecklist: {
      definition: [
        { question: "Strategic Suitability", status: "satisfied" },
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

describe("DealsSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders search input, filter dropdowns, and results grid", () => {
    render(
      <DealsSearch
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        sectorCount={mockOpportunityTypes.length}
      />
    );

    expect(screen.getByTestId("deals-search")).toBeInTheDocument();
    const input = screen.getByTestId("deals-search-input");
    expect(input).toBeInTheDocument();
    expect(input.getAttribute("placeholder")).toMatch(/search deals/i);
    expect(screen.getByTestId("deals-results-list")).toBeInTheDocument();
    expect(screen.getByTestId("deals-count")).toHaveTextContent("2 deals");

    // Filter dropdowns rendered
    expect(screen.getByTestId("filter-opportunity-type")).toBeInTheDocument();
    expect(screen.getByTestId("filter-stage")).toBeInTheDocument();
    expect(screen.getByTestId("filter-lga")).toBeInTheDocument();
  });

  it("shows all deals when query is empty", () => {
    render(
      <DealsSearch
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        sectorCount={mockOpportunityTypes.length}
      />
    );

    expect(screen.getByText("RCOE FlexiLab pilot")).toBeInTheDocument();
    expect(screen.getByText("Solar farm proposal")).toBeInTheDocument();
  });

  it("filters by deal name", () => {
    render(
      <DealsSearch
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        sectorCount={mockOpportunityTypes.length}
      />
    );

    const input = screen.getByTestId("deals-search-input");
    fireEvent.change(input, { target: { value: "solar" } });

    expect(screen.getByTestId("deals-count")).toHaveTextContent("1 deal");
    expect(screen.getByText("Solar farm proposal")).toBeInTheDocument();
    expect(screen.queryByText("RCOE FlexiLab pilot")).not.toBeInTheDocument();
  });

  it("filters by opportunity type name", () => {
    render(
      <DealsSearch
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        sectorCount={mockOpportunityTypes.length}
      />
    );

    const input = screen.getByTestId("deals-search-input");
    fireEvent.change(input, { target: { value: "critical" } });

    expect(screen.getByTestId("deals-count")).toHaveTextContent("1 deal");
    expect(screen.getByText("RCOE FlexiLab pilot")).toBeInTheDocument();
    expect(screen.queryByText("Solar farm proposal")).not.toBeInTheDocument();
  });

  it("filters by LGA name", () => {
    render(
      <DealsSearch
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        sectorCount={mockOpportunityTypes.length}
      />
    );

    const input = screen.getByTestId("deals-search-input");
    fireEvent.change(input, { target: { value: "Isaac" } });

    expect(screen.getByTestId("deals-count")).toHaveTextContent("1 deal");
    expect(screen.getByText("Solar farm proposal")).toBeInTheDocument();
    expect(screen.queryByText("RCOE FlexiLab pilot")).not.toBeInTheDocument();
  });

  it("shows no matches message when filter has no results", () => {
    render(
      <DealsSearch
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        sectorCount={mockOpportunityTypes.length}
      />
    );

    const input = screen.getByTestId("deals-search-input");
    fireEvent.change(input, { target: { value: "xyz-nonexistent" } });

    expect(screen.getByText("No deals match your filters.")).toBeInTheDocument();
  });

  it("deal cards link to the deal detail page", () => {
    render(
      <DealsSearch
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        sectorCount={mockOpportunityTypes.length}
      />
    );

    const grid = screen.getByTestId("deals-results-list");
    const firstCard = within(grid).getByText("RCOE FlexiLab pilot").closest("a");
    expect(firstCard).toHaveAttribute("href", "/deals/demo-flexilab");
  });

  it("renders summary stats bar", () => {
    render(
      <DealsSearch
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        sectorCount={mockOpportunityTypes.length}
      />
    );

    expect(screen.getByTestId("summary-bar")).toBeInTheDocument();
    expect(screen.getByText("Active deals")).toBeInTheDocument();
  });
});
