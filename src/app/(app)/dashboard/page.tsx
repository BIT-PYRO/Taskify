"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { TaskCard } from "@/components/tasks/TaskCard";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { Button } from "@/components/ui/Button";
import { TaskWithRelations, TaskStatus } from "@/types";
import { AlertTriangle, Plus, RefreshCw, CheckCircle2, Clock, Eye, CircleDashed } from "lucide-react";
import { isOverdue, cn } from "@/lib/utils";

type Filter = "all" | "overdue" | "mine" | TaskStatus;

const STATUS_META: Record<TaskStatus, { label: string; icon: any; color: string; bg: string }> = {
  TODO: { label: "To Do", icon: CircleDashed, color: "text-zinc-400", bg: "bg-zinc-800/60" },
  IN_PROGRESS: { label: "In Progress", icon: RefreshCw, color: "text-blue-400", bg: "bg-blue-500/10" },
  IN_REVIEW: { label: "In Review", icon: Eye, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  DONE: { label: "Done", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [tasksRes, projectsRes] = await Promise.all([fetch("/api/tasks"), fetch("/api/projects")]);
    const [tasksData, projectsData] = await Promise.all([tasksRes.json(), projectsRes.json()]);
    setTasks(tasksData.tasks || []);
    setProjects(projectsData.projects || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchData();
  };

  const handleDelete = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    fetchData();
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "overdue") return isOverdue(t.dueDate) && t.status !== "DONE";
    if (filter === "mine") return t.assigneeId === session?.user?.id;
    if (["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"].includes(filter)) return t.status === filter;
    return true;
  });

  const overdueCnt = tasks.filter((t) => isOverdue(t.dueDate) && t.status !== "DONE").length;
  const doneCnt = tasks.filter((t) => t.status === "DONE").length;
  const mineTasks = tasks.filter((t) => t.assigneeId === session?.user?.id);

  const FILTERS: Array<{ key: Filter; label: string; count?: number }> = [
    { key: "all", label: "All", count: tasks.length },
    { key: "mine", label: "Assigned to me", count: mineTasks.length },
    { key: "overdue", label: "Overdue", count: overdueCnt },
    { key: "TODO", label: "To Do" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "IN_REVIEW", label: "In Review" },
    { key: "DONE", label: "Done" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-1">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}{" "}
            {doneCnt > 0 && <span className="text-green-500">· {doneCnt} done</span>}
            {overdueCnt > 0 && <span className="text-red-400"> · {overdueCnt} overdue</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          {isAdmin && (
            <Button size="sm" onClick={() => setShowCreateTask(true)}>
              <Plus size={14} />
              New Task
            </Button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as TaskStatus[]).map((s) => {
          const cnt = tasks.filter((t) => t.status === s).length;
          const meta = STATUS_META[s];
          const Icon = meta.icon;
          const isActive = filter === s;
          return (
            <button
              key={s}
              onClick={() => setFilter(isActive ? "all" : s)}
              className={cn(
                "group text-left p-4 rounded-xl border transition-all duration-150",
                isActive
                  ? `${meta.bg} border-white/[0.12]`
                  : "bg-[#111111] border-white/[0.06] hover:border-white/[0.12]"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon size={14} className={meta.color} />
                <span className={cn("text-2xl font-bold tabular-nums", meta.color)}>{cnt}</span>
              </div>
              <p className="text-xs text-zinc-500">{meta.label}</p>
            </button>
          );
        })}
      </div>

      {/* Overdue alert */}
      {overdueCnt > 0 && (
        <div className="flex items-center gap-3 bg-red-950/20 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
          <AlertTriangle size={14} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-300 flex-1">
            <span className="font-semibold">{overdueCnt} task{overdueCnt > 1 ? "s are" : " is"}</span> past the due date.
          </p>
          <button
            onClick={() => setFilter("overdue")}
            className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
          >
            View
          </button>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex items-center gap-1.5 mb-6 flex-wrap">
        {FILTERS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
              filter === key
                ? "bg-white/[0.1] text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]",
              key === "overdue" && overdueCnt > 0 && filter !== key && "text-red-500/80 hover:text-red-400"
            )}
          >
            {label}
            {count !== undefined && (
              <span className={cn("tabular-nums", filter === key ? "text-zinc-400" : "text-zinc-700")}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tasks grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 h-36 animate-pulse" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center mb-4">
            <CircleDashed size={22} className="text-zinc-700" />
          </div>
          <p className="text-sm font-medium text-zinc-500">No tasks here</p>
          {isAdmin && filter === "all" && (
            <Button variant="ghost" size="sm" onClick={() => setShowCreateTask(true)} className="mt-4">
              <Plus size={13} />
              Create a task
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canEdit={isAdmin || task.assigneeId === session?.user?.id}
              onStatusChange={handleStatusChange}
              onDelete={isAdmin ? handleDelete : undefined}
            />
          ))}
        </div>
      )}

      <CreateTaskModal
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        projects={projects}
        onCreated={fetchData}
      />
    </div>
  );
}
