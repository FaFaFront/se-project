import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ConfigurationError } from "../common/errors/app-error.js";

function getEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === "") {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
}

function getEnvOptional(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export interface GoogleMeetCredentials {
  client_email: string;
  private_key: string;
}

export interface GoogleMeetServiceAccountConfig {
  authMode: "service-account";
  credentials: GoogleMeetCredentials;
  impersonateUser: string;
}

export interface GoogleMeetOAuthConfig {
  authMode: "oauth";
  credentialsPath: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string | null;
}

export type GoogleMeetConfig = GoogleMeetServiceAccountConfig | GoogleMeetOAuthConfig;

function parseMeetCredentials(rawCredentials: string): GoogleMeetCredentials {
  let credentials: unknown;

  try {
    credentials = JSON.parse(rawCredentials);
  } catch {
    throw new ConfigurationError(
      "Invalid Google Meet credentials: expected a valid service-account JSON object"
    );
  }

  if (
    typeof credentials !== "object" ||
    credentials === null ||
    !("type" in credentials) ||
    credentials.type !== "service_account" ||
    !("client_email" in credentials) ||
    typeof credentials.client_email !== "string" ||
    credentials.client_email.length === 0 ||
    !("private_key" in credentials) ||
    typeof credentials.private_key !== "string" ||
    credentials.private_key.length === 0
  ) {
    throw new ConfigurationError(
      "Invalid Google Meet credentials: service-account type, client_email, and private_key are required"
    );
  }

  return {
    client_email: credentials.client_email,
    private_key: credentials.private_key,
  };
}

function parseMeetOAuthCredentials(rawCredentials: string): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} {
  let credentials: unknown;

  try {
    credentials = JSON.parse(rawCredentials);
  } catch {
    throw new ConfigurationError(
      "Invalid Google Meet OAuth credentials: expected a valid OAuth client JSON object"
    );
  }

  if (typeof credentials !== "object" || credentials === null) {
    throw new ConfigurationError("Invalid Google Meet OAuth credentials");
  }

  const oauthClient =
    "installed" in credentials && typeof credentials.installed === "object"
      ? credentials.installed
      : "web" in credentials && typeof credentials.web === "object"
        ? credentials.web
        : null;

  if (
    oauthClient === null ||
    !("client_id" in oauthClient) ||
    typeof oauthClient.client_id !== "string" ||
    !("client_secret" in oauthClient) ||
    typeof oauthClient.client_secret !== "string" ||
    !("redirect_uris" in oauthClient) ||
    !Array.isArray(oauthClient.redirect_uris) ||
    typeof oauthClient.redirect_uris[0] !== "string"
  ) {
    throw new ConfigurationError(
      "Invalid Google Meet OAuth credentials: client_id, client_secret, and redirect_uris are required"
    );
  }

  return {
    clientId: oauthClient.client_id,
    clientSecret: oauthClient.client_secret,
    redirectUri: oauthClient.redirect_uris[0],
  };
}

function readMeetCredentialsFile(credentialsPath: string, envKey: string): string {
  try {
    return readFileSync(credentialsPath, "utf8");
  } catch {
    throw new ConfigurationError(
      `Unable to read ${envKey}; verify that the file exists and is readable`
    );
  }
}

export const env = {
  NODE_ENV: getEnvOptional("NODE_ENV", "development"),
  PORT: getEnvOptional("PORT", "4000"),
  DATABASE_URL: getEnv("DATABASE_URL"),
  CORS_ORIGIN: getEnvOptional("CORS_ORIGIN", "http://localhost:3000"),
  JWT_SECRET: getEnv("JWT_SECRET"),
  REDIS_URL: getEnvOptional("REDIS_URL", ""),
  // Google Cloud Storage
  GCS_PROJECT_ID: getEnvOptional("GOOGLE_CLOUD_PROJECT_ID", ""),
  GCS_BUCKET: getEnvOptional("GOOGLE_STORAGE_BUCKET", ""),
  GCS_CREDENTIALS_PATH: getEnvOptional("GOOGLE_STORAGE_CREDENTIALS_PATH", ""),
  GCS_SERVICE_ACCOUNT_KEY: getEnvOptional("GOOGLE_STORAGE_SERVICE_ACCOUNT_KEY", ""),
  GCS_PUBLIC_BASE_URL: getEnvOptional("GCS_PUBLIC_BASE_URL", ""),
  // Google Meet (validated lazily by getGoogleMeetConfig)
  GOOGLE_MEET_OAUTH_CREDENTIALS_PATH: getEnvOptional("GOOGLE_MEET_OAUTH_CREDENTIALS_PATH", ""),
  GOOGLE_MEET_REFRESH_TOKEN: getEnvOptional("GOOGLE_MEET_REFRESH_TOKEN", ""),
  GOOGLE_MEET_CREDENTIALS_PATH: getEnvOptional("GOOGLE_MEET_CREDENTIALS_PATH", ""),
  GOOGLE_MEET_SERVICE_ACCOUNT_KEY: getEnvOptional("GOOGLE_MEET_SERVICE_ACCOUNT_KEY", ""),
  GOOGLE_MEET_IMPERSONATE_USER: getEnvOptional("GOOGLE_MEET_IMPERSONATE_USER", ""),
} as const;

/**
 * Loads and validates Google Meet authentication. Interactive OAuth takes
 * precedence when configured; otherwise service-account delegation is used.
 */
export function getGoogleMeetConfig(): GoogleMeetConfig {
  const oauthCredentialsPath = env.GOOGLE_MEET_OAUTH_CREDENTIALS_PATH.trim();
  if (oauthCredentialsPath) {
    const absolutePath = resolve(oauthCredentialsPath);
    const oauthCredentials = parseMeetOAuthCredentials(
      readMeetCredentialsFile(absolutePath, "GOOGLE_MEET_OAUTH_CREDENTIALS_PATH")
    );
    return {
      authMode: "oauth",
      credentialsPath: absolutePath,
      ...oauthCredentials,
      refreshToken: env.GOOGLE_MEET_REFRESH_TOKEN.trim() || null,
    };
  }

  const impersonateUser = env.GOOGLE_MEET_IMPERSONATE_USER.trim();
  if (!impersonateUser) {
    throw new ConfigurationError("Missing required env: GOOGLE_MEET_IMPERSONATE_USER");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(impersonateUser)) {
    throw new ConfigurationError("Invalid GOOGLE_MEET_IMPERSONATE_USER: expected an email address");
  }

  let rawCredentials = env.GOOGLE_MEET_SERVICE_ACCOUNT_KEY.trim();
  if (!rawCredentials) {
    const credentialsPath = env.GOOGLE_MEET_CREDENTIALS_PATH.trim();
    if (!credentialsPath) {
      throw new ConfigurationError(
        "Missing Google Meet credentials: set GOOGLE_MEET_CREDENTIALS_PATH or GOOGLE_MEET_SERVICE_ACCOUNT_KEY"
      );
    }

    rawCredentials = readMeetCredentialsFile(credentialsPath, "GOOGLE_MEET_CREDENTIALS_PATH");
  }

  return {
    authMode: "service-account",
    credentials: parseMeetCredentials(rawCredentials),
    impersonateUser,
  };
}
