import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent, act } from "@testing-library/react";
import { MapView } from "./MapView";
import type { Deal, LGA, OpportunityType } from "@/lib/types";
import type { GeoJSONFeatureCollection } from "@/lib/types";

/* ---------------------------------------------------------------------- */
/* Mock react-map-gl/mapbox (no WebGL in jsdom)                           */
/* ---------------------------------------------------------------------- */

let capturedMapProps: Record<string, unknown> = {};

vi.mock("react-map-gl/mapbox", () => {
  const React = require("react"); // eslint-disable-line @typescript-eslint/no-require-imports
  return {
    __esModule: true,
    default: React.forwardRef(function MockMap(
      props: Record<string, unknown> & { children?: React.ReactNode },
      _ref: unknown,
    ) {
      capturedMapProps = props;
      return (
        <div data-testid="mock-mapbox-map">
          {props.children}
        </div>
      );
    }),
    Source: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="mock-source">{children}</div>
    ),
    Layer: ({ id }: { id: string }) => <div data-testid={`mock-layer-${id}`} />,
    Marker: ({
      children,
    }: {
      children?: React.ReactNode;
      longitude: number;
      latitude: number;
      anchor?: string;
    }) => <div data-testid="mock-marker">{children}</div>,
    NavigationControl: () => <div data-testid="mock-nav-control" />,
  };
});

vi.mock("mapbox-gl/dist/mapbox-gl.css", () => ({}));

/* Ensure the token is set so MapCanvas renders the map, not the fallback */
vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "pk.test_token");

/* ---------------------------------------------------------------------- */
/* Test data                                                              */
/* ---------------------------------------------------------------------- */

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
    lat: -21.15,
    lng: 149.19,
    stage: "pre-feasibility",
    readinessState: "feasibility-underway",
    dominantConstraint: "common-user-infrastructure-gap",
    summary: "Pilot processing facility in Paget.",
    nextStep: "Secure offtake.",
    evidence: [],
    notes: [],
    updatedAt: "2026-02-06T00:00:00.000Z",
  },
];

/* ---------------------------------------------------------------------- */
/* Tests                                                                  */
/* ---------------------------------------------------------------------- */

describe("MapView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedMapProps = {};
  });

  it("renders heading, description text, and LGA list", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /explore by map/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/greater whitsunday lga boundaries/i),
    ).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: /lga list/i });
    expect(nav).toBeInTheDocument();
    expect(
      within(nav).getByRole("button", { name: "Mackay" }),
    ).toBeInTheDocument();
  });

  it("renders the Mapbox map component", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />,
    );

    expect(screen.getByTestId("mock-mapbox-map")).toBeInTheDocument();
  });

  it("renders deal marker buttons", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />,
    );

    const dealMarker = screen.getByRole("button", {
      name: /deal: RCOE FlexiLab pilot\. select to view details\./i,
    });
    expect(dealMarker).toBeInTheDocument();
  });

  it("opens Deal drawer when a deal marker is clicked", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />,
    );

    const dealMarker = screen.getByRole("button", {
      name: /deal: RCOE FlexiLab pilot\. select to view details\./i,
    });
    expect(
      screen.queryByRole("dialog", { name: /deal details/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(dealMarker);

    const drawer = screen.getByRole("dialog", { name: /deal details/i });
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByText("RCOE FlexiLab pilot")).toBeInTheDocument();
    expect(within(drawer).getByText("Secure offtake.")).toBeInTheDocument();
  });

  it("opens Deal drawer with keyboard (Enter)", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />,
    );

    const dealMarker = screen.getByRole("button", {
      name: /deal: RCOE FlexiLab pilot\. select to view details\./i,
    });
    dealMarker.focus();
    fireEvent.keyDown(dealMarker, { key: "Enter", code: "Enter" });

    expect(
      screen.getByRole("dialog", { name: /deal details/i }),
    ).toBeInTheDocument();
  });

  it("opens Deal drawer with keyboard (Space)", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />,
    );

    const dealMarker = screen.getByRole("button", {
      name: /deal: RCOE FlexiLab pilot\. select to view details\./i,
    });
    dealMarker.focus();
    fireEvent.keyDown(dealMarker, { key: " ", code: "Space" });

    expect(
      screen.getByRole("dialog", { name: /deal details/i }),
    ).toBeInTheDocument();
  });

  it("closes Deal drawer when Close is clicked", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />,
    );

    const dealMarker = screen.getByRole("button", {
      name: /deal: RCOE FlexiLab pilot\. select to view details\./i,
    });
    fireEvent.click(dealMarker);
    expect(
      screen.getByRole("dialog", { name: /deal details/i }),
    ).toBeInTheDocument();

    const closeButton = screen.getByRole("button", {
      name: /close deal drawer/i,
    });
    fireEvent.click(closeButton);

    expect(
      screen.queryByRole("dialog", { name: /deal details/i }),
    ).not.toBeInTheDocument();
  });

  it("selecting an LGA via list opens bottom sheet with LGA details", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /close lga panel/i }),
    ).not.toBeInTheDocument();

    const mackayButton = screen.getByRole("button", { name: "Mackay" });
    fireEvent.click(mackayButton);

    expect(
      screen.getByRole("button", { name: /close lga panel/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /mackay lga details/i }),
    ).toBeInTheDocument();
    /* Bottom sheet drag handle is present */
    expect(
      screen.getByRole("separator", { name: /resize lga detail panel/i }),
    ).toBeInTheDocument();
  });

  it("deselects LGA when same LGA button is clicked again", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />,
    );

    const mackayButton = screen.getByRole("button", { name: "Mackay" });
    fireEvent.click(mackayButton);
    expect(
      screen.getByRole("button", { name: /close lga panel/i }),
    ).toBeInTheDocument();

    fireEvent.click(mackayButton);
    expect(
      screen.queryByRole("button", { name: /close lga panel/i }),
    ).not.toBeInTheDocument();
  });

  it("selects LGA when map click fires on an LGA feature", () => {
    render(
      <MapView
        lgas={mockLgas}
        deals={mockDeals}
        opportunityTypes={mockOpportunityTypes}
        boundaries={mockBoundaries}
      />,
    );

    /* Simulate Mapbox click on the LGA fill layer */
    const onClick = capturedMapProps.onClick as (e: unknown) => void;
    expect(onClick).toBeDefined();
    act(() => {
      onClick({
        features: [{ properties: { id: "mackay" } }],
      });
    });

    expect(
      screen.getByRole("region", { name: /mackay lga details/i }),
    ).toBeInTheDocument();
  });
});
