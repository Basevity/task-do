"use client";

import type { Task } from "@/lib/types";

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string, done: boolean) => void;
  onRemove: (id: string) => void;
}

export function TaskList({ tasks, onToggle, onRemove }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="py-8 text-center text-zinc-500 dark:text-zinc-400">
        No tasks yet. Add one below.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white py-2.5 px-3 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <button
            type="button"
            onClick={() => onToggle(task.id, !task.done)}
            className={`h-5 w-5 shrink-0 rounded border-2 transition-colors ${
              task.done
                ? "border-amber-500 bg-amber-500"
                : "border-zinc-400 hover:border-amber-500 dark:border-zinc-500"
            }`}
            aria-label={task.done ? "Mark incomplete" : "Mark done"}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
            <span
              className={`text-sm ${
                task.done
                  ? "text-zinc-500 line-through dark:text-zinc-400"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {task.title}
            </span>
            {(task.module ?? task.priority ?? task.notes) && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {[task.module, task.priority, task.notes].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemove(task.id)}
            className="rounded p-1.5 text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-zinc-700 dark:hover:text-red-400"
            aria-label="Delete task"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
