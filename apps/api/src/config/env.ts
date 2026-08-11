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
} as const;
