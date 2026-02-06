import { describe, it, expect } from "vitest";
import {
  getBounds,
  createProjector,
  geometryToPathD,
  getFeatureCentroid,
  featuresToPathData,
} from "./geojson";
import type { GeoJSONFeatureCollection } from "./types";

const mockFc: GeoJSONFeatureCollection = {
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

describe("geojson", () => {
  it("getBounds returns min/max lng/lat", () => {
    const b = getBounds(mockFc);
    expect(b.minLng).toBe(149);
    expect(b.minLat).toBe(-21.3);
    expect(b.maxLng).toBe(149.5);
    expect(b.maxLat).toBe(-21);
  });

  it("createProjector maps lng/lat to x/y with north up", () => {
    const b = getBounds(mockFc);
    const project = createProjector(b, 100, 100);
    const p1 = project(149, -21.3);
    const p2 = project(149.5, -21);
    expect(p1.x).toBe(0);
    expect(p1.y).toBe(100);
    expect(p2.x).toBe(100);
    expect(p2.y).toBe(0);
  });

  it("geometryToPathD produces SVG path commands", () => {
    const b = getBounds(mockFc);
    const project = createProjector(b, 100, 100);
    const coords = mockFc.features[0].geometry.coordinates;
    const d = geometryToPathD(coords, project);
    expect(d).toMatch(/^M \d+ \d+ L .+ Z$/);
  });

  it("getFeatureCentroid returns center of first ring", () => {
    const b = getBounds(mockFc);
    const project = createProjector(b, 100, 100);
    const c = getFeatureCentroid(mockFc.features[0], project);
    expect(c).not.toBeNull();
    expect(c!.x).toBeGreaterThan(0);
    expect(c!.y).toBeGreaterThan(0);
  });

  it("featuresToPathData returns id, name, pathD per feature", () => {
    const b = getBounds(mockFc);
    const project = createProjector(b, 100, 100);
    const paths = featuresToPathData(mockFc, project);
    expect(paths).toHaveLength(1);
    expect(paths[0].id).toBe("mackay");
    expect(paths[0].name).toBe("Mackay");
    expect(paths[0].pathD).toMatch(/^M .+ Z$/);
  });
});
