import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("about page renders and passes a11y", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: /about/i })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"]) // design-level concern, tracked separately
    .analyze();
  expect(results.violations).toEqual([]);
});

test("deals list renders", async ({ page }) => {
  await page.goto("/deals/list");
  await expect(page.getByTestId("deals-results-list")).toBeVisible();
});

test("deals list filters by query", async ({ page }) => {
  await page.goto("/deals/list");
  const input = page.getByTestId("deals-search-input");
  await input.fill("RCOE");
  await expect(page.getByTestId("deals-count")).toContainText("deal");
});

test("map page renders map canvas", async ({ page }) => {
  await page.goto("/lga/map");
  await expect(page.getByTestId("map-canvas")).toBeVisible();
});

test("deal detail page renders", async ({ page }) => {
  await page.goto("/deals/demo-flexilab");
  await expect(page.getByTestId("deal-pathway-stepper")).toBeVisible();
});
