import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-brand-plum-deepest to-primary px-4 py-16 lg:px-16 lg:py-24">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 lg:flex-row lg:gap-16">
        <div className="flex flex-1 flex-col gap-6 text-center lg:text-left">
          <h1 className="font-outfit text-display-lg text-white">
            Find the right tutor, in one place.
          </h1>
          <p className="text-body-md text-white/80">
            Browse expert tutors, book sessions, and learn — all in one platform.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="/tutors"
              className={cn(
                buttonVariants(),
                "bg-white text-primary hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              )}
            >
              Find a tutor
            </Link>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-white text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              )}
            >
              Sign up free
            </Link>
          </div>
        </div>

        {/* Decorative tutor card skeleton — aria-hidden, desktop only */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-center" aria-hidden="true">
          <div className="w-72 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/30" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-24 rounded bg-white/40" />
                <div className="h-2 w-16 rounded bg-white/25" />
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {["Math", "Physics", "Calculus"].map((s) => (
                <span key={s} className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">
                  {s}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-3 w-3 rounded-sm ${i <= 4 ? "bg-white/70" : "bg-white/25"}`}
                  />
                ))}
              </div>
              <div className="h-3 w-16 rounded bg-white/40" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main>
      <HeroSection />
    </main>
  );
}
