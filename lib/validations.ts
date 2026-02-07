/**
 * Zod validation schemas for API route request bodies.
 * Centralised here so schemas can be reused across routes and tests.
 */

import { z } from "zod";

/* ====================================================================== */
/* Shared enums                                                            */
/* ====================================================================== */

export const DealStageSchema = z.enum([
  "definition",
  "pre-feasibility",
  "feasibility",
  "structuring",
  "transaction-close",
]);

export const ReadinessStateSchema = z.enum([
  "no-viable-projects",
  "conceptual-interest",
  "feasibility-underway",
  "structurable-but-stalled",
  "investable-with-minor-intervention",
  "scaled-and-replicable",
]);

export const ConstraintSchema = z.enum([
  "revenue-certainty",
  "offtake-demand-aggregation",
  "planning-and-approvals",
  "sponsor-capability",
  "early-risk-capital",
  "balance-sheet-constraints",
  "technology-risk",
  "coordination-failure",
  "skills-and-workforce-constraint",
  "common-user-infrastructure-gap",
]);

export const GateStatusSchema = z.enum([
  "pending",
  "satisfied",
  "not-applicable",
]);

export const ArtefactStatusSchema = z.enum([
  "not-started",
  "in-progress",
  "complete",
]);

/* ====================================================================== */
/* Deal schemas                                                            */
/* ====================================================================== */

const GateEntrySchema = z.object({
  question: z.string().min(1),
  status: GateStatusSchema,
});

const ArtefactEntrySchema = z.object({
  name: z.string().min(1),
  status: ArtefactStatusSchema,
  summary: z.string().optional(),
  url: z.string().optional(),
});

const EvidenceSchema = z.object({
  label: z.string().optional(),
  url: z.string().optional(),
  pageRef: z.string().optional(),
});

const GovernmentProgramSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const TimelineMilestoneSchema = z.object({
  label: z.string().min(1),
  date: z.string().optional(),
});

export const CreateDealSchema = z.object({
  name: z.string().min(1, "Deal name is required").trim(),
  opportunityTypeId: z.string().min(1),
  lgaIds: z.array(z.string()).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  stage: DealStageSchema,
  readinessState: ReadinessStateSchema,
  dominantConstraint: ConstraintSchema,
  summary: z.string().min(1),
  nextStep: z.string().optional(),
  description: z.string().optional(),
  investmentValue: z.string().optional(),
  investmentValueAmount: z.number().min(0).optional(),
  investmentValueDescription: z.string().optional(),
  economicImpact: z.string().optional(),
  economicImpactAmount: z.number().min(0).optional(),
  economicImpactDescription: z.string().optional(),
  economicImpactJobs: z.number().int().min(0).optional(),
  keyStakeholders: z.array(z.string()).optional(),
  risks: z.array(z.string()).optional(),
  strategicActions: z.array(z.string()).optional(),
  infrastructureNeeds: z.array(z.string()).optional(),
  skillsImplications: z.string().optional(),
  marketDrivers: z.string().optional(),
  governmentPrograms: z.array(GovernmentProgramSchema).optional(),
  timeline: z.array(TimelineMilestoneSchema).optional(),
  evidence: z.array(EvidenceSchema).optional(),
  gateChecklist: z.record(z.string(), z.array(GateEntrySchema)).optional(),
  artefacts: z.record(z.string(), z.array(ArtefactEntrySchema)).optional(),
});

export const PatchDealSchema = z
  .object({
    name: z.string().min(1).trim(),
    stage: DealStageSchema,
    readinessState: ReadinessStateSchema,
    dominantConstraint: ConstraintSchema,
    changeReason: z.string(),
    summary: z.string(),
    nextStep: z.string(),
    description: z.string().nullable(),
    investmentValueAmount: z.number().min(0),
    investmentValueDescription: z.string(),
    economicImpactAmount: z.number().min(0),
    economicImpactDescription: z.string(),
    economicImpactJobs: z.number().int().nullable(),
    keyStakeholders: z.array(z.string()),
    risks: z.array(z.string()),
    strategicActions: z.array(z.string()),
    infrastructureNeeds: z.array(z.string()),
    skillsImplications: z.string().nullable(),
    marketDrivers: z.string().nullable(),
    gateChecklist: z.record(z.string(), z.array(GateEntrySchema)),
    artefacts: z.record(z.string(), z.array(ArtefactEntrySchema)),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateDealInput = z.infer<typeof CreateDealSchema>;
export type PatchDealInput = z.infer<typeof PatchDealSchema>;

/* ====================================================================== */
/* Sector opportunity schemas                                              */
/* ====================================================================== */

export const PatchSectorSchema = z
  .object({
    name: z.string().min(1),
    version: z.string(),
    tags: z.array(z.string()),
    sources: z.array(z.string()),
    sections: z.record(z.string(), z.string()),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No valid fields provided",
  });

export type PatchSectorInput = z.infer<typeof PatchSectorSchema>;

/* ====================================================================== */
/* File upload constraints                                                 */
/* ====================================================================== */

/** Maximum file size in bytes (10 MB). */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Allowed MIME types for document uploads. */
export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/json",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

/**
 * Validate an uploaded file against size and MIME type constraints.
 * Returns null if valid, or an error message string.
 */
export function validateUploadedFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const maxMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
    return `File exceeds maximum size of ${maxMB} MB`;
  }
  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return `File type "${mime}" is not allowed`;
  }
  return null;
}
