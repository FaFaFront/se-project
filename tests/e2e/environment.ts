// Keep all E2E traffic and data separate from the normal development servers/database.
export const WEB_URL = "http://127.0.0.1:3100";
export const API_URL = "http://127.0.0.1:4100/api";
export const DATABASE_URL = "postgresql://e2e:e2e@127.0.0.1:55432/se_project_e2e";

export const EXISTING_ACCOUNT = {
  email: "nat.silp@gmail.com",
  password: "selab2026",
};

export const UNUSED_EMAIL = "test123@gmail.com";
export const UNKNOWN_EMAIL = "newuser@gmail.com";
