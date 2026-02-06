import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { DealsSearch } from "./DealsSearch";
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
    id: "demo-flexilab",
    name: "RCOE FlexiLab pilot",
    opportunityTypeId: "critical-minerals",
    lgaIds: ["mackay"],
    stage: "feasibility",
    readinessState: "feasibility-underway",
    dominantConstraint: "common-user-infrastructure-gap",
    summary: "Pilot.",
    nextStep: "Secure offtake.",
    evidence: [],
    notes: [],
    updatedAt: "2026-02-06T00:00:00.000Z",
  },
  {
    id: "solar-project",
    name: "Solar farm proposal",
    opportunityTypeId: "renewables",
    lgaIds: ["isaac"],
    stage: "concept",
    readinessState: "conceptual-interest",
    dominantConstraint: "planning-and-approvals",
    summary: "Solar.",
    nextStep: "Site assessment.",
    evidence: [],
    notes: [],
    updatedAt: "2026-02-06T00:00:00.000Z",
  },
];

describe("DealsSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders search input and results list", () => {
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
    expect(screen.getByText("2 deals")).toBeInTheDocument();
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

    expect(screen.getByText("1 deal")).toBeInTheDocument();
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

    expect(screen.getByText("1 deal")).toBeInTheDocument();
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

    expect(screen.getByText("1 deal")).toBeInTheDocument();
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

    expect(screen.getByText("No deals match your search.")).toBeInTheDocument();
  });

  it("opening a deal from search opens the Deal drawer", () => {
    render(
      <DealsSearch
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    expect(screen.queryByRole("dialog", { name: /deal details/i })).not.toBeInTheDocument();

    const list = screen.getByTestId("deals-results-list");
    fireEvent.click(within(list).getByText("RCOE FlexiLab pilot"));

    const drawer = screen.getByRole("dialog", { name: /deal details/i });
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByText("RCOE FlexiLab pilot")).toBeInTheDocument();
    expect(within(drawer).getByText("Secure offtake.")).toBeInTheDocument();
  });

  it("keyboard Enter on highlighted result opens deal drawer", () => {
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

    const drawer = screen.getByRole("dialog", { name: /deal details/i });
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByText("RCOE FlexiLab pilot")).toBeInTheDocument();
  });

  it("keyboard ArrowDown then Enter opens second deal", () => {
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

    const drawer = screen.getByRole("dialog", { name: /deal details/i });
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByText("Solar farm proposal")).toBeInTheDocument();
  });
});
