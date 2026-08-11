import { apiClient } from "@/lib/api-client";
import { TaskList } from "@/components/TaskList";
import { AddTaskForm } from "@/components/AddTaskForm";
import type { Task } from "@/types/task";

export default async function Home() {
  let tasks: Task[] = [];
  let error: string | null = null;

  try {
    tasks = await apiClient.get<Task[]>("/tasks");
  } catch {
    error = "Could not reach the API. Is `yarn api:dev` running?";
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
      </div>
      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : (
        <>
          <AddTaskForm />
          <TaskList tasks={tasks} />
        </>
      )}
    </main>
  );
}
