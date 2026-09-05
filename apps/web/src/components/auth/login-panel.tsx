"use client";

import { useRouter } from "next/navigation";
import { LoginForm, type LoginFormValues } from "@/components/auth/login-form";
import { apiClient } from "@/lib/api-client";
import { saveSession } from "@/lib/auth-storage";
import type { LoginResponse } from "@/types/auth";

export interface LoginPanelProps {
  /** Where to send the user once the token is stored. */
  redirectTo?: string;
}

/**
 * Wires the presentational LoginForm to the API and the router. Kept separate
 * so the page itself stays a server component and can export metadata.
 */
export function LoginPanel({ redirectTo = "/" }: LoginPanelProps) {
  const router = useRouter();

  async function handleLogin(values: LoginFormValues) {
    const session = await apiClient.post<LoginResponse>("/auth/login", values);
    saveSession(session);
    // replace, not push: the back button should not return to the login form
    // once a session exists.
    router.replace(redirectTo);
    router.refresh();
  }

  return <LoginForm onSubmit={handleLogin} />;
}
