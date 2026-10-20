import { ClassroomDetail } from "@/features/classroom/classroom-detail";

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const { classroomId } = await params;

  return (
    <main className="min-h-[60vh] bg-canvas px-4 py-8 sm:py-12 md:px-10">
      <ClassroomDetail classroomId={classroomId} />
    </main>
  );
}
