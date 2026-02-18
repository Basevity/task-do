"use client";

import { useState } from "react";

export interface AddTaskOptions {
  startDate?: number;
  endDate?: number;
}

interface AddTaskProps {
  onAdd: (title: string, options?: AddTaskOptions) => Promise<unknown>;
  placeholder?: string;
}

export function AddTask({ onAdd, placeholder = "What to do?" }: AddTaskProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setSubmitting(true);
    const start = startDate ? new Date(startDate).getTime() : undefined;
    const end = endDate ? new Date(endDate).getTime() : undefined;
    await onAdd(t, start !== undefined || end !== undefined ? { startDate: start, endDate: end } : undefined);
    setTitle("");
    setStartDate("");
    setEndDate("");
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={placeholder}
          className="flex-1 border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-500"
        />
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="border border-amber-600 bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      <div className="flex gap-2 text-xs">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="flex-1 border border-stone-300 bg-white px-2 py-1.5 outline-none focus:border-stone-500"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="flex-1 border border-stone-300 bg-white px-2 py-1.5 outline-none focus:border-stone-500"
        />
      </div>
    </form>
  );
}
