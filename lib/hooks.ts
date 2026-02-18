"use client";

import { useEffect, useState } from "react";
import {
  subscribeSprints,
  subscribeTasks,
  createSprint,
  createTask,
  toggleTask,
  deleteTask,
  deleteSprintAndMoveTasksToBacklog,
  updateSprint,
  updateTaskStatus,
  updateTaskAssignment,
  updateTask,
  subscribeUsers,
  ensureUserDoc,
} from "./db";
import { subscribeAuth } from "./firebase";
import type { Task, Sprint, AppUser } from "./types";
import type { User } from "firebase/auth";

export function useSprints() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  useEffect(() => {
    const unsub = subscribeSprints(setSprints);
    return () => {
      if (unsub) unsub();
    };
  }, []);
  return {
    sprints,
    addSprint: createSprint,
    removeSprint: deleteSprintAndMoveTasksToBacklog,
    updateSprint,
  };
}

export function useTasks(sprintId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    const unsub = subscribeTasks(sprintId, setTasks);
    return () => {
      if (unsub) unsub();
    };
  }, [sprintId]);
  return {
    tasks,
    addTask: (title: string, options?: { startDate?: number; endDate?: number }) =>
      createTask(title, sprintId, options),
    toggleTask,
    removeTask: deleteTask,
    updateTaskStatus,
    updateTaskAssignment,
    updateTask,
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeAuth((u) => {
      setUser(u);
      setLoading(false);
      if (u?.email) {
        ensureUserDoc(u.uid, { email: u.email, displayName: u.displayName ?? u.email ?? "" });
      }
    });
    return () => {
      unsub?.();
    };
  }, []);
  return { user, loading };
}

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  useEffect(() => {
    const unsub = subscribeUsers(setUsers);
    return () => {
      if (unsub) unsub();
    };
  }, []);
  return { users };
}
