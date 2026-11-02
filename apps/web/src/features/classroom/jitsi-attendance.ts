export type JitsiConferenceApi = {
  addListener: (event: string, handler: () => void) => void;
  removeListener: (event: string, handler: () => void) => void;
};

export type AttendanceState = {
  status: "waiting" | "saving" | "saved" | "error";
  message: string;
};

/** Only the local conference-joined event reports attendance, never page/lobby/remote events. */
export function bindJitsiAttendance(
  api: JitsiConferenceApi,
  options: {
    endsAt: number;
    record: () => Promise<void>;
    onState: (state: AttendanceState) => void;
  }
) {
  let disposed = false;
  let joined = false;
  let saved = false;
  let saving = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const report = async () => {
    if (disposed || saved || saving || !joined) return;
    if (Date.now() >= options.endsAt) {
      options.onState({
        status: "error",
        message:
          "Attendance was not saved before the session ended. This session may be marked missed.",
      });
      return;
    }
    saving = true;
    options.onState({ status: "saving", message: "Saving your attendance…" });
    try {
      await options.record();
      saved = true;
      if (!disposed) options.onState({ status: "saved", message: "Your attendance is saved." });
    } catch {
      if (!disposed) {
        options.onState({
          status: "error",
          message: "Your attendance could not be saved. Retrying while the session is open…",
        });
        timer = setTimeout(() => {
          void report();
        }, 5_000);
      }
    } finally {
      saving = false;
    }
  };
  const onJoin = () => {
    joined = true;
    void report();
  };
  api.addListener("videoConferenceJoined", onJoin);
  return {
    retry: () => {
      clearTimeout(timer);
      void report();
    },
    dispose: () => {
      disposed = true;
      clearTimeout(timer);
      api.removeListener("videoConferenceJoined", onJoin);
    },
  };
}
