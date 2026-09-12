import type { LoginResponse } from "@/types/auth";

export type UserProfile = LoginResponse["user"] & {
  bio: string | null;
  gradeLevel: string | null;
  goals: string | null;
  hourlyRate: number | null;
  walletBalance: number;
  createdAt: string;
  subjects: { id: string; name: string }[];
};

// The update endpoint returns Prisma decimals as JSON strings.
export type ProfileUpdateResponse = Omit<
  UserProfile,
  "hourlyRate" | "walletBalance" | "subjects"
> & {
  hourlyRate: string | number | null;
  walletBalance: string | number;
  profileComplete: boolean;
};
