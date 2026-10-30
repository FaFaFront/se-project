/**
 * One-time script: prints a Google Meet OAuth refresh token to add to .env.
 * Run from the repo root: node apps/api/scripts/get-meet-token.mjs
 * Then copy GOOGLE_MEET_REFRESH_TOKEN=<value> into apps/api/.env
 */
import { authenticate } from "@google-cloud/local-auth";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const credentialsPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../google-meet-creadentials.json"
);

const SCOPES = [
  "https://www.googleapis.com/auth/meetings.space.created",
  "https://www.googleapis.com/auth/meetings.space.readonly",
];

console.log("Opening browser for Google Meet authorization…");
const client = await authenticate({ scopes: SCOPES, keyfilePath: credentialsPath });

const { refresh_token } = client.credentials;
if (!refresh_token) {
  console.error("No refresh_token returned. Make sure 'access_type=offline' was requested (it is by default).");
  process.exit(1);
}

console.log("\nAdd this line to apps/api/.env:\n");
console.log(`GOOGLE_MEET_REFRESH_TOKEN=${refresh_token}`);
