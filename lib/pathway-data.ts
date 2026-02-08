/**
 * Deal Development Pathway — structured content for the 5-stage pathway.
 * Separated from presentation to keep data maintainable.
 */

import type { DealStage } from "./types";

// --- Types ---

export interface PathwayActivity {
  name: string;
  descriptions: string[];
}

export interface PathwayGateItem {
  question: string;
  description: string;
}

export interface PathwayRisk {
  name: string;
  description: string;
}

export interface PathwayStage {
  id: DealStage;
  number: number;
  title: string;
  shortTitle: string;
  purpose: string;
  activities: PathwayActivity[];
  gateChecklist: PathwayGateItem[];
  gateFailNote: string;
  risksAddressed: PathwayRisk[];
  artefacts: string[];
}

export interface PathwayReference {
  author: string;
  title: string;
  source: string;
}

// --- Stage Data ---

export const PATHWAY_STAGES: PathwayStage[] = [
  {
    id: "definition",
    number: 1,
    title: "Mandate Fit and Project Definition",
    shortTitle: "Definition",
    purpose:
      "Establish whether the opportunity warrants deployment of development capital by confirming that a clearly defined project can plausibly align with the fund\u2019s mandate, operate within a viable regulatory setting, and progress toward private investment. This stage filters out ideas that cannot credibly be developed into investable opportunities.",
    activities: [
      {
        name: "Project definition and option screening",
        descriptions: [
          "Define the core project proposition, including the underlying asset, service, or revenue generating activity",
          "Identify and screen alternative configurations to determine which options could plausibly support private capital participation",
          "Exclude configurations that rely on unrealistic assumptions about pricing, demand, or public support",
        ],
      },
      {
        name: "Mandate alignment assessment",
        descriptions: [
          "Test the project against fund mandate, sector focus, geography, ticket size, return expectations, and impact constraints",
          "Clarify whether the project could ultimately support equity, debt, or blended capital",
          "Identify any mandate misalignment that would prevent future investment, regardless of project quality",
        ],
      },
      {
        name: "Public sector and regulatory viability review",
        descriptions: [
          "Assess whether the legal, regulatory, and institutional environment can support private participation and contract enforceability",
          "Identify any critical policy or regulatory dependencies that must be resolved before progressing",
          "Distinguish between manageable conditions precedent and fundamental structural barriers",
        ],
      },
      {
        name: "Sponsor and counterparty credibility screen",
        descriptions: [
          "Identify the likely project sponsor, public counterparty, or offtaker",
          "Conduct an early credibility and authority screen, including mandate, incentives, decision rights, and delivery track record",
          "Test whether counterparties are likely to behave consistently with long term project bankability",
        ],
      },
    ],
    gateChecklist: [
      {
        question: "Project clarity",
        description:
          "Is there a clearly defined project with a plausible investable form?",
      },
      {
        question: "Mandate fit",
        description:
          "Does the project sit within the fund\u2019s investment mandate and risk appetite?",
      },
      {
        question: "Regulatory viability",
        description:
          "Is there a credible legal and regulatory pathway to enforceable contracts and financial close?",
      },
      {
        question: "Counterparty credibility",
        description:
          "Is there evidence of sponsor and counterparty authority, commitment, and delivery capacity?",
      },
      {
        question: "Capital pathway",
        description:
          "Is there a plausible route to third party investment without reliance on speculative policy reform?",
      },
    ],
    gateFailNote:
      "Projects that fail any of these criteria do not proceed to pre-feasibility.",
    risksAddressed: [
      {
        name: "Concept risk",
        description:
          "Avoiding development spend on poorly defined or incoherent project propositions",
      },
      {
        name: "Mandate drift risk",
        description:
          "Preventing investment in projects that institutional capital cannot ultimately support",
      },
      {
        name: "Policy and counterparty risk",
        description:
          "Early identification of public sector behaviours that undermine bankability",
      },
      {
        name: "Structural infeasibility risk",
        description:
          "Screening out concepts that cannot be shaped into an investable form",
      },
    ],
    artefacts: [
      "Project Concept Note",
      "Option screening summary",
      "Regulatory and enabling environment viability memo",
      "Sponsor and counterparty credibility summary",
      "Preliminary investment rationale note",
    ],
  },
  {
    id: "pre-feasibility",
    number: 2,
    title: "Pre-feasibility and Prioritisation",
    shortTitle: "Pre-feasibility",
    purpose:
      "Determine whether the project is technically plausible, commercially coherent, and free of fatal flaws before committing significant development capital. This stage establishes whether the project justifies full feasibility and structuring effort.",
    activities: [
      {
        name: "Pre-feasibility assessment",
        descriptions: [
          "Test the technical concept at a high level to confirm plausibility, scale assumptions, and delivery logic",
          "Develop an initial financial view to assess whether revenues, costs, and capital intensity could support private investment",
          "Identify material environmental, climate, and social constraints that could preclude development",
        ],
      },
      {
        name: "Options refinement and prioritisation",
        descriptions: [
          "Assess alternative technical, delivery, and ownership configurations",
          "Compare options on risk profile, complexity, cost, and alignment with potential capital providers",
          "Prioritise configurations that minimise complexity and improve investability",
        ],
      },
      {
        name: "Initial risk assessment",
        descriptions: [
          "Identify dominant technical, delivery, market, climate, and social risks",
          "Distinguish between risks that can be mitigated through structuring and those that are likely to be prohibitive",
          "Flag risks that materially affect timing, cost, or capital appetite",
        ],
      },
      {
        name: "Early market sounding",
        descriptions: [
          "Test the project concept with a small number of relevant capital providers or developers",
          "Validate whether the emerging project shape aligns with real investor constraints and expectations",
          "Use feedback to refine scope or deprioritise the project where appropriate",
        ],
      },
    ],
    gateChecklist: [
      {
        question: "Technical plausibility",
        description:
          "Is the project technically feasible at a high level without unresolved fatal flaws?",
      },
      {
        question: "Preliminary financial viability",
        description:
          "Do indicative costs and revenues suggest a credible path to bankability?",
      },
      {
        question: "Risk acceptability",
        description:
          "Are the dominant risks identifiable and potentially manageable through later structuring?",
      },
      {
        question: "Safeguards clearance in principle",
        description:
          "Are environmental, climate, and social risks within acceptable bounds at this stage?",
      },
      {
        question: "Development additionality",
        description:
          "Is there a clear rationale for continued facility involvement rather than immediate market delivery?",
      },
    ],
    gateFailNote:
      "Projects that fail any of these criteria do not proceed to full feasibility.",
    risksAddressed: [
      {
        name: "Technical viability risk",
        description:
          "Avoiding investment in solutions that cannot perform at the required scale or reliability",
      },
      {
        name: "Early financial infeasibility risk",
        description:
          "Identifying cost or revenue dynamics that undermine investability",
      },
      {
        name: "Safeguards and social risk",
        description:
          "Surfacing issues that could delay, constrain, or halt development",
      },
      {
        name: "Misallocation of development capital",
        description:
          "Preventing deeper spend on projects with weak prospects of closure",
      },
    ],
    artefacts: [
      "Pre-feasibility assessment report",
      "Options analysis and prioritisation note",
      "Initial risk and safeguards screening summary",
      "Market sounding summary and prioritisation decision note",
    ],
  },
  {
    id: "feasibility",
    number: 3,
    title: "Detailed Feasibility and Investment Appraisal",
    shortTitle: "Feasibility",
    purpose:
      "Resolve the remaining investment critical uncertainties by establishing cost, performance, risk, and impact with sufficient rigour to support a credible investment decision. This stage determines whether the project can withstand full investor and lender scrutiny.",
    activities: [
      {
        name: "Detailed technical feasibility and cost definition",
        descriptions: [
          "Undertake detailed engineering, geotechnical, and site specific assessments",
          "Develop investment grade cost estimates (e.g. Class 3 or equivalent) to improve cost certainty",
          "Confirm delivery approach, construction timeline, and key interfaces",
        ],
      },
      {
        name: "Environmental, social, and permitting diligence",
        descriptions: [
          "Complete full environmental and social impact assessments consistent with applicable standards",
          "Identify material impacts, mitigation measures, and residual risks",
          "Confirm permitting pathways, approval timelines, and compliance obligations",
        ],
      },
      {
        name: "Financial and economic appraisal",
        descriptions: [
          "Build an integrated financial model reflecting realistic cost, revenue, and financing assumptions",
          "Test sensitivity to key risks including cost overruns, demand variation, and delays",
          "Assess long term financial sustainability under base and downside scenarios",
        ],
      },
      {
        name: "Delivery and value assessment",
        descriptions: [
          "Evaluate delivery structures and risk allocation options",
          "Assess whether the proposed structure offers value relative to credible alternatives",
          "Confirm alignment between delivery model, risk allocation, and likely capital providers",
        ],
      },
    ],
    gateChecklist: [
      {
        question: "Cost and schedule confidence",
        description:
          "Are capital costs, timelines, and delivery risks defined with sufficient certainty for investment appraisal?",
      },
      {
        question: "Financial robustness",
        description:
          "Does the project demonstrate sustainable cash flows under realistic and downside assumptions?",
      },
      {
        question: "ESG and permitting readiness",
        description:
          "Are environmental and social risks understood, mitigable, and aligned with applicable standards?",
      },
      {
        question: "Structural coherence",
        description:
          "Is the proposed delivery and ownership structure internally consistent and investable?",
      },
      {
        question: "Decision readiness",
        description:
          "Is the project sufficiently defined to proceed to final structuring and capital engagement?",
      },
    ],
    gateFailNote:
      "Projects that fail any of these criteria do not proceed to transaction structuring.",
    risksAddressed: [
      {
        name: "Cost and delivery risk",
        description:
          "Reducing uncertainty around capital expenditure, schedule, and constructability",
      },
      {
        name: "Revenue and demand risk",
        description:
          "Stress testing the project\u2019s ability to service capital under adverse conditions",
      },
      {
        name: "Environmental and social risk",
        description:
          "Identifying impacts that could create liability, delay, or reputational exposure",
      },
      {
        name: "Structural misalignment risk",
        description:
          "Avoiding investment in projects with incoherent risk allocation or delivery design",
      },
    ],
    artefacts: [
      "Detailed feasibility report and cost estimates",
      "Environmental and social impact assessment and management plans",
      "Integrated financial model with sensitivity analysis",
      "Delivery structure and investment appraisal note",
    ],
  },
  {
    id: "structuring",
    number: 4,
    title: "Project Structuring and Risk Allocation",
    shortTitle: "Structuring",
    purpose:
      "Translate a feasible project into a transaction that capital can commit to by finalising risk allocation, commercial structure, and credit support in a way that produces an acceptable risk\u2013return profile for targeted investors.",
    activities: [
      {
        name: "Risk allocation and commercial design",
        descriptions: [
          "Allocate construction, operating, demand, regulatory, and force majeure risks to parties best able to manage them",
          "Define residual risks retained by the public sector or sponsors and the mechanisms used to compensate or mitigate them",
          "Confirm that risk allocation is internally consistent and financeable",
        ],
      },
      {
        name: "Transaction and capital structuring",
        descriptions: [
          "Design the ownership, financing, and contractual structure",
          "Incorporate credit enhancements or blended finance instruments where required to address binding risks",
          "Ensure the structure aligns with the requirements of likely equity and debt providers",
        ],
      },
      {
        name: "Contract development and documentation",
        descriptions: [
          "Prepare draft concession, offtake, or availability based payment agreements",
          "Develop term sheets and key commercial schedules",
          "Prepare procurement or tender documentation where competitive processes are required",
        ],
      },
      {
        name: "Targeted market engagement",
        descriptions: [
          "Test the proposed structure with a defined set of potential investors and lenders",
          "Validate pricing assumptions, risk appetite, and conditions for commitment",
          "Refine structure in response to market feedback",
        ],
      },
    ],
    gateChecklist: [
      {
        question: "Risk allocation credibility",
        description:
          "Are risks allocated in a way that is acceptable to the market and consistent with investor practice?",
      },
      {
        question: "Capital fit",
        description:
          "Does the structure align with the requirements of the targeted equity and debt providers?",
      },
      {
        question: "Credit adequacy",
        description:
          "Are offtakers and counterparties creditworthy, or are appropriate credit enhancements in place?",
      },
      {
        question: "Commit-ability",
        description:
          "Is the transaction sufficiently defined to support conditional commitments or bid participation?",
      },
    ],
    gateFailNote:
      "Projects that fail any of these criteria do not proceed to final capital engagement.",
    risksAddressed: [
      {
        name: "Mispriced risk risk",
        description:
          "Avoiding structures where risk is allocated but not bankable or compensable",
      },
      {
        name: "Revenue and credit risk",
        description:
          "Ensuring payment mechanisms and counterparties can support long term obligations",
      },
      {
        name: "Capital mismatch risk",
        description:
          "Preventing misalignment between project structure and available capital instruments",
      },
      {
        name: "Transaction failure risk",
        description:
          "Reducing the likelihood of market rejection late in the process",
      },
    ],
    artefacts: [
      "Risk allocation matrix",
      "Draft concession, offtake, or project agreements",
      "Financing structure and credit support term sheet",
      "Procurement and bid documentation",
    ],
  },
  {
    id: "transaction-close",
    number: 5,
    title: "Transaction Implementation and Financial Close",
    shortTitle: "Transaction close",
    purpose:
      "Convert conditional commitments into binding contracts and deployed capital, resolving all remaining legal, financial, and execution uncertainties so the project can move into construction or implementation.",
    activities: [
      {
        name: "Procurement and selection",
        descriptions: [
          "Manage competitive procurement or negotiated selection processes",
          "Evaluate bids against pre-defined commercial, technical, and financial criteria",
          "Confirm that the selected counterparty can deliver on the proposed risk allocation and pricing",
        ],
      },
      {
        name: "Capital finalisation and financial arranging",
        descriptions: [
          "Finalise debt and equity commitments, including pricing, tenor, security, and covenants",
          "Coordinate participation by public, private, and catalytic capital providers where relevant",
          "Confirm alignment between financing terms and project cash flows",
        ],
      },
      {
        name: "Final negotiations and documentation",
        descriptions: [
          "Conclude negotiations on all project and financing agreements",
          "Resolve residual issues related to risk allocation, security, and step-in rights",
          "Finalise intercreditor and sponsor arrangements where applicable",
        ],
      },
      {
        name: "Conditions precedent and close management",
        descriptions: [
          "Verify that all legal, regulatory, and contractual conditions precedent are satisfied",
          "Coordinate closing mechanics to enable funds to flow",
          "Manage sequencing to avoid last minute execution risk",
        ],
      },
    ],
    gateChecklist: [
      {
        question: "Commercial close",
        description:
          "Are all material project agreements executed and enforceable?",
      },
      {
        question: "Financial close",
        description:
          "Are all financing agreements signed and conditions precedent satisfied?",
      },
      {
        question: "Funding certainty",
        description:
          "Is committed capital available for drawdown in line with the construction or implementation schedule?",
      },
      {
        question: "Execution readiness",
        description:
          "Are governance, controls, and interfaces in place to move into delivery?",
      },
    ],
    gateFailNote:
      "Projects that fail to clear these criteria do not proceed to implementation.",
    risksAddressed: [
      {
        name: "Closing risk",
        description:
          "Preventing transaction failure due to unresolved legal or commercial issues",
      },
      {
        name: "Funding failure risk",
        description:
          "Ensuring capital is committed, available, and correctly sequenced",
      },
      {
        name: "Execution handover risk",
        description:
          "Avoiding gaps between financial close and effective project delivery",
      },
      {
        name: "Market withdrawal risk",
        description:
          "Managing late stage changes in market conditions or investor appetite",
      },
    ],
    artefacts: [
      "Executed financing agreements",
      "Executed project and commercial contracts",
      "Tender evaluation and selection report",
      "Financial close and funds flow memorandum",
    ],
  },
];

