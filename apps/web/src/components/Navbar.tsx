"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Menu, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

const NAV_LINKS = [
  { label: "Find tutors", href: "/tutors" },
  { label: "My classroom", href: "/classroom" },
  { label: "Message", href: "/message" },
];

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type NavbarProps = {
  /** Omit to follow the stored session; pass a value to force the state (Storybook, tests). */
  isLoggedIn?: boolean;
  userName?: string;
  userMoney?: string;
  profileUrl?: string;
};

export function Navbar({ isLoggedIn, userName, userMoney, profileUrl }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { profile, logout } = useAuth();
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const signedIn = isLoggedIn ?? profile !== null;
  const displayName = userName ?? profile?.name ?? profile?.email;
  const displayPhoto = profileUrl ?? profile?.profileUrl ?? undefined;
  const isStudent = profile?.role === "student";
  const isTutor = profile?.role === "tutor";
  const displayBalance =
    userMoney ?? (isStudent || isTutor ? profile.walletBalance.toFixed(2) : undefined);
  const currencySymbol = isTutor ? "฿" : "$";

  useEffect(() => {
    if (!isSidebarOpen) return;

    const sidebar = sidebarRef.current;
    // Captured now rather than read in the cleanup: focus has to return to the
    // button that opened the menu, which is the node as it is on this run.
    const menuToggle = menuToggleRef.current;
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
      menuToggle?.focus();
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const closeOnOutsideOrEscape = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key === "Escape") setIsProfileMenuOpen(false);
        return;
      }
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideOrEscape);
    document.addEventListener("keydown", closeOnOutsideOrEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideOrEscape);
      document.removeEventListener("keydown", closeOnOutsideOrEscape);
    };
  }, [isProfileMenuOpen]);

  async function handleLogout() {
    setIsProfileMenuOpen(false);
    await logout();
  }

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between bg-white px-4 py-3 lg:px-16 shadow-sm">
      <div className="lg:flex lg:items-center">
        <p className="font-outfit font-bold text-[20px] md:text-[28px] text-brand-plum-deepest">
          tutorists.
        </p>
      </div>

      <div className="hidden items-center gap-2 lg:flex">
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

      <div className="hidden items-center justify-end gap-3 lg:flex">
        {signedIn ? (
          <div className="flex items-center gap-3">
            {(isStudent || isTutor) && (
              <Button
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={() => router.push(isTutor ? "/balance/withdraw" : "/balance/top-up")}
              >
                {isTutor ? "Withdraw balance" : "Top up balance"}
              </Button>
            )}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((open) => !open)}
                aria-label="Open profile menu"
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
                className="border-hairline hover:border-primary hover:bg-surface-lavender flex items-center gap-2 rounded-full border bg-white py-1 pr-4 pl-1 transition-colors"
              >
                {displayPhoto ? (
                  <Image
                    src={displayPhoto}
                    alt="Profile"
                    width={32}
                    height={32}
                    unoptimized
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary"></div>
                )}
                <div className="flex flex-col items-start gap-[1px] text-left">
                  <p className="text-ink-black text-sm leading-tight font-semibold">
                    {displayName}
                  </p>
                  {displayBalance !== undefined && (
                    <p className="text-ink text-xs leading-tight">
                      {currencySymbol}
                      {displayBalance}
                    </p>
                  )}
                </div>
              </button>

              {isProfileMenuOpen && (
                <div
                  role="menu"
                  aria-label="Profile menu"
                  className="border-hairline bg-canvas absolute top-full right-0 z-10 mt-2 w-48 overflow-hidden rounded-xl border py-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      router.push("/profile");
                    }}
                    className="text-ink hover:bg-surface-lavender flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors"
                  >
                    <User aria-hidden="true" className="size-4" />
                    Profile settings
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="text-error hover:bg-surface-lavender flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors"
                  >
                    <LogOut aria-hidden="true" className="size-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <Button variant="outline" onClick={() => router.push("/login")}>
              Sign in
            </Button>
            <Button variant="primary" onClick={() => router.push("/register")}>
              Sign up
            </Button>
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

          {signedIn ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                {displayPhoto ? (
                  <Image
                    src={displayPhoto}
                    alt="Profile"
                    width={36}
                    height={36}
                    unoptimized
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-primary"></div>
                )}

                <div className="flex flex-col">
                  {displayName && (
                    <span className="font-inter text-ink-black text-xs font-semibold">
                      {displayName}
                    </span>
                  )}
                  {displayBalance !== undefined && (
                    <span className="font-inter text-ink text-[10px]">
                      {currencySymbol}
                      {displayBalance}
                    </span>
                  )}
                  {(isStudent || isTutor) && (
                    <Link
                      href={isTutor ? "/balance/withdraw" : "/balance/top-up"}
                      onClick={() => setIsSidebarOpen(false)}
                      className="text-xs font-semibold text-primary"
                    >
                      {isTutor ? "Withdraw balance" : "Top up balance"}
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 px-4 py-2 text-xs font-semibold"
                  onClick={() => {
                    router.push("/profile");
                    setIsSidebarOpen(false);
                  }}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  className="text-error flex-1 px-4 py-2 text-xs font-semibold"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    void handleLogout();
                  }}
                >
                  Log out
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  router.push("/register");
                  setIsSidebarOpen(false);
                }}
              >
                Sign up
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  router.push("/login");
                  setIsSidebarOpen(false);
                }}
              >
                Sign in
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
