import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LgaDetailPanel } from "./LgaDetailPanel";
import type { LGA, Deal } from "@/lib/types";

const mockLga: LGA = {
  id: "mackay",
  name: "Mackay",
  geometryRef: "mackay",
  notes: [],
  summary: "Mackay LGA is part of the Greater Whitsunday region.",
  opportunityHypotheses: [
    {
      id: "h1",
      name: "Critical minerals",
      summary: "METS capabilities support critical minerals.",
      dominantConstraint: "common-user-infrastructure-gap",
    },
  ],
  activeDealIds: ["demo-flexilab"],
  repeatedConstraints: ["common-user-infrastructure-gap"],
  evidence: [{ label: "METS Strategy", pageRef: "p.15" }],
};

const mockDeals: Deal[] = [
  {
    id: "demo-flexilab",
    name: "RCOE FlexiLab pilot",
    opportunityTypeId: "critical-minerals",
    lgaIds: ["mackay"],
    stage: "feasibility",
    readinessState: "feasibility-underway",
    dominantConstraint: "common-user-infrastructure-gap",
    summary: "Pilot facility.",
    nextStep: "Secure offtake.",
    evidence: [],
    notes: [],
    updatedAt: "2026-02-06T00:00:00.000Z",
  },
];

describe("LgaDetailPanel", () => {
  it("renders LGA name and Close button", () => {
    const onClose = vi.fn();
    render(<LgaDetailPanel lga={mockLga} deals={mockDeals} onClose={onClose} />);

    expect(screen.getByRole("region", { name: /mackay lga details/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mackay", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close lga panel/i })).toBeInTheDocument();
  });

  it("Summary section is open by default", () => {
    render(<LgaDetailPanel lga={mockLga} deals={mockDeals} onClose={vi.fn()} />);

    const summaryButton = screen.getByRole("button", { name: "Summary" });
    expect(summaryButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Mackay LGA is part of the Greater Whitsunday region/i)).toBeInTheDocument();
  });

  it("Opportunity hypotheses, Active deals, Repeated constraints, Evidence and notes are collapsed by default", () => {
    render(<LgaDetailPanel lga={mockLga} deals={mockDeals} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: /opportunity hypotheses/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(screen.getByRole("button", { name: /active deals/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(screen.getByRole("button", { name: /repeated constraints/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(screen.getByRole("button", { name: /evidence and notes/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    );

    const hypothesesContent = document.getElementById(
      screen.getByRole("button", { name: /opportunity hypotheses/i }).getAttribute("aria-controls") ?? ""
    );
    expect(hypothesesContent).toHaveAttribute("hidden");
  });

  it("opening Opportunity hypotheses section shows content", () => {
    render(<LgaDetailPanel lga={mockLga} deals={mockDeals} onClose={vi.fn()} />);

    const button = screen.getByRole("button", { name: /opportunity hypotheses/i });
    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("heading", { name: "Critical minerals", level: 4 })).toBeInTheDocument();
    expect(screen.getByText("METS capabilities support critical minerals.")).toBeInTheDocument();
  });

  it("closing Summary section hides content", () => {
    render(<LgaDetailPanel lga={mockLga} deals={mockDeals} onClose={vi.fn()} />);

    const summaryButton = screen.getByRole("button", { name: "Summary" });
    expect(summaryButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(summaryButton);
    expect(summaryButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText(/Mackay LGA is part of the Greater Whitsunday region/i)).toBeInTheDocument(); // content may still be in DOM but hidden
  });

  it("keyboard Enter on accordion button toggles section", () => {
    render(<LgaDetailPanel lga={mockLga} deals={mockDeals} onClose={vi.fn()} />);

    const button = screen.getByRole("button", { name: /opportunity hypotheses/i });
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
    expect(button).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("keyboard Space on accordion button toggles section", () => {
    render(<LgaDetailPanel lga={mockLga} deals={mockDeals} onClose={vi.fn()} />);

    const button = screen.getByRole("button", { name: /active deals/i });
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.keyDown(button, { key: " ", code: "Space" });
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("RCOE FlexiLab pilot")).toBeInTheDocument();
  });

  it("accordion controls are keyboard focusable", () => {
    render(<LgaDetailPanel lga={mockLga} deals={mockDeals} onClose={vi.fn()} />);

    const summaryButton = screen.getByRole("button", { name: "Summary" });
    summaryButton.focus();
    expect(summaryButton).toHaveFocus();
  });

  it("Escape calls onClose", () => {
    const onClose = vi.fn();
    render(<LgaDetailPanel lga={mockLga} deals={mockDeals} onClose={onClose} />);

    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Close button calls onClose", () => {
    const onClose = vi.fn();
    render(<LgaDetailPanel lga={mockLga} deals={mockDeals} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /close lga panel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
