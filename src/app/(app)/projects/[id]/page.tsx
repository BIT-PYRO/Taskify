"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { TaskCard } from "@/components/tasks/TaskCard";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TaskStatus } from "@/types";
import { Plus, UserPlus, ArrowLeft, X, CircleDashed, RefreshCw, Eye, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getStatusColor, cn } from "@/lib/utils";

const COLUMN_META: Record<TaskStatus, { label: string; icon: any; accent: string }> = {
  TODO: { label: "To Do", icon: CircleDashed, accent: "text-zinc-500" },
  IN_PROGRESS: { label: "In Progress", icon: RefreshCw, accent: "text-blue-400" },
  IN_REVIEW: { label: "In Review", icon: Eye, accent: "text-yellow-400" },
  DONE: { label: "Done", icon: CheckCircle2, accent: "text-green-400" },
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [project, setProject] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchProject = useCallback(async () => {
    setLoading(true);
    const [projRes, usersRes] = await Promise.all([
      fetch(`/api/projects/${id}`),
      fetch("/api/users"),
    ]);
    const [projData, usersData] = await Promise.all([projRes.json(), usersRes.json()]);
    setProject(projData.project);
    setAllUsers(usersData.users || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchProject();
  };

  const handleDelete = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    fetchProject();
  };

  const handleAddMember = async () => {
    setInviteError("");
    if (!selectedUserId) return;
    setInviting(true);
    const res = await fetch(`/api/projects/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUserId }),
    });
    const data = await res.json();
    setInviting(false);
    if (!res.ok) { setInviteError(data.error); return; }
    setSelectedUserId("");
    fetchProject();
  };

  const handleRemoveMember = async (userId: string) => {
    await fetch(`/api/projects/${id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    fetchProject();
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 h-24 animate-pulse" />
        ))}
      </div>
    );
  }
  if (!project) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-zinc-500 text-sm">Project not found</p>
      </div>
    );
  }

  const columns: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
  const memberIds = new Set(project.members.map((m: any) => m.user.id));
  const nonMembers = allUsers.filter((u) => !memberIds.has(u.id));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/projects" className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-zinc-100 truncate">{project.name}</h1>
          {project.description && <p className="text-xs text-zinc-500 mt-0.5">{project.description}</p>}
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setShowCreateTask(true)}>
            <Plus size={14} />
            New Task
          </Button>
        )}
      </div>

      {isAdmin && (
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-6">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Team Members</h2>

          <div className="flex items-center gap-2 flex-wrap mb-4">
            {project.members.map(({ user }: any) => {
              const isSelf = user.id === session?.user?.id;
              return (
                <div key={user.id} className="group flex items-center gap-2 bg-zinc-900 border border-white/[0.06] rounded-lg px-2.5 py-1.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-600/70 to-indigo-700/70 flex items-center justify-center text-[10px] font-bold text-white">
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-zinc-300">{user.name || user.email}</span>
                  {!isSelf && (
                    <button
                      onClick={() => handleRemoveMember(user.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all ml-0.5"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              );
            })}
            {project.members.length === 0 && (
              <p className="text-xs text-zinc-600 italic">No members yet</p>
            )}
          </div>

          <div className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-700/60 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            >
              <option value="">Select a user to add...</option>
              {nonMembers.map((u) => (
                <option key={u.id} value={u.id}>{u.name || u.email} ({u.role})</option>
              ))}
            </select>
            <Button size="sm" variant="secondary" onClick={handleAddMember} loading={inviting} disabled={!selectedUserId}>
              <UserPlus size={13} />
              Add
            </Button>
          </div>
          {inviteError && <p className="text-xs text-red-400 mt-2">{inviteError}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((status) => {
          const colTasks = project.tasks.filter((t: any) => t.status === status);
          const meta = COLUMN_META[status];
          const Icon = meta.icon;
          return (
            <div key={status} className="flex flex-col gap-3 min-w-0">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Icon size={13} className={meta.accent} />
                  <span className="text-xs font-semibold text-zinc-400">{meta.label}</span>
                </div>
                <span className="text-[11px] text-zinc-700 bg-zinc-900 px-1.5 py-0.5 rounded font-mono">{colTasks.length}</span>
              </div>

              <div className="flex flex-col gap-2 min-h-[80px]">
                {colTasks.length === 0 ? (
                  <div className="border border-dashed border-white/[0.05] rounded-xl p-4 flex items-center justify-center">
                    <p className="text-xs text-zinc-800">Empty</p>
                  </div>
                ) : (
                  colTasks.map((task: any) => (
                    <TaskCard
                      key={task.id}
                      task={{ ...task, project: { id: project.id, name: project.name } }}
                      canEdit={isAdmin || task.assigneeId === session?.user?.id}
                      onStatusChange={handleStatusChange}
                      onDelete={isAdmin ? handleDelete : undefined}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CreateTaskModal
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        projects={[{ id: project.id, name: project.name, members: project.members }]}
        onCreated={fetchProject}
      />
    </div>
  );
}
