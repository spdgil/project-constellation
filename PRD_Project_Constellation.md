# Product Requirements Document (PRD)
## The Constellation Development Facility (Prototype)


**Version:** 0.2  
**Last updated:** 2026-02-06  
**Package contents:** `PRD.md`, `narrative.md`, `DESIGN_SYSTEM.md`

This PRD defines a dashboard that identifies where Queensland’s economy *wants* to grow but cannot yet attract capital, and supports a project development facility to close that gap.

**Design system source of truth:** `DESIGN_SYSTEM.md` (do not duplicate rules elsewhere).

---

## 1. Purpose

### 1.1 Product intent
Build a Queensland state-level dashboard that:

- surfaces market-grounded opportunity patterns by LGA (place context)
- tracks real deals as evidence and as a maturation pipeline (project instances)
- classifies opportunities using a shared taxonomy so similar opportunities can be compared across LGAs
- aggregates to the state level to reveal repeated constraints that justify intervention

### 1.2 Primary use case
A project development facility uses the dashboard to:

- originate opportunities (place → opportunity hypotheses)
- select a small number of priority opportunity clusters
- mature deals through progressive diligence
- identify the **single dominant constraint** blocking investability
- choose interventions that unlock multiple deals and/or multiple LGAs

---

## 2. Goals and non-goals

### 2.1 Goals (v1)
- Navigable LGA boundary map (black/white) as a primary entry point
- Opportunity taxonomy views (cross-LGA comparison)
- Deal cards with readiness state + dominant constraint + next step
- State aggregation views (readiness and constraint patterns)
- Progressive disclosure as the default interaction model

### 2.2 Non-goals (v1)
- Forecasting, macroeconomic modelling, or ROI/IRR projections
- Comprehensive statewide data lake ingestion
- Automating investment decisions
- Ranking LGAs as winners/losers
- GIS complexity beyond LGA boundaries and deal markers

---

## 3. Users

### 3.1 Primary users
- State economic development and Treasury-style analysts
- Project development facility team members
- Regional economic development organisations
- Investors and intermediaries reviewing pipeline maturity

### 3.2 Secondary users
- Local government economic development teams
- Agencies responsible for approvals, infrastructure, and workforce programs

---

## 4. Core concepts and definitions

### 4.1 Objects
**LGA (Place):** context and conditions (assets, constraints, capabilities, signals).  
**Opportunity type (Taxonomy item):** a repeatable pattern used to compare like-with-like across places.  
**Deal (Project instance):** a specific opportunity being matured; may span multiple LGAs; belongs to **one** opportunity type.

### 4.2 Two diligence pathways
**LGA diligence (market opportunity):** defines opportunity hypotheses for a place.  
**Deal diligence (project maturation):** progresses a specific project toward investability.

### 4.3 Capital readiness ladder
Each deal and each cluster has one readiness state:

1. No viable projects  
2. Conceptual interest  
3. Feasibility underway  
4. Structurable but stalled  
5. Investable with minor intervention  
6. Scaled and replicable

### 4.4 Dominant binding constraint
Each deal and each cluster has **one** dominant constraint:

- Revenue certainty
- Offtake / demand aggregation
- Planning and approvals
- Sponsor capability
- Early risk capital
- Balance sheet constraints
- Technology risk
- Coordination failure
- Skills and workforce constraint
- Common-user infrastructure gap

**Rule:** One constraint only; second-order issues go in notes, not classification.

---

## 5. Information architecture and navigation

### 5.1 Primary navigation modes
- **Place-first:** Map → LGA → local hypotheses → deals → cluster
- **Opportunity-first:** Taxonomy → opportunity type → deals across LGAs → patterns
- **Deal-first:** Search → deal card → opportunity type → affected LGAs

### 5.2 Required navigation flows
1. **Map:** select an LGA → open LGA panel (summary, hypotheses, deals)
2. **LGA → opportunity:** select an opportunity type → view local hypothesis + evidence
3. **LGA → deal:** select a deal marker → open deal card
4. **Opportunity → cross-LGA:** view same opportunity across places
5. **State aggregation:** view readiness/constraints patterns by opportunity type and by LGA

---

## 6. Screens and components

### 6.1 State landing
- Minimal introduction copy
- Three entry choices:
  - Explore by map
  - Explore by opportunity types
  - Search deals

### 6.2 LGA map (black/white)
**Visual constraints (from `DESIGN_SYSTEM.md`):**
- black/white map layer only
- no gradients
- minimal UI chrome
- progressive disclosure (details appear on selection)

**Functionality:**
- Render LGA boundaries from local GeoJSON
- Render deal markers as simple dots/squares (consistent size)
- Click or keyboard select an LGA to open LGA panel
- Filter markers by:
  - opportunity type
  - readiness state
  - dominant constraint
