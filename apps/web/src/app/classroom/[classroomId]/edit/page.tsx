import { ClassroomEditForm } from "@/features/classroom/classroom-edit-form";

export default async function EditClassroomPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const { classroomId } = await params;

  return (
    <main className="min-h-[60vh] bg-canvas px-4 py-8 sm:py-12 md:px-10">
      <ClassroomEditForm classroomId={classroomId} />
    </main>
  );
}
