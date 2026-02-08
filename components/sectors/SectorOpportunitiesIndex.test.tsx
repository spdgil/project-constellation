import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import {
  SectorOpportunitiesIndex,
  type SectorStats,
} from "./SectorOpportunitiesIndex";
import type { SectorOpportunity } from "@/lib/types";

const mockSectorOpportunities: SectorOpportunity[] = [
  {
    id: "critical-minerals",
    name: "Critical Minerals Processing",
    version: "1.0",
    tags: ["mining", "processing"],
    sections: {
      "1": "Critical minerals supply chain opportunity.",
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
    tags: ["energy", "solar"],
    sections: {
      "1": "Solar and wind energy generation.",
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

const mockSectorStats: Record<string, SectorStats> = {
  "critical-minerals": {
    dealCount: 3,
    totalInvestment: 5000000,
    totalEconomicImpact: 10000000,
    totalJobs: 150,
    strategyCount: 1,
  },
  renewables: {
    dealCount: 1,
    totalInvestment: 2000000,
    totalEconomicImpact: 4000000,
    totalJobs: 50,
    strategyCount: 1,
  },
};

describe("SectorOpportunitiesIndex", () => {
  it("renders list of sector opportunities", () => {
    render(
      <SectorOpportunitiesIndex
        sectorOpportunities={mockSectorOpportunities}
        sectorStats={mockSectorStats}
        totalDeals={4}
        totalStrategies={2}
      />,
    );

    expect(screen.getByTestId("sectors-index")).toBeInTheDocument();
    expect(screen.getByTestId("sectors-results-list")).toBeInTheDocument();
    expect(screen.getByTestId("sectors-count")).toHaveTextContent("2 sectors");
  });

  it("shows sector names", () => {
    render(
      <SectorOpportunitiesIndex
        sectorOpportunities={mockSectorOpportunities}
        sectorStats={mockSectorStats}
        totalDeals={4}
        totalStrategies={2}
      />,
    );

    expect(
      screen.getByText("Critical Minerals Processing"),
    ).toBeInTheDocument();
    expect(screen.getByText("Renewable Energy")).toBeInTheDocument();
  });

  it("links to individual sector pages", () => {
    render(
      <SectorOpportunitiesIndex
        sectorOpportunities={mockSectorOpportunities}
        sectorStats={mockSectorStats}
        totalDeals={4}
        totalStrategies={2}
      />,
    );

    const grid = screen.getByTestId("sectors-results-list");

    const mineralsCard = within(grid)
      .getByText("Critical Minerals Processing")
      .closest("a");
    expect(mineralsCard).toHaveAttribute("href", "/sectors/critical-minerals");

    const renewablesCard = within(grid)
      .getByText("Renewable Energy")
      .closest("a");
    expect(renewablesCard).toHaveAttribute("href", "/sectors/renewables");
  });

  it("shows sector tags", () => {
    render(
      <SectorOpportunitiesIndex
        sectorOpportunities={mockSectorOpportunities}
        sectorStats={mockSectorStats}
        totalDeals={4}
        totalStrategies={2}
      />,
    );

    // Tags are humanised (first letter capitalised).
    // Tags also appear in the filter dropdown, so use getAllByText.
    expect(screen.getAllByText("Mining").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Processing").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Energy").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Solar").length).toBeGreaterThanOrEqual(1);
  });
});
