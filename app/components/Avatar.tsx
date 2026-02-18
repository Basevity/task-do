"use client";

interface AvatarProps {
  name: string;
  className?: string;
}

export function Avatar({ name, className = "" }: AvatarProps) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <div
      className={`flex shrink-0 items-center justify-center border border-stone-200 bg-stone-100 text-sm font-semibold text-stone-700 ${className}`}
      title={name}
      aria-hidden
    >
      {initial}
    </div>
  );
}
