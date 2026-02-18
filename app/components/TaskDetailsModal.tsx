"use client";

import { useState, useEffect, useCallback } from "react";
import type { Task, AppUser } from "@/lib/types";
import { Avatar } from "./Avatar";
import type { UpdateTaskData } from "@/lib/db";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Extension } from "@tiptap/core";

import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
} from "react-icons/md";

/* ---------------- FONT SIZE EXTENSION ---------------- */

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: Record<string, any>) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize: null }).run(),
    } as any;
  },
});

/* ---------------- TYPES ---------------- */

interface TaskDetailsModalProps {
  task: Task;
  users: AppUser[];
  onClose: () => void;
  onUpdate: (taskId: string, data: UpdateTaskData) => Promise<void>;
}

function toDateInputValue(ts: number | undefined): string {
  if (ts == null) return "";
  return new Date(ts).toISOString().slice(0, 10);
}

/* ---------------- TOOLBAR BUTTON ---------------- */

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`rounded p-1 text-lg transition-colors hover:bg-stone-200 ${
        active ? "bg-stone-300 text-black" : "text-stone-600"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------------- COMPONENT ---------------- */

export function TaskDetailsModal({
  task,
  users,
  onClose,
  onUpdate,
}: TaskDetailsModalProps) {
  const [title, setTitle] = useState(task.title);
  const [startDate, setStartDate] = useState(toDateInputValue(task.startDate));
  const [endDate, setEndDate] = useState(toDateInputValue(task.endDate));
  const [assignedTo, setAssignedTo] = useState<string | null>(task.assignedTo ?? null);
  const [descriptionEditMode, setDescriptionEditMode] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  // This is the key fix for toolbar highlight — force re-render on every editor transaction
  const [, forceUpdate] = useState(0);

  /* ---------------- EDITOR ---------------- */

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      TextStyle,
      FontSize,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: task.description ?? "",
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[180px] px-3 py-3",
      },
    },
    // Re-render toolbar on every state change (selection, marks, nodes)
    onTransaction() {
      forceUpdate((n) => n + 1);
    },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const incoming = task.description ?? "";
      if (editor.getHTML() !== incoming) {
        editor.commands.setContent(incoming, false);
      }
    }
  }, [task.description, editor]);

  const assignee = assignedTo ? users.find((u) => u.id === assignedTo) : null;

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate(task.id, {
        title: title.trim(),
        startDate: startDate ? new Date(startDate).getTime() : null,
        endDate: endDate ? new Date(endDate).getTime() : null,
        assignedTo,
        description: editor ? editor.getHTML() : "",
      });
    } finally {
      setSaving(false);
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex max-h-[95vh] w-[80vw] flex-col border bg-white shadow-xl">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent text-lg font-semibold outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-amber-500 px-3 py-2 text-sm text-white hover:bg-amber-600 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1 text-xl text-stone-500 hover:text-black"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-4">

          {/* TIMELINE */}
          <div className="mb-4 flex gap-3">
            <label className="flex flex-col gap-1 text-xs text-stone-500">
              Start
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-stone-500">
              End
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border px-2 py-1"
              />
            </label>
          </div>

          {/* ASSIGNMENT */}
          <div className="relative mb-4">
            <button
              type="button"
              onClick={() => setShowAssignDropdown((s) => !s)}
              className="flex items-center gap-2 border px-3 py-2 hover:bg-stone-50"
            >
              {assignee ? (
                <>
                  <Avatar name={assignee.displayName} />
                  <span>{assignee.displayName || assignee.email}</span>
                </>
              ) : (
                "Unassigned"
              )}
            </button>
            {showAssignDropdown && (
              <div className="absolute left-0 top-full z-10 mt-1 w-56 border bg-white shadow-lg">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50"
                  onClick={() => { setAssignedTo(null); setShowAssignDropdown(false); }}
                >
                  Unassigned
                </button>
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-stone-50"
                    onClick={() => { setAssignedTo(u.id); setShowAssignDropdown(false); }}
                  >
                    <Avatar name={u.displayName} />
                    {u.displayName || u.email}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="flex flex-1 flex-col">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Description
              </span>
              <button
                type="button"
                onClick={() => setDescriptionEditMode((s) => !s)}
                className="text-xs text-amber-600 hover:underline"
              >
                {descriptionEditMode ? "Done" : "Edit"}
              </button>
            </div>

            {!descriptionEditMode ? (
              // Read view — needs the same list styles
              <div
                className="min-h-[80px] rounded border border-transparent px-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                dangerouslySetInnerHTML={{
                  __html: editor?.getHTML() ?? task.description ?? "",
                }}
              />
            ) : (
              <div className="overflow-hidden rounded border bg-white">

                {/* TOOLBAR */}
                <div className="flex flex-wrap items-center gap-1 border-b bg-stone-50 px-2 py-1.5">
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    active={editor?.isActive("bold")}
                  >
                    <MdFormatBold />
                  </ToolbarButton>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    active={editor?.isActive("italic")}
                  >
                    <MdFormatItalic />
                  </ToolbarButton>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    active={editor?.isActive("underline")}
                  >
                    <MdFormatUnderlined />
                  </ToolbarButton>

                  <span className="mx-1 h-5 w-px bg-stone-300" />

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    active={editor?.isActive("bulletList")}
                  >
                    <MdFormatListBulleted />
                  </ToolbarButton>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    active={editor?.isActive("orderedList")}
                  >
                    <MdFormatListNumbered />
                  </ToolbarButton>

                  <span className="mx-1 h-5 w-px bg-stone-300" />

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                    active={editor?.isActive({ textAlign: "left" })}
                  >
                    <MdFormatAlignLeft />
                  </ToolbarButton>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                    active={editor?.isActive({ textAlign: "center" })}
                  >
                    <MdFormatAlignCenter />
                  </ToolbarButton>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                    active={editor?.isActive({ textAlign: "right" })}
                  >
                    <MdFormatAlignRight />
                  </ToolbarButton>

                  <span className="mx-1 h-5 w-px bg-stone-300" />

                  <select
                    className="border px-2 py-1 text-sm"
                    defaultValue="default"
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const size = e.target.value;
                      if (!editor) return;
                      if (size === "default") {
                        (editor.chain().focus() as any).unsetFontSize().run();
                      } else {
                        (editor.chain().focus() as any).setFontSize(size).run();
                      }
                    }}
                  >
                    <option value="default">Font Size</option>
                    <option value="12px">Small (12px)</option>
                    <option value="16px">Normal (16px)</option>
                    <option value="20px">Large (20px)</option>
                    <option value="28px">Title (28px)</option>
                  </select>
                </div>

                {/* EDITOR — explicit list styles to override Tailwind reset */}
                <style>{`
                  .tiptap-editor ul { list-style-type: disc; padding-left: 1.25rem; }
                  .tiptap-editor ol { list-style-type: decimal; padding-left: 1.25rem; }
                  .tiptap-editor li { margin: 0.15rem 0; }
                `}</style>
                <div className="tiptap-editor">
                  <EditorContent editor={editor} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}