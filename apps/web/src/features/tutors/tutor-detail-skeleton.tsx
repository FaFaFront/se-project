/** Mirrors TutorDetailPanel's loaded layout so the page doesn't jump when data arrives. */
export function TutorDetailSkeleton() {
  return (
    <div className="gap-xl flex flex-col" aria-hidden="true">
      <div className="bg-surface-lavender h-5 w-28 animate-pulse rounded" />

      <section className="border-hairline bg-canvas rounded-[10px] border p-6 shadow-sm sm:p-8">
        <div className="gap-xl flex flex-col justify-between md:flex-row md:items-start">
          <div className="gap-base flex min-w-0 items-start">
            <div className="bg-surface-lavender size-24 shrink-0 animate-pulse rounded-full" />
            <div className="gap-sm flex min-w-0 flex-col pt-1">
              <div className="bg-surface-lavender h-6 w-40 animate-pulse rounded" />
              <div className="bg-surface-lavender h-4 w-24 animate-pulse rounded" />
              <div className="bg-surface-lavender h-4 w-56 animate-pulse rounded" />
            </div>
          </div>
          <div className="bg-surface-lavender h-10 w-28 shrink-0 animate-pulse rounded-full" />
        </div>

        <div className="border-hairline mt-8 gap-sm flex flex-col border-t pt-8">
          <div className="bg-surface-lavender h-4 w-20 animate-pulse rounded" />
          <div className="bg-surface-lavender h-3 w-full animate-pulse rounded" />
          <div className="bg-surface-lavender h-3 w-4/5 animate-pulse rounded" />
        </div>

        <div className="border-hairline mt-8 gap-sm flex flex-col border-t pt-8">
          <div className="bg-surface-lavender h-4 w-20 animate-pulse rounded" />
          <div className="gap-sm mt-1 flex flex-wrap">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="bg-surface-lavender h-7 w-20 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>

      <section className="gap-base flex flex-col">
        <div className="bg-surface-lavender h-6 w-40 animate-pulse rounded" />
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="border-hairline bg-canvas rounded-[10px] border p-5 shadow-sm"
          >
            <div className="gap-sm flex items-center">
              <div className="bg-surface-lavender size-9 shrink-0 animate-pulse rounded-full" />
              <div className="gap-xs flex flex-col">
                <div className="bg-surface-lavender h-4 w-28 animate-pulse rounded" />
                <div className="bg-surface-lavender h-3 w-16 animate-pulse rounded" />
              </div>
            </div>
            <div className="mt-3 gap-xs flex flex-col">
              <div className="bg-surface-lavender h-3 w-full animate-pulse rounded" />
              <div className="bg-surface-lavender h-3 w-3/5 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
