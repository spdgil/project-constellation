import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DealHero } from "./DealHero";
import type { Deal, LGA, OpportunityType } from "@/lib/types";

const mockLgas: LGA[] = [
  { id: "mackay", name: "Mackay", geometryRef: "mackay", notes: [] },
  { id: "isaac", name: "Isaac", geometryRef: "isaac", notes: [] },
];

const mockOpportunityTypes: OpportunityType[] = [
  {
    id: "critical-minerals",
    name: "Critical minerals",
    definition: "Test def",
    economicFunction: "",
    typicalCapitalStack: "",
    typicalRisks: "",
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
  description: "First paragraph.\n\nSecond paragraph.",
  nextStep: "Secure offtake.",
  keyStakeholders: ["QLD Government", "Mining3"],
  evidence: [],
  notes: [],
  updatedAt: "2026-02-06T00:00:00.000Z",
  gateChecklist: {},
  artefacts: {},
  investmentValueAmount: 5700000,
  investmentValueDescription: "Queensland Government funding",
  economicImpactAmount: 30000000000,
  economicImpactDescription: "Part of critical minerals pipeline",
};

const noopSave = vi.fn();
const noopUpdate = vi.fn();

const defaultProps = {
  deal: mockDeal,
  opportunityTypes: mockOpportunityTypes,
  lgas: mockLgas,
  isEditing: false,
  onSave: noopSave,
  onOptimisticUpdate: noopUpdate,
};

describe("DealHero", () => {
  it("renders deal name as h1", () => {
    render(<DealHero {...defaultProps} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "RCOE FlexiLab pilot"
    );
  });

  it("renders stage, readiness, and constraint badges", () => {
    render(<DealHero {...defaultProps} />);

    expect(screen.getByText("Pre-feasibility")).toBeInTheDocument();
    expect(screen.getByText("Feasibility underway")).toBeInTheDocument();
    expect(screen.getByText("Common-user infrastructure gap")).toBeInTheDocument();
  });

  it("renders opportunity type name and LGA names in meta line", () => {
    render(<DealHero {...defaultProps} />);

    expect(screen.getByText(/Critical minerals/)).toBeInTheDocument();
    expect(screen.getByText(/Mackay/)).toBeInTheDocument();
  });

  it("renders description paragraphs when description is provided", () => {
    render(<DealHero {...defaultProps} />);

    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
  });

  it("falls back to summary when description is not provided", () => {
    const dealWithoutDesc = { ...mockDeal, description: undefined };
    render(<DealHero {...defaultProps} deal={dealWithoutDesc} />);

    expect(screen.getByText("Pilot processing facility.")).toBeInTheDocument();
  });

  it("renders financial metrics with formatted values in view mode", () => {
    render(<DealHero {...defaultProps} />);

    expect(screen.getByText(/\$5\.7M/)).toBeInTheDocument();
    expect(screen.getByText(/Queensland Government funding/)).toBeInTheDocument();
    expect(screen.getByText(/\$30B/)).toBeInTheDocument();
  });

  it("renders dashes for empty financial metrics", () => {
    const emptyDeal = {
      ...mockDeal,
      investmentValueAmount: 0,
      investmentValueDescription: "",
      economicImpactAmount: 0,
      economicImpactDescription: "",
      economicImpactJobs: undefined,
    };
    render(<DealHero {...defaultProps} deal={emptyDeal} />);

    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBe(3); // investment, impact, jobs
  });

  it("renders input fields in edit mode", () => {
    render(<DealHero {...defaultProps} isEditing={true} />);

    expect(screen.getByLabelText("Investment amount")).toBeInTheDocument();
    expect(screen.getByLabelText("Investment description")).toBeInTheDocument();
    expect(screen.getByLabelText("Economic impact amount")).toBeInTheDocument();
    expect(screen.getByLabelText("Jobs count")).toBeInTheDocument();
  });

  it("renders key stakeholders", () => {
    render(<DealHero {...defaultProps} />);

    expect(screen.getByText("QLD Government, Mining3")).toBeInTheDocument();
  });

  it("renders next step", () => {
    render(<DealHero {...defaultProps} />);

    expect(screen.getByText("Secure offtake.")).toBeInTheDocument();
  });
});
