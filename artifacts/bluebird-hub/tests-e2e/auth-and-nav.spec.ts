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

  // Drag order to vehicle, then driver, then save dropzone
  await order.dragTo(page.locator("#vehicle-201"));
  await order.dragTo(page.locator("#driver-301"));
  await order.dragTo(page.locator("#dispatch-dropzone"));

  // Assigned section should reflect assignment
  await expect(page.locator("text=Vehicle 201")).toBeVisible();
  await expect(page.locator("text=Driver 301")).toBeVisible();
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
