type ClassroomDetailPageProps = { params: Promise<{ classroomId: string }> };

export default async function ClassroomDetailPage({ params }: ClassroomDetailPageProps) {
  const { classroomId } = await params;

  return (
    <main className="px-4 py-10 md:px-16">
      <h1 className="font-outfit text-2xl font-bold text-ink">Classroom</h1>
      <p className="mt-2 text-sm text-ink/70">Classroom ID: {classroomId}</p>
    </main>
  );
}
