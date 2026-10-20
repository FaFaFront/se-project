export default function ClassroomDetailLoading() {
  return (
    <main className="min-h-[60vh] px-4 py-8 sm:py-12 md:px-10">
      <div className="mx-auto max-w-3xl" role="status">
        <div className="h-5 w-40 animate-pulse rounded bg-surface-lavender" />
        <div className="mt-6 h-72 animate-pulse rounded-3xl bg-surface-lavender" />
        <span className="sr-only">Loading classroom details</span>
      </div>
    </main>
  );
}
