"use client";

import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_MESSAGE_LENGTH = 2000;

type MessageComposerProps = {
  onSend: (text: string) => void | Promise<void>;
  isSending?: boolean;
  disabled?: boolean;
  errorMessage?: string | null;
};

export function MessageComposer({
  onSend,
  isSending = false,
  disabled = false,
  errorMessage,
}: MessageComposerProps) {
  const inputId = useId();
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const sending = isSending || isSubmitting;
  const canSend = draft.trim().length > 0 && !sending && !disabled;
  const visibleError = errorMessage ?? submissionError;

  async function submitDraft() {
    const text = draft.trim();
    if (!text || sending || disabled) return;

    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      await onSend(text);
      setDraft("");
    } catch (error) {
      setSubmissionError(
        error instanceof Error && error.message
          ? error.message
          : "Your message could not be sent. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitDraft();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submitDraft();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-hairline bg-canvas p-3 sm:p-4">
      <label htmlFor={inputId} className="sr-only">
        Message
      </label>
      <div className="flex items-end gap-2 sm:gap-3">
        <Textarea
          id={inputId}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setSubmissionError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          maxLength={MAX_MESSAGE_LENGTH}
          rows={2}
          disabled={sending || disabled}
          aria-label="Message"
          className="min-h-12 max-h-32 resize-none py-2"
          wrapperClassName="min-w-0 flex-1"
        />
        <Button
          type="submit"
          disabled={!canSend}
          className="h-11 shrink-0 px-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:px-5"
        >
          <span>Send</span>
          <Send aria-hidden="true" className="size-4" />
        </Button>
      </div>
      {visibleError && (
        <p role="alert" className="mt-2 text-sm text-error">
          {visibleError}
        </p>
      )}
      <p className="sr-only">Maximum message length: {MAX_MESSAGE_LENGTH} characters.</p>
    </form>
  );
}
