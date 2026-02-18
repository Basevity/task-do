"use client";

import { useState, useRef } from "react";
import { parseImportCSV, runImport, type ImportResult } from "@/lib/import";
import type { Sprint } from "@/lib/types";

interface ImportPanelProps {
  sprints: Sprint[];
  onClose: () => void;
  onImported?: () => void;
}

const SAMPLE_CSV = `Sprint,Module,Task,Role,Priority,Notes
Sprint 1,Project Setup,Initialize monorepo structure,SYSTEM,HIGH,Next.js + Hono API
Sprint 1,Project Setup,Setup Supabase project,SYSTEM,HIGH,Enable RLS default deny
Sprint 2,Authentication,Email/password auth,SYSTEM,HIGH,Supabase auth`;

export function ImportPanel({ sprints, onClose, onImported }: ImportPanelProps) {
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsed = csvText.trim() ? parseImportCSV(csvText) : null;

  async function handleImport() {
    if (!csvText.trim()) return;
    setImporting(true);
    setResult(null);
    try {
      const res = await runImport(csvText, sprints);
      setResult(res);
      if (res.tasksCreated > 0 || res.sprintsCreated > 0) onImported?.();
    } finally {
      setImporting(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col border border-stone-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-stone-900">Import tasks</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <p className="mb-2 text-sm text-stone-500">
            Paste or upload CSV with header:{" "}
            <code className="bg-stone-200 px-1">Sprint,Module,Task,Role,Priority,Notes</code>
          </p>

          <div className="mb-3 flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv,text/plain"
              onChange={handleFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Choose file
            </button>
            <button
              type="button"
              onClick={() => setCsvText(SAMPLE_CSV)}
              className="border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Use sample
            </button>
          </div>

          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Paste CSV here..."
            className="mb-3 min-h-[200px] w-full resize-y border border-stone-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-stone-500"
            spellCheck={false}
          />

          {parsed && parsed.rows.length > 0 && (
            <p className="mb-3 text-sm text-stone-600">
              Preview: {parsed.rows.length} task(s), {parsed.sprintNames.length} sprint(s):{" "}
              {parsed.sprintNames.join(", ") || "(none)"}
              {parsed.errors.length > 0 && (
                <span className="mt-1 block text-amber-600">
                  Warnings: {parsed.errors.join(" ")}
                </span>
              )}
            </p>
          )}

          {result && (
            <div
              className={`mb-3 border p-3 text-sm ${
                result.errors.length && !result.tasksCreated && !result.sprintsCreated
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-green-200 bg-green-50 text-green-900"
              }`}
            >
              {result.sprintsCreated > 0 && (
                <p>Created {result.sprintsCreated} sprint(s).</p>
              )}
              {result.tasksCreated > 0 && (
                <p>Created {result.tasksCreated} task(s).</p>
              )}
              {result.errors.length > 0 && (
                <p className="mt-1">Errors: {result.errors.join(" ")}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-stone-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || !csvText.trim()}
            className="border border-amber-600 bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {importing ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
