import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders the app title", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /project constellation/i })
    ).toBeInTheDocument();
  });

  it("renders three entry links: map, opportunity types, deal search", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("link", { name: /explore by map/i })
    ).toHaveAttribute("href", "/map");
    expect(
      screen.getByRole("link", { name: /explore by opportunity types/i })
    ).toHaveAttribute("href", "/opportunities");
    expect(
      screen.getByRole("link", { name: /search deals/i })
    ).toHaveAttribute("href", "/deals");
  });
});
