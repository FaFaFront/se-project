import type { ReactNode } from "react";

import { RouteGuard } from "@/components/auth/route-guard";

export default function CompleteProfileLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard requireProfileComplete={false} redirectIfProfileComplete>
      {children}
    </RouteGuard>
  );
}
