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
  },
];

describe("DealsSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders search input, filter dropdowns, and results list", () => {
    render(
      <DealsSearch
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    expect(screen.getByTestId("deals-search")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /search deals/i })
    ).toBeInTheDocument();
    const input = screen.getByTestId("deals-search-input");
    expect(input).toBeInTheDocument();
    expect(input.getAttribute("placeholder")).toMatch(
      /filter by deal name, opportunity type, or lga name/i
    );
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
      />
    );

    const input = screen.getByTestId("deals-search-input");
    fireEvent.change(input, { target: { value: "xyz-nonexistent" } });

    expect(screen.getByText("No deals match your filters.")).toBeInTheDocument();
  });

  it("clicking a deal navigates to the deal detail page", () => {
    render(
      <DealsSearch
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    const list = screen.getByTestId("deals-results-list");
    fireEvent.click(within(list).getByText("RCOE FlexiLab pilot"));

    expect(pushMock).toHaveBeenCalledWith("/deals/demo-flexilab");
  });

  it("keyboard Enter on highlighted result navigates to deal detail page", () => {
    render(
      <DealsSearch
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    const input = screen.getByTestId("deals-search-input");
    input.focus();
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(pushMock).toHaveBeenCalledWith("/deals/demo-flexilab");
  });

  it("keyboard ArrowDown then Enter navigates to second deal", () => {
    render(
      <DealsSearch
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    const input = screen.getByTestId("deals-search-input");
    input.focus();
    fireEvent.keyDown(input, { key: "ArrowDown", code: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(pushMock).toHaveBeenCalledWith("/deals/solar-project");
  });

  it("shows gate progress indicator in list items", () => {
    render(
      <DealsSearch
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    const gateIndicators = screen.getAllByTestId("gate-progress");
    expect(gateIndicators).toHaveLength(2);
    // First deal: 0/3 (all pending)
    expect(gateIndicators[0]).toHaveTextContent("0/3 gates");
    // Second deal: 1/3 (Strategic Suitability satisfied)
    expect(gateIndicators[1]).toHaveTextContent("1/3 gates");
  });
});
