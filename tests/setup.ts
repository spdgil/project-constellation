import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi, afterEach } from "vitest";

// Mock next/link for Vitest (no Next router in test env)
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => React.createElement("a", { href, ...rest }, children),
}));

// Default fetch mock to avoid hanging tests on network calls.
const defaultFetch = vi.fn().mockResolvedValue({
  ok: false,
  status: 404,
  json: async () => ({}),
  text: async () => "",
});
vi.stubGlobal("fetch", defaultFetch);

// Mock next-auth client to avoid background polling in tests.
vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

afterEach(() => {
  vi.clearAllTimers();
});

// Polyfill ResizeObserver for jsdom (used by bottom sheet, etc.)
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    private cb: ResizeObserverCallback;
    constructor(cb: ResizeObserverCallback) {
      this.cb = cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
