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
  stage: "pre-feasibility",
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
  gateChecklist: {
    "pre-feasibility": [
      { question: "Preliminary Feasibility", status: "pending" },
      { question: "Clearance in Principle", status: "pending" },
      { question: "Additionality", status: "pending" },
    ],
  },
  artefacts: {
    "pre-feasibility": [
      { name: "Pre-feasibility Study", status: "not-started" },
      { name: "Integrated Safeguards Data Sheet", status: "not-started" },
    ],
  },
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
    expect(screen.getByText("Pre-feasibility")).toBeInTheDocument();
    expect(screen.getByText("Feasibility underway")).toBeInTheDocument();
    expect(screen.getByText("Common-user infrastructure gap")).toBeInTheDocument();
    expect(screen.getByText("Secure offtake.")).toBeInTheDocument();
    expect(screen.getByText(/METS Strategy/)).toBeInTheDocument();
    expect(screen.getByText("Initial note.")).toBeInTheDocument();
    expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
  });

  it("does not show saving indicator on load", () => {
    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
  });

  it("defaults to view mode with static text instead of dropdowns", () => {
    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    // View mode: no select dropdowns for readiness/constraint
    expect(screen.queryByRole("combobox", { name: /readiness state/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /dominant constraint/i })).not.toBeInTheDocument();
    // Toggle button shows "Edit"
    expect(screen.getByTestId("mode-toggle")).toHaveTextContent("Edit");
  });

  it("toggle switches to edit mode showing dropdowns and checkboxes", () => {
    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("mode-toggle"));

    expect(screen.getByTestId("mode-toggle")).toHaveTextContent("Editing");
    expect(screen.getByRole("combobox", { name: /readiness state/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /dominant constraint/i })).toBeInTheDocument();
    expect(screen.getAllByTestId(/^gate-checkbox-/).length).toBe(3);
  });

  it("editing readiness state calls PATCH API", () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockDeal, readinessState: "conceptual-interest" }),
    });

    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("mode-toggle"));

    const readinessSelect = screen.getByRole("combobox", {
      name: /readiness state/i,
    });
    expect(readinessSelect).toHaveValue("feasibility-underway");

    fireEvent.change(readinessSelect, {
      target: { value: "conceptual-interest" },
    });

    expect(readinessSelect).toHaveValue("conceptual-interest");
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/deals/${mockDeal.id}`,
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("editing dominant constraint calls PATCH API", () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockDeal, dominantConstraint: "planning-and-approvals" }),
    });

    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("mode-toggle"));

    const constraintSelect = screen.getByRole("combobox", {
      name: /dominant constraint/i,
    });
    expect(constraintSelect).toHaveValue("common-user-infrastructure-gap");

    fireEvent.change(constraintSelect, {
      target: { value: "planning-and-approvals" },
    });

    expect(constraintSelect).toHaveValue("planning-and-approvals");
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/deals/${mockDeal.id}`,
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("re-render with updated deal prop reflects new readiness state", () => {
    const onClose = vi.fn();
    const updatedDeal = {
      ...mockDeal,
      readinessState: "structurable-but-stalled" as const,
    };

    const { rerender } = render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={onClose}
      />
    );

    expect(screen.getByText("Feasibility underway")).toBeInTheDocument();

    // Simulate re-render with updated deal (as if parent re-fetched from DB)
    rerender(
      <DealDrawer
        deal={updatedDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={onClose}
      />
    );

    expect(screen.getByText("Structurable but stalled")).toBeInTheDocument();
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

  it("renders gate checklist in view mode with progress and status icons", () => {
    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/stage gate checklist/i)).toBeInTheDocument();
    expect(screen.getByText("0 of 3 satisfied")).toBeInTheDocument();
    expect(screen.getByText("Preliminary Feasibility")).toBeInTheDocument();
    expect(screen.getByText("Clearance in Principle")).toBeInTheDocument();
    expect(screen.getByText("Additionality")).toBeInTheDocument();

    // View mode: no checkboxes
    expect(screen.queryAllByTestId(/^gate-checkbox-/)).toHaveLength(0);
  });

  it("edit mode shows gate checkboxes that toggle and call API", () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDeal,
    });

    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("mode-toggle"));

    const checkboxes = screen.getAllByTestId(/^gate-checkbox-/);
    expect(checkboxes).toHaveLength(3);
    checkboxes.forEach((cb) => expect(cb).not.toBeChecked());

    fireEvent.click(checkboxes[0]);

    expect(checkboxes[0]).toBeChecked();
    expect(screen.getByText("1 of 3 satisfied")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/deals/${mockDeal.id}`,
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("renders artefacts with status badges in view mode", () => {
    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/artefacts & documents/i)).toBeInTheDocument();
    expect(screen.getByText("Pre-feasibility Study")).toBeInTheDocument();
    expect(screen.getByText("Integrated Safeguards Data Sheet")).toBeInTheDocument();

    const statusBadges = screen.getAllByTestId(/^artefact-status-/);
    expect(statusBadges).toHaveLength(2);
    expect(statusBadges[0]).toHaveTextContent("Not started");

    // View mode: no summary/URL fields
    expect(screen.queryByTestId("artefact-summary-0")).not.toBeInTheDocument();
    expect(screen.queryByTestId("artefact-url-0")).not.toBeInTheDocument();
  });

  it("cycling artefact status in edit mode advances through not-started → in-progress → complete", () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDeal,
    });

    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("mode-toggle"));

    const statusBtn = screen.getByTestId("artefact-status-0");
    expect(statusBtn).toHaveTextContent("Not started");

    fireEvent.click(statusBtn);
    expect(statusBtn).toHaveTextContent("In progress");

    fireEvent.click(statusBtn);
    expect(statusBtn).toHaveTextContent("Complete");

    fireEvent.click(statusBtn);
    expect(statusBtn).toHaveTextContent("Not started");

    expect(global.fetch).toHaveBeenCalled();
  });

  it("shows View full detail link to deal detail page", () => {
    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    const link = screen.getByTestId("view-full-detail");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/deals/demo-flexilab");
  });

  it("artefact summary and URL fields are editable in edit mode", () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDeal,
    });

    render(
      <DealDrawer
        deal={mockDeal}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("mode-toggle"));

    const summaryField = screen.getByTestId("artefact-summary-0") as HTMLTextAreaElement;
    expect(summaryField.value).toBe("");

    fireEvent.change(summaryField, { target: { value: "Initial draft complete" } });
    expect(summaryField.value).toBe("Initial draft complete");

    const urlField = screen.getByTestId("artefact-url-0") as HTMLInputElement;
    expect(urlField.value).toBe("");

    fireEvent.change(urlField, { target: { value: "https://example.com/doc.pdf" } });
    expect(urlField.value).toBe("https://example.com/doc.pdf");

    expect(global.fetch).toHaveBeenCalled();
  });
});
