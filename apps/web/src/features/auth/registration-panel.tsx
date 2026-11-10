"use client";

import { useRouter } from "next/navigation";

import { RegistrationForm, type RegistrationFormValues, type RegistrationRole } from "@/features/auth/registration-form";
import { apiClient } from "@/lib/api-client";
import { saveSession } from "@/lib/auth-storage";
import type { RegistrationResponse } from "@/types/auth";

export function RegistrationPanel({ defaultRole }: { defaultRole?: RegistrationRole }) {
  const router = useRouter();

  async function handleRegistration({ email, password, role }: RegistrationFormValues) {
    const registration = await apiClient.post<RegistrationResponse>("/auth/register", {
      email,
      password,
      role,
    });

    saveSession(registration);
    router.push("/complete-profile");
    router.refresh();
  }

  return <RegistrationForm defaultRole={defaultRole} onSubmit={handleRegistration} />;
}
