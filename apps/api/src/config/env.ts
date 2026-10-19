import "dotenv/config";

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

export const env = {
  NODE_ENV: getEnvOptional("NODE_ENV", "development"),
  PORT: getEnvOptional("PORT", "4000"),
  DATABASE_URL: getEnv("DATABASE_URL"),
  CORS_ORIGIN: getEnvOptional("CORS_ORIGIN", "http://localhost:3000"),
  JWT_SECRET: getEnv("JWT_SECRET"),
  // Google Cloud Storage
  GCS_PROJECT_ID: getEnvOptional("GOOGLE_CLOUD_PROJECT_ID", ""),
  GCS_BUCKET: getEnvOptional("GOOGLE_STORAGE_BUCKET", ""),
  GCS_CREDENTIALS_PATH: getEnvOptional("GOOGLE_STORAGE_CREDENTIALS_PATH", ""),
  GCS_SERVICE_ACCOUNT_KEY: getEnvOptional("GOOGLE_STORAGE_SERVICE_ACCOUNT_KEY", ""),
  GCS_PUBLIC_BASE_URL: getEnvOptional("GCS_PUBLIC_BASE_URL", ""),
} as const;
