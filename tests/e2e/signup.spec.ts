import { test, expect, expectSignedOut, trackSubmissions } from "./fixtures";
import { API_URL, EXISTING_ACCOUNT, UNUSED_EMAIL } from "./environment";

test.describe("Sign up", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Sign up", exact: true })).toBeVisible();
  });

  test("TC1-1: Student registers with a new email and matching passwords", async ({
    page,
    request,
  }) => {
    await expect(page.getByRole("combobox", { name: "Signing up as" })).toHaveText("Student");
    await page.getByLabel("Gmail", { exact: true }).fill(UNUSED_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill("P@ssw0rd");
    await page.getByLabel("Confirm password", { exact: true }).fill("P@ssw0rd");

    const registered = page.waitForResponse(
      (response) =>
        response.url() === `${API_URL}/auth/register` && response.request().method() === "POST"
    );
    await page.getByRole("main").getByRole("button", { name: "Sign up", exact: true }).click();
    const response = await registered;
    expect(response.status()).toBe(201);
    const { data: session } = await response.json();
    expect(session.user).toMatchObject({ email: UNUSED_EMAIL, role: "student" });
    await expect(page).toHaveURL("/complete-profile");
    await expect(page.getByRole("combobox", { name: "Grade level" })).toBeVisible();

    const profile = await request.get(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    await expect(profile).toBeOK();
    expect((await profile.json()).data).toMatchObject({
      email: UNUSED_EMAIL,
      role: "student",
      profileComplete: false,
    });
  });

  test("TC1-2: Tutor cannot register with all credentials empty", async ({ page }) => {
    const submissions = trackSubmissions(page, "/auth/register");
    await page.getByRole("combobox", { name: "Signing up as" }).click();
    await page.getByRole("option", { name: "Tutor", exact: true }).click();
    await page.getByRole("main").getByRole("button", { name: "Sign up", exact: true }).click();

    await expect(page.getByText("Gmail is required", { exact: true })).toBeVisible();
    await expect(page.getByText("Password is required", { exact: true })).toBeVisible();
    await expect(page.getByText("Please confirm your password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Gmail", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL("/register");
    expect(submissions).toHaveLength(0);
    await expectSignedOut(page);
  });

  test("TC1-3: Tutor cannot register an email that already has an account", async ({ page }) => {
    // The plan labels this valid, but its duplicate-email class and the API require rejection.
    await page.getByRole("combobox", { name: "Signing up as" }).click();
    await page.getByRole("option", { name: "Tutor", exact: true }).click();
    await page.getByLabel("Gmail", { exact: true }).fill(EXISTING_ACCOUNT.email);
    await page.getByLabel("Password", { exact: true }).fill("newpassword123");
    await page.getByLabel("Confirm password", { exact: true }).fill("newpassword123");

    const rejected = page.waitForResponse(`${API_URL}/auth/register`);
    await page.getByRole("main").getByRole("button", { name: "Sign up", exact: true }).click();
    expect((await rejected).status()).toBe(409);
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "An account with this email already exists"
    );
    await expect(page).toHaveURL("/register");
    await expectSignedOut(page);
  });

  test("TC1-4: Student cannot register a malformed email and short password", async ({ page }) => {
    const submissions = trackSubmissions(page, "/auth/register");
    await page.getByLabel("Gmail", { exact: true }).fill("test123#gmail.com");
    await page.getByLabel("Password", { exact: true }).fill("12345");
    await page.getByLabel("Confirm password", { exact: true }).fill("12345");
    await page.getByRole("main").getByRole("button", { name: "Sign up", exact: true }).click();

    await expect(
      page.getByText("Please enter a valid Gmail address", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Password must be at least 8 characters", { exact: true })
    ).toBeVisible();
    await expect(page.getByLabel("Confirm password", { exact: true })).not.toHaveAttribute(
      "aria-invalid",
      "true"
    );
    await expect(page).toHaveURL("/register");
    expect(submissions).toHaveLength(0);
    await expectSignedOut(page);
  });

  test("TC1-5: Tutor cannot register with mismatched passwords", async ({ page }) => {
    const submissions = trackSubmissions(page, "/auth/register");
    await page.getByRole("combobox", { name: "Signing up as" }).click();
    await page.getByRole("option", { name: "Tutor", exact: true }).click();
    await page.getByLabel("Gmail", { exact: true }).fill(UNUSED_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm password", { exact: true }).fill("password999");
    await page.getByRole("main").getByRole("button", { name: "Sign up", exact: true }).click();

    await expect(page.getByText("Passwords do not match", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm password", { exact: true })).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    await expect(page).toHaveURL("/register");
    expect(submissions).toHaveLength(0);
    await expectSignedOut(page);
  });
});
