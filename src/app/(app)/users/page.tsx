"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { getRoleColor, cn } from "@/lib/utils";
import { Plus, Trash2, Shield, User, LogOut } from "lucide-react";

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

/* ─── Add User Modal (Admin only) ─────────────────────────── */
function AddUserModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "MEMBER" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!form.email || !form.password) { setError("Email and password are required"); return; }
    setLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setForm({ name: "", email: "", password: "", role: "MEMBER" });
    onCreated();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add User">
      <div className="flex flex-col gap-4">
        <Input label="Name" placeholder="Jane Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Email" type="email" placeholder="jane@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Role</label>
          <div className="flex gap-2">
            {(["MEMBER", "ADMIN"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setForm({ ...form, role: r })}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors",
                  form.role === r
                    ? r === "ADMIN" ? "bg-violet-900/50 border-violet-600 text-violet-200" : "bg-zinc-700 border-zinc-500 text-zinc-100"
                    : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                )}
              >
                {r === "ADMIN" ? <Shield size={12} /> : <User size={12} />}
                {r}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1">Add User</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Resignation Request Modal (Member only) ─────────────── */
function ResignModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "RESIGNATION_REQUEST",
        message: message.trim() || "I would like to submit my resignation.",
      }),
    });
    setLoading(false);
    if (!res.ok) { setError("Failed to send request. Please try again."); return; }
    setSent(true);
  };

  const handleClose = () => {
    setMessage("");
    setSent(false);
    setError("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Request Resignation">
      {sent ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <LogOut size={20} className="text-green-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-100 mb-1">Request Sent</p>
            <p className="text-xs text-zinc-500">Your resignation request has been sent to the admin.</p>
          </div>
          <Button onClick={handleClose} className="w-full">Close</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-400 leading-relaxed">
            This will send a resignation request notification to the admin. You can include an optional message.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="I would like to submit my resignation..."
              rows={4}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={handleClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} loading={loading} className="flex-1 bg-red-600 hover:bg-red-700 focus-visible:ring-red-500">
              Send Request
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ─── Main Page ────────────────────────────────────────────── */
export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showResign, setShowResign] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleToggle = async (user: UserRecord) => {
    const newRole = user.role === "ADMIN" ? "MEMBER" : "ADMIN";
    setUpdatingId(user.id);
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    await fetchUsers();
    setUpdatingId(null);
  };

  const handleDelete = async (user: UserRecord) => {
    if (!confirm(`Delete user "${user.name || user.email}"? This cannot be undone.`)) return;
    await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    fetchUsers();
  };

  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Team Members</h1>
          <p className="text-xs text-zinc-500 mt-1">
            {users.length} member{users.length !== 1 ? "s" : ""} · {adminCount} admin{adminCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isAdmin && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowResign(true)}
            >
              <LogOut size={14} />
              Request Resignation
            </Button>
          )}
          {isAdmin && (
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus size={14} />
              Add User
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 h-16 animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <User size={32} className="text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500">No team members yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => {
            const isSelf = user.id === session?.user?.id;
            return (
              <div
                key={user.id}
                className="group bg-[#111111] border border-white/[0.06] hover:border-white/[0.12] rounded-xl px-4 py-3.5 flex items-center gap-4 transition-all duration-150"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600/80 to-indigo-700/80 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-100 truncate">
                      {user.name || <span className="text-zinc-500 italic">No name</span>}
                    </p>
                    {isSelf && <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">you</span>}
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                </div>

                <Badge className={cn(getRoleColor(user.role), "text-[10px]")}>{user.role}</Badge>

                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleRoleToggle(user)}
                      disabled={updatingId === user.id || isSelf}
                      title={user.role === "ADMIN" ? "Demote to Member" : "Promote to Admin"}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                        user.role === "ADMIN"
                          ? "border-violet-800/60 text-violet-400 hover:bg-violet-900/20"
                          : "border-zinc-700/60 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                      )}
                    >
                      <Shield size={11} />
                      {user.role === "ADMIN" ? "Demote" : "Make Admin"}
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      disabled={isSelf}
                      title={isSelf ? "Cannot delete your own account" : "Delete user"}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddUserModal open={showAdd} onClose={() => setShowAdd(false)} onCreated={fetchUsers} />
      <ResignModal open={showResign} onClose={() => setShowResign(false)} />
    </div>
  );
}

