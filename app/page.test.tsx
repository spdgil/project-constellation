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
}));

describe("HomePage", () => {
  it("renders the HomeView with Overview and Map tabs", async () => {
    const HomePage = (await import("./page")).default;
    const page = await HomePage({ searchParams: Promise.resolve({}) });
    render(page);
    expect(screen.getByTestId("home-view")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /map/i })).toBeInTheDocument();
  });

  it("defaults to Overview tab with dynamic metrics", async () => {
    const HomePage = (await import("./page")).default;
    const page = await HomePage({ searchParams: Promise.resolve({}) });
    render(page);
    expect(screen.getByTestId("overview-tab")).toBeInTheDocument();
    expect(screen.getByText("Deals")).toBeInTheDocument();
    expect(screen.getByText("Investment")).toBeInTheDocument();
    // $5.7M appears in both top metric and OT card
    expect(screen.getAllByText("$5.7M").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Pipeline readiness")).toBeInTheDocument();
  });

  it("renders GW LGA cards", async () => {
    const HomePage = (await import("./page")).default;
    const page = await HomePage({ searchParams: Promise.resolve({}) });
    render(page);
    expect(screen.getByRole("heading", { name: "Mackay" })).toBeInTheDocument();
    expect(screen.getByText(/1 hypothesis/i)).toBeInTheDocument();
  });
});
