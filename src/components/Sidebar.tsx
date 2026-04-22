"use client";

import Link from "next/link";
// Removed Image import as it was causing resolution errors
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/NotificationContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTheme } from "@/components/ThemeProvider";

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
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { theme } = useTheme();
  const user = session?.user as SessionUser | undefined;
  const { notifications } = useNotifications();

  const userInitial = user?.name ? user.name[0] : "U";
  const userName = user?.name || "User";
  const userRole = user?.role || "Member";

  return (
    <aside
      className={cn(
        "h-screen border-r border-border bg-card flex flex-col glass fixed left-0 top-0 transition-all duration-300 ease-in-out z-50 overflow-visible",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Enhanced Overlay Collapse Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "absolute top-6 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:scale-110 active:scale-95 transition-all z-[100] border-2 border-background",
          isCollapsed ? "-right-4" : "-right-4"
        )}
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>

      {/* Scrollable Content Wrapper */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className={cn(
          "p-4 flex flex-col items-center transition-all duration-300",
          isCollapsed ? "px-2 pt-20" : "px-4 pt-8"
        )}>
          <div className={cn(
            "relative mb-4 group flex items-center justify-center transition-all duration-500 ease-in-out",
            isCollapsed ? "w-12 h-12" : "w-32 h-16"
          )}>
            <img
              src={theme === "dark" ? "/MPLWhite.png" : "/mrllogo.png"}
              alt="MRL Logo"
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          {!isCollapsed && (
            <div className="text-center animate-fade-in">
              <p className="text-[10px] text-muted-foreground mt-0.5 tracking-[0.2em] font-black uppercase opacity-60">
                Asset Management System
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 pb-6 space-y-4">
          {sidebarLinks
            .filter((group) => !group.roles || group.roles.includes(userRole))
            .map((group) => (
              <div key={group.group}>
                {!isCollapsed && (
                  <h2 className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-2 flex items-center px-2">
                    <span>{group.group}</span>
                    <span className="ml-auto w-3 h-[1px] bg-border/50"></span>
                  </h2>
                )}
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
                          isCollapsed && "justify-center px-0"
                        )}
                        title={isCollapsed ? link.name : ""}
                      >
                        <link.icon
                          className={cn(
                            "w-4 h-4 shrink-0",
                            isActive
                              ? "text-primary-foreground"
                              : "group-hover:scale-110 transition-transform",
                          )}
                        />
                        {!isCollapsed && <span className="flex-1 truncate">{link.name}</span>}

                        {/* Notification Badge */}
                        {notificationCount > 0 && (
                          <span className={cn(
                            "flex items-center justify-center text-[10px] font-black rounded-full bg-red-500 text-white ring-2 ring-red-500/30 animate-pulse",
                            isCollapsed 
                              ? "absolute top-1 right-1 w-4 h-4" 
                              : "w-5 h-5"
                          )}>
                            {notificationCount > 99 ? "99+" : notificationCount}
                          </span>
                        )}

                        {isActive && !notificationCount && !isCollapsed && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
        </nav>

        <div className={cn("p-4 border-t border-border mt-auto space-y-3", isCollapsed && "px-2")}>
          <div className={cn(
            "bg-muted p-2 rounded-lg flex items-center gap-3",
            isCollapsed && "justify-center p-1"
          )}>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs ring-2 ring-primary/10 shrink-0">
              {userInitial}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{userName}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter font-black">
                  {userRole}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all",
              isCollapsed && "justify-center px-0"
            )}
            title={isCollapsed ? "Log Out" : ""}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
