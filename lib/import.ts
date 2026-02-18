"use client";

import { createSprint, createTask, type CreateTaskOptions } from "./db";
import type { Sprint } from "./types";

/** Expected CSV header: Sprint,Module,Task,Role,Priority,Notes */
const EXPECTED_HEADER = "Sprint,Module,Task,Role,Priority,Notes";

export interface ImportRow {
  sprint: string;
  module: string;
  task: string;
  role: string;
  priority: string;
  notes: string;
}

export interface ParseResult {
  rows: ImportRow[];
  sprintNames: string[];
  errors: string[];
}

/**
 * Parse CSV text with header "Sprint,Module,Task,Role,Priority,Notes".
 * Supports quoted fields (e.g. "foo, bar").
 */
export function parseImportCSV(csvText: string): ParseResult {
  const errors: string[] = [];
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return { rows: [], sprintNames: [], errors: ["Empty input."] };
  }

  const header = lines[0].trim();
  if (header.toLowerCase() !== EXPECTED_HEADER.toLowerCase()) {
    errors.push(`Expected header: ${EXPECTED_HEADER}. Got: ${header}`);
  }

  const rows: ImportRow[] = [];
  const sprintNameSet = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parsed = parseCSVLine(line);
    if (parsed.length >= 6) {
      const [sprint, mod, task, role, priority, notes] = parsed;
      rows.push({
        sprint: sprint.trim(),
        module: mod.trim(),
        task: task.trim(),
        role: role.trim(),
        priority: priority.trim(),
        notes: notes.trim(),
      });
      if (sprint.trim()) sprintNameSet.add(sprint.trim());
    } else if (parsed.length > 0) {
      errors.push(`Line ${i + 1}: expected 6 columns, got ${parsed.length}.`);
    }
  }

  const sprintNames = Array.from(sprintNameSet);
  return { rows, sprintNames, errors };
}

/** Parse a single CSV line; handles double-quoted fields. */
function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let end = i + 1;
      const parts: string[] = [];
      while (end < line.length) {
        const next = line.indexOf('"', end);
        if (next === -1) {
          parts.push(line.slice(end));
          end = line.length;
          break;
        }
        if (line[next + 1] === '"') {
          parts.push(line.slice(end, next + 1));
          end = next + 2;
        } else {
          parts.push(line.slice(end, next));
          end = next + 1;
          break;
        }
      }
      out.push(parts.join('"'));
      i = end;
      if (i < line.length && line[i] === ",") i++;
    } else {
      const comma = line.indexOf(",", i);
      if (comma === -1) {
        out.push(line.slice(i));
        break;
      }
      out.push(line.slice(i, comma));
      i = comma + 1;
    }
  }
  return out;
}

export interface ImportResult {
  sprintsCreated: number;
  tasksCreated: number;
  errors: string[];
}

/**
 * Create sprints (by unique name) and tasks from parsed import data.
 * Uses existing sprints when the name already exists.
 */
export async function runImport(
  csvText: string,
  existingSprints: Sprint[]
): Promise<ImportResult> {
  const parsed = parseImportCSV(csvText);
  if (parsed.rows.length === 0 && parsed.errors.length === 0) {
    return { sprintsCreated: 0, tasksCreated: 0, errors: ["No data rows to import."] };
  }
  if (parsed.rows.length === 0) {
    return { sprintsCreated: 0, tasksCreated: 0, errors: parsed.errors };
  }

  const nameToId = new Map<string, string>();
  for (const s of existingSprints) nameToId.set(s.name, s.id);

  let sprintsCreated = 0;
  for (const name of parsed.sprintNames) {
    if (!nameToId.has(name)) {
      const id = await createSprint(name);
      if (id) {
        nameToId.set(name, id);
        sprintsCreated++;
      }
    }
  }

  let tasksCreated = 0;
  for (const row of parsed.rows) {
    const sprintId = row.sprint ? (nameToId.get(row.sprint) ?? null) : null;
    const options: CreateTaskOptions = {};
    if (row.module) options.module = row.module;
    if (row.role) options.role = row.role;
    if (row.priority) options.priority = row.priority;
    if (row.notes) options.notes = row.notes;
    const id = await createTask(row.task, sprintId, options);
    if (id) tasksCreated++;
  }

  return {
    sprintsCreated,
    tasksCreated,
    errors: parsed.errors,
  };
}
