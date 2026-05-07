import { test, expect } from "@playwright/test";

test("login as admin in demo mode and navigate core modules", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin");
  await page.getByRole("button", { name: "Sign In" }).click();

  // We should land on the app shell (role home).
  await expect(page).not.toHaveURL(/\/login$/);

  // Sidebar nav should be present.
  await expect(page.getByRole("navigation")).toBeVisible();

  // Click through major modules (these pages should at least render without crashing).
  await page.locator('a:has-text("Dashboard")').first().click();
  await expect(page).toHaveURL(/\/$/);

  await page.locator('a:has-text("Sales")').first().click();
  await expect(page).toHaveURL(/\/sales/);

  await page.locator('a:has-text("Fleet")').first().click();
  await expect(page).toHaveURL(/\/operations/);

  await page.locator('a:has-text("Drivers")').first().click();
  await expect(page).toHaveURL(/\/operations\/drivers/);

  await page.locator('a:has-text("Finance")').first().click();
  await expect(page).toHaveURL(/\/finance/);

  await page.locator('a:has-text("Clients")').first().click();
  await expect(page).toHaveURL(/\/clients/);
});

test("dispatch board loads and allows demo assignment flow", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin");
  await page.getByRole("button", { name: "Sign In" }).click();

  // Open Dispatch Board from sidebar
  await page.locator('a:has-text("Dispatch Board")').first().click();
  await expect(page).toHaveURL(/\/operations\/dispatch/);
  await expect(page.getByRole("heading", { name: "Dispatch Board" })).toBeVisible();

  // Unassigned order should exist
  const order = page.locator("#order-101");
  await expect(order).toBeVisible();

  // Select vehicle + driver, then drop on save zone
  await page.locator("#vehicle-201").click();
  await page.locator("#driver-301").click();
  const from = await order.boundingBox();
  const to = await page.locator("#dispatch-dropzone").boundingBox();
  if (!from || !to) throw new Error("Missing drag bounding boxes");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();

  // Assigned card should reflect assignment
  const assigned = page.locator("#assigned-order-101");
  await expect(assigned).toBeVisible();
  await expect(assigned).toContainText("BB-2026-0001");
  await expect(assigned).toContainText("Vehicle 201");
  await expect(assigned).toContainText("Driver 301");
});

test("dispatch board access is blocked for Sales role", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("sales");
  await page.getByLabel("Password").fill("bluebird");
  await page.getByRole("button", { name: "Sign In" }).click();

  // Navigate directly; guard should redirect to Sales home.
  await page.goto("/operations/dispatch");
  await expect(page).toHaveURL(/\/sales/);
});
