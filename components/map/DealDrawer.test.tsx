import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { DealDrawer } from "./DealDrawer";
import type { Deal, LGA, OpportunityType } from "@/lib/types";

const mockLgas: LGA[] = [
  { id: "mackay", name: "Mackay", geometryRef: "mackay", notes: [] },
];

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

const mockDeal: Deal = {
  id: "demo-flexilab",
  name: "RCOE FlexiLab pilot",
  opportunityTypeId: "critical-minerals",
  lgaIds: ["mackay"],
  stage: "feasibility",
  readinessState: "feasibility-underway",
  dominantConstraint: "common-user-infrastructure-gap",
  summary: "Pilot processing facility in Paget.",
  nextStep: "Secure offtake.",
  evidence: [{ label: "METS Strategy", pageRef: "p.37" }],
  notes: [
    {
      id: "n1",
      content: "Initial note.",
      createdAt: "2026-02-06T10:00:00.000Z",
    },
  ],
  updatedAt: "2026-02-06T00:00:00.000Z",
};

describe("DealDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("opens and shows full deal card fields", () => {
    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole("dialog", { name: /deal details/i })).toBeInTheDocument();
    expect(screen.getByText("RCOE FlexiLab pilot")).toBeInTheDocument();
    expect(screen.getByText("Critical minerals")).toBeInTheDocument();
    expect(screen.getByText("Mackay")).toBeInTheDocument();
    expect(screen.getByText("Feasibility")).toBeInTheDocument();
    expect(screen.getByText("Feasibility underway")).toBeInTheDocument();
    expect(screen.getByText("Common-user infrastructure gap")).toBeInTheDocument();
    expect(screen.getByText("Secure offtake.")).toBeInTheDocument();
    expect(screen.getByText(/METS Strategy/)).toBeInTheDocument();
    expect(screen.getByText("Initial note.")).toBeInTheDocument();
    expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
  });

  it("does not show Updated locally when deal has no local overrides", () => {
    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText(/updated locally/i)).not.toBeInTheDocument();
  });

  it("editing readiness state updates UI and shows Updated locally", () => {
    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    const readinessSelect = screen.getByRole("combobox", {
      name: /readiness state/i,
    });
    expect(readinessSelect).toHaveValue("feasibility-underway");

    fireEvent.change(readinessSelect, {
      target: { value: "conceptual-interest" },
    });

    expect(readinessSelect).toHaveValue("conceptual-interest");
    expect(screen.getByText(/updated locally/i)).toBeInTheDocument();
  });

  it("editing dominant constraint updates UI and shows Updated locally", () => {
    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    const constraintSelect = screen.getByRole("combobox", {
      name: /dominant constraint/i,
    });
    expect(constraintSelect).toHaveValue("common-user-infrastructure-gap");

    fireEvent.change(constraintSelect, {
      target: { value: "planning-and-approvals" },
    });

    expect(constraintSelect).toHaveValue("planning-and-approvals");
    expect(screen.getByText(/updated locally/i)).toBeInTheDocument();
  });

  it("persisted on re-open: edited readiness is shown after close and open again", () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={onClose}
      />
    );

    const readinessSelect = screen.getByRole("combobox", {
      name: /readiness state/i,
    });
    fireEvent.change(readinessSelect, {
      target: { value: "structurable-but-stalled" },
    });
    expect(readinessSelect).toHaveValue("structurable-but-stalled");

    unmount();

    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    const readinessSelectAgain = screen.getByRole("combobox", {
      name: /readiness state/i,
    });
    expect(readinessSelectAgain).toHaveValue("structurable-but-stalled");
    expect(screen.getByText(/updated locally/i)).toBeInTheDocument();
  });

  it("Escape calls onClose", () => {
    const onClose = vi.fn();
    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={onClose}
      />
    );

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("focus is trapped in drawer: Tab from last focusable moves to first", () => {
    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    const dialog = screen.getByRole("dialog", { name: /deal details/i });
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    expect(focusable.length).toBeGreaterThanOrEqual(2);

    const lastFocusable = focusable[focusable.length - 1];
    lastFocusable.focus();
    expect(document.activeElement).toBe(lastFocusable);

    fireEvent.keyDown(document.activeElement!, { key: "Tab", code: "Tab" });

    expect(document.activeElement).toBe(focusable[0]);
  });

  it("Close button calls onClose", () => {
    const onClose = vi.fn();
    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /close deal drawer/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("returns null when deal is null", () => {
    const { container } = render(
      <DealDrawer
        deal={null}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
