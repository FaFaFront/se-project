"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function DeactivateClassroomDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    cancelRef.current?.focus();

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function dismiss() {
    dialogRef.current?.close();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      onClose={(event) => {
        // Ignore a queued close event if an effect has already reopened the dialog.
        if (!event.currentTarget.open) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
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
        <Trash2 aria-hidden="true" className="size-6" />
      </div>
      <h2 id={headingId} className="text-heading-md text-ink">
        Deactivate classroom?
      </h2>
      <p id={descriptionId} className="mt-3 break-words text-sm leading-6 text-ink/70">
        This classroom will be removed from your active list. Its data and history will be kept.
      </p>

      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          ref={cancelRef}
          type="button"
          variant="outline"
          onClick={dismiss}
          className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          ref={confirmRef}
          type="button"
          // UI preview only: dismissal does not mutate or navigate. API wiring comes later.
          onClick={dismiss}
          className="w-full bg-red-600 text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 sm:w-auto"
        >
          Deactivate
        </Button>
      </div>
    </dialog>
  );
}

export function DeactivateClassroomAction() {
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
        className="ml-auto shrink-0 border-red-600 bg-canvas text-red-600 hover:bg-red-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
      >
        <Trash2 aria-hidden="true" className="size-4" />
        Deactivate Classroom
      </Button>
      {isOpen && <DeactivateClassroomDialog onClose={close} />}
    </>
  );
}