// --- References ---

export const PATHWAY_REFERENCES: PathwayReference[] = [
  {
    author: "Clean Air Task Force",
    title:
      "Systemic bankability is the key to unlocking energy transition speed and scale",
    source:
      "Systemic bankability is the key to unlocking energy transition speed and scale - Clean Air Task Force, 358\u2013364",
  },
  {
    author: "Cities Climate Finance Leadership Alliance",
    title: "What is Bankability?",
    source:
      "What is Bankability? - Cities Climate Finance Leadership Alliance, 385",
  },
  {
    author: "Global Infrastructure Facility",
    title: "2020 GIF Results Framework",
    source: "2020 GIF Results Framework_Approved.pdf - Global Infrastructure Facility, 1\u20137",
  },
  {
    author: "Global Infrastructure Facility",
    title: "Global Infrastructure Facility",
    source: "Global Infrastructure Facility - The World Bank, 65\u201368",
  },
  {
    author: "Global Infrastructure Facility",
    title: "The Global Infrastructure Facility",
    source: "THE GLOBAL INFRASTRUCTURE FACILITY, 365\u2013369",
  },
  {
    author: "Global Infrastructure Hub",
    title: "Financing Project Preparation",
    source:
      "3. Financing project preparation - Global Infrastructure Hub, 11\u201315",
  },
  {
    author: "ICLEI and FMDV",
    title:
      "Summary of Good Practice of Successful Project Preparation Facilities",
    source:
      "Summary of Good Practice of Successful Project Preparation Facilities - ICLEI World Congress 2018, 301\u2013332",
  },
  {
    author: "Private Infrastructure Development Group",
    title: "PIDG 2024 Sustainability and Impact Report",
    source:
      "PIDG 2024 Sustainability and Impact Report Final Digital, 203\u2013258",
  },
  {
    author: "Private Infrastructure Development Group",
    title: "Sustainability and Impact Report \u2013 2024",
    source:
      "Sustainability and Impact Report \u2013 2024 - Private Infrastructure, 333\u2013357",
  },
  {
    author: "Strategic Maturation",
    title:
      "Strategic Maturation of Infrastructure and Climate Projects: An Analysis of Best Practices in Project Development Facilities",
    source:
      "Strategic Maturation of Infrastructure and Climate Projects, 286\u2013299",
  },
  {
    author: "World Bank",
    title:
      "A Global Review of Case Studies to Finance the Infrastructure Gap",
    source:
      "A global review of case studies to finance the infrastructure gap, 16\u201342",
  },
  {
    author: "World Bank",
    title: "Infrastructure Project Preparation Facilities",
    source:
      "Infrastructure Project Preparation Facilities - World Bank Document, 73\u2013192",
  },
  {
    author: "World Bank",
    title: "Introduction - Primer on Project Development Funds",
    source:
      "Introduction - Primer on Project Development Funds Public Private Partnership, 193\u2013200",
  },
  {
    author: "World Bank",
    title:
      "Results and Performance of the World Bank Group 2024",
    source:
      "Results and Performance of the World Bank Group 2024, 265\u2013285",
  },
  {
    author: "World Bank",
    title: "World Bank Project Cycle",
    source: "World Bank Project Cycle, 386\u2013389",
  },
];
