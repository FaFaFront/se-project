"use client";

import { useRef, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError, apiClient } from "@/lib/api-client";
import type { ClassroomSession, CreateSessionRequest } from "@/types/session";

const DURATION_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].map((h) => {
  const hours = Math.floor(h);
  const mins = (h - hours) * 60;
  const label =
    hours === 0
      ? "30 minutes"
      : mins === 0
        ? `${hours} hour${hours > 1 ? "s" : ""}`
        : `${hours} hour${hours > 1 ? "s" : ""} 30 minutes`;
  return { label, value: String(h) };
});

type FieldErrors = { date?: string; time?: string; duration?: string };

function validate(date: string, time: string, duration: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!date) errors.date = "Select a date.";
  if (!time) errors.time = "Select a start time.";
  if (!duration) errors.duration = "Select a duration.";

  if (!errors.date && !errors.time) {
    const scheduledAt = new Date(`${date}T${time}`);
    if (scheduledAt < new Date(Date.now() + 30 * 60 * 1000)) {
      errors.time = "Session must be at least 30 minutes in the future.";
    }
  }

  return errors;
}

export function CreateSessionForm({
  classroomId,
  onSuccess,
}: {
  classroomId: string;
  onSuccess?: () => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const submittingRef = useRef(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submittingRef.current) return;

    const errors = validate(date, time, duration);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    submittingRef.current = true;
    setIsPending(true);
    setError(null);

    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      const payload: CreateSessionRequest = {
        scheduledAt,
        durationHours: Number(duration),
      };
      await apiClient.post<ClassroomSession>(
        `/classrooms/${encodeURIComponent(classroomId)}/sessions`,
        payload
      );
      setDate("");
      setTime("");
      setDuration("");
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to schedule session. Please try again."
      );
    } finally {
      submittingRef.current = false;
      setIsPending(false);
    }
  }

  return (
    <section className="rounded-3xl border border-hairline bg-white p-6 shadow-sm sm:p-9">
      <h2 className="flex items-center gap-2 font-outfit text-xl font-bold text-ink">
        <CalendarPlus aria-hidden="true" className="size-5 text-primary" />
        Schedule a session
      </h2>

      <form noValidate onSubmit={handleSubmit} className="mt-6">
        <fieldset disabled={isPending} className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Date"
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => {
              setDate(e.target.value);
              setFieldErrors((prev) => ({ ...prev, date: undefined }));
            }}
            error={Boolean(fieldErrors.date)}
            errorMessage={fieldErrors.date}
          />
          <Input
            label="Start time"
            type="time"
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              setFieldErrors((prev) => ({ ...prev, time: undefined }));
            }}
            error={Boolean(fieldErrors.time)}
            errorMessage={fieldErrors.time}
          />
          <Select
            label="Duration"
            placeholder="Select duration"
            options={DURATION_OPTIONS}
            value={duration}
            onValueChange={(v) => {
              setDuration(v);
              setFieldErrors((prev) => ({ ...prev, duration: undefined }));
            }}
            error={Boolean(fieldErrors.duration)}
            errorMessage={fieldErrors.duration}
            className="w-full"
          />
        </fieldset>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <Button type="submit" isLoading={isPending}>
            Schedule session
          </Button>
        </div>
      </form>
    </section>
  );
}
