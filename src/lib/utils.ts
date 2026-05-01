import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function isOverdue(dueDate: Date | string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "No due date";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    TODO: "bg-zinc-700 text-zinc-300",
    IN_PROGRESS: "bg-blue-900 text-blue-300",
    IN_REVIEW: "bg-yellow-900 text-yellow-300",
    DONE: "bg-green-900 text-green-300",
  };
  return colors[status] ?? "bg-zinc-700 text-zinc-300";
}

export function getRoleColor(role: string): string {
  return role === "ADMIN"
    ? "bg-purple-900 text-purple-300"
    : "bg-zinc-700 text-zinc-300";
}
