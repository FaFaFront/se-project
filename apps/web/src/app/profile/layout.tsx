import type { ReactNode } from "react";

import { RouteGuard } from "@/components/auth/route-guard";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>;
}
