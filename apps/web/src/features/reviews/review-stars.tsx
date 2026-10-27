import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only 1–5 star display. */
export function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="gap-xs flex" role="img" aria-label={`${rating} out of 5 stars`}>
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

export function formatReviewDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}
