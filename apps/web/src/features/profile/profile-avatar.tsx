"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

export interface ProfileAvatarProps {
  /** Absolute http(s) URL. Anything else renders the placeholder instead. */
  src?: string | null;
  /** Used for the alt text so the image isn't announced as just "avatar". */
  name?: string | null;
  /** Rendered box size in pixels. */
  size?: number;
  className?: string;
}

/** Photos come from arbitrary URLs the user types, so they can't be optimized
 * through Next's image proxy — and a URL that 404s must not leave a broken
 * image icon in the middle of the page. */
export function ProfileAvatar({ src, name, size = 96, className }: ProfileAvatarProps) {
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => setHasFailed(false), [src]);

  const isRenderable = Boolean(src && /^https?:\/\//i.test(src) && !hasFailed);

  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        "border-canvas bg-surface-lavender flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2",
        className
      )}
    >
      {isRenderable && src ? (
        <Image
          src={src}
          alt={name ? `${name}'s profile photo` : "Profile photo"}
          width={size}
          height={size}
          unoptimized
          onError={() => setHasFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <UserRound
          aria-hidden="true"
          // brand-plum is declared without <alpha-value>, so an opacity
          // modifier here would silently render black instead of plum.
          className="text-brand-plum"
          style={{ width: size * 0.45, height: size * 0.45 }}
        />
      )}
    </span>
  );
}
