"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Find tutors", href: "/tutors" },
  { label: "My classroom", href: "/classroom" },
  { label: "Message", href: "/message" },
];

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type NavbarProps = {
  isLoggedIn?: boolean;
  userName?: string;
  userMoney?: string;
  profileUrl?: string;
};

export function Navbar({ isLoggedIn = false, userName, userMoney, profileUrl }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSidebarOpen) return;

    const sidebar = sidebarRef.current;
    const firstFocusable = sidebar?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
        return;
      }

      if (event.key !== "Tab" || !sidebar) return;

      const focusable = Array.from(sidebar.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      menuToggleRef.current?.focus();
    };
  }, [isSidebarOpen]);

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between bg-white px-4 py-3 lg:px-16 shadow-sm">
      <div className="lg:flex lg:items-center">
        <p className="font-outfit font-bold text-[20px] md:text-[28px] text-brand-plum-deepest">
          tutorists.
        </p>
      </div>

      <div className="hidden items-center gap-2 lg:absolute lg:left-1/2 lg:flex lg:-translate-x-1/2">
        {NAV_LINKS.map(({ label, href }) => {
          const isActive = pathname === href;
          return (
            <button
              key={href}
              type="button"
              onClick={() => router.push(href)}
              className={`relative cursor-pointer px-4 py-2 text-sm font-medium after:absolute after:right-4 after:-bottom-4 after:left-4 after:h-1 after:rounded-full after:bg-primary after:transition-transform after:content-[''] hover:text-primary hover:after:scale-x-100 ${
                isActive ? "text-primary after:scale-x-100" : "text-ink after:scale-x-0"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className={`hidden items-center justify-end lg:flex ${isLoggedIn ? "gap-6" : "gap-3"}`}>
        {isLoggedIn ? (
          <div className="flex gap-6 items-center">
            <div className="flex gap-4 items-center">
              {profileUrl ? (
                <Image
                  src={profileUrl}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary"></div>
              )}
              <div className="flex flex-col gap-[1px]">
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-xs">${userMoney}</p>
              </div>
            </div>
            <Button variant="outline" className="text-sm font-semibold px-4 py-2">
              Edit Profile
            </Button>
          </div>
        ) : (
          <>
            <Button variant="outline">Sign in</Button>
            <Button variant="primary">Sign up</Button>
          </>
        )}
      </div>

      <button
        ref={menuToggleRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={isSidebarOpen}
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden"
      >
        <Menu className="text-ink h-5 w-5" />
      </button>

      <div
        className={`fixed inset-0 z-40 flex lg:hidden ${
          isSidebarOpen ? "" : "pointer-events-none"
        }`}
        inert={!isSidebarOpen}
        aria-hidden={!isSidebarOpen}
      >
        <div
          className={`absolute inset-0 z-20 bg-black/30 transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />

        <div
          ref={sidebarRef}
          role="dialog"
          aria-modal={isSidebarOpen}
          aria-label="Menu"
          className={`z-50 ml-auto flex h-full w-[300px] flex-col bg-white px-5 transition-transform duration-300 ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-end">
            <button type="button" aria-label="Close menu" onClick={() => setIsSidebarOpen(false)}>
              <X className="text-ink h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {NAV_LINKS.map(({ label, href }) => (
              <button
                key={href}
                type="button"
                onClick={() => {
                  router.push(href);
                  setIsSidebarOpen(false);
                }}
                className={`font-inter py-1 text-left text-sm font-medium ${
                  pathname === href ? "text-primary" : "text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="border-hairline my-6 border-t" />

          {isLoggedIn ? (
            <>
              {(userName ?? userMoney) && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {profileUrl ? (
                      <Image
                        src={profileUrl}
                        alt="Profile"
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-primary"></div>
                    )}

                    <div className="flex flex-col">
                      {userName && (
                        <span className="font-inter text-ink-black text-xs font-semibold">
                          {userName}
                        </span>
                      )}
                      {userMoney && (
                        <span className="font-inter text-ink text-[10px]">${userMoney}</span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" className="text-xs font-semibold px-4 py-2">
                    Edit Profile
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <Button variant="primary" className="w-full">
                Sign up
              </Button>
              <Button variant="outline" className="w-full">
                Sign in
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
