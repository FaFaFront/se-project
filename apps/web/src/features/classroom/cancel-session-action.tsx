"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError, apiClient } from "@/lib/api-client";
import type { ClassroomSession } from "@/types/session";

function CancelSessionDialog({
  session,
  onClose,
  onSuccess,
}: {
  session: ClassroomSession;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const mountedRef = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const descriptionId = useId();

  const sessionDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(session.scheduledAt));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    mountedRef.current = true;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    cancelRef.current?.focus();

    return () => {
      mountedRef.current = false;
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function dismiss() {
    if (submittingRef.current) return;
    dialogRef.current?.close();
  }

  async function cancel() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsPending(true);
    setError(null);
    dialogRef.current?.focus();

    try {
      await apiClient.patch<ClassroomSession>(`/sessions/${encodeURIComponent(session.id)}/cancel`);
      if (!mountedRef.current) return;
      onSuccess?.();
      dialogRef.current?.close();
    } catch (err) {
      if (!mountedRef.current) return;
      submittingRef.current = false;
      setIsPending(false);
      setError(
        err instanceof ApiError ? err.message : "Unable to cancel session. Please try again."
      );
    }
  }

  return (
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        if (submittingRef.current) event.preventDefault();
      }}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        if (submittingRef.current) {
          event.preventDefault();
          return;
        }
        if (event.shiftKey && document.activeElement === cancelRef.current) {
          event.preventDefault();
          confirmRef.current?.focus();
        } else if (!event.shiftKey && document.activeElement === confirmRef.current) {
          event.preventDefault();
          cancelRef.current?.focus();
        }
      }}
      className="m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl border border-hairline bg-canvas p-6 text-ink shadow-xl backdrop:bg-ink-black/40 sm:p-8"
    >
      <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <X aria-hidden="true" className="size-6" />
      </div>
      <h2 id={headingId} className="text-heading-md text-ink">
        Cancel session?
      </h2>
      <p id={descriptionId} className="mt-3 text-sm leading-6 text-ink/70">
        The session scheduled for <span className="font-semibold text-ink">{sessionDate}</span> will
        be cancelled and will not be charged.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
      {isPending && (
        <p role="status" className="sr-only">
          Cancelling session…
        </p>
      )}
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          ref={cancelRef}
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={dismiss}
          className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto"
        >
          Keep session
        </Button>
        <Button
          ref={confirmRef}
          type="button"
          isLoading={isPending}
          onClick={cancel}
          className="w-full bg-red-600 text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 sm:w-auto"
        >
          Cancel session
        </Button>
      </div>
    </dialog>
  );
}

export function CancelSessionAction({
  session,
  onSuccess,
}: {
  session: ClassroomSession;
  onSuccess?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        className="shrink-0 border-red-600 bg-canvas text-red-600 hover:bg-red-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
      >
        <X aria-hidden="true" className="size-4" />
        Cancel
      </Button>
      {isOpen && <CancelSessionDialog session={session} onClose={close} onSuccess={onSuccess} />}
    </>
  );
}
