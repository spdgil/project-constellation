import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DealSidebar } from "./DealSidebar";
import type { Deal, LGA, OpportunityType } from "@/lib/types";

const mockLgas: LGA[] = [
  {
    id: "mackay",
    name: "Mackay",
    geometryRef: "mackay",
    notes: [],
    summary: "Mining is a major driver.",
    repeatedConstraints: ["common-user-infrastructure-gap", "skills-and-workforce-constraint"],
  },
];

const mockOpportunityTypes: OpportunityType[] = [
  {
    id: "critical-minerals",
    name: "Critical minerals",
    definition: "Value chain adjacency.",
    economicFunction: "Diversification from METS base.",
    typicalCapitalStack: "Government and industry co-investment.",
    typicalRisks: "Feedstock certainty.",
  },
];

const baseDeal: Deal = {
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
};

const relatedDeal: Deal = {
  ...baseDeal,
  id: "related-project",
  name: "Related Mining Project",
  stage: "definition",
};

describe("DealSidebar", () => {
  it("renders opportunity type card with definition and risks", () => {
    render(
      <DealSidebar
        deal={baseDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[baseDeal]}
        sectorOpportunities={[]}
      />
    );

    expect(screen.getByText("Critical minerals")).toBeInTheDocument();
    expect(screen.getByText("Value chain adjacency.")).toBeInTheDocument();
    expect(screen.getByText("Government and industry co-investment.")).toBeInTheDocument();
    expect(screen.getByText("Feedstock certainty.")).toBeInTheDocument();
  });

  it("renders LGA context card with summary and repeated constraints", () => {
    render(
      <DealSidebar
        deal={baseDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[baseDeal]}
        sectorOpportunities={[]}
      />
    );

    expect(screen.getByText("Mackay")).toBeInTheDocument();
    expect(screen.getByText("Mining is a major driver.")).toBeInTheDocument();
    expect(screen.getByText("Common-user infrastructure gap")).toBeInTheDocument();
    expect(screen.getByText("Skills and workforce constraint")).toBeInTheDocument();
  });

  it("renders related deals as links with stage badges", () => {
    render(
      <DealSidebar
        deal={baseDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[baseDeal, relatedDeal]}
        sectorOpportunities={[]}
      />
    );

    expect(screen.getByText("Related Mining Project")).toBeInTheDocument();
    const link = screen.getByText("Related Mining Project").closest("a");
    expect(link).toHaveAttribute("href", "/deals/related-project");
  });

  it("does not render related deals card when there are no related deals", () => {
    render(
      <DealSidebar
        deal={baseDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        allDeals={[baseDeal]}
        sectorOpportunities={[]}
      />
    );

    expect(screen.queryByText("Related deals")).not.toBeInTheDocument();
  });
});
