import { test, expect, type Page } from "@playwright/test";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "natalie2026";

// Lands on the admin dashboard, signing in only if the login form is shown
// (the session cookie persists across navigations within a test).
async function gotoAdmin(page: Page) {
  await page.goto("/admin");
  const pw = page.getByPlaceholder("Password");
  const heading = page.getByRole("heading", { name: "Manage lessons" });
  // Wait out the initial "Loading…" state: either the login form or the
  // dashboard (if the session cookie is still valid) will appear.
  await expect(pw.or(heading).first()).toBeVisible({ timeout: 30_000 });
  if (await pw.isVisible()) {
    await pw.fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
  }
  await expect(heading).toBeVisible();
}

// Logs in as admin and paints `count` fresh availability cells in next week,
// returning their [date, time] pairs so the customer test can target them.
async function openSlotsAsAdmin(page: Page, count: number) {
  await gotoAdmin(page);
  await page.getByRole("button", { name: "Next →" }).click();

  const opened: Array<{ date: string; time: string }> = [];
  for (let i = 0; i < count; i++) {
    // Always grab the first still-empty, enabled cell.
    const offCell = page.locator('button[data-cell].bg-white:not([disabled])').nth(i);
    const date = (await offCell.getAttribute("data-date"))!;
    const time = (await offCell.getAttribute("data-time"))!;
    const box = (await offCell.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.up();
    await expect(
      page.locator(`button[data-cell][data-date="${date}"][data-time="${time}"]`)
    ).toHaveClass(/bg-emerald-300/, { timeout: 10_000 });
    opened.push({ date, time });
  }
  return opened;
}

// Cleans up: log in as admin, delete any slots we created, leaving the DB tidy.
async function removeSlotsAsAdmin(page: Page, cells: Array<{ date: string; time: string }>) {
  await gotoAdmin(page);
  await page.getByRole("button", { name: "Next →" }).click();

  for (const { date, time } of cells) {
    const cell = page.locator(`button[data-cell][data-date="${date}"][data-time="${time}"]`);
    const cls = (await cell.getAttribute("class")) || "";
    if (!cls.includes("bg-emerald-300")) continue; // already gone / booked-away
    const box = (await cell.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.up();
    await expect(cell).toHaveClass(/bg-white/, { timeout: 10_000 });
  }
}

test.describe("home page booking calendar", () => {
  test("books multiple available slots in one request (set to pending)", async ({ page, context }) => {
    const opened = await openSlotsAsAdmin(page, 2);
    // Log out of admin so we act as a plain visitor.
    await page.getByRole("button", { name: "Log out" }).click();

    try {
      await page.goto("/");
      // Same calendar widget appears in the booking section. Allow extra time for
      // the dev server to compile the route on first visit.
      await expect(page.locator("button[data-cell]").first()).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText("Selected", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Next →" }).click();

      // Select both opened cells.
      for (const { date, time } of opened) {
        const cell = page.locator(`button[data-cell][data-date="${date}"][data-time="${time}"]`);
        await expect(cell).toBeEnabled();
        await cell.click();
        await expect(cell).toHaveText("✓");
      }

      // The form reflects a multi-slot booking.
      await expect(page.getByRole("button", { name: /Request 2 lessons/ })).toBeVisible();
      await page.getByPlaceholder("Jane Smith").fill("Test Customer");
      await page.getByPlaceholder("(201) 555-0123").fill("2015550199");
      await page.getByRole("button", { name: /Request 2 lessons/ }).click();

      await expect(page.getByText("2 requests received!")).toBeVisible();

      // Verify server-side: the public endpoint now shows those slots as
      // pending with the customer name, but contact details stay private.
      const res = await context.request.get("/api/slots");
      const body = await res.json();
      for (const { date, time } of opened) {
        const slot = body.slots.find(
          (s: { date: string; time: string }) => s.date === date && s.time === time
        );
        expect(slot, `slot ${date} ${time} should still be listed`).toBeTruthy();
        expect(slot.booking?.status).toBe("pending");
        expect(slot.booking?.name).toBe("Test Customer");
        // Contact details do not leak to the public API.
        expect(slot.booking?.phone).toBe("");
        expect(slot.booking?.email).toBeNull();
      }
    } finally {
      // Cancel the bookings so the slots reopen, then delete them.
      await gotoAdmin(page);
      await page.getByRole("button", { name: "Next →" }).click();
      for (const { date, time } of opened) {
        const cell = page.locator(`button[data-cell][data-date="${date}"][data-time="${time}"]`);
        if (((await cell.getAttribute("class")) || "").includes("bg-amber-300")) {
          await cell.click(); // open detail panel
          page.once("dialog", (d) => d.accept());
          await page.getByRole("button", { name: "Decline" }).click();
          await expect(cell).toHaveClass(/bg-emerald-300/, { timeout: 10_000 });
        }
      }
      await removeSlotsAsAdmin(page, opened);
    }
  });

  test("unavailable cells are not selectable", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Available", { exact: true })).toBeVisible();
    // An empty ("off") cell is rendered disabled for visitors.
    const offCell = page.locator("button[data-cell].bg-slate-50").first();
    await expect(offCell).toBeVisible();
    await expect(offCell).toBeDisabled();
  });
});
