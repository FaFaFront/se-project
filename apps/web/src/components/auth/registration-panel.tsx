"use client";

import { useRouter } from "next/navigation";

import { RegistrationForm, type RegistrationFormValues } from "@/components/auth/registration-form";
import { apiClient, setAuthToken } from "@/lib/api-client";
import type { RegistrationResponse } from "@/types/auth";

export function RegistrationPanel() {
  const router = useRouter();

  async function handleRegistration({ email, password, role }: RegistrationFormValues) {
    const registration = await apiClient.post<RegistrationResponse>("/auth/register", {
      email,
      password,
      role,
    });

    setAuthToken(registration.token);
    router.push(`/complete-profile?role=${registration.user.role}`);
  }

  return <RegistrationForm onSubmit={handleRegistration} />;
}
