import type { ReactNode } from "react";

import { GuestGuard } from "@/components/auth/guest-guard";

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <GuestGuard>{children}</GuestGuard>;
}
