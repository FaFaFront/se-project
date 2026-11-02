"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  bindJitsiAttendance,
  type AttendanceState,
  type JitsiConferenceApi,
} from "./jitsi-attendance";

type JitsiApi = JitsiConferenceApi & { dispose: () => void; getIFrame: () => HTMLIFrameElement };
type JitsiConstructor = new (
  domain: string,
  options: {
    roomName: string;
    width: string;
    height: string;
    parentNode: HTMLElement;
    userInfo: { displayName: string };
  }
) => JitsiApi;
declare global {
  interface Window {
    JitsiMeetExternalAPI?: JitsiConstructor;
  }
}

export function JitsiMeeting({
  sessionId,
  meetLink,
  endsAt,
  displayName,
  onJoined,
}: {
  sessionId: string;
  meetLink: string;
  endsAt: number;
  displayName: string;
  onJoined: () => void;
}) {
  const parent = useRef<HTMLDivElement>(null);
  const retryAttendance = useRef<(() => void) | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceState>({
    status: "waiting",
    message: "Attendance will be recorded after you enter the meeting.",
  });

  useEffect(() => {
    if (!sdkReady || !parent.current || !window.JitsiMeetExternalAPI) return;
    const link = new URL(meetLink);
    if (link.origin !== "https://meet.jit.si" || !/^\/se-[a-f0-9-]+$/i.test(link.pathname)) {
      setSdkError(true);
      return;
    }
    const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
      roomName: link.pathname.slice(1),
      width: "100%",
      height: "100%",
      parentNode: parent.current,
      userInfo: { displayName },
    });
    api.getIFrame().title = "Jitsi session meeting";
    api.addListener("videoConferenceJoined", onJoined);
    const binding = bindJitsiAttendance(api, {
      endsAt,
      record: async () => {
        await apiClient.post(`/sessions/${encodeURIComponent(sessionId)}/attendance`, {});
      },
      onState: setAttendance,
    });
    retryAttendance.current = binding.retry;
    return () => {
      retryAttendance.current = null;
      binding.dispose();
      api.removeListener("videoConferenceJoined", onJoined);
      api.dispose();
    };
  }, [sdkReady, sessionId, meetLink, endsAt, displayName, onJoined]);

  return (
    <section className="space-y-3" aria-label="Session meeting">
      <Script
        src="https://meet.jit.si/external_api.js"
        strategy="afterInteractive"
        onReady={() => setSdkReady(true)}
        onError={() => setSdkError(true)}
      />
      {sdkError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          The meeting could not load. Reload this page to try again. Your attendance has not been
          recorded.
        </p>
      ) : (
        <>
          {!sdkReady && <p role="status">Loading the meeting…</p>}
          <div
            ref={parent}
            className="h-[70vh] min-h-[420px] overflow-hidden rounded-2xl bg-surface-lavender"
          />
          <div
            role="status"
            aria-live="polite"
            className="flex flex-wrap items-center gap-3 text-sm text-ink/70"
          >
            <p>{attendance.message}</p>
            {attendance.status === "error" && Date.now() < endsAt && (
              <Button variant="outline" onClick={() => retryAttendance.current?.()}>
                Retry attendance
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
