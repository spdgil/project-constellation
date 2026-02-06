import { describe, it, expect, beforeEach } from "vitest";
import {
  getDealWithLocalOverrides,
  getDealsWithLocalOverrides,
  hasLocalDealOverrides,
  saveDealLocally,
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
    removeItem: () => {},
    clear: () => {},
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
  stage: "feasibility",
  readinessState: "feasibility-underway",
  dominantConstraint: "common-user-infrastructure-gap",
  summary: "Pilot.",
  nextStep: "Secure offtake.",
  evidence: [],
  notes: [],
  updatedAt: "2026-02-06T00:00:00.000Z",
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
