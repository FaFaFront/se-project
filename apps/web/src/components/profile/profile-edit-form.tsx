"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { Camera, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { getToken, saveSession } from "@/lib/auth-storage";
import { GRADE_LEVELS } from "@/lib/grade-levels";
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
  // Name, photo and about are local UI drafts until connected to the update API.
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoError, setPhotoError] = useState("");
  const photoInput = useRef<HTMLInputElement>(null);
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
    if (!photo) {
      setPhotoPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

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
        setName(current.name ?? "");
        setAbout(current.bio ?? "");
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
    gradeLevel: fields.gradeLevel.trim() ? "" : "Please select your grade level.",
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
    <div className="rounded-3xl border border-hairline bg-white shadow-sm">
      <section className="min-w-0 p-5 sm:p-6">
        <h1 className="font-outfit text-2xl font-semibold text-ink">
          Edit {isStudent ? "student" : "tutor"} profile
        </h1>
        <p className="mb-4 mt-1 text-sm text-ink/70">Update your profile details.</p>
        <form noValidate onSubmit={handleSubmit} aria-busy={saving}>
          <fieldset disabled={saving} className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <legend className="sr-only">Profile information</legend>
            <div className="flex flex-col items-center gap-3 border-b border-hairline pb-4 sm:col-span-2 sm:flex-row sm:flex-wrap sm:gap-5">
              <div className="flex size-32 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-primary/5 sm:size-40">
                {photoPreview || profile.profileUrl ? (
                  <Image
                    src={photoPreview || profile.profileUrl!}
                    alt="Selected profile photo"
                    width={160}
                    height={160}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  <UserRound aria-hidden="true" className="size-16 text-primary/60 sm:size-20" />
                )}
              </div>
              <div className="flex flex-col items-center gap-2 sm:items-start">
                <Button type="button" variant="outline" onClick={() => photoInput.current?.click()}>
                  <Camera aria-hidden="true" className="size-4" />
                  Change photo
                </Button>
                <p className="text-xs text-ink/60">JPG, PNG or WebP. Maximum 5 MB.</p>
              </div>
              <input
                ref={photoInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Choose profile photo"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  event.target.value = "";
                  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                    setPhotoError("Please choose a JPG, PNG, or WebP image.");
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    setPhotoError("Please choose an image smaller than 5 MB.");
                    return;
                  }
                  setPhotoError("");
                  setPhoto(file);
                }}
              />
              {photoError && (
                <p role="alert" className="text-sm text-error">
                  {photoError}
                </p>
              )}
            </div>
            <Input
              name="name"
              label="Name"
              autoComplete="name"
              placeholder="Enter your name"
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10 rounded-xl"
            />
            <Textarea
              name="bio"
              wrapperClassName="sm:row-start-3"
              label="About"
              placeholder="Tell us a little about yourself."
              maxLength={1000}
              value={about}
              onChange={(event) => setAbout(event.target.value)}
              className="h-24 min-h-24 rounded-xl"
            />
            {isStudent ? (
              <>
                <Select
                  name="gradeLevel"
                  label="Grade level"
                  placeholder="Select your grade level"
                  options={
                    fields.gradeLevel && !GRADE_LEVELS.includes(fields.gradeLevel)
                      ? [fields.gradeLevel, ...GRADE_LEVELS]
                      : GRADE_LEVELS
                  }
                  value={fields.gradeLevel}
                  onValueChange={(value) => {
                    edit("gradeLevel", value);
                    touch("gradeLevel");
                  }}
                  disabled={saving}
                  error={Boolean(touched.gradeLevel && errors.gradeLevel)}
                  errorMessage={errors.gradeLevel}
                  className="w-full gap-2 sm:col-start-2 sm:row-start-2 [&>button]:h-10 [&>button]:rounded-xl [&>button]:px-4 [&>button]:text-sm [&>button:focus-visible]:ring-4 [&>button:focus-visible]:ring-primary/10"
                />
                <Textarea
                  name="goals"
                  wrapperClassName="sm:col-start-2 sm:row-start-3"
                  label="Learning goals"
                  required
                  value={fields.goals}
                  onChange={(event) => edit("goals", event.target.value)}
                  onBlur={() => touch("goals")}
                  error={Boolean(touched.goals && errors.goals)}
                  errorMessage={errors.goals}
                  placeholder="What would you like to learn?"
                  className="h-24 min-h-24 rounded-xl"
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
                className="h-10 rounded-xl"
              />
            )}
            <div className="flex justify-end border-t border-hairline pt-3 sm:col-span-2">
              <Button
                type="submit"
                isLoading={saving}
                disabled={saving || !valid || !changed}
                className="h-10 w-full rounded-xl px-8 shadow-cta disabled:opacity-60 sm:w-auto sm:min-w-44"
              >
                {saving ? "Saving changes..." : "Save changes"}
              </Button>
            </div>
          </fieldset>
          <p role="status" className="text-sm text-ink empty:hidden">
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
