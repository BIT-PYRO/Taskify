"use client";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
  members: Array<{ user: { id: string; name: string | null; email: string } }>;
}

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  onCreated: () => void;
}

export function CreateTaskModal({ open, onClose, projects, onCreated }: CreateTaskModalProps) {
  const [form, setForm] = useState({ title: "", description: "", projectId: "", assigneeId: "", dueDate: "", status: "TODO" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedProject = projects.find((p) => p.id === form.projectId);

  const handleSubmit = async () => {
    setError("");
    if (!form.title.trim() || !form.projectId) { setError("Title and project are required"); return; }
    setLoading(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setForm({ title: "", description: "", projectId: "", assigneeId: "", dueDate: "", status: "TODO" });
    onCreated();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Task">
      <div className="flex flex-col gap-4">
        <Input label="Title" placeholder="Implement auth middleware" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Description</label>
          <textarea rows={3} placeholder="Optional description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500 resize-none" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Project</label>
          <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value, assigneeId: "" })} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500">
            <option value="">Select project...</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {selectedProject && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Assignee</label>
            <select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500">
              <option value="">Unassigned</option>
              {selectedProject.members.map(({ user }) => <option key={user.id} value={user.id}>{user.name || user.email}</option>)}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500">
              {["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1">Create Task</Button>
        </div>
      </div>
    </Modal>
  );
}
