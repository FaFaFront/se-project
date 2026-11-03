/** Small banner at the top of /tutors — just sets context, no inputs. */
export function TutorsHero() {
  return (
    <section className="from-brand-plum-deepest to-primary relative flex flex-col overflow-hidden rounded-[16px] bg-gradient-to-br px-5 py-8 text-white sm:px-8 sm:py-10">
      <div
        aria-hidden="true"
        className="bg-primary/30 absolute -top-16 -right-16 size-56 rounded-full blur-3xl"
      />
      <div className="relative z-10">
        <h1 className="text-heading-md font-outfit">Find your perfect tutor</h1>
        <p className="mt-2 max-w-xl text-sm text-white/80 sm:text-base">
          Browse active tutors by subject and price, then message one to get started.
        </p>
      </div>
    </section>
  );
}
