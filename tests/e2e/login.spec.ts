import { test, expect, expectSignedOut, trackSubmissions } from "./fixtures";
import { API_URL, EXISTING_ACCOUNT, UNKNOWN_EMAIL } from "./environment";

test.describe("Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Log in", exact: true })).toBeVisible();
  });

  test("TC2-1: An existing user logs in with the correct credentials", async ({ page }) => {
    await page.getByLabel("Email", { exact: true }).fill(EXISTING_ACCOUNT.email);
    await page.getByLabel("Password", { exact: true }).fill(EXISTING_ACCOUNT.password);

    const loggedIn = page.waitForResponse(`${API_URL}/auth/login`);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    expect((await loggedIn).status()).toBe(200);
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("button", { name: "Open profile menu", exact: true })
    ).toBeVisible();

    // Reloading a protected page proves that the saved session remains usable.
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Nat", exact: true })).toBeVisible();
    await expect(page.getByRole("main")).toContainText(EXISTING_ACCOUNT.email);
  });

  test("TC2-2: Empty email and password cannot log in", async ({ page }) => {
    const submissions = trackSubmissions(page, "/auth/login");
    await page.getByRole("button", { name: "Log in", exact: true }).click();

    await expect(page.getByText("Email is required", { exact: true })).toBeVisible();
    await expect(page.getByText("Password is required", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    await expect(page).toHaveURL("/login");
    expect(submissions).toHaveLength(0);
    await expectSignedOut(page);
  });

  test("TC2-3: A non-existent account cannot log in", async ({ page }) => {
    await page.getByLabel("Email", { exact: true }).fill(UNKNOWN_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill("selab1999");

    const rejected = page.waitForResponse(`${API_URL}/auth/login`);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    expect((await rejected).status()).toBe(401);
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Invalid email or password");
    await expect(page).toHaveURL("/login");
    await expectSignedOut(page);
  });
});
