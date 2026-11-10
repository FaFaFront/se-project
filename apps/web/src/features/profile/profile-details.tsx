"use client";

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { ProfileAvatar } from "@/features/profile/profile-avatar";
import { GRADE_LEVELS } from "@/features/profile/profile-completion-form";
import { ApiError, apiClient } from "@/lib/api-client";
import { clearSession, getToken, saveSession } from "@/lib/auth-storage";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, uploadImageToGCS } from "@/lib/upload";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types/subject";
import type { ProfileUpdateResponse, UserProfile } from "@/types/user";

export interface ProfileDetailsProps {
  profile: UserProfile;
  className?: string;
  onToggleAccountStatus?: () => void;
  isStatusUpdating?: boolean;
  statusError?: string | null;
  statusMessage?: string | null;
}

const EMPTY = "Not set yet";

// Only primary/ink/ink-black are declared with <alpha-value> in tailwind.config,
// so an opacity modifier on any other token silently falls back to a wrong colour
// (hairline/70 renders Tailwind's default grey, success/10 renders transparent).
// Every other token below is used at full strength on purpose.
const CARD = "rounded-[10px] border border-hairline bg-canvas shadow-sm";
// Matches the label style every design-system input renders internally, so a
// field looks the same whether it's a read-only box or a real input.
const FIELD_LABEL =
  "text-ink-black text-sm leading-[23px] font-semibold md:text-base md:leading-[26px]";

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

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatJoinedDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

/** A read-only value, styled like a disabled input so it reads as "this came from somewhere real". */
function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="gap-xs flex flex-col">
      <span className={FIELD_LABEL}>{label}</span>
      {/* Matches the real disabled-input style (disabled:text-placeholder) so it
          reads as "disabled", not just "box with a color". */}
      <div className="bg-surface-disabled text-placeholder rounded-lg px-3.5 py-2.5 text-sm">
        {value || EMPTY}
      </div>
    </div>
  );
}

/**
 * The signed-in user's profile: a read-only view that turns into an inline
 * edit form (same card, same layout) when "Edit" is pressed — no navigation.
 */
