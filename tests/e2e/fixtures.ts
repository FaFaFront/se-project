import { randomUUID } from "node:crypto";
import { test as base, expect, type Page, type Request } from "@playwright/test";
import { database } from "./database";
import { API_URL, UNKNOWN_EMAIL, UNUSED_EMAIL, WEB_URL } from "./environment";

type Session = {
  token: string;
  user: { id: string; email: string; role: "student" | "tutor"; name: string | null };
};

type Fixtures = {
  openIncompleteProfile: (role: "student" | "tutor") => Promise<Session>;
};

export const test = base.extend<Fixtures>({
  openIncompleteProfile: async ({ page, request }, use) => {
    const userIds: string[] = [];

    try {
      await use(async (role) => {
        const response = await request.post(`${API_URL}/auth/register`, {
          data: {
            role,
            email: `e2e.${role}.${randomUUID()}@gmail.com`,
            password: "ProfileSetup123!",
          },
        });
        await expect(response).toBeOK();
        const { data: session }: { data: Session } = await response.json();
        userIds.push(session.user.id);

        // Establish the real API-issued session required by these profile test cases.
        await page.addInitScript(
          ({ origin, session }) => {
            if (window.location.origin !== origin || localStorage.getItem("tutorist.auth.token")) {
              return;
            }
            localStorage.setItem("tutorist.auth.token", session.token);
            localStorage.setItem("tutorist.auth.user", JSON.stringify(session.user));
          },
          { origin: WEB_URL, session }
        );
        await page.goto("/complete-profile");
        await expect(page.getByRole("heading", { name: "Tell us about yourself" })).toBeVisible();
        return session;
      });
    } finally {
      await database.user.deleteMany({ where: { id: { in: userIds } } });
    }
  },
});

// The exact same emails remain reusable when cases run alone, together, or on retry.
test.beforeEach(async () => {
  await database.user.deleteMany({ where: { email: { in: [UNUSED_EMAIL, UNKNOWN_EMAIL] } } });
});

test.afterEach(async () => {
  await database.user.deleteMany({ where: { email: { in: [UNUSED_EMAIL, UNKNOWN_EMAIL] } } });
});

test.afterAll(async () => {
  await database.$disconnect();
});

export function trackSubmissions(page: Page, path: string): Request[] {
  const submissions: Request[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url() === `${API_URL}${path}`) {
      submissions.push(request);
    }
  });
  return submissions;
}

export async function expectSignedOut(page: Page) {
  expect(await page.evaluate(() => localStorage.getItem("tutorist.auth.token"))).toBeNull();
}

export { expect };
