import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { GeoJSONFeatureCollection } from "@/lib/types";
import type { Deal } from "@/lib/types";

/* ---------------------------------------------------------------------- */
/* Mock react-map-gl/mapbox so tests run in jsdom (no WebGL).             */
/* We render marker children and fire clicks on the fill layer via        */
/* the onClick prop captured from <Map>.                                  */
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

/* ---------------------------------------------------------------------- */
/* Test data                                                              */
/* ---------------------------------------------------------------------- */

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
    summary: "Pilot processing facility.",
    nextStep: "Secure offtake.",
    evidence: [],
    notes: [],
    updatedAt: "2026-02-06T00:00:00.000Z",
    gateChecklist: {},
    artefacts: {},
  },
];

const mockDealPositions = {
  "demo-flexilab": { lng: 149.19, lat: -21.15 },
};

/* ---------------------------------------------------------------------- */
/* Tests                                                                  */
/* ---------------------------------------------------------------------- */

describe("MapCanvas", () => {
  const originalEnv = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  beforeEach(() => {
    vi.resetModules();
    capturedMapProps = {};
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = originalEnv;
  });

  it("shows a helpful message when Mapbox token is not set", async () => {
    /* Override the env at module level via dynamic import */
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "");
    vi.resetModules();
    const { MapCanvas } = await import("./MapCanvas");

    render(
      <MapCanvas
        boundaries={mockBoundaries}
        selectedLgaId={null}
        onSelectLga={vi.fn()}
        deals={mockDeals}
        dealPositions={mockDealPositions}
        selectedDealId={null}
        onSelectDeal={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/mapbox token not configured/i)).toBeInTheDocument();
  });

  it("renders the Mapbox map and layers when token is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "pk.test_token");
    vi.resetModules();
    const { MapCanvas } = await import("./MapCanvas");

    render(
      <MapCanvas
        boundaries={mockBoundaries}
        selectedLgaId={null}
        onSelectLga={vi.fn()}
        deals={mockDeals}
        dealPositions={mockDealPositions}
        selectedDealId={null}
        onSelectDeal={vi.fn()}
      />,
    );

    expect(screen.getByTestId("mock-mapbox-map")).toBeInTheDocument();
    expect(screen.getByTestId("mock-layer-lga-fill")).toBeInTheDocument();
    expect(screen.getByTestId("mock-layer-lga-line")).toBeInTheDocument();
    expect(screen.getByTestId("mock-nav-control")).toBeInTheDocument();
  });

  it("renders deal marker buttons inside Mapbox markers", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "pk.test_token");
    vi.resetModules();
    const { MapCanvas } = await import("./MapCanvas");

    render(
      <MapCanvas
        boundaries={mockBoundaries}
        selectedLgaId={null}
        onSelectLga={vi.fn()}
        deals={mockDeals}
        dealPositions={mockDealPositions}
        selectedDealId={null}
        onSelectDeal={vi.fn()}
      />,
    );

    const markerButton = screen.getByRole("button", {
      name: /deal: RCOE FlexiLab pilot\. select to view details\./i,
    });
    expect(markerButton).toBeInTheDocument();
  });

  it("calls onSelectDeal when deal marker is clicked", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "pk.test_token");
    vi.resetModules();
    const { MapCanvas } = await import("./MapCanvas");
    const onSelectDeal = vi.fn();

    render(
      <MapCanvas
        boundaries={mockBoundaries}
        selectedLgaId={null}
        onSelectLga={vi.fn()}
        deals={mockDeals}
        dealPositions={mockDealPositions}
        selectedDealId={null}
        onSelectDeal={onSelectDeal}
      />,
    );

    const markerButton = screen.getByRole("button", {
      name: /deal: RCOE FlexiLab pilot\. select to view details\./i,
    });
    fireEvent.click(markerButton);
    expect(onSelectDeal).toHaveBeenCalledWith("demo-flexilab");
  });

  it("calls onSelectLga when map click hits an LGA feature", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "pk.test_token");
    vi.resetModules();
    const { MapCanvas } = await import("./MapCanvas");
    const onSelectLga = vi.fn();

    render(
      <MapCanvas
        boundaries={mockBoundaries}
        selectedLgaId={null}
        onSelectLga={onSelectLga}
        deals={[]}
        dealPositions={{}}
        selectedDealId={null}
        onSelectDeal={vi.fn()}
      />,
    );

    /* Simulate what Mapbox does: call onClick with features */
    const onClick = capturedMapProps.onClick as (e: MapMouseEvent) => void;
    expect(onClick).toBeDefined();
    onClick({
      features: [{ properties: { id: "mackay" } }],
    } as unknown as MapMouseEvent);

    expect(onSelectLga).toHaveBeenCalledWith("mackay");
  });

  it("deselects LGA when clicking an already-selected LGA", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "pk.test_token");
    vi.resetModules();
    const { MapCanvas } = await import("./MapCanvas");
    const onSelectLga = vi.fn();

    render(
      <MapCanvas
        boundaries={mockBoundaries}
        selectedLgaId="mackay"
        onSelectLga={onSelectLga}
        deals={[]}
        dealPositions={{}}
        selectedDealId={null}
        onSelectDeal={vi.fn()}
      />,
    );

    const onClick = capturedMapProps.onClick as (e: MapMouseEvent) => void;
    onClick({
      features: [{ properties: { id: "mackay" } }],
    } as unknown as MapMouseEvent);

    expect(onSelectLga).toHaveBeenCalledWith(null);
  });
});
