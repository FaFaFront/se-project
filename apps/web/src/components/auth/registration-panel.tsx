"use client";

import { useRouter } from "next/navigation";

import { RegistrationForm, type RegistrationFormValues } from "@/components/auth/registration-form";
import { apiClient } from "@/lib/api-client";
import { saveSession } from "@/lib/auth-storage";
import type { RegistrationResponse } from "@/types/auth";

export function RegistrationPanel() {
  const router = useRouter();

  async function handleRegistration({ email, password, role }: RegistrationFormValues) {
    const registration = await apiClient.post<RegistrationResponse>("/auth/register", {
      email,
      password,
      role,
    });

    saveSession(registration);
    router.push(`/complete-profile?role=${registration.user.role}`);
    router.refresh();
  }

  return <RegistrationForm onSubmit={handleRegistration} />;
}
