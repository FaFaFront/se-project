import Link from "next/link";

import { BookOpen, MessageCircle, Search, Wallet } from "lucide-react";

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

const HOW_IT_WORKS_STEPS = [
  {
    number: "01",
    title: "Find a tutor",
    description: "Browse and filter tutors by subject, rating, and price.",
  },
  {
    number: "02",
    title: "Book a classroom",
    description: "Schedule a session directly through the platform.",
  },
  {
    number: "03",
    title: "Start learning",
    description: "Join your session and chat with your tutor in real time.",
  },
];

function HowItWorksSection() {
  return (
    <section className="bg-surface-lavender px-4 py-16 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-outfit text-display-md text-brand-plum-deepest mb-10 text-center">
          How it works
        </h2>
        <ol className="grid gap-8 lg:grid-cols-3 lg:divide-x lg:divide-primary/20">
          {HOW_IT_WORKS_STEPS.map(({ number, title, description }) => (
            <li key={number} className="flex flex-col gap-3 lg:px-8">
              <span className="font-outfit text-display-md text-primary">{number}</span>
              <h3 className="text-heading-md text-ink-black">{title}</h3>
              <p className="text-body-sm text-ink/70">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    Icon: Search,
    title: "Browse Tutors",
    description: "Filter by subject, price, and availability to find your perfect match.",
  },
  {
    Icon: BookOpen,
    title: "Classroom Sessions",
    description: "Book and manage your learning sessions in one place.",
  },
  {
    Icon: MessageCircle,
    title: "Real-time Messaging",
    description: "Chat directly with tutors before and after sessions.",
  },
  {
    Icon: Wallet,
    title: "Simple Payments",
    description: "Top up your wallet and pay for sessions seamlessly.",
  },
];

function FeatureHighlightsSection() {
  return (
    <section className="bg-canvas px-4 py-16 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-outfit text-display-md text-brand-plum-deepest mb-10 text-center">
          Everything you need to learn
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ Icon, title, description }) => (
            <div key={title} className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm">
              <Icon className="size-6 text-primary" aria-hidden="true" />
              <h3 className="text-heading-md text-ink-black">{title}</h3>
              <p className="text-body-sm text-ink/70">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main>
      <HeroSection />
      <HowItWorksSection />
      <FeatureHighlightsSection />
    </main>
  );
}
