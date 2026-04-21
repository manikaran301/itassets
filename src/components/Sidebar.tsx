"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Users,
  Monitor,
  Mail,
  ShieldCheck,
  BarChart3,
  History,
  Settings,
  LayoutDashboard,
  HardDrive,
  UserCheck,
  UserX,
  Truck,
  ArrowRightLeft,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/NotificationContext";

const sidebarLinks = [
  {
    group: "Overview",
    links: [{ name: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    group: "HR Module",
    roles: ["hr", "admin"],
    links: [
      { name: "Employees", href: "/hr/employees", icon: Users },
      { name: "Joiners", href: "/hr/joiners", icon: UserCheck },
      { name: "Exits", href: "/hr/exits", icon: UserX },
      { name: "Seats", href: "/hr/seats", icon: ShieldCheck },
    ],
  },
  {
    group: "IT Module",
    roles: ["it", "admin"],
    links: [
      { name: "Assets", href: "/it/assets", icon: Monitor },
      { name: "Provisioning", href: "/it/provisioning", icon: Truck },
      { name: "Assignments", href: "/it/assignments", icon: ArrowRightLeft },
      { name: "Email Accounts", href: "/it/email", icon: Mail },
      { name: "Accessories", href: "/it/accessories", icon: HardDrive },
    ],
  },
  {
    group: "Management",
    roles: ["admin"],
    links: [
      { name: "Reports", href: "/admin/reports", icon: BarChart3 },
      { name: "Audit Log", href: "/admin/audit", icon: History },
      { name: "Users", href: "/admin/users", icon: Settings },
    ],
  },
];

interface SessionUser {
  name?: string | null;
  email?: string | null;
  role?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  const { notifications } = useNotifications();

  const userInitial = user?.name ? user.name[0] : "U";
  const userName = user?.name || "User";
  const userRole = user?.role || "Member";

  return (
    <aside className="w-64 h-screen border-r border-border bg-card flex flex-col glass fixed left-0 top-0 overflow-y-auto">
      <div className="p-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          M_AMS
        </h1>
        <p className="text-[10px] text-muted-foreground mt-0.5 tracking-widest uppercase opacity-60">
          Asset Management
        </p>
      </div>

      <nav className="flex-1 px-3 pb-6 space-y-4">
        {sidebarLinks
          .filter((group) => !group.roles || group.roles.includes(userRole))
          .map((group) => (
            <div key={group.group}>
              <h2 className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-2 flex items-center px-2">
                <span>{group.group}</span>
                <span className="ml-auto w-3 h-[1px] bg-border/50"></span>
              </h2>
              <div className="space-y-1">
                {group.links.map((link) => {
                  const isActive = pathname === link.href;

                  // Get notification count for this link
                  let notificationCount = 0;
                  if (
                    link.name === "Provisioning" &&
                    notifications?.provisioning.total
                  ) {
                    notificationCount = notifications.provisioning.total;
                  } else if (
                    link.name === "Joiners" &&
                    notifications?.joiners.incomplete
                  ) {
                    notificationCount = notifications.joiners.incomplete;
                  }

                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      <link.icon
                        className={cn(
                          "w-4 h-4",
                          isActive
                            ? "text-primary-foreground"
                            : "group-hover:scale-110 transition-transform",
                        )}
                      />
                      <span className="flex-1">{link.name}</span>

                      {/* Notification Badge */}
                      {notificationCount > 0 && (
                        <span className="flex items-center justify-center w-5 h-5 text-[10px] font-black rounded-full bg-red-500 text-white ring-2 ring-red-500/30 animate-pulse">
                          {notificationCount > 99 ? "99+" : notificationCount}
                        </span>
                      )}

                      {isActive && !notificationCount && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
      </nav>

      <div className="p-4 border-t border-border mt-auto space-y-3">
        <div className="bg-muted p-2.5 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs ring-2 ring-primary/10">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{userName}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tighter font-black">
              {userRole}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
