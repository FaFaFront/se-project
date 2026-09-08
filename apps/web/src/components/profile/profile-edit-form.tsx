"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { GraduationCap, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { getToken, saveSession } from "@/lib/auth-storage";
import type { ProfileUpdateResponse, UserProfile } from "@/types/profile";

type Fields = { gradeLevel: string; goals: string; hourlyRate: string };

function fieldsFromProfile(profile: UserProfile): Fields {
  return {
    gradeLevel: profile.gradeLevel ?? "",
    goals: profile.goals ?? "",
    hourlyRate: profile.hourlyRate === null ? "" : String(profile.hourlyRate),
  };
}

export function ProfileEditForm() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fields, setFields] = useState<Fields>({ gradeLevel: "", goals: "", hourlyRate: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    if (!getToken()) {
      setNeedsLogin(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    apiClient
      .get<UserProfile>("/users/me")
      .then((current) => {
        if (!active) return;
        setProfile(current);
        setFields(fieldsFromProfile(current));
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Unable to load your profile.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const isStudent = profile?.role === "student";
  const rate = Number(fields.hourlyRate);
  // Match the controller schema: trimmed required strings, or a finite positive number.
  const errors = {
    gradeLevel: fields.gradeLevel.trim() ? "" : "Please enter your grade level.",
    goals: fields.goals.trim() ? "" : "Please enter your learning goals.",
    hourlyRate:
      fields.hourlyRate.trim() && Number.isFinite(rate) && rate > 0
        ? ""
        : "Enter an hourly rate greater than 0.",
  };
  const valid = isStudent ? !errors.gradeLevel && !errors.goals : !errors.hourlyRate;
  const changed = Boolean(
    profile &&
    (isStudent
      ? fields.gradeLevel.trim() !== (profile.gradeLevel ?? "").trim() ||
        fields.goals.trim() !== (profile.goals ?? "").trim()
      : fields.hourlyRate.trim() !== "" && rate !== profile.hourlyRate)
  );

  function edit(field: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setSaveError("");
  }

  function touch(field: keyof Fields) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || submitting.current || !valid || !changed) return;
    submitting.current = true;
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      const updated = await apiClient.post<ProfileUpdateResponse>(
        "/users/profile",
        isStudent
          ? { gradeLevel: fields.gradeLevel.trim(), goals: fields.goals.trim() }
          : { hourlyRate: rate }
      );
      // Refresh from the persisted response, including database decimal rounding.
      const current: UserProfile = {
        ...profile,
        ...updated,
        hourlyRate: updated.hourlyRate === null ? null : Number(updated.hourlyRate),
        walletBalance: Number(updated.walletBalance),
      };
      setProfile(current);
      setFields(fieldsFromProfile(current));
      setTouched({});
      const token = getToken();
      if (token) {
        const { id, name, email, role, profileUrl } = current;
        saveSession({ token, user: { id, name, email, role, profileUrl } });
      }
      setSaved(true);
      router.refresh();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unable to save your profile. Please try again."
      );
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p role="status" className="p-8 text-center text-ink">
        Loading your profile...
      </p>
    );
  }

  if (needsLogin) {
    return (
      <section className="mx-auto max-w-lg space-y-6">
        <h1 className="font-outfit text-2xl font-semibold text-ink">
          Sign in to edit your profile
        </h1>
        <Link href="/login" className="inline-block text-primary underline">
          Sign in
        </Link>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="space-y-4 rounded-3xl border border-hairline bg-white p-8">
        <h1 className="font-outfit text-2xl font-semibold text-ink">Your profile</h1>
        <p role="alert" className="text-error">
          {loadError}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Button onClick={() => setAttempt((current) => current + 1)}>Try again</Button>
          <Link href="/login" className="text-primary underline">
            Sign in
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid overflow-hidden rounded-3xl border border-hairline/70 bg-white shadow-[0_20px_70px_-24px_rgba(48,9,66,0.18)] lg:grid-cols-[0.85fr_1.4fr]">
      <aside className="bg-gradient-to-br from-brand-plum-deepest to-brand-plum-dark px-6 py-8 text-white sm:p-10 lg:p-12">
        <GraduationCap className="size-8" aria-hidden="true" />
        <h1 className="font-outfit mt-6 text-3xl font-semibold sm:text-4xl">Your profile</h1>
        <p className="mt-4 text-sm leading-7 text-white/80">
          Keep your {isStudent ? "learning goals" : "teaching rate"} up to date.
        </p>
        <div className="mt-8 flex size-24 items-center justify-center overflow-hidden rounded-full bg-white/10">
          {profile.profileUrl ? (
            <Image
              src={profile.profileUrl}
              alt="Your current profile photo"
              width={96}
              height={96}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            <UserRound className="size-10" aria-hidden="true" />
          )}
        </div>
        <dl className="mt-6 space-y-4 break-words text-sm">
          <div>
            <dt className="text-white/70">Name</dt>
            <dd className="mt-1 font-semibold">{profile.name || "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-white/70">Email</dt>
            <dd className="mt-1 font-semibold">{profile.email}</dd>
          </div>
        </dl>
      </aside>
      <section className="min-w-0 px-6 py-8 sm:p-10 lg:p-12">
        <h2 className="font-outfit text-2xl font-semibold text-ink">
          Edit {isStudent ? "student" : "tutor"} profile
        </h2>
        <p className="mb-6 mt-2 text-sm text-ink/70">All fields below are required.</p>
        <form noValidate onSubmit={handleSubmit} aria-busy={saving}>
          <fieldset disabled={saving} className="min-w-0 space-y-5">
            <legend className="sr-only">Profile information</legend>
            {isStudent ? (
              <>
                <Input
                  name="gradeLevel"
                  label="Grade level"
                  required
                  value={fields.gradeLevel}
                  onChange={(event) => edit("gradeLevel", event.target.value)}
                  onBlur={() => touch("gradeLevel")}
                  error={Boolean(touched.gradeLevel && errors.gradeLevel)}
                  errorMessage={errors.gradeLevel}
                  placeholder="For example, Grade 10 or University"
                  className="h-12 rounded-xl"
                />
                <Textarea
                  name="goals"
                  label="Learning goals"
                  required
                  value={fields.goals}
                  onChange={(event) => edit("goals", event.target.value)}
                  onBlur={() => touch("goals")}
                  error={Boolean(touched.goals && errors.goals)}
                  errorMessage={errors.goals}
                  placeholder="What would you like to learn?"
                  className="min-h-32 rounded-xl"
                />
              </>
            ) : (
              <Input
                name="hourlyRate"
                label="Hourly rate ($)"
                type="number"
                inputMode="decimal"
                step="any"
                required
                value={fields.hourlyRate}
                onChange={(event) => edit("hourlyRate", event.target.value)}
                onBlur={() => touch("hourlyRate")}
                error={Boolean(touched.hourlyRate && errors.hourlyRate)}
                errorMessage={errors.hourlyRate}
                className="h-12 rounded-xl"
              />
            )}
            <Button
              type="submit"
              isLoading={saving}
              disabled={saving || !valid || !changed}
              className="h-12 w-full rounded-xl shadow-cta disabled:opacity-60"
            >
              {saving ? "Saving changes..." : "Save changes"}
            </Button>
          </fieldset>
          <p role="status" className="mt-4 text-sm text-ink">
            {saving ? "Saving your profile..." : saved ? "Your profile has been saved." : ""}
          </p>
          {saveError && (
            <p role="alert" className="mt-4 text-sm text-error">
              {saveError}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
