"use client";

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  type Unsubscribe,
  type DocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Task, Sprint, TaskStatus, AppUser } from "./types";

const TASKS = "tasks";
const SPRINTS = "sprints";
const USERS = "users";

// ——— Sprints (ordered lowest to high / oldest first) ———
export function subscribeSprints(cb: (sprints: Sprint[]) => void): Unsubscribe | void {
  if (!db) return cb([]);
  const q = query(
    collection(db, SPRINTS),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name ?? "",
        createdAt: data.createdAt?.toMillis?.() ?? 0,
        startDate: data.startDate != null ? (typeof data.startDate === "number" ? data.startDate : data.startDate?.toMillis?.()) : undefined,
        endDate: data.endDate != null ? (typeof data.endDate === "number" ? data.endDate : data.endDate?.toMillis?.()) : undefined,
      } as Sprint;
    });
    cb(list);
  });
}

export interface CreateSprintOptions {
  startDate?: number;
  endDate?: number;
}

export async function createSprint(name: string, options?: CreateSprintOptions): Promise<string | null> {
  if (!db) return null;
  const ref = await addDoc(collection(db, SPRINTS), {
    name,
    createdAt: serverTimestamp(),
    ...(options?.startDate != null && { startDate: options.startDate }),
    ...(options?.endDate != null && { endDate: options.endDate }),
  });
  return ref.id;
}

export async function updateSprint(
  sprintId: string,
  data: { name?: string; startDate?: number | null; endDate?: number | null }
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, SPRINTS, sprintId), data as Record<string, unknown>);
}

export async function deleteSprint(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, SPRINTS, id));
}

/** Move all tasks in a sprint to Backlog (sprintId = null), then delete the sprint. */
export async function deleteSprintAndMoveTasksToBacklog(sprintId: string): Promise<void> {
  if (!db) return;
  const q = query(collection(db, TASKS), where("sprintId", "==", sprintId));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { sprintId: null })));
  await deleteDoc(doc(db, SPRINTS, sprintId));
}

// ——— Tasks ———
export function subscribeTasks(
  sprintId: string | null,
  cb: (tasks: Task[]) => void
): Unsubscribe | void {
  if (!db) return cb([]);
  const col = collection(db, TASKS);
  const q = sprintId
    ? query(
        col,
        where("sprintId", "==", sprintId),
        orderBy("createdAt", "desc")
      )
    : query(col, where("sprintId", "==", null), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => mapDocToTask(d));
    cb(list);
  });
}

function mapDocToTask(d: DocumentSnapshot<DocumentData>): Task {
  const data = d.data();
  if (!data) {
    return { id: d.id, title: "", done: false, status: "backlog", sprintId: null, createdAt: 0 };
  }
  const status: TaskStatus =
    data.status && ["backlog", "todo", "in_progress", "in_review", "done"].includes(data.status)
      ? (data.status as TaskStatus)
      : data.done
        ? "done"
        : "backlog";
  const toMs = (v: unknown): number | undefined => {
    if (v == null) return undefined;
    if (typeof v === "number") return v;
    return (v as { toMillis?: () => number })?.toMillis?.();
  };
  return {
    id: d.id,
    title: data.title ?? "",
    done: status === "done",
    status,
    sprintId: data.sprintId ?? null,
    createdAt: data.createdAt?.toMillis?.() ?? 0,
    module: data.module ?? undefined,
    role: data.role ?? undefined,
    priority: data.priority ?? undefined,
    notes: data.notes ?? undefined,
    startDate: toMs(data.startDate),
    endDate: toMs(data.endDate),
    assignedTo: data.assignedTo ?? undefined,
    description: data.description ?? undefined,
  };
}

export function subscribeAllTasks(cb: (tasks: Task[]) => void): Unsubscribe | void {
  if (!db) return cb([]);
  const q = query(
    collection(db, TASKS),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => mapDocToTask(d));
    cb(list);
  });
}

export interface CreateTaskOptions {
  module?: string;
  role?: string;
  priority?: string;
  notes?: string;
  startDate?: number;
  endDate?: number;
  assignedTo?: string | null;
  description?: string;
}

export async function createTask(
  title: string,
  sprintId: string | null,
  options?: CreateTaskOptions
): Promise<string | null> {
  if (!db) return null;
  const ref = await addDoc(collection(db, TASKS), {
    title,
    done: false,
    status: "backlog",
    sprintId,
    createdAt: serverTimestamp(),
    ...(options?.module !== undefined && { module: options.module }),
    ...(options?.role !== undefined && { role: options.role }),
    ...(options?.priority !== undefined && { priority: options.priority }),
    ...(options?.notes !== undefined && { notes: options.notes }),
    ...(options?.startDate != null && { startDate: options.startDate }),
    ...(options?.endDate != null && { endDate: options.endDate }),
    ...(options?.assignedTo !== undefined && { assignedTo: options.assignedTo }),
    ...(options?.description !== undefined && { description: options.description }),
  });
  return ref.id;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  startDate?: number | null;
  endDate?: number | null;
  assignedTo?: string | null;
}

export async function updateTask(taskId: string, data: UpdateTaskData): Promise<void> {
  if (!db) return;
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.startDate !== undefined) payload.startDate = data.startDate ?? null;
  if (data.endDate !== undefined) payload.endDate = data.endDate ?? null;
  if (data.assignedTo !== undefined) payload.assignedTo = data.assignedTo;
  if (Object.keys(payload).length === 0) return;
  await updateDoc(doc(db, TASKS, taskId), payload);
}

export async function toggleTask(id: string, done: boolean): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, TASKS, id), { done });
}

export async function deleteTask(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, TASKS, id));
}

export async function setTaskSprint(taskId: string, sprintId: string | null): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, TASKS, taskId), { sprintId });
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, TASKS, taskId), { status, done: status === "done" });
}

export async function updateTaskAssignment(taskId: string, assignedTo: string | null): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, TASKS, taskId), { assignedTo });
}

// ——— Users ———
export function subscribeUsers(cb: (users: AppUser[]) => void): Unsubscribe | void {
  if (!db) return cb([]);
  const q = query(collection(db, USERS), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        email: data.email ?? "",
        displayName: data.displayName ?? "",
        createdAt: data.createdAt?.toMillis?.() ?? 0,
      } as AppUser;
    });
    cb(list);
  });
}

export async function ensureUserDoc(uid: string, data: { email: string; displayName: string }): Promise<void> {
  if (!db) return;
  const userRef = doc(db, USERS, uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, { ...data, createdAt: serverTimestamp() });
  }
}

export async function updateUserProfile(uid: string, data: { displayName?: string }): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, USERS, uid), data as Record<string, unknown>);
}
