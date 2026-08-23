import { Facebook, Instagram, Twitter } from "lucide-react";

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

export function Footer() {
  return (
    <footer className="w-full text-white">
      {/* Mobile and tablet: the supplied 405px design scales to the viewport width. */}
      <div className="flex h-[351px] w-full flex-col items-start gap-8 bg-gradient-to-b from-brand-plum-deepest to-primary px-5 py-16 lg:hidden">
        <div className="flex h-[140px] w-full flex-col items-center gap-6">
          <div className="flex h-[76px] w-[213px] flex-col items-center gap-2">
            <p className="font-outfit h-[45px] text-4xl font-bold leading-[45px]">tutorist.</p>
            <p className="font-outfit h-[23px] whitespace-nowrap text-lg font-medium leading-[23px]">
              find all tutors. in one place.
            </p>
          </div>

          <SocialLinks />
        </div>

        <div className="h-0 w-full border-t border-white/20" />

        <p className="flex h-[19px] w-full items-center justify-center text-center text-sm font-normal leading-[135%]">
          © 2026 tutorist. All rights reserved.
        </p>
      </div>

      {/* Laptop and desktop: the original 1512px design remains fluid at wider widths. */}
      <div className="hidden h-[349px] w-full flex-col items-start gap-12 bg-gradient-to-r from-brand-plum-deepest to-primary px-16 py-16 lg:flex">
        <div className="flex h-[106px] w-full items-center justify-between gap-12">
          <div className="flex h-[106px] w-[284px] flex-col items-start gap-4">
            <p className="font-outfit h-[60px] text-5xl font-bold leading-[60px]">tutorist.</p>
            <p className="font-outfit h-[30px] whitespace-nowrap text-2xl font-medium leading-[30px]">
              find all tutors. in one place.
            </p>
          </div>

          <SocialLinks />
        </div>

        <div className="h-0 w-full border-t border-white/20" />

        <p className="flex h-[19px] w-full items-center justify-center text-center text-sm font-normal leading-[135%]">
          © 2026 tutorist. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
