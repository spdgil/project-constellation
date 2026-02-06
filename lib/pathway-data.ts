/**
 * Deal Development Pathway — structured content for the 5-stage pathway.
 * Separated from presentation to keep data maintainable.
 */

import type { DealStage } from "./types";

// --- Types ---

export interface PathwayActivity {
  name: string;
  description: string;
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
  risksAddressed: PathwayRisk[];
  artefacts: string[];
  investorAlignment: string;
  evidenceNote: string;
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
    title: "Enabling Environment and Project Definition",
    shortTitle: "Definition",
    purpose:
      "This stage resolves strategic alignment and regulatory viability, ensuring the project is situated within a legal and institutional framework that supports private participation before significant resources are committed.",
    activities: [
      {
        name: "Sector Planning",
        description:
          "Conduct system planning to determine least-cost options and prioritize investments based on national goals.",
      },
      {
        name: "Regulatory Assessment",
        description:
          "Evaluate legal, regulatory, and institutional frameworks to identify reforms required for private capital participation.",
      },
      {
        name: "Consensus Building",
        description:
          "Initiate stakeholder engagement to build government and social consensus for the project rationale.",
      },
      {
        name: "Concept Definition",
        description:
          "Screen project options against needs and draft the initial project concept.",
      },
    ],
    gateChecklist: [
      {
        question: "Strategic Suitability",
        description:
          "Does the project align with national infrastructure priorities and Nationally Determined Contributions (NDCs)?",
      },
      {
        question: "Legal Viability",
        description:
          "Is the existing legal and regulatory framework sufficient to support the proposed project structure (e.g., PPP law)?",
      },
      {
        question: "Government Commitment",
        description:
          "Is there demonstrable government support and willingness to champion the project?",
      },
    ],
    risksAddressed: [
      {
        name: "Government Action Failure",
        description:
          "Reducing the risk of erratic policy changes or lack of political will.",
      },
      {
        name: "Legal/Regulatory Risk",
        description:
          "Identifying legislative gaps that would prevent financial close.",
      },
    ],
    artefacts: [
      "Project Concept Note (PCN)",
      "Legal and Regulatory Assessment Report",
      "Project Information Document",
    ],
    investorAlignment:
      "Corresponds to an investor's initial \"screen\" or \"watch list.\" Investors look for \"strategic suitability\" and a stable enabling environment.",
    evidenceNote:
      "Design draws on the GIF's \"Project or program definition\" activity and World Bank \"Enabling Environment\" phase, emphasizing upstream policy work.",
  },
  {
    id: "pre-feasibility",
    number: 2,
    title: "Pre-feasibility and Prioritisation",
    shortTitle: "Pre-feasibility",
    purpose:
      "This stage resolves the \"fatal flaw\" uncertainty by determining if the project is technically plausible and financially reasonable before incurring high preparation costs.",
    activities: [
      {
        name: "Pre-feasibility Studies",
        description:
          "Conduct high-level analysis of technical, financial, and environmental aspects to validate the core logic.",
      },
      {
        name: "Options Analysis",
        description:
          "Screen implementation options (public vs. private) and technical configurations.",
      },
      {
        name: "Initial Risk Screening",
        description:
          "Identify high-level physical climate risks, transition risks, and social safeguards issues.",
      },
      {
        name: "Market Testing",
        description:
          "Conduct initial market sounding to gauge potential investor interest.",
      },
    ],
    gateChecklist: [
      {
        question: "Preliminary Feasibility",
        description:
          "Does the pre-feasibility study indicate technical and financial viability without fatal flaws?",
      },
      {
        question: "Clearance in Principle",
        description:
          "Has the project passed initial screening for climate, nature, and social risks (e.g., HSES Category A/B)?",
      },
      {
        question: "Additionality",
        description:
          "Is there evidence that the investment would not occur without facility support?",
      },
    ],
    risksAddressed: [
      {
        name: "Technical Performance Risk",
        description:
          "Ensuring the proposed technology or solution is viable at a basic level.",
      },
      {
        name: "Social Opposition Risk",
        description:
          "Identifying community or safeguard issues early to avoid project cancellation.",
      },
    ],
    artefacts: [
      "Pre-feasibility Study",
      "Integrated Safeguards Data Sheet",
      "\"Clearance in Principle\" Decision Note",
    ],
    investorAlignment:
      "Corresponds to an investor's \"preliminary review.\" The project is investable at this stage only for early-stage risk capital (e.g., DevCo).",
    evidenceNote:
      "The separation of Pre-feasibility is supported by the GIF's \"Project Definition Activity\" and PIDG's \"Clearance in Principle\" gate.",
  },
  {
    id: "feasibility",
    number: 3,
    title: "Detailed Feasibility and Investment Appraisal",
    shortTitle: "Feasibility",
    purpose:
      "This stage resolves the core investment uncertainties by producing the detailed technical, economic, and ESG evidence required for a final investment decision.",
    activities: [
      {
        name: "Full Feasibility Studies",
        description:
          "Execute detailed engineering estimates, geotechnical assessments, and resource assessments.",
      },
      {
        name: "ESIA",
        description:
          "Conduct full Environmental and Social Impact Assessments in accordance with international standards.",
      },
      {
        name: "Financial Modelling",
        description:
          "Develop detailed financial models to assess viability, sustainability, and fiscal impact.",
      },
      {
        name: "Value for Money (VfM) Analysis",
        description:
          "Assess whether the proposed delivery model offers better value than traditional public procurement.",
      },
    ],
    gateChecklist: [
      {
        question: "Commercial Viability",
        description:
          "Does the financial model demonstrate sufficient cash flows to cover costs and provide returns?",
      },
      {
        question: "ESG Compliance",
        description:
          "Are E&S assessments completed with management plans (ESMP) that meet international performance standards?",
      },
      {
        question: "Fiscal Affordability",
        description:
          "Is the project affordable within the government's fiscal constraints?",
      },
    ],
    risksAddressed: [
      {
        name: "Construction Cost Overrun Risk",
        description:
          "Improving cost certainty through detailed engineering.",
      },
      {
        name: "Environmental/Social Risk",
        description:
          "Mitigating adverse impacts that could lead to liability or reputational damage.",
      },
    ],
    artefacts: [
      "Detailed Feasibility Report",
      "Environmental and Social Impact Assessment (ESIA)",
      "Financial Model and VfM Report",
    ],
    investorAlignment:
      "Corresponds to the \"due diligence\" phase. Investors require \"cost certainty\" and verified \"revenue potential\".",
    evidenceNote:
      "The heavy focus on technical/financial/ESG appraisal is derived from the \"Project Preparation and Investment Feasibility Assessment\" described by GIF and the World Bank's feasibility checklist.",
  },
  {
    id: "structuring",
    number: 4,
    title: "Project Structuring and Risk Allocation",
    shortTitle: "Structuring",
    purpose:
      "This stage resolves the commercial structure and risk allocation to ensure the project presents an acceptable risk-return profile to the market.",
    activities: [
      {
        name: "Risk Allocation",
        description:
          "Define the legal transfer of risks (e.g., construction, demand) to the parties best able to manage them.",
      },
      {
        name: "Transaction Structuring",
        description:
          "Design the commercial structure, including credit enhancements or blended finance instruments (e.g., guarantees, concessional debt).",
      },
      {
        name: "Drafting Agreements",
        description:
          "Prepare draft concession agreements, power purchase agreements (PPAs), and tender documents.",
      },
      {
        name: "Market Sounding",
        description:
          "Engage with investors to test the attractiveness of the proposed structure.",
      },
    ],
    gateChecklist: [
      {
        question: "Market Appetite",
        description:
          "Have market sounding activities confirmed investor interest in the proposed risk allocation?",
      },
      {
        question: "Creditworthiness",
        description:
          "Is the off-taker or implementing entity sufficiently creditworthy, or are credit enhancements in place?",
      },
      {
        question: "Endorsement",
        description:
          "Has the project received final endorsement regarding climate/nature risk mitigation and development impact?",
      },
    ],
    risksAddressed: [
      {
        name: "Revenue Adequacy Risk",
        description:
          "Structuring tariffs or payments to ensure financial obligations can be met.",
      },
      {
        name: "Currency Risk",
        description:
          "Implementing hedging or local currency guarantees to mitigate FX exposure.",
      },
    ],
    artefacts: [
      "Risk Allocation Matrix",
      "Draft Concession/Project Agreements",
      "Bid/Tender Documents",
    ],
    investorAlignment:
      "Corresponds to the \"credit committee\" or \"investment committee\" decision.",
    evidenceNote:
      "Structuring and risk allocation as a distinct phase is supported by the GIF's \"Transaction design and implementation\" and the Strategic Maturation analysis.",
  },
  {
    id: "transaction-close",
    number: 5,
    title: "Transaction Implementation and Financial Close",
    shortTitle: "Transaction close",
    purpose:
      "This stage resolves the final funding and contractual uncertainties, moving the project from a structured proposal to a funded asset ready for construction.",
    activities: [
      {
        name: "Procurement Management",
        description:
          "Manage the competitive bidding/tender process and evaluate proposals.",
      },
      {
        name: "Financial Arranging",
        description:
          "Coordinate public and private financing, finalizing debt and equity packages.",
      },
      {
        name: "Negotiation",
        description:
          "Finalize project agreements with the winning bidder and financiers.",
      },
      {
        name: "Conditions Precedent",
        description:
          "Ensure all legal and financial conditions for disbursement are met.",
      },
    ],
    gateChecklist: [
      {
        question: "Commercial Close",
        description:
          "Are all project agreements and contracts signed?",
      },
      {
        question: "Financial Close",
        description:
          "Have all financing agreements been signed and conditions precedent satisfied to allow funds to flow?",
      },
    ],
    risksAddressed: [
      {
        name: "Financial Market Failure",
        description:
          "Overcoming liquidity constraints or risk aversion through final credit enhancement packages.",
      },
      {
        name: "Closing Risk",
        description:
          "Ensuring all parties sign and conditions are met.",
      },
    ],
    artefacts: [
      "Signed Financing Agreements",
      "Commercial Contracts (signed)",
      "Tender Evaluation Report",
    ],
    investorAlignment:
      "Corresponds to \"financial close.\"",
    evidenceNote:
      "The final transaction phase aligns with GIF's \"Financing\" stage and the \"Commercial/Financial Close\" milestones tracked in results frameworks.",
  },
];

// --- Investability Definition ---

export const INVESTABILITY_DEFINITION =
  "A project is investable/bankable at the final stage when its \"risk-return profile meets investors' criteria,\" ensuring that \"estimated cash flows cover costs and produce returns commensurate with risk\". It requires a \"creditworthy entity\" to implement the project and confidence that \"regulatory, environmental, social, and economic factors\" will not prevent completion.";

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
