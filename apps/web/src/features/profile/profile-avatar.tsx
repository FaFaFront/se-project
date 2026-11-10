"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

export interface ProfileAvatarProps {
  /** Absolute http(s) photo URL or a blob URL for a local file preview. */
  src?: string | null;
  /** Used for the alt text so the image isn't announced as just "avatar". */
  name?: string | null;
  /** Rendered box size in pixels. */
  size?: number;
  className?: string;
}

/** Render remote photos and local file previews without Next's image proxy,
 * falling back to a placeholder if an image fails to load. */
export function ProfileAvatar({ src, name, size = 96, className }: ProfileAvatarProps) {
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => setHasFailed(false), [src]);

  const isRenderable = Boolean(src && /^(https?:\/\/|blob:)/i.test(src) && !hasFailed);

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
