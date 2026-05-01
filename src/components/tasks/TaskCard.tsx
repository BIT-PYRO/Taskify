"use client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, getStatusColor, isOverdue } from "@/lib/utils";
import { TaskWithRelations, TaskStatus } from "@/types";
import { Calendar, User2, AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";

interface TaskCardProps {
  task: TaskWithRelations;
  canEdit: boolean;
  onStatusChange?: (taskId: string, status: TaskStatus) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

const STATUS_OPTIONS: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

export function TaskCard({ task, canEdit, onStatusChange, onDelete }: TaskCardProps) {
  const [loading, setLoading] = useState(false);
  const overdue = isOverdue(task.dueDate) && task.status !== "DONE";

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!onStatusChange) return;
    setLoading(true);
    await onStatusChange(task.id, newStatus);
    setLoading(false);
  };

  return (
    <div className={`group relative bg-[#111111] border rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5 ${overdue ? "border-red-500/30 hover:border-red-500/50" : "border-white/[0.06] hover:border-white/[0.12]"}`}>
      {overdue && <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl bg-gradient-to-b from-red-500 to-red-700" />}

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {overdue && <AlertTriangle size={12} className="text-red-400 shrink-0" />}
            <h3 className="text-sm font-semibold text-zinc-100 truncate">{task.title}</h3>
          </div>
          {task.description && (
            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{task.description}</p>
          )}
        </div>
        <Badge className={`${getStatusColor(task.status)} shrink-0 text-[10px]`}>
          {STATUS_LABELS[task.status]}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-600 mb-3">
        <span className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400">
            {(task.assignee?.name || task.assignee?.email || "U")[0].toUpperCase()}
          </div>
          <span className={task.assignee ? "text-zinc-400" : "text-zinc-600 italic"}>
            {task.assignee?.name || task.assignee?.email || "Unassigned"}
          </span>
        </span>
        {task.dueDate && (
          <span className={`flex items-center gap-1 ${overdue ? "text-red-400" : "text-zinc-600"}`}>
            <Calendar size={10} />
            {formatDate(task.dueDate)}
          </span>
        )}
        <span className="ml-auto text-zinc-700 text-[10px] font-mono">{task.project.name}</span>
      </div>

      {canEdit && (
        <div className="flex items-center gap-2 pt-2.5 border-t border-white/[0.05]">
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            disabled={loading}
            className="flex-1 bg-[#1a1a1a] border border-white/[0.08] text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50 cursor-pointer"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          {onDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

