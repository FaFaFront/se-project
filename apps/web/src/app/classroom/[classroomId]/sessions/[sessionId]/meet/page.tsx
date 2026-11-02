import { SessionMeeting } from "@/features/classroom/session-meeting";

export default async function SessionMeetingPage({
  params,
}: {
  params: Promise<{ classroomId: string; sessionId: string }>;
}) {
  const { classroomId, sessionId } = await params;
  return (
    <main className="min-h-[60vh] bg-canvas px-4 py-8 md:px-10">
      <SessionMeeting
        key={`${classroomId}:${sessionId}`}
        classroomId={classroomId}
        sessionId={sessionId}
      />
    </main>
  );
}
