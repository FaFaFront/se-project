import { expect, request } from "@playwright/test";
import { database } from "./database";
import { API_URL, EXISTING_ACCOUNT, UNKNOWN_EMAIL, UNUSED_EMAIL } from "./environment";

export default async function globalSetup() {
  const api = await request.newContext({ baseURL: `${API_URL}/` });

  try {
    // Reset only the test-plan accounts, inside the dedicated E2E database.
    await database.user.deleteMany({
      where: { email: { in: [EXISTING_ACCOUNT.email, UNUSED_EMAIL, UNKNOWN_EMAIL] } },
    });

    const registration = await api.post("auth/register", {
      data: { ...EXISTING_ACCOUNT, role: "student" },
    });
    await expect(registration).toBeOK();
    const { data: session } = await registration.json();

    const completion = await api.post("users/profile", {
      headers: { Authorization: `Bearer ${session.token}` },
      data: { name: "Nat", gradeLevel: "Grade 12", goals: "Prepare for exams" },
    });
    await expect(completion).toBeOK();
  } finally {
    await api.dispose();
    await database.$disconnect();
  }
}