export function ProfileDetails({
  profile,
  className,
  onToggleAccountStatus,
  isStatusUpdating,
  statusError,
  statusMessage,
}: ProfileDetailsProps) {
  const router = useRouter();
  const { refresh, logout } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name ?? "");
  const [about, setAbout] = useState(profile.bio ?? "");
  const [fields, setFields] = useState<Fields>(fieldsFromProfile(profile));
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(
    profile.subjects.map((subject) => subject.id)
  );
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoError, setPhotoError] = useState("");

  const isStudent = profile.role === "student";
  const isActive = profile.accountStatus === "ACTIVE";

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview("");
      return;
    }
    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile]);

  useEffect(() => {
    if (!isEditing || isStudent || availableSubjects.length > 0) return;
    let active = true;
    apiClient
      .get<Subject[]>("/subjects")
      .then((subjects) => {
        if (active) setAvailableSubjects(subjects);
      })
      // The subject picker just stays empty if this fails; saving other fields still works.
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isEditing, isStudent, availableSubjects.length]);

  const rate = Number(fields.hourlyRate);
  // Match the controller schema: trimmed required strings, or a finite positive number.
  const errors = {
    gradeLevel: fields.gradeLevel.trim() ? "" : "Please select your grade level.",
    goals: fields.goals.trim() ? "" : "Please enter your learning goals.",
    hourlyRate:
      !fields.hourlyRate.trim() || !Number.isFinite(rate) || rate < 1
        ? "Hourly rate must be at least ฿1"
        : !Number.isInteger(rate)
          ? "Hourly rate must be an integer"
          : rate > 999999
            ? "Hourly rate must be at most ฿999,999"
            : "",
  };
  const valid =
    Boolean(name.trim()) &&
    name.trim().length <= 100 &&
    about.trim().length <= 1000 &&
    (isStudent ? !errors.gradeLevel && !errors.goals : !errors.hourlyRate);
  const changed = Boolean(
    name.trim() !== (profile.name ?? "").trim() ||
    about.trim() !== (profile.bio ?? "").trim() ||
    photoFile !== null ||
    (isStudent
      ? fields.gradeLevel.trim() !== (profile.gradeLevel ?? "").trim() ||
        fields.goals.trim() !== (profile.goals ?? "").trim()
      : (fields.hourlyRate.trim() !== "" && rate !== profile.hourlyRate) ||
        !haveSameSubjectIds(
          selectedSubjectIds,
          profile.subjects.map((subject) => subject.id)
        ))
  );

  function startEditing() {
    setName(profile.name ?? "");
    setAbout(profile.bio ?? "");
    setFields(fieldsFromProfile(profile));
    setSelectedSubjectIds(profile.subjects.map((subject) => subject.id));
    setTouched({});
    setPhotoFile(null);
    setPhotoError("");
    setSaveError("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setPhotoFile(null);
    setPhotoError("");
    setSaveError("");
  }

  function edit(field: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setSaveError("");
  }

  function touch(field: keyof Fields) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      setPhotoError("Please choose a JPG, PNG, WebP, or GIF image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setPhotoError("Image must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }

    setPhotoError("");
    setPhotoFile(file);
    setSaveError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !valid || !changed) return;
    submitting.current = true;
    setSaving(true);
    setSaveError("");

    try {
      let uploadedUrl = profile.profileUrl;
      if (photoFile) uploadedUrl = await uploadImageToGCS(photoFile, "avatars");

      const updated = await apiClient.put<ProfileUpdateResponse>("/users/profile", {
        name: name.trim(),
        profileUrl: uploadedUrl,
        bio: about.trim() || null,
        ...(isStudent
          ? { gradeLevel: fields.gradeLevel.trim(), goals: fields.goals.trim() }
          : { hourlyRate: rate, subjectIds: selectedSubjectIds }),
      });

      const token = getToken();
      if (token) {
        const { id, name: updatedName, email, role, profileUrl } = updated;
        saveSession({ token, user: { id, name: updatedName, email, role, profileUrl } });
      }
      await refresh();
      router.refresh();
      setIsEditing(false);
      setPhotoFile(null);
      showToast("Your profile has been saved.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        await logout();
        return;
      }
      const message =
        error instanceof Error ? error.message : "Unable to save your profile. Please try again.";
      setSaveError(message);
      showToast(message, "error");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <div className={cn("gap-base flex flex-col", className)}>
      <section className={cn(CARD, "overflow-hidden")}>
        <div className="from-brand-plum-deepest to-primary h-32 bg-gradient-to-br sm:h-36" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="gap-base -mt-6 flex flex-col items-start justify-between sm:flex-row sm:items-end">
            <div className="gap-base flex items-end">
              <div className="relative shrink-0">
                <ProfileAvatar
                  src={photoPreview || profile.profileUrl}
                  name={name || profile.name}
                  size={96}
                  className="ring-canvas ring-4"
                />
                {isEditing && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      aria-label="Change profile photo"
                      onChange={handlePhotoChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Change profile photo"
                      className="bg-primary ring-canvas hover:bg-primary/80 absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full text-white shadow-sm ring-2 transition-colors"
                    >
                      <Camera aria-hidden="true" className="size-4" />
                    </button>
                  </>
                )}
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="text-heading-md text-ink-black max-w-full truncate">
                  {(isEditing ? name : profile.name) || "Your profile"}
                </h1>
                <p className="text-ink/60 truncate text-sm">{profile.email}</p>
                {isEditing && photoError && (
                  <p role="alert" className="text-error mt-1 text-xs">
                    {photoError}
                  </p>
                )}
              </div>
            </div>

            <div className="gap-sm flex shrink-0 items-center">
              <span className="bg-primary/5 text-primary shrink-0 rounded-lg px-3 py-1 text-xs font-semibold capitalize">
                {profile.role}
              </span>
              {isEditing ? (
                <>
                  <Button type="button" variant="outline" disabled={saving} onClick={cancelEditing}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="profile-edit-form"
                    isLoading={saving}
                    disabled={saving || !valid || !changed}
                  >
                    Save changes
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={startEditing}>
                  <Pencil aria-hidden="true" className="size-4 shrink-0" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={cn(CARD, "p-6 sm:p-8")}>
        <form id="profile-edit-form" noValidate onSubmit={handleSubmit}>
          <fieldset disabled={saving} className="gap-x-xl gap-y-lg grid sm:grid-cols-2">
            <legend className="sr-only">Profile information</legend>

            {isEditing ? (
              <Input
                label="Full name"
                maxLength={100}
                value={name}
                required
                error={!name.trim()}
                errorMessage="Please enter your name."
                onChange={(event) => {
                  setName(event.target.value);
                  setSaveError("");
                }}
                className="rounded-lg"
              />
            ) : (
              <ReadOnlyField label="Full name" value={profile.name} />
            )}

            <ReadOnlyField label="Email" value={profile.email} />

            {isStudent ? (
              isEditing ? (
                <Select
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
                  className="w-full [&>button]:h-10 [&>button]:rounded-lg [&>button]:px-3.5"
                />
              ) : (
                <ReadOnlyField label="Grade level" value={profile.gradeLevel} />
              )
            ) : isEditing ? (
              <Input
                label="Hourly rate (฿)"
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                max="999999"
                required
                value={fields.hourlyRate}
                onChange={(event) => edit("hourlyRate", event.target.value)}
                onBlur={() => touch("hourlyRate")}
                error={Boolean(touched.hourlyRate && errors.hourlyRate)}
                errorMessage={errors.hourlyRate}
                className="rounded-lg"
              />
            ) : (
              <ReadOnlyField
                label="Hourly rate"
                value={
                  profile.hourlyRate === null
                    ? null
                    : `${formatCurrency(profile.hourlyRate)} / hour`
                }
              />
            )}

            <ReadOnlyField label="Member since" value={formatJoinedDate(profile.createdAt)} />
            <ReadOnlyField label="Wallet balance" value={formatCurrency(profile.walletBalance)} />

            <div className="border-hairline gap-lg flex flex-col border-t pt-6 sm:col-span-2">
              {isEditing ? (
                <Textarea
                  label="About"
                  placeholder="Tell us a little about yourself."
                  maxLength={1000}
                  value={about}
                  onChange={(event) => {
                    setAbout(event.target.value);
                    setSaveError("");
                  }}
                  className="min-h-24 rounded-lg"
                />
              ) : (
                <div className="gap-xs flex flex-col">
                  <span className={FIELD_LABEL}>About</span>
                  <p className={cn("text-sm", profile.bio ? "text-ink" : "text-placeholder")}>
                    {profile.bio || EMPTY}
                  </p>
                </div>
              )}

              {isStudent ? (
                isEditing ? (
                  <Textarea
                    label="Learning goals"
                    required
                    value={fields.goals}
                    onChange={(event) => edit("goals", event.target.value)}
                    onBlur={() => touch("goals")}
                    error={Boolean(touched.goals && errors.goals)}
                    errorMessage={errors.goals}
                    placeholder="What would you like to learn?"
                    className="min-h-24 rounded-lg"
                  />
                ) : (
                  <div className="gap-xs flex flex-col">
                    <span className={FIELD_LABEL}>Learning goals</span>
                    <p className={cn("text-sm", profile.goals ? "text-ink" : "text-placeholder")}>
                      {profile.goals || EMPTY}
                    </p>
                  </div>
                )
              ) : isEditing ? (
                <MultiSelect
                  label="Subjects you teach"
                  placeholder="Select subjects"
                  options={availableSubjects.map((subject) => ({
                    label: subject.name,
                    value: subject.id,
                  }))}
                  value={selectedSubjectIds}
                  onValueChange={(subjectIds) => {
                    setSelectedSubjectIds(subjectIds);
                    setSaveError("");
                  }}
                  disabled={saving}
                  className="w-full [&>button]:h-10 [&>button]:rounded-lg [&>button]:px-3.5"
                />
              ) : (
                <div className="gap-xs flex flex-col">
                  <span className={FIELD_LABEL}>Subjects you teach</span>
                  {profile.subjects.length === 0 ? (
                    <span className="text-placeholder text-sm">{EMPTY}</span>
                  ) : (
                    <ul className="gap-sm flex flex-wrap">
                      {profile.subjects.map((subject) => (
                        <li
                          key={subject.id}
                          className="border-hairline text-ink rounded-lg border px-3 py-1 text-sm"
                        >
                          {subject.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </fieldset>

          {saveError && (
            <p role="alert" className="text-error mt-4 text-sm">
              {saveError}
            </p>
          )}
        </form>
      </section>

      {!isStudent && (
        <section className="border-error overflow-hidden rounded-[10px] border">
          <div className="px-6 py-4 sm:px-8">
            <h2 className="text-error text-body-emphasis">Danger zone</h2>
          </div>
          <div className="border-error gap-base flex flex-wrap items-center justify-between border-t px-6 py-5 sm:px-8">
            <div className="max-w-md">
              <p className="text-ink-black text-sm font-semibold">
                {isActive ? "Deactivate account" : "Activate account"}
              </p>
              <p className="text-ink/60 mt-1 text-xs">
                {isActive
                  ? "You won't be visible to students, and classroom, messaging, and session actions will be blocked until you reactivate. Your data is kept."
                  : "Your account is currently inactive. Reactivate to appear in search again and resume classroom, messaging, and session actions."}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className={isActive ? "text-error border-error" : undefined}
              disabled={!onToggleAccountStatus || isStatusUpdating}
              isLoading={isStatusUpdating}
              onClick={onToggleAccountStatus}
            >
              {isActive ? "Deactivate account" : "Activate account"}
            </Button>
          </div>
          {(statusError || statusMessage) && (
            <p
              className={cn(
                "px-6 pb-4 text-xs font-medium sm:px-8",
                statusError ? "text-error" : "text-success"
              )}
            >
              {statusError ?? statusMessage}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
