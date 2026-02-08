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
