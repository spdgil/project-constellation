import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import RootLayout from "./layout";

vi.mock("next/font/google", () => ({
  Newsreader: () => ({ variable: "--font-newsreader" }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

function getFocusableInOrder(container: HTMLElement): HTMLElement[] {
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

describe("RootLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skip-to-content link is the first focusable element", () => {
    const { container } = render(
      <RootLayout>
        <div>Page content</div>
      </RootLayout>
    );

    const skip = screen.getByTestId("skip-to-content");
    expect(skip).toBeInTheDocument();
    expect(skip).toHaveAttribute("href", "#main-content");
    expect(skip).toHaveTextContent(/skip to main content/i);

    const focusable = getFocusableInOrder(container);
    expect(focusable.length).toBeGreaterThan(0);
    expect(focusable[0]).toBe(skip);
  });

  it("main content has id main-content for skip link target", () => {
    render(
      <RootLayout>
        <div>Page content</div>
      </RootLayout>
    );

    const main = document.getElementById("main-content");
    expect(main).toBeInTheDocument();
    expect(main?.tagName.toLowerCase()).toBe("main");
  });
});
