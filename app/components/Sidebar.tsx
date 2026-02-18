"use client";

import { useState } from "react";
import type { Sprint } from "@/lib/types";
import type { CreateSprintOptions } from "@/lib/db";
import { formatDateRange } from "@/lib/format";
import { ConfirmModal } from "./ConfirmModal";

function toDateInputValue(ts: number | undefined): string {
  if (ts == null) return "";
  const d = new Date(ts);
  return d.toISOString().slice(0, 10);
}

interface SidebarProps {
  sprints: Sprint[];
  currentSprintId: string | null;
  onSelect: (sprintId: string | null) => void;
  onAddSprint: (name: string, options?: CreateSprintOptions) => Promise<string | null>;
  onRemoveSprint: (id: string) => void;
  onUpdateSprint: (sprintId: string, data: { startDate?: number | null; endDate?: number | null }) => Promise<void>;
}

export function Sidebar({
  sprints,
  currentSprintId,
  onSelect,
  onAddSprint,
  onRemoveSprint,
  onUpdateSprint,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [newName, setNewName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [sprintToDelete, setSprintToDelete] = useState<Sprint | null>(null);
  const [editingSprintId, setEditingSprintId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [savingSprint, setSavingSprint] = useState(false);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    const start = startDate ? new Date(startDate).getTime() : undefined;
    const end = endDate ? new Date(endDate).getTime() : undefined;
    await onAddSprint(name, start !== undefined || end !== undefined ? { startDate: start, endDate: end } : undefined);
    setNewName("");
    setStartDate("");
    setEndDate("");
    setAdding(false);
  }

  function handleConfirmDelete() {
    if (sprintToDelete) {
      onRemoveSprint(sprintToDelete.id);
      setSprintToDelete(null);
    }
  }

  function openEditSprint(s: Sprint) {
    setEditingSprintId(s.id);
    setEditStart(toDateInputValue(s.startDate));
    setEditEnd(toDateInputValue(s.endDate));
  }

  async function saveSprintDates() {
    if (!editingSprintId) return;
    setSavingSprint(true);
    await onUpdateSprint(editingSprintId, {
      startDate: editStart ? new Date(editStart).getTime() : null,
      endDate: editEnd ? new Date(editEnd).getTime() : null,
    });
    setSavingSprint(false);
    setEditingSprintId(null);
  }

  return (
    <>
      <aside
        className={`flex h-screen shrink-0 flex-col overflow-hidden border-r border-stone-200 bg-white transition-[width] ${
          collapsed ? "w-14" : "w-72"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-stone-200 px-3 py-3">
          {!collapsed && (
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Sprints
            </h2>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="shrink-0 p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {!collapsed && (
          <>
            <nav className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto">
              <button
                type="button"
                onClick={() => onSelect(null)}
                className={`border-b border-stone-100 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  currentSprintId === null
                    ? "bg-amber-50 text-amber-800 border-l-2 border-l-amber-500"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
              >
                Backlog
              </button>
              {sprints.map((s) => (
                <div
                  key={s.id}
                  className={`border-b border-stone-100 ${
                    currentSprintId === s.id ? "bg-amber-50 border-l-2 border-l-amber-500" : ""
                  }`}
                >
                  <div className="group flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onSelect(s.id)}
                      className={`min-w-0 flex-1 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        currentSprintId === s.id ? "text-amber-800" : "text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <span className="block truncate">{s.name}</span>
                      {(s.startDate != null || s.endDate != null) && (
                        <span className="mt-0.5 block truncate text-xs font-normal text-stone-500">
                          {formatDateRange(s.startDate, s.endDate)}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditSprint(s);
                      }}
                      className="shrink-0 p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                      title="Edit sprint dates"
                      aria-label="Edit sprint dates"
                    >
                      📅
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSprintToDelete(s);
                      }}
                      className="shrink-0 p-2 text-stone-400 hover:bg-stone-100 hover:text-red-600"
                      title="Delete sprint"
                      aria-label="Delete sprint"
                    >
                      ×
                    </button>
                  </div>
                  {editingSprintId === s.id && (
                    <div className="border-t border-stone-100 bg-stone-50 px-3 py-2">
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={editStart}
                          onChange={(e) => setEditStart(e.target.value)}
                          className="flex-1 border border-stone-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-stone-500"
                        />
                        <input
                          type="date"
                          value={editEnd}
                          onChange={(e) => setEditEnd(e.target.value)}
                          className="flex-1 border border-stone-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-stone-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={saveSprintDates}
                        disabled={savingSprint}
                        className="mt-2 w-full border border-amber-600 bg-amber-500 px-2 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                      >
                        {savingSprint ? "Saving…" : "Save"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <div className="border-t border-stone-200 p-3">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder="New sprint"
                    className="flex-1 border border-stone-300 bg-white px-2 py-2 text-sm outline-none focus:border-stone-500"
                  />
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={adding || !newName.trim()}
                    className="shrink-0 border border-amber-600 bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
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
              </div>
            </div>
          </>
        )}

        {collapsed && (
          <div className="flex flex-1 flex-col items-center gap-1 pt-2">
            <button
              type="button"
              onClick={() => onSelect(null)}
              className={`p-2 text-xs font-medium ${
                currentSprintId === null ? "text-amber-600" : "text-stone-500 hover:text-stone-700"
              }`}
              title="Backlog"
            >
              B
            </button>
            {sprints.slice(0, 8).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                className={`truncate p-2 text-xs font-medium max-w-full ${
                  currentSprintId === s.id ? "text-amber-600" : "text-stone-500 hover:text-stone-700"
                }`}
                title={s.name}
              >
                {s.name.charAt(0)}
              </button>
            ))}
          </div>
        )}
      </aside>

      {sprintToDelete && (
        <ConfirmModal
          title="Delete sprint?"
          message={`Sprint "${sprintToDelete.name}" will be deleted. Tasks in this sprint will move to Backlog. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setSprintToDelete(null)}
        />
      )}
    </>
  );
}
