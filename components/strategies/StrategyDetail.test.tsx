import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StrategyDetail } from "./StrategyDetail";
import type {
  SectorDevelopmentStrategy,
  StrategyGrade,
  SectorOpportunity,
} from "@/lib/types";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/lga/strategies/strat-1",
}));

// Mock next/image to a plain <img> (jsdom has no image decoding)
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

const mockSectorOpportunity: SectorOpportunity = {
  id: "critical-minerals",
  name: "Critical Minerals Processing",
  version: "1.0",
  tags: ["mining", "processing"],
  sections: {
    "1": "Definition of critical minerals.",
    "2": "",
    "3": "",
    "4": "",
    "5": "",
    "6": "",
    "7": "",
    "8": "",
    "9": "",
    "10": "",
  },
  sources: [],
};

const mockStrategy: SectorDevelopmentStrategy = {
  id: "strat-1",
  title: "Mackay Region Critical Minerals Strategy",
  type: "sector_development",
  status: "published",
  sourceDocument: "Mackay Region Economic Plan 2025",
  summary: "A strategy focused on critical minerals processing in the Mackay region.",
  components: {
    "1": "Diagnostics content for component 1.",
    "2": "Geography content for component 2.",
    "3": "",
    "4": "",
    "5": "",
    "6": "",
  },
  selectionLogic: {
    adjacentDefinition: "Adjacent sectors defined as...",
    growthDefinition: "Growth sectors defined as...",
    criteria: ["export_oriented", "value_chain_depth"],
  },
  crossCuttingThemes: ["sustainability"],
  stakeholderCategories: ["government"],
  prioritySectorIds: ["critical-minerals"],
};

const mockGrade: StrategyGrade = {
  id: "grade-1",
  strategyId: "strat-1",
  gradeLetter: "B",
  gradeRationaleShort: "Good coverage of diagnostics but missing workforce detail.",
  evidenceNotesByComponent: {
    "1": "Strong diagnostics section.",
    "2": "Good geography coverage.",
  },
  missingElements: [
    { componentId: "5", reason: "No workforce analysis provided." },
  ],
  scopeDisciplineNotes: "Strategy stays focused on one sector.",
};

describe("StrategyDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders strategy title and summary", () => {
    render(
      <StrategyDetail
        strategy={mockStrategy}
        grade={null}
        sectorOpportunities={[mockSectorOpportunity]}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Mackay Region Critical Minerals Strategy",
    );
    expect(
      screen.getByText(
        "A strategy focused on critical minerals processing in the Mackay region.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the grade badge when a grade is present", () => {
    render(
      <StrategyDetail
        strategy={mockStrategy}
        grade={mockGrade}
        sectorOpportunities={[mockSectorOpportunity]}
      />,
    );

    expect(screen.getByText("Grade B")).toBeInTheDocument();
    expect(
      screen.getByText("Good coverage of diagnostics but missing workforce detail."),
    ).toBeInTheDocument();
  });

  it("renders component sections", () => {
    render(
      <StrategyDetail
        strategy={mockStrategy}
        grade={null}
        sectorOpportunities={[mockSectorOpportunity]}
      />,
    );

    // Component 1 title
    expect(
      screen.getByText("1. Sector Diagnostics and Comparative Advantage"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Diagnostics content for component 1."),
    ).toBeInTheDocument();

    // Component 2 title
    expect(
      screen.getByText("2. Economic Geography and Places of Production"),
    ).toBeInTheDocument();
  });

  it('shows a "Grade" button when no grade is present and has content', () => {
    render(
      <StrategyDetail
        strategy={mockStrategy}
        grade={null}
        sectorOpportunities={[mockSectorOpportunity]}
      />,
    );

    // Both the inline section and sidebar prompt should have a grade button
    const gradeButtons = screen.getAllByText("Run AI grading");
    expect(gradeButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("calls the grading API when grade button is clicked", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockGrade,
        warnings: [],
      }),
    });

    render(
      <StrategyDetail
        strategy={mockStrategy}
        grade={null}
        sectorOpportunities={[mockSectorOpportunity]}
      />,
    );

    const gradeBtn = screen.getByTestId("run-grading-btn");
    fireEvent.click(gradeBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/strategies/strat-1/grade",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("renders priority sectors with linked sector names", () => {
    render(
      <StrategyDetail
        strategy={mockStrategy}
        grade={null}
        sectorOpportunities={[mockSectorOpportunity]}
      />,
    );

    expect(screen.getByText("Priority sectors")).toBeInTheDocument();
    expect(screen.getByText("Critical Minerals Processing")).toBeInTheDocument();
  });

  it("renders source document in sidebar", () => {
    render(
      <StrategyDetail
        strategy={mockStrategy}
        grade={null}
        sectorOpportunities={[mockSectorOpportunity]}
      />,
    );

    expect(
      screen.getByText("Mackay Region Economic Plan 2025"),
    ).toBeInTheDocument();
  });

  it("renders back link to all strategies", () => {
    render(
      <StrategyDetail
        strategy={mockStrategy}
        grade={null}
        sectorOpportunities={[mockSectorOpportunity]}
      />,
    );

    const backLink = screen.getByText("← All strategies");
    expect(backLink).toHaveAttribute("href", "/lga/strategies");
  });
});