- Keyboard: tab to controls; arrows/+/– for map zoom if provided

### 6.3 LGA panel
Progressive sections (collapsed by default except Summary):
- Summary
- Opportunity hypotheses
- Active deals
- Repeated constraints (local pattern)
- Evidence and notes

### 6.4 Opportunity taxonomy index
- List of opportunity types
- Deal count statewide
- Readiness distribution summary
- Dominant constraint summary

### 6.5 Opportunity type detail
- Definition of opportunity type
- Deals across LGAs
- Readiness distribution
- Dominant constraints distribution
- Replication signals (same constraint repeating)

### 6.6 Deal card
Required fields:
- Deal name
- Opportunity type
- LGAs involved
- Location marker (optional; can be centroid)
- Stage (concept/feasibility/structuring/investment-ready/operating)
- Readiness state
- Dominant constraint
- “What would move this forward” (single sentence)
- Evidence links (internal references)
- Notes (timestamped)
- Last updated

Actions (v1, local-only):
- Edit deal status / readiness / constraint (with audit trail)
- Add a note
- Link deal toims to a cluster (create cluster if needed)

### 6.7 State aggregation views
- Pipeline summary by opportunity type (counts by readiness)
- Constraint summary by opportunity type
- Constraint summary by LGA
- “Stall points” view: where deals cluster at the same readiness stage

---

## 7. Data model (v1)

### 7.1 Entities (TypeScript)
**LGA**
- `id: string`
- `name: string`
- `geometryRef: string` (key into GeoJSON features)
- `notes?: string[]`

**OpportunityType**
- `id: string`
- `name: string`
- `definition: string`
- `economicFunction: string`
- `typicalCapitalStack: string`
- `typicalRisks: string`

**Cluster**
- `id: string`
- `name: string`
- `opportunityTypeId: string`
- `lgaIds: string[]`
- `readinessState: ReadinessState`
- `dominantConstraint: Constraint`
- `rationale: string`
- `dealIds: string[]`

**Deal**
- `id: string`
- `name: string`
- `opportunityTypeId: string`
- `lgaIds: string[]`
- `lat?: number`
- `lng?: number`
- `stage: DealStage`
- `readinessState: ReadinessState`
- `dominantConstraint: Constraint`
- `summary: string`
- `nextStep: string`
- `evidence: EvidenceRef[]`
- `notes: Note[]`
- `updatedAt: string`

**ConstraintEvent**
- `id: string`
- `entityType: "deal" | "cluster"`
- `entityId: string`
- `dominantConstraint: Constraint`
- `changedAt: string`
- `changeReason: string`

### 7.2 Storage (v1)
- Static JSON in repo (`/data/*.json`)
- Local edits stored in browser (localStorage) for prototype, optional

---

## 8. LGA-level diligence module (prototype content)

### 8.1 Purpose
A disciplined method to define market opportunities at the LGA level, without collapsing into a project list.

### 8.2 Output format
For each LGA (or LGA group in pilots):
- Place signals (economy, structure, assets)
- Capability anchors (firms, skills, infrastructure)
- Opportunity hypotheses (3–7)
- Constraint signals (recurring barriers)
- Candidate deal exemplars (2–8)
- Evidence references (page pointers)

### 8.3 Example: Greater Whitsunday (Mackay, Isaac, Whitsunday LGAs)
**Source:** *Greater Whitsunday METS Sector – A Revenue Diversification Strategy* (PDF pages referenced below).  
**Note:** The content in this example is derived **only** from the provided PDF.

#### 8.3.1 Place signals and economic profile (PDF p.15, p.17)
- Mining is a major driver and the region is described as heavily reliant on mining, creating cyclical employment patterns correlated with commodity cycles. (p.15)
- The region is presented as a combined economy spanning Mackay, Isaac, and Whitsunday LGAs, with a gross regional product close to $30bn (~6% of Queensland’s economy). (p.17)
- Additional signals presented include:
  - over two million visitors and over $2bn visitor expenditure in 2023 (p.17)
  - 10% of Queensland agricultural production and 28% of Australia’s sugarcane production (p.17)
  - unemployment rate 3.9% (p.17)
  - largest metallurgical coal deposits in Australia (p.17)
  - Paget Industrial Estate described as the largest mining services industrial precinct in the southern hemisphere (p.17)

#### 8.3.2 Capability anchors (PDF p.7, p.18–21)
**METS base**
- METS is described as a significant contributor stemming from resources and mining, with an estimated 700+ businesses providing specialised goods and services, directly employing and supporting thousands of jobs. (p.7, p.18)

**Industry clusters**
- Paget: ~40% of METS businesses, with diverse categories including equipment hire, equipment manufacturing, and integrated businesses. (p.19)
- Moranbah: ~13%, emphasising proximity-dependent services (equipment hire and mine-site services). (p.19)
- Mackay City: ~12%, with a high share of technical consulting. (p.19)

