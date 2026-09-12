"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { Camera, Check, GraduationCap, UserRound } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { GRADE_LEVELS } from "@/lib/grade-levels";

type UserRole = "student" | "tutor";

type ProfileCompletionFormProps = {
  role: UserRole;
};

export function ProfileCompletionForm({ role }: ProfileCompletionFormProps) {
  const router = useRouter();
  const photoInputId = useId();
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [profileImageError, setProfileImageError] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [goals, setGoals] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!profileImage) {
      setProfilePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(profileImage);
    setProfilePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [profileImage]);

  const isStudent = role === "student";
  const gradeLevelError = showErrors && !gradeLevel;
  const goalsError = showErrors && !goals.trim();
  const hourlyRateNumber = Number(hourlyRate);
  const hourlyRateError =
    showErrors && (!hourlyRate || !Number.isFinite(hourlyRateNumber) || hourlyRateNumber <= 0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    setSubmitError("");

    const isValid = isStudent
      ? Boolean(gradeLevel && goals.trim())
      : Boolean(hourlyRate && Number.isFinite(hourlyRateNumber) && hourlyRateNumber > 0);

    if (!isValid) return;

    const profileData = isStudent
      ? { gradeLevel, goals: goals.trim() }
      : { hourlyRate: hourlyRateNumber };

    try {
      setIsPending(true);
      await apiClient.post<unknown>("/users/profile", profileData);
      router.refresh();
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to save your profile.");
    } finally {
      setIsPending(false);
    }
  };

  if (submitted) {
    return (
      <section
        aria-live="polite"
        className="flex min-h-[440px] flex-col items-center justify-center rounded-3xl border border-hairline/70 bg-white px-6 py-12 text-center shadow-sm"
      >
        <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-success/15">
          <Check className="size-8 text-[#0a9f87]" strokeWidth={2.5} />
        </span>
        <h1 className="font-outfit text-3xl font-bold text-ink">Your profile is ready!</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-ink/70 md:text-base">
          Thanks for telling us a little more about yourself. You can now start using Tutorist.
        </p>
        <Button type="button" className="mt-8 min-w-44" onClick={() => router.push("/tutors")}>
          Continue
        </Button>
      </section>
    );
  }

  return (
    <div className="grid overflow-hidden rounded-3xl border border-hairline/70 bg-white shadow-[0_20px_70px_-24px_rgba(48,9,66,0.18)] lg:grid-cols-[0.85fr_1.4fr]">
      <aside className="relative overflow-hidden bg-gradient-to-br from-brand-plum-deepest via-brand-plum-deepest to-brand-plum-dark px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-10 lg:py-12">
        <div className="absolute -right-24 -top-24 size-64 rounded-full bg-primary/30 blur-2xl" />
        <div className="absolute -bottom-32 -left-24 size-72 rounded-full bg-brand-plum/30 blur-2xl" />
        <div className="relative flex h-full flex-col">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
            <GraduationCap className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 lg:mt-10">
            One last step
          </p>
          <h1 className="font-outfit mt-3 max-w-xs text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Complete your profile
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/80">
            {isStudent
              ? "Tell us where you are in your learning journey so we can help you find the right tutor."
              : "Set your teaching rate so students know what to expect before booking a lesson."}
          </p>

          <ol
            className="relative mt-8 space-y-6 before:absolute before:bottom-8 before:left-[19px] before:top-8 before:w-px before:bg-white/25 lg:mt-12"
            aria-label="Registration progress"
          >
            <li className="relative flex items-center gap-4 text-sm text-white/85">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-brand-ultra-dark">
                <Check className="size-4" strokeWidth={3} />
              </span>
              <span className="space-y-1">
                <span className="block font-semibold">Account created</span>
                <span className="block text-xs text-white/70">Step 1 ? Completed</span>
              </span>
            </li>
            <li
              aria-current="step"
              className="relative flex items-center gap-4 text-sm font-semibold"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-plum-deepest ring-4 ring-white/15">
                2
              </span>
              <span className="space-y-1">
                <span className="block">Complete your profile</span>
                <span className="block text-xs font-normal text-white/80">
                  Step 2 ? In progress
                </span>
              </span>
            </li>
          </ol>
        </div>
      </aside>

      <section className="min-w-0 px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
        <div className="mb-6">
          <p className="inline-flex rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
            {isStudent ? "Student profile" : "Tutor profile"}
          </p>
          <h2 className="font-outfit mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Tell us about yourself
          </h2>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="space-y-5 [&_label]:text-sm [&_label]:leading-6"
        >
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <label
              htmlFor={photoInputId}
              className="group relative flex w-full min-w-0 cursor-pointer flex-col items-center gap-3"
            >
              <div className="relative shrink-0">
                <div className="flex size-40 items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-surface-lavender/50 transition-colors group-hover:border-primary group-focus-within:outline group-focus-within:outline-2 group-focus-within:outline-offset-4 group-focus-within:outline-primary">
                  {profilePreview ? (
                    <Image
                      src={profilePreview}
                      alt="Selected profile photo"
                      width={160}
                      height={160}
                      unoptimized
                      className="size-full object-cover"
                    />
                  ) : (
                    <UserRound className="size-14 text-brand-plum/60" aria-hidden="true" />
                  )}
                </div>
                <span className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full border-2 border-white bg-primary text-white">
                  <Camera className="size-4" aria-hidden="true" />
                </span>
              </div>
              <div className="w-full min-w-0 space-y-1 text-center">
                <span className="inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold text-primary transition-colors group-hover:bg-primary/5 group-hover:underline group-active:bg-primary/10 underline-offset-4">
                  {profileImage ? "Change photo" : "Choose photo"}
                </span>
              </div>
              <input
                id={photoInputId}
                name="profile_image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label="Choose profile photo"
                aria-invalid={Boolean(profileImageError)}
                aria-describedby={profileImageError ? `${photoInputId}-error` : undefined}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;

                  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                    setProfileImageError("Please choose a JPG, PNG, or WebP image.");
                    event.target.value = "";
                    setProfileImage(null);
                    return;
                  }

                  setProfileImageError("");
                  setProfileImage(file);
                }}
              />
            </label>
            {profileImageError && (
              <p id={`${photoInputId}-error`} role="alert" className="text-sm text-error">
                {profileImageError}
              </p>
            )}
          </div>
          <Input
            name="name"
            label="Name"
            autoComplete="name"
            placeholder="Enter your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            wrapperClassName="gap-2"
            className="h-12 rounded-xl px-4 focus:ring-4 focus:ring-primary/10"
          />
          {isStudent ? (
            <>
              <Select
                name="gradeLevel"
                label="Grade level"
                placeholder="Select your grade level"
                options={GRADE_LEVELS}
                value={gradeLevel}
                onValueChange={setGradeLevel}
                error={gradeLevelError}
                errorMessage="Please select your grade level."
                className="w-full gap-2 [&>button]:h-12 [&>button]:rounded-xl [&>button]:px-4 [&>button]:text-sm [&>button:focus-visible]:ring-4 [&>button:focus-visible]:ring-primary/10"
              />
              <Textarea
                name="goals"
                label="Learning goals"
                placeholder="For example, I want to improve my algebra skills and prepare for my final exam."
                value={goals}
                onChange={(event) => setGoals(event.target.value)}
                error={goalsError}
                errorMessage="Please tell us about your learning goals."
                wrapperClassName="gap-2"
                className="min-h-32 rounded-xl px-4 py-3 text-sm leading-6 focus:ring-4 focus:ring-primary/10 md:text-sm md:leading-6"
              />
            </>
          ) : (
            <div className="relative flex h-full flex-col">
              <Input
                name="hourlyRate"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                label="Hourly rate"
                placeholder="25.00"
                value={hourlyRate}
                onChange={(event) => setHourlyRate(event.target.value)}
                error={hourlyRateError}
                errorMessage="Enter an hourly rate greater than 0."
                wrapperClassName="gap-2"
                className="h-12 rounded-xl pl-9 focus:ring-4 focus:ring-primary/10"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-11 text-sm text-ink/60"
              >
                $
              </span>
              <p className="mt-1 text-xs leading-5 text-ink/55">
                This is the amount students will see for a one-hour lesson.
              </p>
            </div>
          )}

          {submitError && (
            <p role="alert" className="text-sm leading-5 text-error">
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            isLoading={isPending}
            className="mt-2 h-12 w-full rounded-xl shadow-cta transition-all hover:bg-primary/90 hover:shadow-lg active:translate-y-px active:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            Complete profile
          </Button>
        </form>
      </section>
    </div>
  );
}
