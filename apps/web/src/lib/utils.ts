import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * For a page heading that shows a user's name. On devices that can hover
 * (mouse/trackpad) a long name truncates with "…" and the full name shows in a
 * `title` tooltip — pair this with `title={name}`. Touch devices can't hover, so
 * there the full name wraps onto extra lines instead of being cut off.
 *
 * Join it with a template string, not `cn()`: tailwind-merge doesn't know our
 * custom `text-heading-*` sizes and drops them when a `text-<color>` follows.
 */
export const NAME_HEADING = "[overflow-wrap:anywhere] [@media(hover:hover)]:truncate";
