import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { MapView } from "./MapView";
import type { Deal, LGA, OpportunityType } from "@/lib/types";
import type { GeoJSONFeatureCollection } from "@/lib/types";

const mockLgas: LGA[] = [
  { id: "mackay", name: "Mackay", geometryRef: "mackay", notes: [] },
];

const mockBoundaries: GeoJSONFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "mackay",
      properties: { id: "mackay", name: "Mackay" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [149, -21.3],
            [149.5, -21.3],
            [149.5, -21],
            [149, -21],
            [149, -21.3],
          ],
        ],
      },
    },
  ],
};

const mockOpportunityTypes: OpportunityType[] = [
  {
    id: "critical-minerals",
    name: "Critical minerals",
    definition: "",
    economicFunction: "",
    typicalCapitalStack: "",
    typicalRisks: "",
  },
];

const mockDeals: Deal[] = [
  {
    id: "demo-flexilab",
    name: "RCOE FlexiLab pilot",
    opportunityTypeId: "critical-minerals",
    lgaIds: ["mackay"],
    stage: "feasibility",
    readinessState: "feasibility-underway",
    dominantConstraint: "common-user-infrastructure-gap",
    summary: "Pilot processing facility in Paget.",
    nextStep: "Secure offtake.",
    evidence: [],
    notes: [],
    updatedAt: "2026-02-06T00:00:00.000Z",
  },
];

describe("MapView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders map with LGA list and zoom controls", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />
    );

    expect(
      screen.getByRole("heading", { name: /explore by map/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /map zoom controls/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zoom in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset zoom/i })).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: /lga list/i });
    expect(nav).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Mackay" })).toBeInTheDocument();
  });

  it("opens Deal drawer when a deal marker is selected by click", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />
    );

    const dealMarker = screen.getByRole("button", {
      name: /deal: RCOE FlexiLab pilot\. select to view details\./i,
    });
    expect(dealMarker).toBeInTheDocument();

    expect(screen.queryByRole("dialog", { name: /deal details/i })).not.toBeInTheDocument();

    fireEvent.click(dealMarker);

    const drawer = screen.getByRole("dialog", { name: /deal details/i });
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByText("RCOE FlexiLab pilot")).toBeInTheDocument();
    expect(within(drawer).getByText("Secure offtake.")).toBeInTheDocument();
  });

  it("opens Deal drawer when deal marker is activated with keyboard (Enter)", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />
    );

    const dealMarker = screen.getByRole("button", {
      name: /deal: RCOE FlexiLab pilot\. select to view details\./i,
    });
    dealMarker.focus();
    expect(screen.queryByRole("dialog", { name: /deal details/i })).not.toBeInTheDocument();

    fireEvent.keyDown(dealMarker, { key: "Enter", code: "Enter" });

    expect(screen.getByRole("dialog", { name: /deal details/i })).toBeInTheDocument();
    expect(screen.getByText("RCOE FlexiLab pilot")).toBeInTheDocument();
  });

  it("opens Deal drawer when deal marker is activated with keyboard (Space)", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />
    );

    const dealMarker = screen.getByRole("button", {
      name: /deal: RCOE FlexiLab pilot\. select to view details\./i,
    });
    dealMarker.focus();
    fireEvent.keyDown(dealMarker, { key: " ", code: "Space" });

    expect(screen.getByRole("dialog", { name: /deal details/i })).toBeInTheDocument();
  });

  it("closes Deal drawer when Close is clicked", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />
    );

    const dealMarker = screen.getByRole("button", {
      name: /deal: RCOE FlexiLab pilot\. select to view details\./i,
    });
    fireEvent.click(dealMarker);
    expect(screen.getByRole("dialog", { name: /deal details/i })).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: /close deal drawer/i });
    fireEvent.click(closeButton);

    expect(screen.queryByRole("dialog", { name: /deal details/i })).not.toBeInTheDocument();
  });

  it("selecting an LGA via list opens LGA panel", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />
    );

    expect(screen.queryByRole("button", { name: /close lga panel/i })).not.toBeInTheDocument();

    const mackayButton = screen.getByRole("button", { name: "Mackay" });
    fireEvent.click(mackayButton);

    expect(screen.getByRole("button", { name: /close lga panel/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /mackay lga details/i })).toBeInTheDocument();
    expect(screen.getByText(/place context will appear here when connected/i)).toBeInTheDocument();
  });

  it("deselects LGA when same LGA button is clicked again", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />
    );

    const mackayButton = screen.getByRole("button", { name: "Mackay" });
    fireEvent.click(mackayButton);
    expect(screen.getByRole("button", { name: /close lga panel/i })).toBeInTheDocument();

    fireEvent.click(mackayButton);
    expect(screen.queryByRole("button", { name: /close lga panel/i })).not.toBeInTheDocument();
  });

  it("zoom controls have visible focus when focused", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />
    );

    const zoomIn = screen.getByRole("button", { name: /zoom in/i });
    zoomIn.focus();
    expect(zoomIn).toHaveFocus();
  });

  it("selecting a deal marker opens Deal drawer", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />
    );

    const dealMarker = screen.getByRole("button", {
      name: /deal: RCOE FlexiLab pilot\. select to view details\./i,
    });
    expect(screen.queryByRole("dialog", { name: /deal details/i })).not.toBeInTheDocument();
    fireEvent.click(dealMarker);
    expect(screen.getByRole("dialog", { name: /deal details/i })).toBeInTheDocument();
    expect(screen.getByText("RCOE FlexiLab pilot")).toBeInTheDocument();
  });

  it("clicking LGA polygon on map opens LGA panel", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />
    );

    expect(screen.queryByRole("region", { name: /mackay lga details/i })).not.toBeInTheDocument();

    const polygon = screen.getByTestId("lga-polygon-mackay");
    fireEvent.click(polygon);

    expect(screen.getByRole("region", { name: /mackay lga details/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close lga panel/i })).toBeInTheDocument();
  });
});
