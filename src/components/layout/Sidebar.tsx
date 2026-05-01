"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderOpen, LogOut, Users, Bell, ChevronRight } from "lucide-react";
import { cn, getRoleColor } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/users", label: "Team", icon: Users },
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdmin = session?.user?.role === "ADMIN";
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        setUnreadCount((data.notifications || []).filter((n: any) => !n.isRead).length);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const initial = (session?.user?.name || session?.user?.email || "?")[0].toUpperCase();

  return (
    <aside className="w-60 shrink-0 bg-[#0a0a0a] border-r border-white/[0.06] flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-violet-900/30">
            T
          </div>
          <span className="text-sm font-semibold text-zinc-100 tracking-tight">taskify</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">Menu</p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-white/[0.08] text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
              )}
            >
              <Icon size={16} className={active ? "text-violet-400" : "text-zinc-600 group-hover:text-zinc-400"} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={12} className="text-zinc-600" />}
            </Link>
          );
        })}

        {!isAdmin && (
          <Link
            href="/notifications"
            className={cn(
              "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              pathname === "/notifications"
                ? "bg-white/[0.08] text-zinc-100"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
            )}
          >
            <Bell size={16} className={pathname === "/notifications" ? "text-violet-400" : "text-zinc-600 group-hover:text-zinc-400"} />
            <span className="flex-1">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {unreadCount}
              </span>
            )}
            {pathname === "/notifications" && unreadCount === 0 && <ChevronRight size={12} className="text-zinc-600" />}
          </Link>
        )}

        {isAdmin && (
          <>
            <p className="px-3 mb-2 mt-5 text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">Admin</p>
            <Link
              href="/notifications"
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                pathname === "/notifications"
                  ? "bg-white/[0.08] text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
              )}
            >
              <Bell size={16} className={pathname === "/notifications" ? "text-violet-400" : "text-zinc-600 group-hover:text-zinc-400"} />
              <span className="flex-1">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
              {pathname === "/notifications" && unreadCount === 0 && <ChevronRight size={12} className="text-zinc-600" />}
            </Link>
          </>
        )}
      </nav>

      <div className="px-3 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] mb-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-300 truncate">{session?.user?.name || session?.user?.email}</p>
            <Badge className={cn("mt-0.5 text-[10px]", getRoleColor(session?.user?.role || "MEMBER"))}>
              {session?.user?.role}
            </Badge>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

