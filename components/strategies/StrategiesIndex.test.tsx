import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { StrategiesIndex } from "./StrategiesIndex";
import type {
  SectorDevelopmentStrategy,
  StrategyGrade,
  SectorOpportunity,
} from "@/lib/types";

const mockSectorOpportunities: SectorOpportunity[] = [
  {
    id: "critical-minerals",
    name: "Critical Minerals Processing",
    version: "1.0",
    tags: [],
    sections: {
      "1": "",
      "2": "",
      "3": "",
      "4": "",
      "5": "",
      "6": "",
      "7": "",
      "8": "",
      "9": "",
      "10": "",
    },
    sources: [],
  },
  {
    id: "renewables",
    name: "Renewable Energy",
    version: "1.0",
    tags: [],
    sections: {
      "1": "",
      "2": "",
      "3": "",
      "4": "",
      "5": "",
      "6": "",
      "7": "",
      "8": "",
      "9": "",
      "10": "",
    },
    sources: [],
  },
];

const mockStrategies: SectorDevelopmentStrategy[] = [
  {
    id: "strat-1",
    title: "Mackay Minerals Strategy",
    type: "sector_development",
    status: "published",
    summary: "A critical minerals strategy.",
    components: { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "" },
    crossCuttingThemes: [],
    stakeholderCategories: [],
    prioritySectorIds: ["critical-minerals"],
  },
  {
    id: "strat-2",
    title: "Renewables Growth Plan",
    type: "sector_development",
    status: "draft",
    summary: "A renewables expansion plan for the region.",
    components: { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "" },
    crossCuttingThemes: [],
    stakeholderCategories: [],
    prioritySectorIds: ["renewables"],
  },
];

const mockGrades: StrategyGrade[] = [
  {
    id: "grade-1",
    strategyId: "strat-1",
    gradeLetter: "B",
    gradeRationaleShort: "Good coverage.",
    evidenceNotesByComponent: {},
    missingElements: [],
  },
];

describe("StrategiesIndex", () => {
  it("renders strategy list", () => {
    render(
      <StrategiesIndex
        strategies={mockStrategies}
        strategyGrades={mockGrades}
        sectorOpportunities={mockSectorOpportunities}
      />,
    );

    expect(screen.getByTestId("strategies-index")).toBeInTheDocument();
    expect(screen.getByTestId("strategies-results-list")).toBeInTheDocument();
    expect(screen.getByTestId("strategies-count")).toHaveTextContent(
      "2 strategies",
    );
  });

  it("shows strategy names and statuses", () => {
    render(
      <StrategiesIndex
        strategies={mockStrategies}
        strategyGrades={mockGrades}
        sectorOpportunities={mockSectorOpportunities}
      />,
    );

    expect(screen.getByText("Mackay Minerals Strategy")).toBeInTheDocument();
    expect(screen.getByText("Renewables Growth Plan")).toBeInTheDocument();

    // Draft badge appears for the draft strategy
    expect(screen.getByText("Draft")).toBeInTheDocument();

    // Grade badge appears for the graded strategy
    expect(screen.getByText("Grade B")).toBeInTheDocument();
  });

  it("links to individual strategy pages", () => {
    render(
      <StrategiesIndex
        strategies={mockStrategies}
        strategyGrades={mockGrades}
        sectorOpportunities={mockSectorOpportunities}
      />,
    );

    const grid = screen.getByTestId("strategies-results-list");

    // Published strategy links to detail page
    const publishedCard = within(grid)
      .getByText("Mackay Minerals Strategy")
      .closest("a");
    expect(publishedCard).toHaveAttribute("href", "/lga/strategies/strat-1");

    // Draft strategy links to draft page
    const draftCard = within(grid)
      .getByText("Renewables Growth Plan")
      .closest("a");
    expect(draftCard).toHaveAttribute("href", "/lga/strategies/strat-2/draft");
  });

  it("shows sector names on strategy cards", () => {
    render(
      <StrategiesIndex
        strategies={mockStrategies}
        strategyGrades={mockGrades}
        sectorOpportunities={mockSectorOpportunities}
      />,
    );

    expect(
      screen.getByText("Critical Minerals Processing"),
    ).toBeInTheDocument();
    expect(screen.getByText("Renewable Energy")).toBeInTheDocument();
  });
});
