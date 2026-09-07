export type UserRole = "student" | "tutor";

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
    profileUrl: string | null;
  };
};

export type RegistrationResponse = {
  token: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
    profileUrl: string | null;
  };
};
