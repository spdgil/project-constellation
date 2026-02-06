import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/* Mock data loaders so the async server component can render in tests */
vi.mock("@/lib/data", () => ({
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
  it("renders the app title", async () => {
    const HomePage = (await import("./page")).default;
    const page = await HomePage();
    render(page);
    expect(
      screen.getByRole("heading", { name: /project constellation/i }),
    ).toBeInTheDocument();
  });

  it("renders pipeline and LGA sections (entry links moved to header tabs)", async () => {
    const HomePage = (await import("./page")).default;
    const page = await HomePage();
    render(page);
    expect(screen.getByText(/pipeline at a glance/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /greater whitsunday lgas/i }),
    ).toBeInTheDocument();
  });

  it("renders key figures from data", async () => {
    const HomePage = (await import("./page")).default;
    const page = await HomePage();
    render(page);
    expect(screen.getByText("LGAs")).toBeInTheDocument();
    expect(screen.getByText("Opportunity types")).toBeInTheDocument();
    expect(screen.getByText("Deal exemplars")).toBeInTheDocument();
    expect(screen.getByText("Gross regional product")).toBeInTheDocument();
  });

  it("renders pipeline at a glance", async () => {
    const HomePage = (await import("./page")).default;
    const page = await HomePage();
    render(page);
    expect(screen.getByText(/deals by readiness/i)).toBeInTheDocument();
    expect(screen.getByText(/most common constraints/i)).toBeInTheDocument();
    expect(screen.getByText("Feasibility underway")).toBeInTheDocument();
  });

  it("renders LGA snapshot cards", async () => {
    const HomePage = (await import("./page")).default;
    const page = await HomePage();
    render(page);
    expect(
      screen.getByRole("heading", { name: "Mackay" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /greater whitsunday lgas/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 hypothesis/i)).toBeInTheDocument();
  });
});
