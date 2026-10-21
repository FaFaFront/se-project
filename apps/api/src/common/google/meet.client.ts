import { google, meet_v2 } from "googleapis";
import { authenticate } from "@google-cloud/local-auth";
import { AppError, BadRequestError, ExternalServiceError } from "../errors/app-error.js";
import { getGoogleMeetConfig } from "../../config/env.js";

const MEET_SCOPES = [
  "https://www.googleapis.com/auth/meetings.space.created",
  "https://www.googleapis.com/auth/meetings.space.readonly",
] as const;

const TRANSIENT_NETWORK_CODES = new Set([
  "ECONNABORTED",
  "ECONNRESET",
  "ENETUNREACH",
  "ENOTFOUND",
  "ETIMEDOUT",
]);

export interface MeetSpace {
  spaceName: string;
  meetingUri: string;
}

export interface ConferenceEnd {
  startTime: string;
  endTime: string;
}

interface GoogleErrorShape {
  code?: string | number;
  response?: {
    status?: number;
    data?: {
      error?: {
        status?: string;
        errors?: Array<{ reason?: string }>;
        details?: Array<{ reason?: string }>;
      };
    };
  };
}

let meetClientPromise: Promise<meet_v2.Meet> | null = null;

async function createMeetClient(): Promise<meet_v2.Meet> {
  const config = getGoogleMeetConfig();

  if (config.authMode === "oauth") {
    const authorizedClient = await authenticate({
      scopes: [...MEET_SCOPES],
      keyfilePath: config.credentialsPath,
    });
    const auth = new google.auth.OAuth2({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
    });
    auth.setCredentials(authorizedClient.credentials);
    return google.meet({ version: "v2", auth });
  }

  const auth = new google.auth.JWT({
    email: config.credentials.client_email,
    key: config.credentials.private_key,
    scopes: [...MEET_SCOPES],
    subject: config.impersonateUser,
  });

  return google.meet({ version: "v2", auth });
}

async function getMeetClient(): Promise<meet_v2.Meet> {
  meetClientPromise ??= createMeetClient();
  try {
    return await meetClientPromise;
  } catch (error) {
    meetClientPromise = null;
    throw error;
  }
}

function getGoogleErrorDetails(error: unknown): {
  status?: number;
  code?: string;
  reason?: string;
} {
  if (typeof error !== "object" || error === null) {
    return {};
  }

  const googleError = error as GoogleErrorShape;
  const code = googleError.code === undefined ? undefined : String(googleError.code);
  const status =
    googleError.response?.status ??
    (typeof googleError.code === "number" ? googleError.code : undefined);
  const apiError = googleError.response?.data?.error;
  const reason =
    apiError?.details?.find((detail) => detail.reason)?.reason ??
    apiError?.errors?.find((detail) => detail.reason)?.reason ??
    apiError?.status;
  return { status, code, reason };
}

function isTransientGoogleError(error: unknown): boolean {
  const { status, code } = getGoogleErrorDetails(error);
  return (
    status === 408 ||
    status === 429 ||
    (status !== undefined && status >= 500) ||
    (code !== undefined && TRANSIENT_NETWORK_CODES.has(code))
  );
}

function mapGoogleMeetError(error: unknown): ExternalServiceError {
  const { status, code, reason } = getGoogleErrorDetails(error);

  if (reason === "SERVICE_DISABLED" || reason === "accessNotConfigured") {
    return new ExternalServiceError(
      "Google Meet REST API is not enabled for the OAuth client's Google Cloud project"
    );
  }

  if (reason === "ACCESS_TOKEN_SCOPE_INSUFFICIENT" || reason === "insufficientPermissions") {
    return new ExternalServiceError(
      "Google Meet authorization is missing the required meetings.space.created scope"
    );
  }

  if (status === 400 || status === 401 || code?.startsWith("ERR_OSSL_")) {
    return new ExternalServiceError(
      "Google Meet authentication failed; verify the OAuth credentials and authorize the requested scopes"
    );
  }

  if (status === 403) {
    const reasonSuffix = reason ? ` (${reason})` : "";
    return new ExternalServiceError(
      `Google Meet request was denied${reasonSuffix}; verify the API is enabled and the signed-in Google Workspace account has Meet access`
    );
  }

  if (status === 429 || (status !== undefined && status >= 500)) {
    return new ExternalServiceError("Google Meet is temporarily unavailable", 503);
  }

  return new ExternalServiceError("Google Meet request failed");
}

function assertSpaceName(spaceName: string): void {
  if (!/^spaces\/[A-Za-z0-9_-]+$/.test(spaceName)) {
    throw new BadRequestError("Invalid Google Meet space name");
  }
}

export async function createMeetSpace(): Promise<MeetSpace> {
  try {
    const meetClient = await getMeetClient();
    const response = await meetClient.spaces.create({
      requestBody: {
        config: {
          accessType: "RESTRICTED",
        },
      },
    });

    const { name, meetingUri } = response.data;
    if (!name || !meetingUri) {
      throw new ExternalServiceError("Google Meet returned an incomplete space");
    }

    return { spaceName: name, meetingUri };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw mapGoogleMeetError(error);
  }
}

/**
 * Returns the newest completed conference in a space. An absent record or a
 * record without endTime means that the meeting has not started or is running.
 */
export async function getConferenceEnd(spaceName: string): Promise<ConferenceEnd | null> {
  assertSpaceName(spaceName);

  try {
    const meetClient = await getMeetClient();
    const response = await meetClient.conferenceRecords.list({
      filter: `space.name = "${spaceName}"`,
      pageSize: 1,
    });
    const conference = response.data.conferenceRecords?.[0];

    if (!conference?.startTime || !conference.endTime) {
      return null;
    }

    return {
      startTime: conference.startTime,
      endTime: conference.endTime,
    };
  } catch (error) {
    if (isTransientGoogleError(error)) {
      const { status, code } = getGoogleErrorDetails(error);
      console.error("Google Meet conference lookup failed temporarily", { status, code });
      return null;
    }

    if (error instanceof AppError) {
      throw error;
    }
    throw mapGoogleMeetError(error);
  }
}
