"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatReviewDate, ReviewStars } from "@/features/reviews/review-stars";
import { apiClient, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { ClassroomDetail } from "@/types/classroom";
import { REVIEW_COMMENT_MAX_LENGTH, type CreateReviewRequest, type Review } from "@/types/review";

const dismissKey = (classroomId: string) => `classroom-review-dismissed:${classroomId}`;

// Storage can be unavailable (private mode, blocked site data); the prompt then just reopens.
function isDismissed(classroomId: string): boolean {
  try {
    return window.localStorage.getItem(dismissKey(classroomId)) === "1";
  } catch {
    return false;
  }
}

function markDismissed(classroomId: string) {
  try {
    window.localStorage.setItem(dismissKey(classroomId), "1");
  } catch {
    // Ignore: see isDismissed.
  }
}

function ReviewDialog({
  classroomId,
  tutorName,
  onSubmitted,
  onClose,
}: {
  classroomId: string;
  tutorName: string;
  onSubmitted: (review: Review) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const submittingRef = useRef(false);
  const mountedRef = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const counterId = useId();
  const commentLength = comment.trim().length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    mountedRef.current = true;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();

    return () => {
      mountedRef.current = false;
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function skip() {
    if (submittingRef.current) return;
    dialogRef.current?.close();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    const nextRatingError = rating >= 1 && rating <= 5 ? null : "Please choose a rating.";
    const nextCommentError =
      commentLength > REVIEW_COMMENT_MAX_LENGTH
        ? `Comment must be at most ${REVIEW_COMMENT_MAX_LENGTH} characters.`
        : null;
    setRatingError(nextRatingError);
    setCommentError(nextCommentError);
    if (nextRatingError || nextCommentError) return;

    submittingRef.current = true;
    setIsPending(true);
    setError(null);

    try {
      const payload: CreateReviewRequest = {
        rating,
        ...(commentLength > 0 && { comment: comment.trim() }),
      };
      const review = await apiClient.post<Review>(
        `/classrooms/${encodeURIComponent(classroomId)}/review`,
        payload
      );
      if (!mountedRef.current) return;
      onSubmitted(review);
      router.refresh();
    } catch (err) {
      if (!mountedRef.current) return;
      submittingRef.current = false;
      setIsPending(false);
      setError(
        err instanceof ApiError ? err.message : "Unable to submit your review. Please try again."
      );
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onCancel={(event) => {
        if (submittingRef.current) event.preventDefault();
      }}
      onClose={(event) => {
        // Ignore a queued close event if an effect has already reopened the dialog.
        if (!event.currentTarget.open) onClose();
      }}
      className="m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border border-hairline bg-canvas p-6 text-ink shadow-xl backdrop:bg-ink-black/40 sm:p-8"
    >
      <h2 id={headingId} className="text-heading-md text-ink">
        Review your tutor
      </h2>
      <p className="mt-2 break-words text-sm leading-6 text-ink/70">
        How was learning with {tutorName}? Your review helps other students choose a tutor. It
        can&apos;t be changed after you submit it.
      </p>

      <form noValidate onSubmit={submit} className="mt-6 space-y-5">
        <fieldset disabled={isPending}>
          <legend className="text-sm font-semibold text-ink-black md:text-base">Rating</legend>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} className="cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => {
                    setRating(value);
                    setRatingError(null);
                  }}
                  className="peer sr-only"
                />
                <span className="block rounded-md p-1 peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
                  <Star
                    aria-hidden="true"
                    className={cn(
                      "size-8 text-amber-400 transition-colors",
                      value <= rating ? "fill-amber-400" : "fill-transparent"
                    )}
                  />
                </span>
                <span className="sr-only">
                  {value} {value === 1 ? "star" : "stars"}
                </span>
              </label>
            ))}
          </div>
          {ratingError && (
            <p role="alert" className="mt-1 text-sm text-error">
              {ratingError}
            </p>
          )}
        </fieldset>

        <div>
          <Textarea
            label="Comment (optional)"
            placeholder="What went well? What could be better?"
            value={comment}
            disabled={isPending}
            onChange={(event) => {
              setComment(event.target.value);
              setCommentError(null);
            }}
            error={Boolean(commentError)}
            errorMessage={commentError ?? undefined}
            aria-describedby={counterId}
          />
          <p
            id={counterId}
            className={cn(
              "mt-1 text-right text-xs",
              commentLength > REVIEW_COMMENT_MAX_LENGTH ? "text-error" : "text-ink/60"
            )}
          >
            {commentLength}/{REVIEW_COMMENT_MAX_LENGTH}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={skip}
            className="w-full sm:w-auto"
          >
            Skip
          </Button>
          <Button type="submit" isLoading={isPending} className="w-full sm:w-auto">
            Submit review
          </Button>
        </div>
      </form>
    </dialog>
  );
}

/**
 * The classroom's review: read-only once submitted (both roles); for the student of a completed,
 * unreviewed classroom, a "Write a review" prompt that opens itself until skipped.
 */
export function ClassroomReview({ classroom }: { classroom: ClassroomDetail }) {
  const [submitted, setSubmitted] = useState<Review | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const review = classroom.review ?? submitted;
  const canReview =
    classroom.viewerRole === "student" && classroom.status === "completed" && !review;
  const tutorName = classroom.participant.name?.trim() || "your tutor";

  useEffect(() => {
    if (canReview && !isDismissed(classroom.id)) setIsOpen(true);
  }, [canReview, classroom.id]);

  const close = useCallback(() => {
    markDismissed(classroom.id);
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [classroom.id]);

  const handleSubmitted = useCallback((created: Review) => {
    setSubmitted(created);
    setIsOpen(false);
  }, []);

  if (review) {
    return (
      <div className="rounded-2xl border border-hairline p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink/60">
            {classroom.viewerRole === "student" ? "Your review" : "Student review"}
          </p>
          <ReviewStars rating={review.rating} />
        </div>
        {review.comment && (
          <p className="mt-3 whitespace-pre-line break-words leading-7 text-ink">
            {review.comment}
          </p>
        )}
        <p className="mt-3 text-xs text-ink/60">
          <time dateTime={review.createdAt}>{formatReviewDate(review.createdAt)}</time>
        </p>
      </div>
    );
  }

  if (!canReview) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-hairline p-5">
      <div className="min-w-0">
        <p className="font-semibold text-ink">This classroom is complete</p>
        <p className="mt-1 text-sm text-ink/70">Share how learning with {tutorName} went.</p>
      </div>
      <Button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        className="w-full sm:w-auto"
      >
        <Star aria-hidden="true" className="size-4" />
        Write a review
      </Button>
      {isOpen && (
        <ReviewDialog
          classroomId={classroom.id}
          tutorName={tutorName}
          onSubmitted={handleSubmitted}
          onClose={close}
        />
      )}
    </div>
  );
}
