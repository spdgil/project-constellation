import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LgaBottomSheet } from "./LgaBottomSheet";
import type { LGA, Deal } from "@/lib/types";

const mockLga: LGA = {
  id: "mackay",
  name: "Mackay",
  geometryRef: "mackay",
  notes: [],
  summary: "Mackay LGA summary.",
  activeDealIds: ["demo-flexilab"],
  repeatedConstraints: [],
};

const mockDeals: Deal[] = [
  {
    id: "demo-flexilab",
    name: "RCOE FlexiLab pilot",
    opportunityTypeId: "critical-minerals",
    lgaIds: ["mackay"],
    stage: "pre-feasibility",
    readinessState: "feasibility-underway",
    dominantConstraint: "common-user-infrastructure-gap",
    summary: "Pilot facility.",
    nextStep: "Secure offtake.",
    evidence: [],
    notes: [],
    updatedAt: "2026-02-06T00:00:00.000Z",
    gateChecklist: {},
    artefacts: {},
    investmentValueAmount: 0,
    investmentValueDescription: "",
    economicImpactAmount: 0,
    economicImpactDescription: "",
  },
];

describe("LgaBottomSheet", () => {
  let onClose: () => void;

  beforeEach(() => {
    onClose = vi.fn();
  });

  it("renders with LGA name and region role", () => {
    render(<LgaBottomSheet lga={mockLga} deals={mockDeals} onClose={onClose} />);

    expect(screen.getByRole("region", { name: /mackay lga details/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mackay", level: 2 })).toBeInTheDocument();
  });

  it("renders Close button that calls onClose", () => {
    render(<LgaBottomSheet lga={mockLga} deals={mockDeals} onClose={onClose} />);

    const closeBtn = screen.getByRole("button", { name: /close lga panel/i });
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders drag handle with separator role", () => {
    render(<LgaBottomSheet lga={mockLga} deals={mockDeals} onClose={onClose} />);

    const handle = screen.getByRole("separator", { name: /resize lga detail panel/i });
    expect(handle).toBeInTheDocument();
    expect(handle).toHaveAttribute("tabindex", "0");
  });

  it("renders snap-size buttons", () => {
    render(<LgaBottomSheet lga={mockLga} deals={mockDeals} onClose={onClose} />);

    expect(screen.getByRole("button", { name: /resize to peek/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resize to half/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resize to full/i })).toBeInTheDocument();
  });

  it("renders embedded LgaDetailPanel content", () => {
    render(<LgaBottomSheet lga={mockLga} deals={mockDeals} onClose={onClose} />);

    /* Summary accordion should be visible (default open) */
    expect(screen.getByRole("button", { name: "Summary" })).toBeInTheDocument();
    expect(screen.getByText(/mackay lga summary/i)).toBeInTheDocument();
  });

  it("Escape key calls onClose", () => {
    render(<LgaBottomSheet lga={mockLga} deals={mockDeals} onClose={onClose} />);

    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ArrowUp on handle changes snap from half to full", () => {
    render(<LgaBottomSheet lga={mockLga} deals={mockDeals} onClose={onClose} />);

    const handle = screen.getByRole("separator", { name: /resize lga detail panel/i });
    fireEvent.keyDown(handle, { key: "ArrowUp" });

    /* Full button should now appear active (visual check via className) */
    const fullBtn = screen.getByRole("button", { name: /resize to full/i });
    expect(fullBtn.className).toContain("bg-[#E8E6E3]");
  });

  it("ArrowDown on handle changes snap from half to peek", () => {
    render(<LgaBottomSheet lga={mockLga} deals={mockDeals} onClose={onClose} />);

    const handle = screen.getByRole("separator", { name: /resize lga detail panel/i });
    fireEvent.keyDown(handle, { key: "ArrowDown" });

    const peekBtn = screen.getByRole("button", { name: /resize to peek/i });
    expect(peekBtn.className).toContain("bg-[#E8E6E3]");
  });
});
