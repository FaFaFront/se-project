"use client";

import { useRouter } from "next/navigation";

import { RegistrationForm, type RegistrationFormValues } from "@/components/auth/registration-form";
import { apiClient } from "@/lib/api-client";
import type { RegistrationResponse } from "@/types/auth";

export function RegistrationPanel() {
  const router = useRouter();

  async function handleRegistration({
    name,
    email,
    password,
    role,
    profileUrl,
  }: RegistrationFormValues) {
    const registration = await apiClient.post<RegistrationResponse>("/auth/register", {
      name,
      email,
      password,
      role,
      profileUrl,
    });

    router.push(`/complete-profile?role=${registration.user.role}`);
  }

  return <RegistrationForm onSubmit={handleRegistration} />;
}
