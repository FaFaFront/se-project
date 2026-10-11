import Link from "next/link";
import type { ReactNode } from "react";

/** Wraps a My Classroom list item with the canonical detail-page link. */
export function ClassroomItemLink({
  classroomId,
  children,
  className,
}: {
  classroomId: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={`/classroom/${encodeURIComponent(classroomId)}`} className={className}>
      {children}
    </Link>
  );
}
