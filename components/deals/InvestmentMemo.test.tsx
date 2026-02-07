import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InvestmentMemo } from "./InvestmentMemo";
import type { Deal, LGA, OpportunityType } from "@/lib/types";
import type { MemoAnalysisResult } from "@/app/api/deals/analyse-memo/route";

/* Mock next/navigation */
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/deals/memo",
}));

/* Mock next/link */
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

/* Mock deal-storage */
const saveDealLocallyMock = vi.fn();
const saveOpportunityTypeLocallyMock = vi.fn();
vi.mock("@/lib/deal-storage", () => ({
  getDealsWithLocalOverrides: (deals: Deal[]) => deals,
  saveDealLocally: (...args: unknown[]) => saveDealLocallyMock(...args),
  saveOpportunityTypeLocally: (...args: unknown[]) =>
    saveOpportunityTypeLocallyMock(...args),
  getAllOpportunityTypes: (base: unknown[]) => base,
}));

/* Mock extract-text — avoids loading pdfjs-dist in tests */
const mockExtractTextFromFile = vi.fn();
vi.mock("@/lib/extract-text", () => ({
  extractTextFromFile: (...args: unknown[]) =>
    mockExtractTextFromFile(...args),
  ACCEPTED_EXTENSIONS: ".pdf,.txt,.md,.csv",
}));

// --- Test data ---

const mockLgas: LGA[] = [
  { id: "mackay", name: "Mackay", geometryRef: "mackay" },
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
  summary: "Pilot.",
  nextStep: "Secure offtake.",
  evidence: [],
  notes: [],
  updatedAt: "2026-02-06T00:00:00.000Z",
  gateChecklist: {},
  artefacts: {},
};

const mockResult: MemoAnalysisResult = {
  name: "GW3 Minerals Processing Hub",
  stage: "feasibility",
  readinessState: "feasibility-underway",
  dominantConstraint: "early-risk-capital",
  summary: "A mining processing facility with strong regional support.",
  description: "Detailed description of the deal from the memo.",
  nextStep: "Commission detailed feasibility study.",
  investmentValue: "$45M",
  economicImpact: "200 direct jobs",
  keyStakeholders: ["METS Corp", "State Government"],
  risks: ["Supply chain risk", "Permitting delays"],
  strategicActions: ["Secure grant funding", "Complete ESIA"],
  governmentPrograms: [
    {
      name: "Critical Minerals Facility",
      description: "Federal co-investment program",
    },
  ],
  timeline: [{ label: "Feasibility complete", date: "Q3 2026" }],
  memoReference: { label: "Investment Memo: strategy.pdf" },
  suggestedOpportunityType: {
    existingId: "critical-minerals",
    confidence: "high" as const,
    reasoning: "The deal focuses on critical minerals processing.",
  },
};

/** Helper: create a fake File and simulate uploading it. */
function uploadFile(name = "strategy.pdf", content = "Memo text content") {
  const file = new File([content], name, {
    type: name.endsWith(".pdf") ? "application/pdf" : "text/plain",
  });
  const input = screen.getByTestId("file-input") as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
  return file;
}

// --- Tests ---

