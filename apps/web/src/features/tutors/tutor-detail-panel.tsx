"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Star, Users } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { ProfileAvatar } from "@/features/profile/profile-avatar";
import { formatCurrency } from "@/features/profile/profile-details";
import { ApiError, apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { TutorListItem } from "@/types/tutor";

type MockReview = {
  reviewer: string;
  rating: number;
  comment: string;
};

const MOCK_REVIEWS: MockReview[] = [
  {
    reviewer: "Narin P.",
    rating: 5,
    comment:
      "Clear explanations and useful practice questions. I felt much more confident after our lessons.",
  },
  {
    reviewer: "Pim S.",
    rating: 4,
    comment:
      "Very patient and well prepared. The lesson was easy to follow and matched what I needed to revise.",
  },
];

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="gap-xs flex" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={cn(
            "size-4 text-amber-400",
            index < rating ? "fill-amber-400" : "fill-transparent"
          )}
        />
      ))}
    </span>
  );
}

export function TutorDetailPanel({ tutorId }: { tutorId: string }) {
  const [tutor, setTutor] = useState<TutorListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isStale = false;
    setIsLoading(true);
    setError(null);

    apiClient
      .get<TutorListItem>(`/tutors/${encodeURIComponent(tutorId)}`)
      .then((data) => {
        if (!isStale) setTutor(data);
      })
      .catch((requestError: unknown) => {
        if (!isStale) {
          if (requestError instanceof ApiError && requestError.status === 404) {
            setTutor(null);
            return;
          }
          setError(
            requestError instanceof Error ? requestError.message : "Unable to load this tutor."
          );
        }
      })
      .finally(() => {
        if (!isStale) setIsLoading(false);
      });

    return () => {
      isStale = true;
    };
  }, [tutorId, reloadKey]);

  if (isLoading) {
    return (
      <p className="text-ink py-12 text-center" role="status">
        Loading tutor...
      </p>
    );
  }

  if (error) {
    return (
      <div className="gap-base flex flex-col items-center py-12 text-center">
        <p className="text-ink">{error}</p>
        <Button variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
          Retry
        </Button>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-heading-md text-ink-black">Tutor not found</h1>
        <p className="text-ink mt-3">This tutor may no longer be available.</p>
        <Link
          href="/tutors"
          className="text-primary mt-5 inline-block font-semibold hover:underline"
        >
          Browse tutors
        </Link>
      </div>
    );
  }

  return (
    <div className="gap-xl flex flex-col">
      <Link href="/tutors" className="text-primary w-fit text-sm font-semibold hover:underline">
        ← Back to tutors
      </Link>

      <section className="border-hairline bg-canvas rounded-[10px] border p-6 shadow-sm sm:p-8">
        <div className="gap-xl flex flex-col justify-between md:flex-row md:items-start">
          <div className="gap-base flex min-w-0 items-start">
            <ProfileAvatar src={tutor.profileUrl} name={tutor.name} size={96} />
            <div className="min-w-0">
              <h1 className="text-heading-md text-ink-black truncate">{tutor.name ?? "Tutor"}</h1>
              <p className="text-primary mt-2 text-sm font-semibold">
                {tutor.hourlyRate === null
                  ? "Rate not set"
                  : `${formatCurrency(tutor.hourlyRate)} / hour`}
              </p>
              <div className="gap-sm text-ink mt-3 flex flex-wrap items-center text-sm">
                <span className="gap-xs flex items-center">
                  <Star aria-hidden="true" className="size-4 fill-amber-400 text-amber-400" />
                  {tutor.rating === null
                    ? "No reviews yet"
                    : `${tutor.rating.toFixed(1)} (${tutor.reviewCount})`}
                </span>
                <span className="gap-xs flex items-center" title="Popularity">
                  <Users aria-hidden="true" className="size-4" />
                  Popular with {tutor.studentCount}{" "}
                  {tutor.studentCount === 1 ? "student" : "students"}
                </span>
              </div>
            </div>
          </div>

          <Link
            href={`/message?tutor=${encodeURIComponent(tutor.id)}`}
            className={buttonVariants()}
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            Message
          </Link>
        </div>

        <div className="border-hairline mt-8 border-t pt-8">
          <h2 className="text-body-emphasis text-ink-black">About</h2>
          <p className="text-ink mt-3 leading-7">
            {tutor.bio || "This tutor has not added a bio yet."}
          </p>
        </div>

        <div className="border-hairline mt-8 border-t pt-8">
          <h2 className="text-body-emphasis text-ink-black">Subjects</h2>
          {tutor.subjects.length > 0 ? (
            <ul className="gap-sm mt-3 flex flex-wrap">
              {tutor.subjects.map((subject) => (
                <li
                  key={subject.id}
                  className="border-hairline text-ink rounded-lg border px-3 py-1 text-sm"
                >
                  {subject.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-placeholder mt-3 text-sm">No subjects listed yet.</p>
          )}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-heading-md text-ink-black">Student reviews</h2>
          <p className="text-ink text-sm">Mocked data until reviews are available</p>
        </div>
        <div className="gap-base mt-5 flex flex-col">
          {MOCK_REVIEWS.map((review) => (
            <article
              key={review.reviewer}
              className="border-hairline bg-canvas rounded-[10px] border p-5 shadow-sm"
            >
              <div className="gap-base flex items-center justify-between">
                <h3 className="text-body-emphasis text-ink-black">{review.reviewer}</h3>
                <ReviewStars rating={review.rating} />
              </div>
              <p className="text-ink mt-3 leading-7">{review.comment}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
