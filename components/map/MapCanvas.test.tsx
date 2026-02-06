import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MapCanvas } from "./MapCanvas";

const defaultLgaPaths = [
  { id: "mackay", name: "Mackay", pathD: "M 0 0 L 100 0 L 100 100 L 0 100 Z" },
];

const defaultProps = {
  lgaPaths: defaultLgaPaths,
  mapWidth: 800,
  mapHeight: 600,
  selectedLgaId: null as string | null,
  onSelectLga: vi.fn(),
  zoom: 1,
  onZoomIn: vi.fn(),
  onZoomOut: vi.fn(),
  onReset: vi.fn(),
};

describe("MapCanvas", () => {
  it("renders Map canvas label and zoom controls", () => {
    render(
      <MapCanvas {...defaultProps}>
        <span>Marker</span>
      </MapCanvas>
    );

    expect(screen.getByText("Map canvas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zoom in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset zoom/i })).toBeInTheDocument();
    expect(screen.getByText("Marker")).toBeInTheDocument();
  });

  it("calls onZoomIn when Zoom in is clicked", () => {
    const onZoomIn = vi.fn();
    render(
      <MapCanvas {...defaultProps} onZoomIn={onZoomIn}>
        <span />
      </MapCanvas>
    );

    fireEvent.click(screen.getByRole("button", { name: /zoom in/i }));
    expect(onZoomIn).toHaveBeenCalledTimes(1);
  });

  it("calls onZoomOut when Zoom out is clicked", () => {
    const onZoomOut = vi.fn();
    render(
      <MapCanvas {...defaultProps} onZoomOut={onZoomOut}>
        <span />
      </MapCanvas>
    );

    fireEvent.click(screen.getByRole("button", { name: /zoom out/i }));
    expect(onZoomOut).toHaveBeenCalledTimes(1);
  });

  it("calls onReset when Reset is clicked", () => {
    const onReset = vi.fn();
    render(
      <MapCanvas {...defaultProps} zoom={1.5} onReset={onReset}>
        <span />
      </MapCanvas>
    );

    fireEvent.click(screen.getByRole("button", { name: /reset zoom/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("zoom controls are keyboard focusable", () => {
    render(
      <MapCanvas {...defaultProps}>
        <span />
      </MapCanvas>
    );

    const zoomIn = screen.getByRole("button", { name: /zoom in/i });
    zoomIn.focus();
    expect(zoomIn).toHaveFocus();
  });

  it("calls onSelectLga when LGA polygon is clicked", () => {
    const onSelectLga = vi.fn();
    render(
      <MapCanvas {...defaultProps} onSelectLga={onSelectLga}>
        <span />
      </MapCanvas>
    );

    const polygon = screen.getByTestId("lga-polygon-mackay");
    fireEvent.click(polygon);

    expect(onSelectLga).toHaveBeenCalledWith("mackay");
  });
});
