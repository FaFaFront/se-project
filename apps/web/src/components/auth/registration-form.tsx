"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordForm } from "@/components/ui/password-form";
import { Select, type SelectOption } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const GMAIL_PATTERN = /^[^\s@]+@gmail\.com$/i;
const MINIMUM_PASSWORD_LENGTH = 8;

const FALLBACK_ERROR = "Unable to sign up. Please try again.";
const NETWORK_ERROR = "Unable to reach the server. Please try again.";

const ROLE_OPTIONS: SelectOption[] = [
  { label: "Student", value: "student" },
  { label: "Tutor", value: "tutor" },
];

export type RegistrationRole = "student" | "tutor";

export interface RegistrationFormValues {
  role: RegistrationRole;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegistrationFormProps {
  defaultRole?: RegistrationRole;
  onSubmit: (values: RegistrationFormValues) => Promise<void>;
  className?: string;
}

type FieldName = "email" | "password" | "confirmPassword";
type FieldErrors = Partial<Record<FieldName, string>>;

function validate({ email, password, confirmPassword }: RegistrationFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!email) {
    errors.email = "Gmail is required";
  } else if (!GMAIL_PATTERN.test(email)) {
    errors.email = "Please enter a valid Gmail address";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < MINIMUM_PASSWORD_LENGTH) {
    errors.password = "Password must be at least 8 characters";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}

export function RegistrationForm({
  defaultRole = "student",
  onSubmit,
  className,
}: RegistrationFormProps) {
  const [role, setRole] = useState<RegistrationRole>(defaultRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const values = { role, email: email.trim(), password, confirmPassword };
    const errors = validate(values);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
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
      <h1 className="font-inter text-heading-md text-ink-black">Sign up</h1>

      <Select
        label="Signing up as"
        name="role"
        options={ROLE_OPTIONS}
        value={role}
        onValueChange={(value) => setRole(value as RegistrationRole)}
        disabled={isSubmitting}
        className="w-full"
      />

      <Input
        label="Gmail"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="Enter your Gmail"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={isSubmitting}
        error={Boolean(fieldErrors.email)}
        errorMessage={fieldErrors.email}
      />

      <PasswordForm
        label="Password"
        autoComplete="new-password"
        minLength={MINIMUM_PASSWORD_LENGTH}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={isSubmitting}
        error={Boolean(fieldErrors.password)}
        errorMessage={fieldErrors.password}
      />

      <PasswordForm
        label="Confirm password"
        placeholder="Confirm your password"
        autoComplete="new-password"
        minLength={MINIMUM_PASSWORD_LENGTH}
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        disabled={isSubmitting}
        error={Boolean(fieldErrors.confirmPassword)}
        errorMessage={fieldErrors.confirmPassword}
      />

      {formError && (
        <p role="alert" className="font-inter text-error text-xs leading-[23px] sm:text-sm">
          {formError}
        </p>
      )}

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Sign up
      </Button>
    </form>
  );
}