**Infrastructure anchors**
- Paget Industrial Estate described as a leading METS precinct; the document highlights infrastructure suitability for multiple industries. (p.20)
- Resources Centre of Excellence in Paget: includes training, innovation, demonstration; Stage 2 “Future Industries Hub” supported with Queensland Government funding and a focus including incubating new industries such as critical minerals processing. (p.20)

**Workforce profile**
- The region is described as highly specialised in technicians/trades and machine operators/drivers, with examples including station plant operators, mechanical engineering trades, building/engineering technicians, electricians, and fabrication engineering workers. (p.21)

#### 8.3.3 Opportunity identification method (PDF p.10, p.24–28)
The strategy identifies diversification opportunities using:
- policy and strategy scanning to form a long list (p.25)
- a multi-criteria analysis with five criteria:
  - government priority
  - size/scale of opportunity
  - sector maturity and recent growth
  - alignment with METS skills and capability
  - stakeholder interest and understanding (p.10, p.26)
- The prioritised sectors include:
  - critical minerals
  - renewable energy
  - bioenergy
  - biomanufacturing
  - circular economy
  - space
  - post-mining land use (p.7, p.28–29)

A scoring table is provided, placing critical minerals, renewables, and bioeconomy highest, followed by circular economy, space, and post-mining land use. (p.27–28)

#### 8.3.4 Opportunity hypotheses (store as LGA opportunity hypotheses)
Each hypothesis below should be stored with:
- a single dominant constraint (from §4.4)
- 1–3 candidate deal exemplars (from §8.3.6)
- evidence page references

**H1: Critical minerals (value chain adjacency; common-user processing)**
- Opportunity framing includes upstream exploration/extraction adjacency and longer-term upside in downstream processing/manufacturing. (p.34–35)
- The document highlights a view that shared/common-user processing infrastructure can enable growth, with a case study describing a critical minerals pilot processing facility in Paget (FlexiLab) supported by Queensland Government funding and reporting interest from companies. (p.37)
- Local hypothesis: METS capabilities support servicing critical minerals opportunities beyond the region, and common-user processing infrastructure can be catalytic.

**H2: Renewable energy (project pipeline; participation barriers)**
- Renewable transition described as requiring significant investment, with a Queensland pipeline cited and major projects referenced for the region, including pumped hydro and energy hub concepts. (p.38, p.41)
- The action plan notes METS businesses tend to see involvement as limited to operations and maintenance, with gaps in awareness of construction-phase opportunities and specialised electrical capabilities. (p.40)
- Local hypothesis: a durable pipeline exists, but local capture is constrained by awareness, skills gaps, and procurement structure.

**H3: Bioenergy (existing biofuel history; knowledge and feedstock perceptions)**
- Bioenergy sector described as established locally with case studies including a biocommodities pilot plant and a sugar-to-ethanol precinct. (p.42, p.45)
- The action plan describes stakeholder perceptions focused on competition with agriculture for feedstock and limited understanding of newer biofuels demand drivers, including sustainable aviation fuels. (p.44)
- Local hypothesis: the region can progress bioenergy opportunities, but needs clearer market understanding and value chain targeting.

**H4: Biomanufacturing (future foods; certification and process capability)**
- Biomanufacturing opportunity described with regional relevance including a future foods biohub business case and upgrades to a pilot plant enabling synthetic biology demonstration. (p.46)
- The action plan highlights constraints including food-grade certification and limited technical understanding of biomanufacturing processes. (p.48)
- Local hypothesis: fabrication and maintenance adjacency exists, but bankability depends on certification pathways and process capability building.

**H5: Circular economy (mining value chain; lifecycle and regulation barriers)**
- Circular economy opportunity described with Queensland-scale benefits and regional relevance via mining value chains and programs associated with the Resources Centre of Excellence. (p.50, p.53)
- The action plan highlights gaps including limited circular systems thinking and constraints associated with mine site control practices and waste regulation. (p.52)
- Local hypothesis: circular opportunities exist, but require capability uplift and regulatory navigation to scale.

**H6: Space (Bowen spaceport adjacency; standards and demand uncertainty)**
- Space opportunity framed around investment attraction and the Bowen Orbital Spaceport, with licensing noted and the site described as one of only three dedicated orbital launch sites globally. (p.54)
- The action plan highlights gaps in accreditation and procurement pathways, including ISO standards. (p.56)
- Local hypothesis: initial manufacturing and services opportunities exist, but entry is constrained by standards and near-term demand uncertainty.

**H7: Post-mining land use (mine closure scale; risk allocation clarity)**
- Post-mining land use described as a significant opportunity with expected mine closure periods and expenditure ranges, and an emphasis on proactive planning and progressive rehabilitation. (p.58–60)
- Action plan highlights a lack of clarity regarding who carries ongoing risk for post-mining uses, and the need for regional strategic planning frameworks. (p.60)
- Local hypothesis: a scalable project class is possible, but requires governance, risk allocation, and multi-stakeholder planning.

