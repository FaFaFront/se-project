"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import type { Task } from "@/types/task";

export function TaskList({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (tasks.length === 0) {
    return <p className="text-muted-foreground text-sm">No tasks yet.</p>;
  }

  async function toggleTask(task: Task) {
    setPendingId(task.id);
    try {
      await apiClient.patch(`/tasks/${task.id}`, { done: !task.done });
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  async function deleteTask(task: Task) {
    setPendingId(task.id);
    try {
      await apiClient.delete(`/tasks/${task.id}`);
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center gap-2 rounded-md border border-border p-3">
          <button
            type="button"
            onClick={() => toggleTask(task)}
            disabled={pendingId === task.id}
            aria-label={task.done ? "Mark as not done" : "Mark as done"}
          >
            {task.done ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <span className="flex-1">{task.title}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteTask(task)}
            disabled={pendingId === task.id}
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
