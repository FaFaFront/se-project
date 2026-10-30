/**
 * One-time script: prints a Google Meet OAuth refresh token to add to .env.
 * Run from the repo root:
 *   GOOGLE_MEET_OAUTH_CREDENTIALS_PATH=apps/api/google-meet-credentials.json \
 *     node apps/api/scripts/get-meet-token.mjs
 * Then copy GOOGLE_MEET_REFRESH_TOKEN=<value> into apps/api/.env
 */
import { authenticate } from "@google-cloud/local-auth";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const envPath = process.env.GOOGLE_MEET_OAUTH_CREDENTIALS_PATH;
const credentialsPath = envPath
  ? resolve(process.cwd(), envPath)
  : resolve(dirname(fileURLToPath(import.meta.url)), "../google-meet-creadentials.json");

const SCOPES = [
  "https://www.googleapis.com/auth/meetings.space.created",
  "https://www.googleapis.com/auth/meetings.space.readonly",
];

console.log("Opening browser for Google Meet authorization…");
const client = await authenticate({ scopes: SCOPES, keyfilePath: credentialsPath });

const { refresh_token } = client.credentials;
if (!refresh_token) {
  console.error(
    "No refresh_token returned. The account has already consented to this client.\n" +
    "Revoke access at https://myaccount.google.com/permissions, then re-run this script."
  );
  process.exit(1);
}

console.log("\nAdd this line to apps/api/.env:\n");
console.log(`GOOGLE_MEET_REFRESH_TOKEN=${refresh_token}`);
