export function formatDate(ts: number | undefined): string {
  if (ts == null) return "";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateShort(ts: number | undefined): string {
  if (ts == null) return "";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDateRange(start: number | undefined, end: number | undefined): string {
  if (start == null && end == null) return "";
  if (start != null && end != null) return `${formatDateShort(start)} – ${formatDateShort(end)}`;
  if (start != null) return `From ${formatDateShort(start)}`;
  return `Until ${formatDateShort(end!)}`;
}
