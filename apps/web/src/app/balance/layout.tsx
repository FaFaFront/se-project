import type { ReactNode } from "react";

import { RouteGuard } from "@/components/auth/route-guard";

export default function BalanceLayout({ children }: { children: ReactNode }) {
  return <RouteGuard allowRoles={["student"]}>{children}</RouteGuard>;
}
