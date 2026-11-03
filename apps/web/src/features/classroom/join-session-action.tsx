"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError, apiClient } from "@/lib/api-client";
import type { ClassroomSession } from "@/types/session";

export function JoinSessionAction({
  sessionId,
  disabled = false,
  unavailableLabel = "Joining closed",
}: {
  sessionId: string;
  disabled?: boolean;
  unavailableLabel?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const active = useRef(true);
  const errorId = useId();

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  async function join() {
    if (submitting.current || disabled) return;
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      const session = await apiClient.post<ClassroomSession>(
        `/sessions/${encodeURIComponent(sessionId)}/attendance`,
        {}
      );
      if (active.current) window.location.assign(session.meetLink);
    } catch (err) {
      if (!active.current) return;
      submitting.current = false;
      setPending(false);
      setError(
        err instanceof ApiError ? err.message : "Unable to save your check-in. Please try again."
      );
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        variant="outline"
        isLoading={pending}
        disabled={disabled}
        onClick={join}
        aria-describedby={error ? errorId : undefined}
      >
        <ExternalLink aria-hidden="true" className="size-4" />
        {pending || !disabled ? "Join Meet" : unavailableLabel}
      </Button>
      {error && (
        <p id={errorId} role="alert" className="max-w-56 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
