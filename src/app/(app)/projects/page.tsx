"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ProjectWithRelations } from "@/types";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { Button } from "@/components/ui/Button";
import { Plus, FolderOpen, Trash2, Users, CheckSquare, Calendar } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data.projects || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project and all its tasks?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    fetchProjects();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Projects</h1>
          <p className="text-xs text-zinc-500 mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            New Project
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#111111] border border-white/[0.06] rounded-xl h-40 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center mb-4">
            <FolderOpen size={22} className="text-zinc-700" />
          </div>
          <p className="text-sm font-medium text-zinc-500">No projects yet</p>
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(true)} className="mt-4">
              <Plus size={13} />
              Create a project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group relative bg-[#111111] border border-white/[0.06] hover:border-white/[0.14] rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5"
            >
              {/* Icon + Name */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/40 to-indigo-700/40 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <FolderOpen size={15} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors truncate">{project.name}</h3>
                  {project.description && (
                    <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2 leading-relaxed">{project.description}</p>
                  )}
                </div>
                {isAdmin && (
                  <button
                    onClick={(e) => { e.preventDefault(); handleDelete(project.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="mt-auto pt-3 border-t border-white/[0.04] flex items-center gap-4 text-[11px] text-zinc-600">
                <span className="flex items-center gap-1.5">
                  <Users size={11} />
                  {project.members.length} member{project.members.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckSquare size={11} />
                  {project._count.tasks} task{project._count.tasks !== 1 ? "s" : ""}
                </span>
                <span className="ml-auto flex items-center gap-1">
                  <Calendar size={10} />
                  {formatDate(project.createdAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={fetchProjects} />
    </div>
  );
}
