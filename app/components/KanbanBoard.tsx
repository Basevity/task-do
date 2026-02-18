"use client";

import { useState, useRef, useCallback } from "react";
import type { Task, TaskStatus, AppUser } from "@/lib/types";
import { TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/types";
import { formatDateRange } from "@/lib/format";
import { Avatar } from "./Avatar";

interface KanbanBoardProps {
  tasks: Task[];
  users: AppUser[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onRemove: (taskId: string) => void;
  onAssign: (taskId: string, userId: string | null) => void;
  onOpenDetails: (task: Task) => void;
}

export function KanbanBoard({ tasks, users, onStatusChange, onRemove, onAssign, onOpenDetails }: KanbanBoardProps) {
  const tasksByStatus = groupTasksByStatus(tasks);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollDragRef = useRef({ startX: 0, startScrollLeft: 0 });

  const handleScrollDragMove = useCallback((e: MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { startX, startScrollLeft } = scrollDragRef.current;
    el.scrollLeft = startScrollLeft + (startX - e.clientX);
  }, []);

  const handleScrollDragEnd = useCallback(() => {
    document.removeEventListener("mousemove", handleScrollDragMove);
    document.removeEventListener("mouseup", handleScrollDragEnd);
    document.body.classList.remove("cursor-grabbing");
    document.body.style.userSelect = "";
  }, [handleScrollDragMove]);

  function handleColumnHeaderMouseDown(e: React.MouseEvent) {
    if (e.button !== 0 || !scrollContainerRef.current) return;
    e.preventDefault();
    scrollDragRef.current = {
      startX: e.clientX,
      startScrollLeft: scrollContainerRef.current.scrollLeft,
    };
    document.body.classList.add("cursor-grabbing");
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleScrollDragMove);
    document.addEventListener("mouseup", handleScrollDragEnd);
  }

  function handleDragStart(e: React.DragEvent, taskId: string, status: TaskStatus) {
    e.dataTransfer.setData("application/task-id", taskId);
    e.dataTransfer.setData("application/task-status", status);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, toStatus: TaskStatus) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("application/task-id");
    const fromStatus = e.dataTransfer.getData("application/task-status") as TaskStatus;
    if (taskId && toStatus !== fromStatus) {
      onStatusChange(taskId, toStatus);
    }
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
    >
      {TASK_STATUSES.map((status) => (
        <div
          key={status}
          className="flex w-64 shrink-0 flex-col border border-stone-200 bg-white"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
        >
          <div
            role="button"
            tabIndex={0}
            onMouseDown={handleColumnHeaderMouseDown}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") e.preventDefault();
            }}
            className="cursor-grab select-none border-b border-stone-200 px-3 py-2.5 active:cursor-grabbing"
            title="Drag to scroll board horizontally"
          >
            <h3 className="text-sm font-semibold text-stone-700">
              {TASK_STATUS_LABELS[status]}
            </h3>
            <p className="text-xs text-stone-500">
              {tasksByStatus[status].length} task(s)
            </p>
          </div>
          <div className="flex min-h-[120px] flex-1 flex-col gap-2 p-2">
            {tasksByStatus[status].map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                users={users}
                onDragStart={(e) => handleDragStart(e, task.id, task.status)}
                onRemove={() => onRemove(task.id)}
                onAssign={(userId) => onAssign(task.id, userId)}
                onOpenDetails={() => onOpenDetails(task)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const map: Record<TaskStatus, Task[]> = {
    backlog: [],
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  };
  for (const task of tasks) {
    const status = task.status ?? "backlog";
    if (status in map) map[status].push(task);
    else map.backlog.push(task);
  }
  return map;
}

interface KanbanCardProps {
  task: Task;
  users: AppUser[];
  onDragStart: (e: React.DragEvent) => void;
  onRemove: () => void;
  onAssign: (userId: string | null) => void;
  onOpenDetails: () => void;
}

function KanbanCard({ task, users, onDragStart, onRemove, onAssign, onOpenDetails }: KanbanCardProps) {
  const [showAssign, setShowAssign] = useState(false);
  const movedRef = useRef(false);
  const assignee = task.assignedTo ? users.find((u) => u.id === task.assignedTo) : null;
  const taskTimeFrame = formatDateRange(task.startDate, task.endDate);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseDown={() => { movedRef.current = false; }}
      onMouseMove={() => { movedRef.current = true; }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        if (!movedRef.current) onOpenDetails();
      }}
      className="cursor-grab border border-stone-200 bg-white py-2.5 px-3 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium ${
              task.status === "done"
                ? "text-stone-500 line-through"
                : "text-stone-900"
            }`}
          >
            {task.title}
          </p>
          {(task.module ?? task.priority ?? task.notes) && (
            <p className="mt-0.5 truncate text-xs text-stone-500">
              {[task.module, task.priority, task.notes].filter(Boolean).join(" · ")}
            </p>
          )}
          {taskTimeFrame && (
            <p className="mt-0.5 text-xs text-stone-500">{taskTimeFrame}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAssign((s) => !s);
              }}
              className="flex items-center"
              title="Assign"
            >
              {assignee ? (
                <Avatar name={assignee.displayName} className="h-6 w-6 text-xs" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center border border-stone-200 bg-stone-50 text-xs text-stone-400">
                  +
                </span>
              )}
            </button>
            {showAssign && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden
                  onClick={() => setShowAssign(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-52 border border-stone-200 bg-white py-1">
                  <p className="px-3 py-1.5 text-xs font-medium text-stone-500">Assign to</p>
                  <button
                    type="button"
                    onClick={() => {
                      onAssign(null);
                      setShowAssign(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-stone-600 hover:bg-stone-50"
                  >
                    Unassigned
                  </button>
                  {users.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-stone-500">No other users yet. They’ll appear here after signing in.</p>
                  ) : users.length === 1 ? (
                    <>
                      <p className="border-b border-stone-100 px-3 py-2 text-xs text-amber-700 bg-amber-50">
                        To see other team members: have them sign in once, then deploy Firestore rules (see README).
                      </p>
                      {users.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            onAssign(u.id);
                            setShowAssign(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-stone-700 hover:bg-stone-50"
                        >
                          <Avatar name={u.displayName} className="h-5 w-5 shrink-0 text-xs" />
                          <span className="truncate">{u.displayName || u.email}</span>
                        </button>
                      ))}
                    </>
                  ) : (
                    users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          onAssign(u.id);
                          setShowAssign(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-stone-700 hover:bg-stone-50"
                      >
                        <Avatar name={u.displayName} className="h-5 w-5 shrink-0 text-xs" />
                        <span className="truncate">{u.displayName || u.email}</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete task"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
