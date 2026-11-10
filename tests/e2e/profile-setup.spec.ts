import { test, expect, trackSubmissions } from "./fixtures";
import { API_URL } from "./environment";

test.describe("Student profile setup", () => {
  test("TC3-1: Student completes all required profile fields", async ({
    page,
    request,
    openIncompleteProfile,
  }) => {
    const session = await openIncompleteProfile("student");
    await page.getByLabel("Name", { exact: true }).fill("Ryu");
    await page.getByRole("combobox", { name: "Grade level" }).click();
    await page.getByRole("option", { name: "Grade 12", exact: true }).click();
    await page
      .getByLabel("Learning goals", { exact: true })
      .fill("Prepare for university entrance exam");

    const saved = page.waitForResponse(`${API_URL}/users/profile`);
    await page.getByRole("button", { name: "Complete profile", exact: true }).click();
    expect((await saved).status()).toBe(200);
    await expect(page).not.toHaveURL(/\/complete-profile/);

    const profile = await request.get(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    await expect(profile).toBeOK();
    expect((await profile.json()).data).toMatchObject({
      name: "Ryu",
      role: "student",
      gradeLevel: "Grade 12",
      goals: "Prepare for university entrance exam",
      profileComplete: true,
    });
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Ryu", exact: true })).toBeVisible();
  });

  test("TC3-2: Student cannot submit an empty profile", async ({
    page,
    request,
    openIncompleteProfile,
  }) => {
    const session = await openIncompleteProfile("student");
    const submissions = trackSubmissions(page, "/users/profile");
    await expect(page.getByRole("combobox", { name: "Grade level" })).toHaveText(
      "Select your grade level"
    );
    await page.getByRole("button", { name: "Complete profile", exact: true }).click();

    await expect(page.getByText("Please enter your name.", { exact: true })).toBeVisible();
    await expect(page.getByText("Please select your grade level.", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Please tell us about your learning goals.", { exact: true })
    ).toBeVisible();
    await expect(page).toHaveURL("/complete-profile");
    expect(submissions).toHaveLength(0);

    const profile = await request.get(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    await expect(profile).toBeOK();
    expect((await profile.json()).data).toMatchObject({ profileComplete: false });
  });
});

test.describe("Tutor profile setup", () => {
  test("TC4-1: Tutor completes a profile with a positive hourly rate", async ({
    page,
    request,
    openIncompleteProfile,
  }) => {
    const session = await openIncompleteProfile("tutor");
    await expect(page.getByRole("combobox", { name: "Grade level" })).toHaveCount(0);
    await page.getByLabel("Name", { exact: true }).fill("Fonn");
    await page.getByLabel("Hourly rate", { exact: true }).fill("10");

    const saved = page.waitForResponse(`${API_URL}/users/profile`);
    await page.getByRole("button", { name: "Complete profile", exact: true }).click();
    expect((await saved).status()).toBe(200);
    await expect(page).not.toHaveURL(/\/complete-profile/);

    const profile = await request.get(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    await expect(profile).toBeOK();
    expect((await profile.json()).data).toMatchObject({
      name: "Fonn",
      role: "tutor",
      hourlyRate: 10,
      profileComplete: true,
    });
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Fonn", exact: true })).toBeVisible();
  });

  test("TC4-2: Tutor cannot submit an empty name", async ({
    page,
    request,
    openIncompleteProfile,
  }) => {
    const session = await openIncompleteProfile("tutor");
    const submissions = trackSubmissions(page, "/users/profile");
    await page.getByLabel("Hourly rate", { exact: true }).fill("25");
    await page.getByRole("button", { name: "Complete profile", exact: true }).click();

    await expect(page.getByText("Please enter your name.", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Name", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Hourly rate", { exact: true })).not.toHaveAttribute(
      "aria-invalid",
      "true"
    );
    await expect(page).toHaveURL("/complete-profile");
    expect(submissions).toHaveLength(0);

    const profile = await request.get(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    await expect(profile).toBeOK();
    expect((await profile.json()).data).toMatchObject({ profileComplete: false });
  });

  test("TC4-3: Tutor cannot submit a negative hourly rate", async ({
    page,
    request,
    openIncompleteProfile,
  }) => {
    const session = await openIncompleteProfile("tutor");
    const submissions = trackSubmissions(page, "/users/profile");
    await page.getByLabel("Name", { exact: true }).fill("Fonn");
    await page.getByLabel("Hourly rate", { exact: true }).fill("-10");
    await page.getByRole("button", { name: "Complete profile", exact: true }).click();

    await expect(page.getByLabel("Hourly rate", { exact: true })).toHaveAccessibleDescription(
      "Hourly rate must be at least ฿1"
    );
    await expect(page.getByLabel("Hourly rate", { exact: true })).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    await expect(page.getByLabel("Name", { exact: true })).not.toHaveAttribute(
      "aria-invalid",
      "true"
    );
    await expect(page).toHaveURL("/complete-profile");
    expect(submissions).toHaveLength(0);

    const profile = await request.get(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    await expect(profile).toBeOK();
    expect((await profile.json()).data).toMatchObject({ profileComplete: false });
  });
});
