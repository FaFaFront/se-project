"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { Camera, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiClient } from "@/lib/api-client";
import { clearSession, getToken, saveSession } from "@/lib/auth-storage";
import { GRADE_LEVELS } from "@/lib/grade-levels";
import type { Subject } from "@/types/subject";
import type { ProfileUpdateResponse, UserProfile } from "@/types/user";

type Fields = { gradeLevel: string; goals: string; hourlyRate: string };

function fieldsFromProfile(profile: UserProfile): Fields {
  return {
    gradeLevel: profile.gradeLevel ?? "",
    goals: profile.goals ?? "",
    hourlyRate: profile.hourlyRate === null ? "" : String(profile.hourlyRate),
  };
}

function haveSameSubjectIds(left: string[], right: string[]) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

export function ProfileEditForm() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [fields, setFields] = useState<Fields>({ gradeLevel: "", goals: "", hourlyRate: "" });
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
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
    setProfile(null);
    setAvailableSubjects([]);
    setSelectedSubjectIds([]);

    async function loadProfile() {
      try {
        const current = await apiClient.get<UserProfile>("/users/me");
        const subjects =
          current.role === "tutor" ? await apiClient.get<Subject[]>("/subjects") : [];

        if (!active) return;
        setProfile(current);
        setName(current.name ?? "");
        setAbout(current.bio ?? "");
        setFields(fieldsFromProfile(current));
        setAvailableSubjects(subjects);
        setSelectedSubjectIds(current.subjects.map((subject) => subject.id));
      } catch (error) {
        if (active) {
          if (error instanceof ApiError && error.status === 401) {
            clearSession();
            setNeedsLogin(true);
            return;
          }
          setLoadError(error instanceof Error ? error.message : "Unable to load your profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();
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
  const valid =
    Boolean(name.trim()) &&
    name.trim().length <= 100 &&
    about.trim().length <= 1000 &&
    (isStudent ? !errors.gradeLevel && !errors.goals : !errors.hourlyRate);
  const changed = Boolean(
    profile &&
    (name.trim() !== (profile.name ?? "").trim() ||
      about.trim() !== (profile.bio ?? "").trim() ||
      (isStudent
        ? fields.gradeLevel.trim() !== (profile.gradeLevel ?? "").trim() ||
          fields.goals.trim() !== (profile.goals ?? "").trim()
        : (fields.hourlyRate.trim() !== "" && rate !== profile.hourlyRate) ||
          !haveSameSubjectIds(
            selectedSubjectIds,
            profile.subjects.map((subject) => subject.id)
          )))
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
      const updated = await apiClient.put<ProfileUpdateResponse>("/users/profile", {
        name: name.trim(),
        profileUrl: profile.profileUrl,
        bio: about.trim() || null,
        ...(isStudent
          ? { gradeLevel: fields.gradeLevel.trim(), goals: fields.goals.trim() }
          : { hourlyRate: rate, subjectIds: selectedSubjectIds }),
      });
      const current: UserProfile = updated;
      setProfile(current);
      setName(current.name ?? "");
      setAbout(current.bio ?? "");
      setFields(fieldsFromProfile(current));
      setSelectedSubjectIds(current.subjects.map((subject) => subject.id));
      setTouched({});
      const token = getToken();
      if (token) {
        const { id, name, email, role, profileUrl } = current;
        saveSession({ token, user: { id, name, email, role, profileUrl } });
      }
      setSaved(true);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        setNeedsLogin(true);
        return;
      }
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
                {profile.profileUrl ? (
                  <Image
                    src={profile.profileUrl}
                    alt="Profile photo"
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
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  title="Photo uploads are not available yet"
                >
                  <Camera aria-hidden="true" className="size-4" />
                  Change photo
                </Button>
                <p className="text-xs text-ink/60">JPG, PNG or WebP. Maximum 5 MB.</p>
              </div>
            </div>
            <Input
              name="name"
              label="Name"
              autoComplete="name"
              placeholder="Enter your name"
              maxLength={100}
              value={name}
              required
              error={!name.trim()}
              errorMessage="Please enter your name."
              onChange={(event) => {
                setName(event.target.value);
                setSaved(false);
                setSaveError("");
              }}
              className="h-10 rounded-xl"
            />
            <Textarea
              name="bio"
              wrapperClassName="sm:row-start-3"
              label="About"
              placeholder="Tell us a little about yourself."
              maxLength={1000}
              value={about}
              onChange={(event) => {
                setAbout(event.target.value);
                setSaved(false);
                setSaveError("");
              }}
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
              <>
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
                <MultiSelect
                  name="subjectIds"
                  label="Subjects you teach"
                  placeholder="Select subjects"
                  options={availableSubjects.map((subject) => ({
                    label: subject.name,
                    value: subject.id,
                  }))}
                  value={selectedSubjectIds}
                  onValueChange={(subjectIds) => {
                    setSelectedSubjectIds(subjectIds);
                    setSaved(false);
                    setSaveError("");
                  }}
                  disabled={saving}
                  className="w-full gap-2 sm:col-start-2 sm:row-start-3 [&>button]:h-10 [&>button]:rounded-xl [&>button]:px-4 [&>button]:text-sm [&>button:focus-visible]:ring-4 [&>button:focus-visible]:ring-primary/10"
                />
              </>
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
