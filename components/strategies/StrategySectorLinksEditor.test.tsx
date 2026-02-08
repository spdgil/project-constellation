import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StrategySectorLinksEditor } from "./StrategySectorLinksEditor";

const sectorNameById = new Map<string, string>([
  ["critical-minerals", "Critical Minerals Processing"],
  ["renewables", "Renewable Energy"],
  ["agtech", "Agricultural Technology"],
]);

const defaultProps = {
  linkedSectorIds: ["critical-minerals", "renewables"],
  sectorNameById,
  moveSectorLink: vi.fn() as (sectorId: string, direction: "up" | "down") => void,
  removeSectorLink: vi.fn() as (sectorId: string) => void,
  sectorsLoading: false,
  availableSectors: [
    { id: "critical-minerals", name: "Critical Minerals Processing" },
    { id: "renewables", name: "Renewable Energy" },
    { id: "agtech", name: "Agricultural Technology" },
  ],
  unlinkedSectors: [{ id: "agtech", name: "Agricultural Technology" }],
  sectorPickerId: "sector-picker",
  addSectorLink: vi.fn() as (sectorId: string) => void,
  labelClass:
    "text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium mb-1 block",
};

describe("StrategySectorLinksEditor", () => {
  it("renders linked sectors", () => {
    render(<StrategySectorLinksEditor {...defaultProps} />);

    expect(screen.getByTestId("sector-links-editor")).toBeInTheDocument();
    expect(screen.getByTestId("linked-sectors-list")).toBeInTheDocument();
    expect(
      screen.getByText("Critical Minerals Processing"),
    ).toBeInTheDocument();
    expect(screen.getByText("Renewable Energy")).toBeInTheDocument();
  });

  it("can add a sector via the select dropdown", () => {
    const addSectorLink = vi.fn();
    render(
      <StrategySectorLinksEditor
        {...defaultProps}
        addSectorLink={addSectorLink}
      />,
    );

    const select = screen.getByTestId("add-sector-select");
    fireEvent.change(select, { target: { value: "agtech" } });

    expect(addSectorLink).toHaveBeenCalledWith("agtech");
  });

  it("can remove a sector", () => {
    const removeSectorLink = vi.fn();
    render(
      <StrategySectorLinksEditor
        {...defaultProps}
        removeSectorLink={removeSectorLink}
      />,
    );

    const removeBtn = screen.getByTestId("remove-sector-critical-minerals");
    fireEvent.click(removeBtn);

    expect(removeSectorLink).toHaveBeenCalledWith("critical-minerals");
  });

  it("shows empty state when no sectors are linked", () => {
    render(
      <StrategySectorLinksEditor {...defaultProps} linkedSectorIds={[]} />,
    );

    expect(
      screen.getByText("No sector opportunities linked yet."),
    ).toBeInTheDocument();
  });

  it("shows move buttons for reordering", () => {
    render(<StrategySectorLinksEditor {...defaultProps} />);

    // First item has disabled up button
    const upBtn = screen.getByLabelText(
      "Move Critical Minerals Processing up",
    );
    expect(upBtn).toBeDisabled();

    // Last item has disabled down button
    const downBtn = screen.getByLabelText("Move Renewable Energy down");
    expect(downBtn).toBeDisabled();
  });
});
