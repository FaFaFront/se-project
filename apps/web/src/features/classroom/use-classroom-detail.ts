"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiClient } from "@/lib/api-client";
import type { ClassroomDetail } from "@/types/classroom";

export type ClassroomErrorKind = "not-found" | "forbidden" | "general";

export type ClassroomLoadState =
  | { status: "loading" }
  | { status: "ready"; classroom: ClassroomDetail }
  | { status: "error"; kind: ClassroomErrorKind; message: string };

/** Loads `GET /classrooms/:id` for the detail and edit pages; `retry` refetches. */
export function useClassroomDetail(classroomId: string) {
  const [state, setState] = useState<ClassroomLoadState>({ status: "loading" });
  const [requestKey, setRequestKey] = useState(0);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setRequestKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    apiClient.get<ClassroomDetail>(`/classrooms/${encodeURIComponent(classroomId)}`).then(
      (classroom) => {
        if (active) setState({ status: "ready", classroom });
      },
      (error: unknown) => {
        if (!active) return;

        const status = error instanceof ApiError ? error.status : undefined;
        // A malformed ID (400) can never succeed on retry, so treat it like a missing classroom.
        const kind =
          status === 404 || status === 400 ? "not-found" : status === 403 ? "forbidden" : "general";
        const message =
          kind === "not-found"
            ? "The classroom may have been removed or the link may be incorrect."
            : kind === "forbidden"
              ? "Your account is inactive. Reactivate it to view classroom details."
              : "Please check your connection and try again.";

        setState({
          status: "error",
          kind,
          message,
        });
      }
    );

    return () => {
      active = false;
    };
  }, [classroomId, requestKey]);

  return { state, retry };
}
