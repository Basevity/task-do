"use client";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm border border-stone-200 bg-white shadow-lg">
        <div className="border-b border-stone-200 px-4 py-3">
          <h2 className="text-base font-semibold text-stone-900">{title}</h2>
        </div>
        <div className="px-4 py-3 text-sm text-stone-600">{message}</div>
        <div className="flex justify-end gap-2 border-t border-stone-200 px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="border border-red-600 bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
