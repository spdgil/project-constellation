import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DealDetail } from "./DealDetail";
import type { Deal, LGA, OpportunityType } from "@/lib/types";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));

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
  investmentValueAmount: 0,
  investmentValueDescription: "",
  economicImpactAmount: 0,
  economicImpactDescription: "",
};

describe("DealDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders the deal hero with name and badges", () => {
    render(
      <DealDetail
        deal={mockDeal}
        dealId={mockDeal.id}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
        sectorOpportunities={[]}
      />
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "RCOE FlexiLab pilot"
    );
    // Stats bar and hero both show "Pre-feasibility"
    expect(screen.getAllByText("Pre-feasibility").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Feasibility underway")).toBeInTheDocument();
  });

  it("renders back to deals link", () => {
    render(
      <DealDetail
        deal={mockDeal}
        dealId={mockDeal.id}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
        sectorOpportunities={[]}
      />
    );

    const backLink = screen.getByText(/back to deals/i);
    expect(backLink).toHaveAttribute("href", "/deals/list");
  });

  it("renders gate checklist accordion with progress badge", () => {
    render(
      <DealDetail
        deal={mockDeal}
        dealId={mockDeal.id}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
        sectorOpportunities={[]}
      />
    );

    expect(screen.getByText("Gate checklist")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("renders risks accordion section", () => {
    render(
      <DealDetail
        deal={mockDeal}
        dealId={mockDeal.id}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
        sectorOpportunities={[]}
      />
    );

    expect(screen.getByText("Risks and challenges")).toBeInTheDocument();
    // Badge "2" appears in multiple places (pathway stepper, risks count)
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
  });

  it("renders strategic actions accordion section", () => {
    render(
      <DealDetail
        deal={mockDeal}
        dealId={mockDeal.id}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
        sectorOpportunities={[]}
      />
    );

    expect(screen.getByText("Strategic actions")).toBeInTheDocument();
  });

  it("renders government programs accordion section", () => {
    render(
      <DealDetail
        deal={mockDeal}
        dealId={mockDeal.id}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
        sectorOpportunities={[]}
      />
    );

    expect(screen.getByText("Government programs and funding")).toBeInTheDocument();
  });

  it("renders timeline accordion section", () => {
    render(
      <DealDetail
        deal={mockDeal}
        dealId={mockDeal.id}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
        sectorOpportunities={[]}
      />
    );

    expect(screen.getByText("Timeline")).toBeInTheDocument();
  });

  it("renders the sidebar with opportunity type card", () => {
    render(
      <DealDetail
        deal={mockDeal}
        dealId={mockDeal.id}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
        sectorOpportunities={[]}
      />
    );

    expect(screen.getByText("Value chain adjacency.")).toBeInTheDocument();
    expect(screen.getByText("Feedstock certainty.")).toBeInTheDocument();
  });

  it("edit toggle shows classification form", () => {
    render(
      <DealDetail
        deal={mockDeal}
        dealId={mockDeal.id}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
        sectorOpportunities={[]}
      />
    );

    // Initially in view mode
    expect(screen.getByTestId("mode-toggle")).toHaveTextContent("Edit");
    expect(screen.queryByLabelText("Readiness state")).not.toBeInTheDocument();

    // Toggle to edit mode
    fireEvent.click(screen.getByTestId("mode-toggle"));

    expect(screen.getByTestId("mode-toggle")).toHaveTextContent("Done");
    expect(screen.getByLabelText("Readiness state")).toBeInTheDocument();
    expect(screen.getByLabelText("Dominant constraint")).toBeInTheDocument();
  });

  it("renders document directory accordion section", () => {
    const dealWithDocs: Deal = {
      ...mockDeal,
      documents: [
        {
          id: "doc-1",
          fileName: "investment-memo.pdf",
          mimeType: "application/pdf",
          sizeBytes: 245760,
          fileUrl: "https://example.com/investment-memo.pdf",
          addedAt: "2026-02-06T00:00:00.000Z",
          label: "Investment Memo Q1 2026",
        },
      ],
    };

    render(
      <DealDetail
        deal={dealWithDocs}
        dealId={dealWithDocs.id}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[dealWithDocs]}
        sectorOpportunities={[]}
      />
    );

    // Accordion header visible with badge
    expect(screen.getByText("Document directory")).toBeInTheDocument();
    // Badge "1" appears in multiple places (gate checklist, document directory)
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);

    // Expand the accordion to see contents
    fireEvent.click(screen.getByText("Document directory"));

    expect(screen.getByText("Investment Memo Q1 2026")).toBeInTheDocument();
    expect(screen.getByText(/240\.0 KB/)).toBeInTheDocument();
    expect(screen.getByText("Download")).toBeInTheDocument();
    expect(screen.getByText("+ Add document")).toBeInTheDocument();
  });

  it("shows empty document directory when no documents", () => {
    render(
      <DealDetail
        deal={mockDeal}
        dealId={mockDeal.id}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
        sectorOpportunities={[]}
      />
    );

    expect(screen.getByText("Document directory")).toBeInTheDocument();

    // Expand the accordion
    fireEvent.click(screen.getByText("Document directory"));

    expect(screen.getByText("No documents attached yet.")).toBeInTheDocument();
  });

  it("editing readiness state calls PATCH API", async () => {
    // Mock the PATCH API response
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockDeal,
        readinessState: "conceptual-interest",
        updatedAt: new Date().toISOString(),
      }),
    });

    render(
      <DealDetail
        deal={mockDeal}
        dealId={mockDeal.id}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[mockDeal]}
        sectorOpportunities={[]}
      />
    );

    fireEvent.click(screen.getByTestId("mode-toggle"));

    const readinessSelect = screen.getByLabelText("Readiness state");
    fireEvent.change(readinessSelect, {
      target: { value: "conceptual-interest" },
    });

    // Verify API was called
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/deals/${mockDeal.id}`,
      expect.objectContaining({
        method: "PATCH",
      })
    );
  });
});
