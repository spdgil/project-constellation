import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DealDetail } from "./DealDetail";
import type { Deal, LGA, OpportunityType } from "@/lib/types";

const mockLgas: LGA[] = [
  {
    id: "mackay",
    name: "Mackay",
    geometryRef: "mackay",
    notes: [],
    summary: "Mining is a major driver.",
    repeatedConstraints: ["common-user-infrastructure-gap"],
  },
];

const mockOpportunityTypes: OpportunityType[] = [
  {
    id: "critical-minerals",
    name: "Critical minerals",
    definition: "Value chain adjacency.",
    economicFunction: "",
    typicalCapitalStack: "Government co-investment.",
    typicalRisks: "Feedstock certainty.",
  },
];

const mockDeal: Deal = {
  id: "demo-flexilab",
  name: "RCOE FlexiLab pilot",
  opportunityTypeId: "critical-minerals",
  lgaIds: ["mackay"],
  stage: "pre-feasibility",
  readinessState: "feasibility-underway",
  dominantConstraint: "common-user-infrastructure-gap",
  summary: "Pilot processing facility.",
  description: "A detailed description of the project.",
  nextStep: "Secure offtake.",
  investmentValue: "$5.7m",
  economicImpact: "Major impact",
  keyStakeholders: ["QLD Government", "Mining3"],
  risks: ["Risk one", "Risk two"],
  strategicActions: ["Action one"],
  infrastructureNeeds: ["Paget Industrial Estate"],
  skillsImplications: "Reskilling needed.",
  marketDrivers: "Global demand increasing.",
  governmentPrograms: [
    { name: "QLD Resources Plan", description: "Growth strategy" },
  ],
  timeline: [
    { label: "Funding secured" },
    { label: "Construction starts", date: "2025" },
  ],
  evidence: [{ label: "METS Strategy", pageRef: "p.37" }],
  notes: [],
  updatedAt: "2026-02-06T00:00:00.000Z",
  gateChecklist: {
    "pre-feasibility": [
      { question: "Preliminary Feasibility", status: "pending" },
      { question: "Clearance in Principle", status: "satisfied" },
      { question: "Additionality", status: "pending" },
    ],
  },
  artefacts: {
    "pre-feasibility": [
      { name: "Pre-feasibility Study", status: "not-started" },
      { name: "Safeguards Data Sheet", status: "complete" },
    ],
  },
};

describe("DealDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the deal hero with name and badges", () => {
    render(
      <DealDetail
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
      />
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "RCOE FlexiLab pilot"
    );
    expect(screen.getByText("Pre-feasibility")).toBeInTheDocument();
    expect(screen.getByText("Feasibility underway")).toBeInTheDocument();
  });

  it("renders back to deals link", () => {
    render(
      <DealDetail
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
      />
    );

    const backLink = screen.getByText(/back to deals/i);
    expect(backLink).toHaveAttribute("href", "/deals/list");
  });

  it("renders gate checklist accordion with progress badge", () => {
    render(
      <DealDetail
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
      />
    );

    expect(screen.getByText("Gate checklist")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("renders risks accordion section", () => {
    render(
      <DealDetail
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
      />
    );

    expect(screen.getByText("Risks and challenges")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders strategic actions accordion section", () => {
    render(
      <DealDetail
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
      />
    );

    expect(screen.getByText("Strategic actions")).toBeInTheDocument();
  });

  it("renders government programs accordion section", () => {
    render(
      <DealDetail
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
      />
    );

    expect(screen.getByText("Government programs and funding")).toBeInTheDocument();
  });

  it("renders timeline accordion section", () => {
    render(
      <DealDetail
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
      />
    );

    expect(screen.getByText("Timeline")).toBeInTheDocument();
  });

  it("renders the sidebar with opportunity type card", () => {
    render(
      <DealDetail
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
      />
    );

    expect(screen.getByText("Value chain adjacency.")).toBeInTheDocument();
    expect(screen.getByText("Feedstock certainty.")).toBeInTheDocument();
  });

  it("edit toggle shows classification form", () => {
    render(
      <DealDetail
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
      />
    );

    // Initially in view mode
    expect(screen.getByTestId("mode-toggle")).toHaveTextContent("Edit");
    expect(screen.queryByLabelText("Readiness state")).not.toBeInTheDocument();

    // Toggle to edit mode
    fireEvent.click(screen.getByTestId("mode-toggle"));

    expect(screen.getByTestId("mode-toggle")).toHaveTextContent("Editing");
    expect(screen.getByLabelText("Readiness state")).toBeInTheDocument();
    expect(screen.getByLabelText("Dominant constraint")).toBeInTheDocument();
  });

  it("editing readiness state shows Updated locally badge", () => {
    render(
      <DealDetail
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
      />
    );

    fireEvent.click(screen.getByTestId("mode-toggle"));

    const readinessSelect = screen.getByLabelText("Readiness state");
    fireEvent.change(readinessSelect, {
      target: { value: "conceptual-interest" },
    });

    expect(screen.getByText(/updated locally/i)).toBeInTheDocument();
  });
});
