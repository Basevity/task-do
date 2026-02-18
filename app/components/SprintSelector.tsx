"use client";

import { useState } from "react";
import type { Sprint } from "@/lib/types";

interface SprintSelectorProps {
  sprints: Sprint[];
  currentSprintId: string | null;
  onSelect: (sprintId: string | null) => void;
  onAddSprint: (name: string) => Promise<string | null>;
  onRemoveSprint: (id: string) => void;
}

export function SprintSelector({
  sprints,
  currentSprintId,
  onSelect,
  onAddSprint,
  onRemoveSprint,
}: SprintSelectorProps) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    await onAddSprint(name);
    setNewName("");
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            currentSprintId === null
              ? "bg-amber-500 text-white"
              : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          }`}
        >
          Backlog
        </button>
        {sprints.map((s) => (
          <div key={s.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                currentSprintId === s.id
                  ? "bg-amber-500 text-white"
                  : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
              }`}
            >
              {s.name}
            </button>
            <button
              type="button"
              onClick={() => onRemoveSprint(s.id)}
              className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-300 hover:text-red-600 dark:hover:bg-zinc-600 dark:hover:text-red-400"
              title="Remove sprint"
              aria-label="Remove sprint"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="New sprint name..."
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:border-amber-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
        >
          Add sprint
        </button>
      </div>
    </div>
  );
}
