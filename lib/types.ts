export interface Sprint {
  id: string;
  name: string;
  createdAt: number;
  startDate?: number;
  endDate?: number;
}

export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

export interface Task {
  id: string;
  title: string;
  done: boolean;
  status: TaskStatus;
  sprintId: string | null;
  createdAt: number;
  module?: string;
  role?: string;
  priority?: string;
  notes?: string;
  startDate?: number;
  endDate?: number;
  assignedTo?: string | null;
  description?: string;
}

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: number;
}
