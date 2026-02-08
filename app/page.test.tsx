import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/* Mock database queries so the async server component can render in tests */
vi.mock("@/lib/db/queries", () => ({
  loadLgas: () =>
    Promise.resolve([
      {
        id: "mackay",
        name: "Mackay",
        geometryRef: "mackay",
        summary: "Mining is a major driver.",
        opportunityHypotheses: [
          { id: "h1", name: "Critical minerals", summary: "", dominantConstraint: "common-user-infrastructure-gap" },
        ],
        activeDealIds: ["demo-flexilab"],
      },
    ]),
  loadDeals: () =>
    Promise.resolve([
      {
        id: "demo-flexilab",
        name: "RCOE FlexiLab pilot",
        opportunityTypeId: "critical-minerals",
        lgaIds: ["mackay"],
        stage: "pre-feasibility",
        readinessState: "feasibility-underway",
        dominantConstraint: "common-user-infrastructure-gap",
        summary: "Pilot processing facility.",
        nextStep: "Secure offtake.",
        evidence: [],
        notes: [],
        updatedAt: "2026-02-06T00:00:00.000Z",
        investmentValueAmount: 5_700_000,
        investmentValueDescription: "AUD $5.7M initial",
        economicImpactAmount: 10_000_000,
        economicImpactDescription: "AUD $10M GDP",
        economicImpactJobs: 150,
      },
    ]),
  loadDealsForMap: () =>
    Promise.resolve([
      {
        id: "demo-flexilab",
        name: "RCOE FlexiLab pilot",
        opportunityTypeId: "critical-minerals",
        lgaIds: ["mackay"],
        stage: "pre-feasibility",
        readinessState: "feasibility-underway",
        dominantConstraint: "common-user-infrastructure-gap",
        summary: "Pilot processing facility.",
        nextStep: "Secure offtake.",
        evidence: [],
        notes: [],
        updatedAt: "2026-02-06T00:00:00.000Z",
        investmentValueAmount: 5_700_000,
        investmentValueDescription: "AUD $5.7M initial",
        economicImpactAmount: 10_000_000,
        economicImpactDescription: "AUD $10M GDP",
        economicImpactJobs: 150,
      },
    ]),
  loadOpportunityTypes: () =>
    Promise.resolve([
      {
        id: "critical-minerals",
        name: "Critical minerals",
        definition: "",
        economicFunction: "",
        typicalCapitalStack: "",
        typicalRisks: "",
      },
    ]),
  loadSectorOpportunities: () =>
    Promise.resolve([
      {
        id: "critical-minerals-vcs",
        name: "Critical Minerals Value Chain Services",
        version: "1",
        tags: [],
        sections: {},
        sources: [],
      },
    ]),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

/* Mock MapCanvas — Mapbox GL not available in jsdom */
vi.mock("@/components/map/MapCanvas", () => ({
  MapCanvas: () => <div data-testid="map-canvas" />,
}));

/* Mock useBoundaries to avoid fetch("/api/boundaries") 404 in jsdom */
vi.mock("@/lib/hooks/useBoundaries", () => ({
  useBoundaries: () => ({
    boundaries: { type: "FeatureCollection", features: [] },
    boundaryError: null,
  }),
}));

describe("HomePage", () => {
  it("renders the HomeView with header and summary bar", async () => {
    const HomePage = (await import("./page")).default;
    const page = await HomePage();
    render(page);
    expect(screen.getByTestId("home-view")).toBeInTheDocument();
    expect(screen.getByText(/coordinated investment pipeline/i)).toBeInTheDocument();
    expect(screen.getByTestId("summary-bar")).toBeInTheDocument();
  });

  it("renders summary metrics", async () => {
    const HomePage = (await import("./page")).default;
    const page = await HomePage();
    render(page);
    expect(screen.getByText("Total deals")).toBeInTheDocument();
    expect(screen.getByText("Investment")).toBeInTheDocument();
    expect(screen.getByText("$5.7M")).toBeInTheDocument();
  });

  it("renders the embedded map", async () => {
    const HomePage = (await import("./page")).default;
    const page = await HomePage();
    render(page);
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
  });
});
