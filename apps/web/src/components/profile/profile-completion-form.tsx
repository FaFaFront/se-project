"use client";

import { FormEvent, useState } from "react";
import { Check, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type UserRole = "student" | "tutor";

type ProfileCompletionFormProps = {
  role: UserRole;
};

const GRADE_LEVELS = [
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "University",
  "Other",
];

export function ProfileCompletionForm({ role }: ProfileCompletionFormProps) {
  const router = useRouter();
  const [gradeLevel, setGradeLevel] = useState("");
  const [goals, setGoals] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const isStudent = role === "student";
  const gradeLevelError = showErrors && !gradeLevel;
  const goalsError = showErrors && !goals.trim();
  const hourlyRateNumber = Number(hourlyRate);
  const hourlyRateError =
    showErrors && (!hourlyRate || !Number.isFinite(hourlyRateNumber) || hourlyRateNumber <= 0);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);

    const isValid = isStudent
      ? Boolean(gradeLevel && goals.trim())
      : Boolean(hourlyRate && Number.isFinite(hourlyRateNumber) && hourlyRateNumber > 0);

    if (isValid) setSubmitted(true);
  };

  if (submitted) {
    return (
      <section
        aria-live="polite"
        className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center"
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
    <div className="grid overflow-hidden rounded-3xl border border-hairline bg-white shadow-[0_18px_50px_rgba(48,9,66,0.08)] lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="relative overflow-hidden bg-brand-plum-deepest px-6 py-10 text-white sm:px-10 lg:px-12 lg:py-14">
        <div className="absolute -right-24 -top-24 size-64 rounded-full bg-primary/30 blur-2xl" />
        <div className="absolute -bottom-32 -left-24 size-72 rounded-full bg-brand-plum/30 blur-2xl" />
        <div className="relative">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
            <GraduationCap className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.18em] text-white/65">
            One last step
          </p>
          <h1 className="font-outfit mt-3 text-3xl font-bold leading-tight sm:text-4xl">
            Complete your profile
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/75 md:text-base">
            {isStudent
              ? "Tell us where you are in your learning journey so we can help you find the right tutor."
              : "Set your teaching rate so students know what to expect before booking a lesson."}
          </p>

          <ol className="mt-10 space-y-5" aria-label="Registration progress">
            <li className="flex items-center gap-3 text-sm text-white/70">
              <span className="flex size-7 items-center justify-center rounded-full bg-success text-brand-ultra-dark">
                <Check className="size-4" strokeWidth={3} />
              </span>
              Account created
            </li>
            <li className="flex items-center gap-3 text-sm font-semibold">
              <span className="flex size-7 items-center justify-center rounded-full bg-white text-brand-plum-deepest">
                2
              </span>
              Complete your profile
            </li>
          </ol>
        </div>
      </aside>

      <section className="px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">
            {isStudent ? "Student profile" : "Tutor profile"}
          </p>
          <h2 className="font-outfit mt-1 text-2xl font-bold text-ink">Tell us about yourself</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            All fields are required before you can continue to Tutorist.
          </p>
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full"
              />
              <Textarea
                name="goals"
                label="Learning goals"
                placeholder="For example, I want to improve my algebra skills and prepare for my final exam."
                value={goals}
                onChange={(event) => setGoals(event.target.value)}
                error={goalsError}
                errorMessage="Please tell us about your learning goals."
                className="min-h-32"
              />
            </>
          ) : (
            <div>
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
                className="pl-9"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none relative -top-[33px] left-3 block w-fit text-sm text-ink/60"
              >
                $
              </span>
              <p className="-mt-4 text-xs leading-5 text-ink/55">
                This is the amount students will see for a one-hour lesson.
              </p>
            </div>
          )}

          <Button type="submit" className="mt-2 w-full shadow-cta sm:w-auto sm:min-w-48">
            Complete profile
          </Button>
        </form>
      </section>
    </div>
  );
}
