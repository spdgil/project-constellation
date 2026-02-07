import { describe, it, expect } from "vitest";
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
  investmentValue: "$5.7m",
  economicImpact: "Major impact",
  keyStakeholders: ["QLD Government", "Mining3"],
  evidence: [],
  notes: [],
  updatedAt: "2026-02-06T00:00:00.000Z",
  gateChecklist: {},
  artefacts: {},
};

describe("DealHero", () => {
  it("renders deal name as h1", () => {
    render(
      <DealHero deal={mockDeal} opportunityTypes={mockOpportunityTypes} lgas={mockLgas} />
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "RCOE FlexiLab pilot"
    );
  });

  it("renders stage, readiness, and constraint badges", () => {
    render(
      <DealHero deal={mockDeal} opportunityTypes={mockOpportunityTypes} lgas={mockLgas} />
    );

    expect(screen.getByText("Pre-feasibility")).toBeInTheDocument();
    expect(screen.getByText("Feasibility underway")).toBeInTheDocument();
    expect(screen.getByText("Common-user infrastructure gap")).toBeInTheDocument();
  });

  it("renders opportunity type name and LGA names in meta line", () => {
    render(
      <DealHero deal={mockDeal} opportunityTypes={mockOpportunityTypes} lgas={mockLgas} />
    );

    expect(screen.getByText(/Critical minerals/)).toBeInTheDocument();
    expect(screen.getByText(/Mackay/)).toBeInTheDocument();
  });

  it("renders description paragraphs when description is provided", () => {
    render(
      <DealHero deal={mockDeal} opportunityTypes={mockOpportunityTypes} lgas={mockLgas} />
    );

    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
  });

  it("falls back to summary when description is not provided", () => {
    const dealWithoutDesc = { ...mockDeal, description: undefined };
    render(
      <DealHero deal={dealWithoutDesc} opportunityTypes={mockOpportunityTypes} lgas={mockLgas} />
    );

    expect(screen.getByText("Pilot processing facility.")).toBeInTheDocument();
  });

  it("renders investment value and economic impact", () => {
    render(
      <DealHero deal={mockDeal} opportunityTypes={mockOpportunityTypes} lgas={mockLgas} />
    );

    expect(screen.getByText("$5.7m")).toBeInTheDocument();
    expect(screen.getByText("Major impact")).toBeInTheDocument();
  });

  it("renders key stakeholders", () => {
    render(
      <DealHero deal={mockDeal} opportunityTypes={mockOpportunityTypes} lgas={mockLgas} />
    );

    expect(screen.getByText("QLD Government, Mining3")).toBeInTheDocument();
  });

  it("renders next step", () => {
    render(
      <DealHero deal={mockDeal} opportunityTypes={mockOpportunityTypes} lgas={mockLgas} />
    );

    expect(screen.getByText("Secure offtake.")).toBeInTheDocument();
  });
});
