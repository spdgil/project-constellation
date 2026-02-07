import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AccordionSection } from "./AccordionSection";

describe("AccordionSection", () => {
  it("renders title and is collapsed by default", () => {
    render(
      <AccordionSection title="Test Section">
        <p>Content inside</p>
      </AccordionSection>
    );

    expect(screen.getByText("Test Section")).toBeInTheDocument();
    const button = screen.getByRole("button", { expanded: false });
    expect(button).toBeInTheDocument();
    // Content is not rendered when collapsed
    expect(screen.queryByText("Content inside")).not.toBeInTheDocument();
  });

  it("shows badge when provided", () => {
    render(
      <AccordionSection title="Gates" badge="3/5">
        <p>Content</p>
      </AccordionSection>
    );

    expect(screen.getByText("3/5")).toBeInTheDocument();
  });

  it("starts expanded when defaultOpen is true", () => {
    render(
      <AccordionSection title="Open Section" defaultOpen>
        <p>Visible content</p>
      </AccordionSection>
    );

    const button = screen.getByRole("button", { expanded: true });
    expect(button).toBeInTheDocument();
    expect(screen.getByText("Visible content")).toBeInTheDocument();
  });

  it("toggles open/closed on click", () => {
    render(
      <AccordionSection title="Toggle Section">
        <p>Hidden content</p>
      </AccordionSection>
    );

    const button = screen.getByRole("button", { expanded: false });
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Hidden content")).toBeInTheDocument();

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
  });

  it("toggles on keyboard Enter", () => {
    render(
      <AccordionSection title="Keyboard Section">
        <p>Keyboard content</p>
      </AccordionSection>
    );

    const button = screen.getByRole("button");
    fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
    expect(button).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles on keyboard Space", () => {
    render(
      <AccordionSection title="Space Section">
        <p>Space content</p>
      </AccordionSection>
    );

    const button = screen.getByRole("button");
    fireEvent.keyDown(button, { key: " ", code: "Space" });
    expect(button).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(button, { key: " ", code: "Space" });
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("has correct aria attributes linking header and panel when open", () => {
    render(
      <AccordionSection title="Accessible Section" defaultOpen>
        <p>Panel content</p>
      </AccordionSection>
    );

    const button = screen.getByRole("button");
    const panelId = button.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();

    const panel = document.getElementById(panelId!);
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute("role", "region");
    expect(panel).toHaveAttribute("aria-labelledby", button.id);
  });

  it("supports controlled mode with expanded and onToggle", () => {
    let expanded = false;
    const onToggle = () => {
      expanded = !expanded;
    };

    const { rerender } = render(
      <AccordionSection heading="Controlled" expanded={expanded} onToggle={onToggle}>
        <p>Controlled content</p>
      </AccordionSection>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);
    rerender(
      <AccordionSection heading="Controlled" expanded={expanded} onToggle={onToggle}>
        <p>Controlled content</p>
      </AccordionSection>
    );

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Controlled content")).toBeInTheDocument();
  });
});
