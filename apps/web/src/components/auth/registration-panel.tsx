"use client";

import { RegistrationForm } from "@/components/auth/registration-form";

/**
 * Provides the temporary frontend-only submission boundary until the
 * registration API is available.
 */
export function RegistrationPanel() {
  function handleRegistration() {
    return Promise.resolve();
  }

  return <RegistrationForm onSubmit={handleRegistration} />;
}
