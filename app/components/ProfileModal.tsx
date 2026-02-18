"use client";

import { useState } from "react";
import { changeUserPassword, changeUserDisplayName } from "@/lib/firebase";
import { updateUserProfile } from "@/lib/db";
import type { User } from "firebase/auth";

interface ProfileModalProps {
  user: User;
  onClose: () => void;
}

export function ProfileModal({ user, onClose }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await changeUserDisplayName((displayName.trim() || user.email) ?? "");
      await updateUserProfile(user.uid, { displayName: (displayName.trim() || user.email) ?? "" });
      setSuccess("Name updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await changeUserPassword(newPassword);
      setSuccess("Password updated");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  const initial = (user.displayName || user.email || "?").charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md border border-stone-200 bg-white">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-stone-900">Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-4 border-b border-stone-200 pb-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center border border-stone-200 bg-stone-100 text-xl font-semibold text-stone-700"
              aria-hidden
            >
              {initial}
            </div>
            <div>
              <p className="font-medium text-stone-900">{user.displayName || "No name"}</p>
              <p className="text-sm text-stone-500">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateName} className="mt-4">
            <label className="block text-xs font-medium text-stone-600">Display name</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="border border-amber-600 bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>

          <form onSubmit={handleChangePassword} className="mt-6">
            <p className="text-xs font-medium text-stone-600">Change password</p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 characters)"
              minLength={6}
              className="mt-2 w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-2 border border-amber-600 bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              Update password
            </button>
          </form>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-3 text-sm text-green-600">{success}</p>}
        </div>
      </div>
    </div>
  );
}
