"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import type { Task } from "@/types/task";

export function AddTaskForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      await apiClient.post<Task>("/tasks", { title: title.trim() });
      setTitle("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task title"
        className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm"
      />
      <Button type="submit" disabled={submitting || !title.trim()}>
        New task
      </Button>
    </form>
  );
}
