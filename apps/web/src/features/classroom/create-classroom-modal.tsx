"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api-client";
import type { ChatParticipant } from "@/types/conversation";
import type { Classroom, CreateClassroomRequest } from "@/types/classroom";

type CreateClassroomModalProps = {
  conversationId: string;
  student: ChatParticipant;
  onClose: () => void;
};

type FieldErrors = { subjectId?: string; pricePerHour?: string };

const FOCUSABLE_SELECTOR =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function CreateClassroomModal({
  conversationId,
  student,
  onClose,
}: CreateClassroomModalProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const [subjectId, setSubjectId] = useState("");
  const [price, setPrice] = useState(
    profile?.hourlyRate !== null && profile?.hourlyRate !== undefined
      ? String(profile.hourlyRate)
      : ""
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
    return () => previouslyFocused?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!submitting.current) onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const subjects = profile?.subjects ?? [];
  const studentName = student.name?.trim() || "Student";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    const errors: FieldErrors = {};
    if (!subjectId) errors.subjectId = "Please select a subject.";
    const parsedPrice = Number(price);
    if (!price.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      errors.pricePerHour = "Enter a valid price greater than 0.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const payload: CreateClassroomRequest = {
        conversationId,
        subjectId,
        pricePerHour: parsedPrice,
      };
      const classroom = await apiClient.post<Classroom>("/classrooms", payload);
      router.push(`/classroom/${classroom.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create this classroom.");
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/40 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-classroom-heading"
        className="w-full max-w-md rounded-2xl border border-hairline bg-canvas p-6 shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="create-classroom-heading" className="font-outfit text-xl font-bold text-ink">
            Create Classroom
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label="Close"
            className="rounded-full p-1 text-ink/60 hover:bg-ink-black/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="mt-5 space-y-4">
          <fieldset disabled={pending} className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink-black md:text-base">Student</span>
              <p className="rounded-lg border border-hairline bg-surface-disabled px-3 py-2 text-sm text-ink md:text-base">
                {studentName}
              </p>
            </div>

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

          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" isLoading={pending}>
              Create Classroom
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
