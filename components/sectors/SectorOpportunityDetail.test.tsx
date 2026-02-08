import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectorOpportunityDetail } from "./SectorOpportunityDetail";
import type {
  SectorOpportunity,
  SectorDevelopmentStrategy,
  Deal,
  LGA,
} from "@/lib/types";

const mockSectorOpportunity: SectorOpportunity = {
  id: "critical-minerals",
  name: "Critical Minerals Processing",
  version: "2.1",
  tags: ["mining", "processing", "export"],
  sections: {
    "1": "Critical minerals represent a strategic opportunity for regions with existing mining infrastructure.",
    "2": "Global demand for rare earths and lithium is driven by EV and battery manufacturing.",
    "3": "The sector contributes to GDP through export earnings and import substitution.",
    "4": "",
    "5": "",
    "6": "",
    "7": "",
    "8": "",
    "9": "",
    "10": "",
  },
  sources: ["ABS 2021", "QLD Resources Plan"],
};

const mockLinkedStrategies: SectorDevelopmentStrategy[] = [
  {
    id: "strat-1",
    title: "Mackay Minerals Strategy",
    type: "sector_development",
    status: "published",
    summary: "Regional minerals strategy.",
    components: { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "" },
    crossCuttingThemes: [],
    stakeholderCategories: [],
    prioritySectorIds: ["critical-minerals"],
  },
];

const mockLinkedDeals: Deal[] = [
  {
    id: "deal-1",
    name: "FlexiLab Pilot",
    opportunityTypeId: "critical-minerals",
    lgaIds: ["mackay"],
    stage: "pre-feasibility",
    readinessState: "feasibility-underway",
    dominantConstraint: "common-user-infrastructure-gap",
    summary: "Pilot facility.",
    nextStep: "Secure offtake.",
    evidence: [],
    notes: [],
    updatedAt: "2026-02-06T00:00:00.000Z",
    gateChecklist: {},
    artefacts: {},
    investmentValueAmount: 5000000,
    investmentValueDescription: "",
    economicImpactAmount: 10000000,
    economicImpactDescription: "",
  },
];

const mockLinkedLgas: LGA[] = [
  {
    id: "mackay",
    name: "Mackay",
    geometryRef: "mackay",
    notes: [],
  },
];

describe("SectorOpportunityDetail", () => {
  it("renders sector name and version", () => {
    render(
      <SectorOpportunityDetail
        sectorOpportunity={mockSectorOpportunity}
        linkedStrategies={mockLinkedStrategies}
        linkedDeals={mockLinkedDeals}
        linkedLgas={mockLinkedLgas}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Critical Minerals Processing",
    );
    expect(screen.getByText("Version 2.1")).toBeInTheDocument();
  });

  it("renders section content", () => {
    render(
      <SectorOpportunityDetail
        sectorOpportunity={mockSectorOpportunity}
        linkedStrategies={mockLinkedStrategies}
        linkedDeals={mockLinkedDeals}
        linkedLgas={mockLinkedLgas}
      />,
    );

    // Section 1 content is always visible
    expect(
      screen.getByText(
        "Critical minerals represent a strategic opportunity for regions with existing mining infrastructure.",
      ),
    ).toBeInTheDocument();

    // Section 2 accordion title is rendered
    expect(
      screen.getByText("Structural Drivers of the Opportunity"),
    ).toBeInTheDocument();
  });

  it("shows tags", () => {
    render(
      <SectorOpportunityDetail
        sectorOpportunity={mockSectorOpportunity}
        linkedStrategies={mockLinkedStrategies}
        linkedDeals={mockLinkedDeals}
        linkedLgas={mockLinkedLgas}
      />,
    );

    // Tags are humanised (first letter capitalised)
    expect(screen.getByText("Mining")).toBeInTheDocument();
    expect(screen.getByText("Processing")).toBeInTheDocument();
    expect(screen.getByText("Export")).toBeInTheDocument();
  });

  it("renders back link to all sectors", () => {
    render(
      <SectorOpportunityDetail
        sectorOpportunity={mockSectorOpportunity}
        linkedStrategies={mockLinkedStrategies}
        linkedDeals={mockLinkedDeals}
        linkedLgas={mockLinkedLgas}
      />,
    );

    const backLink = screen.getByText("← All sector opportunities");
    expect(backLink).toHaveAttribute("href", "/sectors");
  });

  it("renders linked deals in sidebar", () => {
    render(
      <SectorOpportunityDetail
        sectorOpportunity={mockSectorOpportunity}
        linkedStrategies={mockLinkedStrategies}
        linkedDeals={mockLinkedDeals}
        linkedLgas={mockLinkedLgas}
      />,
    );

    expect(screen.getByText("FlexiLab Pilot")).toBeInTheDocument();
  });

  it("renders linked LGAs in sidebar", () => {
    render(
      <SectorOpportunityDetail
        sectorOpportunity={mockSectorOpportunity}
        linkedStrategies={mockLinkedStrategies}
        linkedDeals={mockLinkedDeals}
        linkedLgas={mockLinkedLgas}
      />,
    );

    expect(screen.getByText("Mackay")).toBeInTheDocument();
  });

  it("renders linked strategies in sidebar", () => {
    render(
      <SectorOpportunityDetail
        sectorOpportunity={mockSectorOpportunity}
        linkedStrategies={mockLinkedStrategies}
        linkedDeals={mockLinkedDeals}
        linkedLgas={mockLinkedLgas}
      />,
    );

    expect(screen.getByText("Mackay Minerals Strategy")).toBeInTheDocument();
  });
});
