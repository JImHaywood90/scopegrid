"use client";

/** Canonical status type used across BackupRadar UI */
export type BackupStatus =
  | "Success"
  | "Warning"
  | "Failure"
  | "Pending"
  | "No result";

/** Stable ordering (for sorts, chips, etc.) */
export const ALL_STATUSES: readonly BackupStatus[] = [
  "Success",
  "Warning",
  "Failure",
  "Pending",
  "No result",
] as const;

export const STATUS_ORDER: readonly BackupStatus[] = [
  "Failure",
  "Warning",
  "Pending",
  "No result",
  "Success",
] as const;

/** Brand palette per status */
export const STATUS_COLORS: Record<BackupStatus, string> = {
  Success: "#06AEF4",
  Warning: "#247BA0",
  Failure: "#FE5F55",
  Pending: "#FFCA28",
  "No result": "#90A4AE",
};

export const RECENT_MS = 24 * 60 * 60 * 1000;

/* ---------------- helpers ---------------- */

export function parseISO(d?: string) {
  const t = d ? Date.parse(d) : NaN;
  return Number.isFinite(t) ? new Date(t) : null;
}

export function rel(from?: string) {
  const d = parseISO(from);
  if (!d) return "";
  const ms = Date.now() - d.getTime();
  const s = Math.max(1, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const day = Math.floor(h / 24);
  if (day > 0) return `${day}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return `${s}s ago`;
}

export function normalizeStatusName(s?: string): BackupStatus | null {
  const t = (s || "").toLowerCase().replace(/[\s_]/g, "");
  switch (t) {
    case "success":
      return "Success";
    case "warning":
      return "Warning";
    case "failure":
      return "Failure";
    case "pending":
      return "Pending";
    case "noresult":
    case "noresults":
      return "No result";
    default:
      return null;
  }
}

export function chipToneForStatus(
  s?: string,
): "default" | "error" | "warning" | "success" | "info" {
  const norm = normalizeStatusName(s);
  if (norm === "Success") return "success";
  if (norm === "Warning") return "warning";
  if (norm === "Failure") return "error";
  if (norm === "Pending") return "info";
  return "default";
}
