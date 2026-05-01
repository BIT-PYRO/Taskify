"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Bell, Check, Trash2, LogOut, Clock, CheckCircle2, XCircle, Eye,
  ClipboardList, RefreshCw, FolderPlus, FolderMinus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

type NotificationStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  status: NotificationStatus;
  createdAt: string;
  fromUser: { id: string; name: string | null; email: string };
}

const STATUS_META: Record<NotificationStatus, { label: string; classes: string; Icon: any }> = {
  PENDING:      { label: "Pending",      classes: "text-amber-400 bg-amber-500/10 border-amber-500/20",  Icon: Clock },
  UNDER_REVIEW: { label: "Under Review", classes: "text-blue-400 bg-blue-500/10 border-blue-500/20",    Icon: Eye },
  APPROVED:     { label: "Approved",     classes: "text-green-400 bg-green-500/10 border-green-500/20", Icon: CheckCircle2 },
  REJECTED:     { label: "Rejected",     classes: "text-red-400 bg-red-500/10 border-red-500/20",       Icon: XCircle },
};

const TYPE_META: Record<string, { label: string; classes: string; Icon: any }> = {
  RESIGNATION_REQUEST:  { label: "Resignation Request", classes: "text-orange-400 bg-orange-500/10 border-orange-500/20", Icon: LogOut },
  RESIGNATION_RESPONSE: { label: "Resignation Update",  classes: "text-violet-400 bg-violet-500/10 border-violet-500/20", Icon: RefreshCw },
  TASK_ASSIGNED:        { label: "Task Assigned",        classes: "text-blue-400 bg-blue-500/10 border-blue-500/20",       Icon: ClipboardList },
  PROJECT_ADDED:        { label: "Added to Project",     classes: "text-green-400 bg-green-500/10 border-green-500/20",   Icon: FolderPlus },
  PROJECT_REMOVED:      { label: "Removed from Project", classes: "text-red-400 bg-red-500/10 border-red-500/20",         Icon: FolderMinus },
};

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchNotifications();
  }, [session, fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.all(
      unread.map((n) =>
        fetch(`/api/notifications/${n.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        })
      )
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleStatusChange = async (id: string, status: NotificationStatus) => {
    setUpdating(id + status);
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, isRead: true }),
    });
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, status, isRead: true } : n)
    );
    setUpdating(null);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Notifications</h1>
          <p className="text-xs text-zinc-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            {notifications.length > 0 && ` · ${notifications.length} total`}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
            <Check size={13} />
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center mb-4">
            <Bell size={22} className="text-zinc-700" />
          </div>
          <p className="text-sm font-medium text-zinc-500">No notifications</p>
          <p className="text-xs text-zinc-700 mt-1">
            {isAdmin
              ? "Resignation requests from members will appear here."
              : "Task assignments and resignation updates will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const senderInitial = (n.fromUser.name || n.fromUser.email)[0].toUpperCase();
            const status = n.status || "PENDING";
            const statusMeta = STATUS_META[status];
            const typeMeta = TYPE_META[n.type] ?? {
              label: n.type, classes: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20", Icon: Bell,
            };
            const TypeIcon = typeMeta.Icon;
            const StatusIcon = statusMeta.Icon;
            const isResignationRequest = n.type === "RESIGNATION_REQUEST";
            const isActionable = isAdmin && isResignationRequest && status !== "APPROVED" && status !== "REJECTED";

            return (
              <div
                key={n.id}
                className={`group flex items-start gap-4 px-4 py-4 rounded-xl border transition-all duration-150 ${
                  n.isRead
                    ? "bg-[#0f0f0f] border-white/[0.04]"
                    : "bg-[#111111] border-white/[0.08] shadow-sm"
                }`}
              >
                <div className="mt-2 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${!n.isRead ? "bg-violet-500" : "bg-transparent"}`} />
                </div>

                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500/80 to-red-600/80 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {senderInitial}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-zinc-200">
                      {n.fromUser.name || n.fromUser.email}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${typeMeta.classes}`}>
                      <TypeIcon size={9} />
                      {typeMeta.label}
                    </span>
                    {isResignationRequest && (
                      <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${statusMeta.classes}`}>
                        <StatusIcon size={9} />
                        {statusMeta.label}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-zinc-400 leading-relaxed">{n.message}</p>

                  {isActionable && (
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {status !== "UNDER_REVIEW" && (
                        <button
                          disabled={!!updating}
                          onClick={() => handleStatusChange(n.id, "UNDER_REVIEW")}
                          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                        >
                          <Eye size={11} />
                          Under Review
                        </button>
                      )}
                      <button
                        disabled={!!updating}
                        onClick={() => handleStatusChange(n.id, "APPROVED")}
                        className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg text-green-400 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 size={11} />
                        Approve
                      </button>
                      <button
                        disabled={!!updating}
                        onClick={() => handleStatusChange(n.id, "REJECTED")}
                        className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        <XCircle size={11} />
                        Reject
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-2 text-[11px] text-zinc-600">
                    <Clock size={10} />
                    {formatDate(n.createdAt)}
                    {n.isRead && <span className="ml-2 text-zinc-700">· Read</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      title="Mark as read"
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(n.id)}
                      title="Dismiss"
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
