import { describe, it, expect, beforeEach } from "vitest";
import {
  getDealWithLocalOverrides,
  getDealsWithLocalOverrides,
  hasLocalDealOverrides,
  saveDealLocally,
  deleteDealLocally,
  getConstraintEvents,
  appendConstraintEvent,
} from "./deal-storage";
import type { Deal, ConstraintEvent } from "./types";

function createMockStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    key: () => null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

const baseDeal: Deal = {
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
  investmentValueAmount: 0,
  investmentValueDescription: "",
  economicImpactAmount: 0,
  economicImpactDescription: "",
};

describe("deal-storage", () => {
  describe("with mock localStorage", () => {
    let mockStorage: Storage;

    beforeEach(() => {
      mockStorage = createMockStorage();
    });

    it("getDealWithLocalOverrides returns base deal when storage is empty", () => {
      const result = getDealWithLocalOverrides(baseDeal.id, baseDeal, mockStorage);
      expect(result).toEqual(baseDeal);
    });

    it("saveDealLocally and getDealWithLocalOverrides: persisted on reload", () => {
      const updated: Deal = {
        ...baseDeal,
        readinessState: "conceptual-interest",
        updatedAt: "2026-02-06T12:00:00.000Z",
      };
      saveDealLocally(updated, mockStorage);

      const result = getDealWithLocalOverrides(baseDeal.id, baseDeal, mockStorage);
      expect(result.readinessState).toBe("conceptual-interest");
      expect(result.updatedAt).toBe("2026-02-06T12:00:00.000Z");
    });

    it("hasLocalDealOverrides returns true after save", () => {
      expect(hasLocalDealOverrides(baseDeal.id, mockStorage)).toBe(false);
      saveDealLocally(baseDeal, mockStorage);
      expect(hasLocalDealOverrides(baseDeal.id, mockStorage)).toBe(true);
    });

    it("getDealsWithLocalOverrides merges each deal with storage", () => {
      const updated: Deal = {
        ...baseDeal,
        readinessState: "conceptual-interest",
      };
      saveDealLocally(updated, mockStorage);
      const baseDeals = [baseDeal];
      const result = getDealsWithLocalOverrides(baseDeals, mockStorage);
      expect(result).toHaveLength(1);
      expect(result[0].readinessState).toBe("conceptual-interest");
    });

    it("deleteDealLocally removes a deal and returns true", () => {
      saveDealLocally(baseDeal, mockStorage);
      expect(hasLocalDealOverrides(baseDeal.id, mockStorage)).toBe(true);

      const deleted = deleteDealLocally(baseDeal.id, mockStorage);
      expect(deleted).toBe(true);
      expect(hasLocalDealOverrides(baseDeal.id, mockStorage)).toBe(false);
    });

    it("deleteDealLocally returns false when deal does not exist", () => {
      expect(deleteDealLocally("non-existent", mockStorage)).toBe(false);
    });

    it("deleteDealLocally removes storage key when last deal is deleted", () => {
      saveDealLocally(baseDeal, mockStorage);
      deleteDealLocally(baseDeal.id, mockStorage);

      // Storage key removed entirely — getItem returns null
      expect(
        mockStorage.getItem("constellation-dev-facility:deals")
      ).toBeNull();
    });

    it("appendConstraintEvent persists and getConstraintEvents returns it", () => {
      expect(getConstraintEvents(mockStorage)).toHaveLength(0);

      const event = appendConstraintEvent(
        {
          entityType: "deal",
          entityId: baseDeal.id,
          dominantConstraint: "planning-and-approvals",
          changedAt: "2026-02-06T12:00:00.000Z",
          changeReason: "Edited in UI",
        },
        mockStorage
      );

      expect(event.id).toBeDefined();
      expect(event.entityType).toBe("deal");
      expect(event.entityId).toBe(baseDeal.id);
      expect(event.dominantConstraint).toBe("planning-and-approvals");

      const events = getConstraintEvents(mockStorage);
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe(event.id);
      expect(events[0].changeReason).toBe("Edited in UI");
    });
  });
});
