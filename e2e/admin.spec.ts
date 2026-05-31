import { test, expect, type Page } from "@playwright/test";

// Admin password — matches the dev default in lib/auth.ts (ADMIN_PASSWORD env
// overrides it). Set ADMIN_PASSWORD in your shell to run against a custom one.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "natalie2026";

async function login(page: Page) {
  await page.goto("/admin");
  await page.getByPlaceholder("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Dashboard heading confirms an authenticated session.
  await expect(page.getByRole("heading", { name: "Manage lessons" })).toBeVisible();
}

test.describe("admin page", () => {
  test("rejects the wrong password and stays on the login screen", async ({ page }) => {
    await page.goto("/admin");
    await page.getByPlaceholder("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Incorrect password.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Admin login" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Manage lessons" })).toHaveCount(0);
  });

  test("logs in with the correct password and shows the calendar", async ({ page }) => {
    await login(page);
    await expect(page.getByText("Available", { exact: true })).toBeVisible(); // legend
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  });

  // Regression: wide time labels ("10:00 AM" / "12:00 PM") used to wrap to two
  // lines, inflating those rows and leaving the following :30 cells (10:30,
  // 12:30) misaligned and unclickable. Every row should be the same height.
  test("renders every half-hour row at a uniform height", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Next →" }).click();

    // Group cells by their time row and measure each row's height.
    const heightsByTime = await page.evaluate(() => {
      const cells = [...document.querySelectorAll<HTMLElement>("button[data-cell]")];
      const byTime = new Map<string, number>();
      for (const c of cells) {
        const t = c.getAttribute("data-time")!;
        byTime.set(t, Math.round(c.getBoundingClientRect().height));
      }
      return Object.fromEntries(byTime);
    });

    const heights = Object.values(heightsByTime);
    const min = Math.min(...heights);
    const max = Math.max(...heights);
    // No row should be taller than another (a wrapped label would ~double it).
    expect(max - min, `row heights: ${JSON.stringify(heightsByTime)}`).toBeLessThanOrEqual(1);

    // The previously-broken cells must be clickable (not covered / disabled).
    for (const time of ["10:30", "12:30"]) {
      const cell = page.locator(`button[data-cell][data-time="${time}"]:not([disabled])`).first();
      await expect(cell).toBeVisible();
      await expect(cell).toBeEnabled();
    }
  });

  test("paints availability with a drag, then removes it (self-cleaning)", async ({ page }) => {
    await login(page);

    // Move to next week so every visible cell is in the future (today's row and
    // past cells are disabled / not paintable).
    await page.getByRole("button", { name: "Next →" }).click();

    // Pick the first enabled, empty ("off") cell in the visible grid.
    const offCell = page.locator('button[data-cell].bg-white:not([disabled])').first();
    await expect(offCell).toBeVisible();
    const date = await offCell.getAttribute("data-date");
    const time = await offCell.getAttribute("data-time");
    expect(date).toBeTruthy();
    expect(time).toBeTruthy();

    const cell = page.locator(
      `button[data-cell][data-date="${date}"][data-time="${time}"]`
    );

    // --- Paint it available: pointer down + up on the cell commits one slot. ---
    const box = (await cell.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.up();

    // The cell turns green (available) once the POST resolves and data reloads.
    await expect(cell).toHaveClass(/bg-emerald-300/, { timeout: 10_000 });

    // --- Remove it again: dragging over a green cell deletes the slot. ---
    const box2 = (await cell.boundingBox())!;
    await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
    await page.mouse.down();
    await page.mouse.up();

    // Back to empty — leaves the database as we found it.
    await expect(cell).toHaveClass(/bg-white/, { timeout: 10_000 });
  });

  test("logs out and returns to the login screen", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page.getByRole("heading", { name: "Admin login" })).toBeVisible();
  });
});
