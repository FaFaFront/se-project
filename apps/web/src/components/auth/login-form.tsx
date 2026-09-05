"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordForm } from "@/components/ui/password-form";
import { cn } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FALLBACK_ERROR = "Unable to log in. Please try again.";
const NETWORK_ERROR = "Unable to reach the server. Please try again.";

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface LoginFormProps {
  /**
   * Performs the login. Rejecting marks the attempt as failed and surfaces the
   * rejection's message as the form-level error, so the caller owns the API
   * call and the post-login redirect while this component owns the UI state.
   */
  onSubmit: (values: LoginFormValues) => Promise<void>;
  className?: string;
}

type FieldErrors = Partial<Record<keyof LoginFormValues, string>>;

function validate({ email, password }: LoginFormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!email) {
    errors.email = "Email is required";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Please enter a valid email address";
  }
  if (!password) {
    errors.password = "Password is required";
  }
  return errors;
}

export function LoginForm({ onSubmit, className }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const values = { email: email.trim(), password };
    const errors = validate(values);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      // The API answers a bad email and a bad password with the same 401 body,
      // so echoing its message keeps that ambiguity intact. Field-level errors
      // stay cleared here — highlighting one field would reveal which was wrong.
      if (error instanceof TypeError) {
        setFormError(NETWORK_ERROR);
      } else {
        setFormError(error instanceof Error && error.message ? error.message : FALLBACK_ERROR);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className={cn("flex w-full max-w-[400px] flex-col gap-base", className)}
    >
      <div className="flex flex-col gap-xs">
        <h1 className="font-inter text-heading-md text-ink-black">Log in</h1>
        <p className="font-inter text-caption text-ink">
          Enter your details to access your account.
        </p>
      </div>

      <Input
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="Enter your email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={isSubmitting}
        error={Boolean(fieldErrors.email)}
        errorMessage={fieldErrors.email}
      />

      <PasswordForm
        label="Password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={isSubmitting}
        error={Boolean(fieldErrors.password)}
        errorMessage={fieldErrors.password}
      />

      {formError && (
        <p role="alert" className="font-inter text-error text-xs leading-[23px] sm:text-sm">
          {formError}
        </p>
      )}

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Log in
      </Button>
    </form>
  );
}
