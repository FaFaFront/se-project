export type UserRole = "student" | "tutor";

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    profileUrl: string;
  };
};

export type RegistrationResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    profileUrl: string;
  };
};
