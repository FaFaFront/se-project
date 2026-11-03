/** Mirrors TutorCard's shape so the grid doesn't jump when real data arrives. */
function TutorCardSkeleton() {
  return (
    <li className="border-hairline bg-canvas gap-base flex flex-col rounded-[10px] border p-5 shadow-sm">
      <div className="gap-base flex items-center">
        <div className="bg-surface-lavender size-14 shrink-0 animate-pulse rounded-full" />
        <div className="gap-xs flex min-w-0 flex-1 flex-col">
          <div className="bg-surface-lavender h-4 w-2/3 animate-pulse rounded" />
          <div className="bg-surface-lavender h-3 w-1/3 animate-pulse rounded" />
        </div>
      </div>

      <div className="gap-xs flex flex-col">
        <div className="bg-surface-lavender h-3 w-full animate-pulse rounded" />
        <div className="bg-surface-lavender h-3 w-4/5 animate-pulse rounded" />
      </div>

      <div className="gap-sm flex">
        <div className="bg-surface-lavender h-6 w-16 animate-pulse rounded-lg" />
        <div className="bg-surface-lavender h-6 w-20 animate-pulse rounded-lg" />
      </div>

      <div className="border-hairline gap-base mt-auto flex items-center border-t pt-4">
        <div className="bg-surface-lavender h-4 w-16 animate-pulse rounded" />
        <div className="bg-surface-lavender h-4 w-20 animate-pulse rounded" />
      </div>
    </li>
  );
}

export function TutorListSkeleton({ count = 9 }: { count?: number }) {
  return (
    <ul aria-hidden="true" className="gap-base grid sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <TutorCardSkeleton key={index} />
      ))}
    </ul>
  );
}
