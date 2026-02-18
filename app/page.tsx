"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { KanbanBoard } from "./components/KanbanBoard";
import { AddTask } from "./components/AddTask";
import { ImportPanel } from "./components/ImportPanel";
import { LoginForm } from "./components/LoginForm";
import { ProfileModal } from "./components/ProfileModal";
import { TaskDetailsModal } from "./components/TaskDetailsModal";
import { Avatar } from "./components/Avatar";
import { useSprints, useTasks, useAuth, useUsers } from "@/lib/hooks";
import { isFirebaseReady, signOut } from "@/lib/firebase";
import { formatDateRange } from "@/lib/format";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const { sprints, addSprint, removeSprint, updateSprint } = useSprints();
  const { tasks, addTask, removeTask, updateTaskStatus, updateTaskAssignment, updateTask } = useTasks(sprintId);
  const { users } = useUsers();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const firebaseReady = mounted && isFirebaseReady();

  if (firebaseReady && !authLoading && !user) {
    return <LoginForm onSuccess={() => {}} />;
  }

  const currentLabel = sprintId
    ? sprints.find((s) => s.id === sprintId)?.name ?? "Sprint"
    : "Backlog";

  const currentSprint = sprintId ? sprints.find((s) => s.id === sprintId) : null;
  const sprintTimeFrame = currentSprint
    ? formatDateRange(currentSprint.startDate, currentSprint.endDate)
    : "";

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100">
      {firebaseReady && user && (
        <Sidebar
          sprints={sprints}
          currentSprintId={sprintId}
          onSelect={setSprintId}
          onAddSprint={addSprint}
          onRemoveSprint={removeSprint}
          onUpdateSprint={updateSprint}
        />
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-stone-200 bg-white">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-xl font-semibold text-stone-900">Task Do</h1>
              <p className="text-xs text-stone-500">Simple tasks & sprints</p>
            </div>
            <div className="flex items-center gap-2">
              {firebaseReady && user && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowImport(true)}
                    className="border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    Import
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setProfileOpen((o) => !o)}
                      className="flex items-center gap-2 border border-stone-200 bg-white px-2 py-1.5 hover:bg-stone-50"
                      aria-expanded={profileOpen}
                    >
                      <Avatar
                        name={user.displayName || user.email || ""}
                        className="h-8 w-8"
                      />
                      <span className="text-sm text-stone-700">
                        {user.displayName || user.email}
                      </span>
                    </button>
                    {profileOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          aria-hidden
                          onClick={() => setProfileOpen(false)}
                        />
                        <div className="absolute right-0 top-full z-20 mt-1 w-48 border border-stone-200 bg-white py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowProfile(true);
                              setProfileOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
                          >
                            Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              signOut();
                              setProfileOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
                          >
                            Sign out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {firebaseReady && showImport && (
          <ImportPanel sprints={sprints} onClose={() => setShowImport(false)} />
        )}

        {user && showProfile && (
          <ProfileModal user={user} onClose={() => setShowProfile(false)} />
        )}

        {selectedTask && (
          <TaskDetailsModal
            task={selectedTask}
            users={users}
            onClose={() => setSelectedTaskId(null)}
            onUpdate={updateTask}
          />
        )}

        <main className="min-h-0 flex-1 overflow-y-auto p-4">
          {!mounted ? (
            <p className="text-center text-stone-500">Loading…</p>
          ) : !firebaseReady ? (
            <div className="border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-900">
              <p className="font-medium">Firebase not configured</p>
              <p className="mt-2 text-amber-800">
                Add your Firebase config to <code className="bg-amber-200/50 px-1">.env.local</code> (see README).
              </p>
            </div>
          ) : !user ? (
            <p className="text-center text-stone-500">Signing in…</p>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                    {currentLabel}
                  </h2>
                  {sprintTimeFrame && (
                    <p className="mt-0.5 text-xs text-stone-500">{sprintTimeFrame}</p>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <AddTask
                  onAdd={addTask}
                  placeholder={`Add task to ${currentLabel}...`}
                />
              </div>
              <KanbanBoard
                tasks={tasks}
                users={users}
                onStatusChange={updateTaskStatus}
                onRemove={removeTask}
                onAssign={updateTaskAssignment}
                onOpenDetails={(task) => setSelectedTaskId(task.id)}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
