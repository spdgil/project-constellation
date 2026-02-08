import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { HomeView } from "./HomeView";
import type { Deal } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

/* ---- Mock MapCanvas (Mapbox GL not available in jsdom) ---- */
vi.mock("@/components/map/MapCanvas", () => ({
  MapCanvas: () => <div data-testid="map-canvas" />,
}));

const mockDeals: Deal[] = [
  {
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
    investmentValueAmount: 5_000_000,
    investmentValueDescription: "$5M",
    economicImpactAmount: 10_000_000,
    economicImpactDescription: "$10M GDP",
    economicImpactJobs: 120,
  },
  {
    id: "solar-project",
    name: "Solar farm proposal",
    opportunityTypeId: "renewables",
    lgaIds: ["isaac"],
    stage: "definition",
    readinessState: "conceptual-interest",
    dominantConstraint: "planning-and-approvals",
    summary: "Solar.",
    nextStep: "Site assessment.",
    evidence: [],
    notes: [],
    updatedAt: "2026-02-06T00:00:00.000Z",
    gateChecklist: {},
    artefacts: {},
    investmentValueAmount: 3_000_000,
    investmentValueDescription: "$3M",
    economicImpactAmount: 7_000_000,
    economicImpactDescription: "$7M GDP",
    economicImpactJobs: 80,
  },
];

describe("HomeView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ type: "FeatureCollection", features: [] }),
    });
  });

  it("renders the home view with header and summary bar", () => {
    render(
      <HomeView deals={mockDeals} />,
    );

    expect(screen.getByTestId("home-view")).toBeInTheDocument();
    expect(screen.getByText(/coordinated investment pipeline/i)).toBeInTheDocument();
    expect(screen.getByTestId("summary-bar")).toBeInTheDocument();
  });

  it("renders navigation links to Deals, Sectors, and LGA", () => {
    render(
      <HomeView deals={mockDeals} />,
    );

    const navLinks = screen.getByTestId("nav-links");
    expect(within(navLinks).getByRole("link", { name: /deals/i })).toHaveAttribute("href", "/deals/list");
    expect(within(navLinks).getByRole("link", { name: /sectors/i })).toHaveAttribute("href", "/sectors");
    expect(within(navLinks).getByRole("link", { name: /lga/i })).toHaveAttribute("href", "/lga");
  });

  it("renders summary card metrics computed from deals", () => {
    render(
      <HomeView deals={mockDeals} />,
    );

    const bar = screen.getByTestId("summary-bar");
    expect(within(bar).getByText("Total deals")).toBeInTheDocument();
    // Use getAllByText since "2" also appears as a stage number in the pipeline
    expect(within(bar).getAllByText("2").length).toBeGreaterThanOrEqual(1);
    expect(within(bar).getByText("Investment")).toBeInTheDocument();
    expect(within(bar).getByText("$8M")).toBeInTheDocument();
    expect(within(bar).getByText("Economic impact")).toBeInTheDocument();
    expect(within(bar).getByText("$17M")).toBeInTheDocument();
    expect(within(bar).getByText("Jobs identified")).toBeInTheDocument();
    expect(within(bar).getByText("200")).toBeInTheDocument();
  });

  it("renders the embedded map container", () => {
    render(
      <HomeView deals={mockDeals} />,
    );

    expect(screen.getByTestId("map-container")).toBeInTheDocument();
  });

  it("stats recompute when deals change", () => {
    const singleDeal = [mockDeals[0]];

    const { rerender } = render(
      <HomeView deals={singleDeal} />,
    );

    const bar = screen.getByTestId("summary-bar");
    expect(within(bar).getByText("$5M")).toBeInTheDocument();

    rerender(
      <HomeView deals={mockDeals} />,
    );

    expect(within(bar).getByText("$8M")).toBeInTheDocument();
  });

  it("renders the static intro text", () => {
    render(
      <HomeView deals={mockDeals} />,
    );

    expect(screen.getByText(/coordinated investment pipeline/i)).toBeInTheDocument();
  });
});
