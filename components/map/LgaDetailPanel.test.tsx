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
  },
];

describe("LgaDetailPanel", () => {
  it("renders accordion sections", () => {
    render(<LgaDetailPanel lga={mockLga} deals={mockDeals} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Summary" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /opportunity hypotheses/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /active deals/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /repeated constraints/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /evidence and notes/i })).toBeInTheDocument();
  });

  it("Summary section is open by default", () => {
    render(<LgaDetailPanel lga={mockLga} deals={mockDeals} onClose={vi.fn()} />);

    const summaryButton = screen.getByRole("button", { name: "Summary" });
    expect(summaryButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Mackay LGA is part of the Greater Whitsunday region/i)).toBeInTheDocument();
  });

  it("other sections are collapsed by default", () => {
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
});