#### 8.3.5 Constraint signals (local pattern evidence) (PDF p.33, p.64–69)
Four action themes are presented:
- powering a workforce (skills development/transferability)
- forging relationships (partnerships)
- exploring opportunities (information/awareness)
- championing change (regulatory/policy) (p.33)

Stakeholder insights are summarised into recurring themes, including:
- low awareness and knowledge of adjacent diversification opportunities (p.65)
- talent attraction challenges and labour constraints (p.66)
- strong mining workflow making diversification motivation difficult (p.67)
- expensive and carbon-intensive transport/logistics (p.68)
- early-stage decarbonisation actions driven by cost savings; constraints in leased assets and EV infrastructure (p.69)

For dashboard classification, map these to dominant constraints as follows:
- powering a workforce → skills and workforce constraint
- forging relationships → coordination failure / sponsor capability (case dependent)
- exploring opportunities → off-take/demand aggregation or coordination failure (case dependent)
- championing change → planning and approvals or coordination failure (case dependent)

#### 8.3.6 Candidate deal exemplars for prototype seed
Create initial deal cards from case studies and named projects, with conservative readiness state and constraints (avoid adding facts not in the PDF):

- Resources Centre of Excellence (Paget) and Future Industries Hub (p.20)
- RCOE FlexiLab critical minerals pilot processing plant (p.37)
- Capricornia Energy Hub pumped hydro concept (p.41)
- Pioneer-Burdekin pumped hydro concept (p.41)
- Linked Group Services diversification into commercial solar solutions and products (p.41)
- Mackay QUT Renewable Biocommodities Pilot Plant and Racecourse Cogeneration (p.45)
- Wilmar Sarina Distillery (ethanol precinct) (p.45)
- Future Foods Biohub business case partnership and Cauldron Ferm facility concept (p.49)
- RCOE and BHP Mitsubishi “Pit to Port” circular program (p.53)
- Valmar Engineering supplying Gilmour Space (p.57)
- Veolia Woodlawn Eco Precinct (external example included in the PDF; use only what is described) (p.61)

Each deal card should state:
- which LGA(s) it sits in (if inferable from place names in the PDF; otherwise “Greater Whitsunday region”)
- readiness state and dominant constraint (choose the single most defensible constraint based on the PDF narrative)

---

## 9. Design system requirements
All UI, components, typography, palette, motion, and accessibility must comply with `DESIGN_SYSTEM.md`.  
**Do not introduce rounding, drop shadows, gradients, bright colours, or dense layouts.**

---

## 10. Technical requirements

### 10.1 Suggested stack
Framework & runtime
- Next.js 16.1.6 (App Router)
- React 19.2.3
- TypeScript 5

Styling
- Tailwind CSS 4

Testing
- Vitest 4
- Testing Library
- jsdom

Code quality
- ESLint 9 with Next.js config

### 10.2 Mapping implementation requirements
- Render boundaries from local GeoJSON
- Black/white styling for map
- Keyboard accessible interactions
- Deal markers on top of boundaries
- Click and keyboard selection parity

### 10.3 Data
- Static JSON datasets committed into the repo for v1
- Typed schemas for all entities
- Seed data includes the Greater Whitsunday example

---

## 11. Acceptance criteria

### 11.1 MVP acceptance
- Enter via map, opportunity types, or deal search
- Select an LGA → view LGA diligence + deals
- Select a deal marker → view deal card (readiness + constraint + next step)
- View an opportunity type → see deals across LGAs and patterns
- View state aggregation → see readiness and constraint patterns
- Meets `DESIGN_SYSTEM.md` and accessibility requirements (keyboard, focus rings, reduced motion)

### 11.2 Content acceptance (Greater Whitsunday example)
- LGA diligence content is derived only from the provided PDF
- No external facts are added to the example
- Page references are included for every substantive claim

---

## 12. Suggested repository structure
```
app/
components/
lib/
data/
  lgas.json
  opportunityTypes.json
  deals.json
  clusters.json
  qld-lga-boundaries.geojson
tests/
docs/
  PRD.md
  narrative.md
  DESIGN_SYSTEM.md
```

---

## 13. Build order (Cursor friendly)
1. Scaffold project (Next.js, TS, Tailwind, ESLint, Vitest)
2. Define TypeScript types for entities and constraints
3. Create seed JSON and loaders
4. Build map page with LGA outlines + deal markers
5. Build LGA panel (progressive disclosure)
6. Build deal drawer / page
7. Build opportunity taxonomy index + detail
8. Build state aggregation views
9. Accessibility pass (skip link, focus rings, reduced motion)
10. Tests for key flows
