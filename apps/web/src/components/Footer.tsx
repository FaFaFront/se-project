import { Facebook, Instagram, Twitter } from "lucide-react";
import Link from "next/link";

const SOCIAL_LINKS = [
  { label: "Instagram", href: "#", Icon: Instagram },
  { label: "Facebook", href: "#", Icon: Facebook },
  { label: "Twitter", href: "#", Icon: Twitter },
];

function SocialLinks() {
  return (
    <div className="flex h-10 w-36 items-center gap-3" aria-label="Social media links">
      {SOCIAL_LINKS.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          className="flex size-10 items-center justify-center rounded-3xl bg-white text-primary transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Icon className="size-4" aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

function FooterBottom() {
  return (
    <div className="flex w-full flex-col items-center gap-5 border-t border-white/20 pt-5 sm:flex-row sm:justify-between">
      <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
        <Link href="/about" className="underline-offset-4 hover:underline focus-visible:underline">
          About Tutorist
        </Link>
        <Link
          href="/privacy-policy"
          className="underline-offset-4 hover:underline focus-visible:underline"
        >
          Privacy Policy
        </Link>
      </nav>
      <p className="text-center text-sm font-normal leading-[135%]">
        © 2026 Tutorist. All rights reserved.
      </p>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="w-full text-white">
      <div className="flex w-full flex-col items-start gap-8 bg-gradient-to-b from-brand-plum-deepest to-primary px-5 py-10 lg:hidden">
        <div className="flex w-full flex-col items-center gap-6">
          <div className="flex h-[76px] w-[213px] flex-col items-center gap-2">
            <p className="font-outfit h-[45px] text-4xl font-bold leading-[45px]">tutorist.</p>
            <p className="font-outfit h-[23px] whitespace-nowrap text-lg font-medium leading-[23px]">
              find all tutors. in one place.
            </p>
          </div>
          <SocialLinks />
        </div>
        <FooterBottom />
      </div>

      <div className="hidden w-full flex-col items-start gap-8 bg-gradient-to-r from-brand-plum-deepest to-primary px-16 py-10 lg:flex">
        <div className="flex w-full items-center justify-between gap-12">
          <div className="flex flex-col gap-4">
            <p className="font-outfit h-[60px] text-5xl font-bold leading-[60px]">tutorist.</p>
            <p className="font-outfit h-[30px] whitespace-nowrap text-2xl font-medium leading-[30px]">
              find all tutors. in one place.
            </p>
          </div>
          <SocialLinks />
        </div>
        <FooterBottom />
      </div>
    </footer>
  );
}
