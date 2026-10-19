import { Star, Users } from "lucide-react";

import { ProfileAvatar } from "@/features/profile/profile-avatar";
import { formatCurrency } from "@/features/profile/profile-details";
import type { TutorListItem } from "@/types/tutor";

export function TutorCard({ tutor }: { tutor: TutorListItem }) {
  return (
    <li className="border-hairline bg-canvas gap-base flex flex-col rounded-[10px] border p-5 shadow-sm">
      <div className="gap-base flex items-center">
        <ProfileAvatar src={tutor.profileUrl} name={tutor.name} size={56} />
        <div className="min-w-0 flex-1">
          <h2 className="text-body-emphasis text-ink-black truncate">{tutor.name ?? "Tutor"}</h2>
          <p className="text-primary text-sm font-semibold">
            {tutor.hourlyRate === null
              ? "Rate not set"
              : `${formatCurrency(tutor.hourlyRate)} / hour`}
          </p>
        </div>
      </div>

      {tutor.bio && <p className="text-ink line-clamp-2 text-sm">{tutor.bio}</p>}

      {tutor.subjects.length > 0 && (
        <ul aria-label="Subjects" className="gap-sm flex flex-wrap">
          {tutor.subjects.map((subject) => (
            <li
              key={subject.id}
              className="border-hairline text-ink rounded-lg border px-3 py-1 text-xs"
            >
              {subject.name}
            </li>
          ))}
        </ul>
      )}

      <div className="border-hairline gap-base text-ink mt-auto flex items-center border-t pt-4 text-sm">
        <span className="gap-xs flex items-center" title={`${tutor.reviewCount} reviews`}>
          <Star aria-hidden="true" className="size-4 shrink-0 fill-amber-400 text-amber-400" />
          {tutor.rating === null ? (
            <span className="text-placeholder">No reviews yet</span>
          ) : (
            <span>
              <span className="text-ink-black font-semibold">{tutor.rating.toFixed(1)}/5</span>
              <span className="sr-only"> average rating</span>
            </span>
          )}
        </span>
        <span className="gap-xs flex items-center">
          <Users aria-hidden="true" className="size-4 shrink-0" />
          {tutor.studentCount} {tutor.studentCount === 1 ? "student" : "students"}
        </span>
      </div>
    </li>
  );
}
