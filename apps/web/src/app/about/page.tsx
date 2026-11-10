import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Tutorist",
  description: "Learn about Tutorist, a place for students and tutors to connect.",
};

export default function AboutPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#faf9fc] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">About us</p>
        <h1 className="font-outfit mb-6 text-4xl font-bold text-brand-plum-deepest sm:text-5xl">
          About Tutorist
        </h1>
        <div className="space-y-5 text-base leading-7 text-ink/80">
          <p>
            Tutorist is a learning platform project built to bring students and tutors together in
            one place. Students can explore tutor profiles, subjects, rates, and reviews to find
            support that fits their learning goals.
          </p>
          <p>
            Tutors can share their experience and subjects, connect with students, and manage
            learning sessions. The platform also includes classroom tools, direct messaging, and a
            wallet ledger for session-related transactions.
          </p>
          <p>
            Our goal is to make it easier to discover the right learning support and keep the
            details of tutoring in one convenient place.
          </p>
        </div>
      </article>
    </main>
  );
}
