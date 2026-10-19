"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { ProfileAvatar } from "@/features/profile/profile-avatar";
import { ApiError, apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { TutorClassroomDetail, UpdateClassroomRequest } from "@/types/classroom";
import type { Subject } from "@/types/subject";
import { ClassroomErrorState } from "./classroom-detail";
import { useClassroomDetail } from "./use-classroom-detail";

type FieldErrors = { subjectId?: string; pricePerHour?: string };

// Mirrors the API's numeric(10,2) column limits for pricePerHour.
const MAX_PRICE = 99_999_999.99;

function validate(subjectId: string, price: string): { errors: FieldErrors; parsedPrice: number } {
  const errors: FieldErrors = {};
  if (!subjectId) errors.subjectId = "Please select a subject.";

  const parsedPrice = Number(price);
  if (!price.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    errors.pricePerHour = "Enter a valid price greater than 0.";
  } else if (parsedPrice > MAX_PRICE) {
    errors.pricePerHour = "Price is too large.";
  } else if (!/^\d+(\.\d{1,2})?$/.test(price.trim())) {
    errors.pricePerHour = "Use at most 2 decimal places.";
  }

  return { errors, parsedPrice };
}

function NotEditable({ classroomId, message }: { classroomId: string; message: string }) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-hairline bg-white px-6 py-12 text-center shadow-sm">
      <CircleAlert aria-hidden="true" className="size-10 text-primary" />
      <h1 className="mt-5 font-outfit text-2xl font-bold text-ink">
        This classroom can&apos;t be edited
      </h1>
      <p className="mt-2 text-sm text-ink/70">{message}</p>
      <Link
        href={`/classroom/${encodeURIComponent(classroomId)}`}
        className={cn(buttonVariants({ variant: "outline" }), "mt-7")}
      >
        Back to classroom
      </Link>
    </section>
  );
}

function EditForm({
  classroom,
  subjects,
}: {
  classroom: TutorClassroomDetail;
  subjects: Subject[];
}) {
  const router = useRouter();
  // The API only accepts subjects still assigned to the tutor, so a subject removed from the
  // profile can't be kept: start empty and ask for a new pick instead of submitting a hidden value.
  const currentSubjectAssigned = subjects.some((subject) => subject.id === classroom.subject.id);
  const [subjectId, setSubjectId] = useState(currentSubjectAssigned ? classroom.subject.id : "");
  const [price, setPrice] = useState(String(classroom.pricePerHour));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(
    currentSubjectAssigned
      ? {}
      : {
          subjectId: `${classroom.subject.name} is no longer one of your subjects. Please select another.`,
        }
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  const detailHref = `/classroom/${encodeURIComponent(classroom.id)}`;
  const participantName = classroom.participant.name?.trim() || "Profile not completed";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    const { errors, parsedPrice } = validate(subjectId, price);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const payload: UpdateClassroomRequest = { subjectId, pricePerHour: parsedPrice };
      await apiClient.patch<TutorClassroomDetail>(
        `/classrooms/${encodeURIComponent(classroom.id)}`,
        payload
      );
      router.push(detailHref);
      router.refresh();
    } catch (err) {
      const status = err instanceof ApiError ? err.status : undefined;
      setError(
        status === 404
          ? "This classroom no longer exists or isn't assigned to you."
          : status === 409
            ? "This classroom has been completed and can no longer be edited."
            : err instanceof Error
              ? err.message
              : "Unable to save this classroom."
      );
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={detailHref}
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Classroom details
      </Link>

      <section className="mt-6 overflow-hidden rounded-3xl border border-hairline bg-white shadow-sm">
        <div className="bg-brand-plum-deepest px-6 py-7 text-white sm:px-9">
          <p className="text-sm font-medium text-white/70">Edit classroom</p>
          <h1 className="mt-1 break-words font-outfit text-3xl font-bold">
            {classroom.subject.name}
          </h1>
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-9">
          <div>
            <p className="text-sm font-semibold text-ink/60">Assigned student</p>
            <div className="mt-3 flex min-w-0 items-center gap-4">
              <ProfileAvatar
                src={classroom.participant.profileUrl}
                name={participantName}
                size={64}
              />
              <div className="min-w-0">
                <p className="break-words text-lg font-semibold text-ink">{participantName}</p>
                <p className="mt-0.5 text-sm text-ink/60">Student</p>
              </div>
            </div>
          </div>

          <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Subject"
              placeholder={subjects.length > 0 ? "Select a subject" : "No subjects assigned"}
              options={subjects.map((subject) => ({ label: subject.name, value: subject.id }))}
              value={subjectId}
              onValueChange={(value) => {
                setSubjectId(value);
                setFieldErrors((current) => ({ ...current, subjectId: undefined }));
              }}
              disabled={pending || subjects.length === 0}
              error={Boolean(fieldErrors.subjectId)}
              errorMessage={fieldErrors.subjectId}
              className="w-full"
            />

            <Input
              label="Price per hour"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                setFieldErrors((current) => ({ ...current, pricePerHour: undefined }));
              }}
              error={Boolean(fieldErrors.pricePerHour)}
              errorMessage={fieldErrors.pricePerHour}
            />
          </fieldset>

          <p className="text-sm text-ink/60">
            This price applies to this classroom only. Your default hourly rate stays the same.
          </p>

          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-hairline pt-6">
            <Link
              href={detailHref}
              aria-disabled={pending}
              className={cn(
                buttonVariants({ variant: "outline" }),
                pending && "pointer-events-none opacity-50"
              )}
            >
              Cancel
            </Link>
            <Button type="submit" isLoading={pending}>
              Save changes
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function ClassroomEditForm({ classroomId }: { classroomId: string }) {
  const { state, retry } = useClassroomDetail(classroomId);
  const { profile, isLoading: profileLoading } = useAuth();

  // Wait for the profile too: the subject options come from it, and rendering early would
  // show "No subjects assigned" and pick the initial subject against an empty list.
  if (state.status === "loading" || profileLoading) {
    return (
      <div className="mx-auto max-w-3xl" role="status" aria-live="polite">
        <div className="h-5 w-40 animate-pulse rounded bg-surface-lavender" />
        <div className="mt-6 h-96 animate-pulse rounded-3xl bg-surface-lavender" />
        <span className="sr-only">Loading classroom</span>
      </div>
    );
  }

  if (state.status === "error") {
    return <ClassroomErrorState kind={state.kind} message={state.message} onRetry={retry} />;
  }

  const { classroom } = state;
  if (classroom.viewerRole !== "tutor") {
    return (
      <NotEditable
        classroomId={classroom.id}
        message="Only the assigned tutor can edit this classroom."
      />
    );
  }
  if (classroom.status !== "active") {
    return (
      <NotEditable
        classroomId={classroom.id}
        message="Completed classrooms can no longer be changed."
      />
    );
  }

  return <EditForm classroom={classroom} subjects={profile?.subjects ?? []} />;
}