describe("InvestmentMemo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
    mockExtractTextFromFile.mockReset();
  });

  it("renders heading, drop zone, and empty state — no analyse button, no deal selector", () => {
    render(
      <InvestmentMemo
        deals={[mockDeal]}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    expect(
      screen.getByRole("heading", { name: /new deal from document/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("drop-zone")).toBeInTheDocument();

    // No deal selector
    expect(screen.queryByLabelText(/target deal/i)).not.toBeInTheDocument();
    // No analyse button — analysis is automatic
    expect(
      screen.queryByRole("button", { name: /analyse/i })
    ).not.toBeInTheDocument();
  });

  it("shows empty state message", () => {
    render(
      <InvestmentMemo
        deals={[mockDeal]}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    expect(
      screen.getByText(/upload a document to automatically/i)
    ).toBeInTheDocument();
  });

  it("auto-analyses after uploading a file and shows results", async () => {
    mockExtractTextFromFile.mockResolvedValueOnce(
      "Full investment memo text content."
    );

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    });

    render(
      <InvestmentMemo
        deals={[mockDeal]}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    uploadFile("strategy.pdf");

    // Results appear automatically — no button click needed
    await waitFor(() => {
      expect(screen.getByLabelText(/deal name/i)).toBeInTheDocument();
    });

    // Deal name pre-filled from AI
    const nameInput = screen.getByLabelText(/deal name/i) as HTMLInputElement;
    expect(nameInput.value).toBe("GW3 Minerals Processing Hub");

    // Classification badges
    expect(screen.getByText("Feasibility")).toBeInTheDocument();
    expect(screen.getByText("Early risk capital")).toBeInTheDocument();

    // Summary field populated in editable textarea
    const summaryTextarea = screen.getByLabelText(/summary/i) as HTMLTextAreaElement;
    expect(summaryTextarea.value).toBe(
      "A mining processing facility with strong regional support."
    );

    // Verify fetch was called with opportunity types catalogue
    expect(global.fetch).toHaveBeenCalledWith("/api/deals/analyse-memo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memoText: "Full investment memo text content.",
        memoLabel: "strategy.pdf",
        opportunityTypes: [
          { id: "critical-minerals", name: "Critical minerals", definition: "" },
        ],
      }),
    });
  });

  it("shows extraction error when text extraction fails", async () => {
    mockExtractTextFromFile.mockRejectedValueOnce(
      new Error("Corrupt PDF file.")
    );

    render(
      <InvestmentMemo
        deals={[mockDeal]}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    uploadFile("bad.pdf");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Corrupt PDF file.");
    });

    // API should not have been called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows API error with Try again button when analysis fails", async () => {
    mockExtractTextFromFile.mockResolvedValueOnce("Some text.");

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "API key is invalid." }),
    });

    render(
      <InvestmentMemo
        deals={[mockDeal]}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    uploadFile("memo.txt");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "API key is invalid."
      );
    });

    // Try again button should be visible
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  it("retries analysis without re-extracting when Try again is clicked", async () => {
    mockExtractTextFromFile.mockResolvedValueOnce("Extracted memo text.");

    // First call fails (rate limit)
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: "Rate limit exceeded." }),
    });

    render(
      <InvestmentMemo
        deals={[mockDeal]}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    uploadFile("strategy.pdf");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Rate limit exceeded."
      );
    });

    // Second call succeeds
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    });

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    // Results appear — extraction was not called again
    await waitFor(() => {
      expect(screen.getByLabelText(/deal name/i)).toBeInTheDocument();
    });

    // extractTextFromFile was only called once (on initial upload)
    expect(mockExtractTextFromFile).toHaveBeenCalledTimes(1);

    // fetch was called twice (first failed, second succeeded on retry)
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("clears file and results when remove button is clicked", async () => {
    mockExtractTextFromFile.mockResolvedValueOnce("Memo content.");

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    });

    render(
      <InvestmentMemo
        deals={[mockDeal]}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    uploadFile("strategy.pdf");

    await waitFor(() => {
      expect(screen.getByLabelText(/deal name/i)).toBeInTheDocument();
    });

    // Click remove
    fireEvent.click(screen.getByLabelText(/remove file/i));

    // Drop zone should be back, results gone
    expect(screen.getByTestId("drop-zone")).toBeInTheDocument();
    expect(screen.queryByLabelText(/deal name/i)).not.toBeInTheDocument();
  });

  it("allows editing the deal name before creating", async () => {
    mockExtractTextFromFile.mockResolvedValueOnce("Memo content.");

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    });

    render(
      <InvestmentMemo
        deals={[mockDeal]}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    uploadFile("strategy.pdf");

    await waitFor(() => {
      expect(screen.getByLabelText(/deal name/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/deal name/i), {
      target: { value: "My Custom Deal Name" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /create deal/i })
    );

    await waitFor(() => {
      expect(saveDealLocallyMock).toHaveBeenCalledTimes(1);
    });
    const savedDeal = saveDealLocallyMock.mock.calls[0][0] as Deal;
    expect(savedDeal.name).toBe("My Custom Deal Name");
  });

  it("creates a brand-new deal with generated ID", async () => {
    mockExtractTextFromFile.mockResolvedValueOnce("Memo content.");

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    });

    render(
      <InvestmentMemo
        deals={[mockDeal]}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    uploadFile("strategy.pdf");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /create deal/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /create deal/i })
    );

    // handleCreateDeal is async (reads file as data URL), so wait for save
    await waitFor(() => {
      expect(saveDealLocallyMock).toHaveBeenCalledTimes(1);
    });
    const savedDeal = saveDealLocallyMock.mock.calls[0][0] as Deal;

    expect(savedDeal.id).toBeTruthy();
    expect(savedDeal.id).not.toBe("demo-flexilab");
    expect(savedDeal.name).toBe("GW3 Minerals Processing Hub");
    expect(savedDeal.stage).toBe("feasibility");
    expect(savedDeal.dominantConstraint).toBe("early-risk-capital");
    expect(savedDeal.investmentValue).toBe("$45M");
    expect(savedDeal.evidence).toHaveLength(1);
    expect(savedDeal.evidence[0].label).toBe("Investment Memo: strategy.pdf");
    expect(savedDeal.opportunityTypeId).toBe("critical-minerals");
    expect(savedDeal.lgaIds).toEqual([]);
    // Document directory: uploaded file should be attached
    expect(savedDeal.documents).toBeDefined();
    expect(savedDeal.documents!.length).toBe(1);
    expect(savedDeal.documents![0].fileName).toBe("strategy.pdf");

    // "Open deal" link replaces the create button
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /open deal/i })).toBeInTheDocument();
    });
    const openLink = screen.getByRole("link", { name: /open deal/i });
    expect(openLink).toHaveAttribute(
      "href",
      expect.stringContaining("/deals/")
    );
  });

  it("highlights drop zone on drag over", () => {
    render(
      <InvestmentMemo
        deals={[mockDeal]}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    const dropZone = screen.getByTestId("drop-zone");
    fireEvent.dragOver(dropZone);

    expect(dropZone.className).toContain("border-[#7A6B5A]");
  });

  it("shows file card with file info after upload", async () => {
    mockExtractTextFromFile.mockResolvedValueOnce("Text.");
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    });

    render(
      <InvestmentMemo
        deals={[mockDeal]}
        opportunityTypes={mockOpportunityTypes}
        lgas={mockLgas}
      />
    );

    uploadFile("report.pdf");

    await waitFor(() => {
      expect(screen.getByTestId("file-name")).toHaveTextContent("report.pdf");
    });
  });
});
