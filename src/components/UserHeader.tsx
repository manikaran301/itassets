"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSearch } from "@/contexts/SearchContext";
import { LogOut, User, Settings, ChevronDown, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const headerContent = [
  {
    matcher: (pathname: string) => pathname === "/",
    title: "Operations Dashboard",
    subtitle: "Live Asset Intelligence Center",
  },
  {
    matcher: (pathname: string) => pathname === "/hr/employees",
    title: "Employee Registry",
    subtitle: "Workforce Identity Directory",
  },
  {
    matcher: (pathname: string) => pathname === "/hr/employees/new",
    title: "Employee Onboarding",
    subtitle: "New Workforce Entry Builder",
  },
  {
    matcher: (pathname: string) => pathname === "/hr/joiners",
    title: "Joiner Pipeline",
    subtitle: "Upcoming Workforce Activations",
  },
  {
    matcher: (pathname: string) => pathname === "/hr/exits",
    title: "Exit Control",
    subtitle: "Offboarding and Recovery Queue",
  },
  {
    matcher: (pathname: string) => pathname === "/seats",
    title: "Seats Registry",
    subtitle: "Common Workspace Occupancy & Hardware Map",
  },
  {
    matcher: (pathname: string) => pathname === "/it/assets",
    title: "Enterprise Assets",
    subtitle: "Device Inventory Command Center",
  },
  {
    matcher: (pathname: string) => pathname === "/it/assets/new",
    title: "Asset Onboarding",
    subtitle: "New Hardware Intake Workspace",
  },
  {
    matcher: (pathname: string) => /^\/it\/assets\/[^/]+\/edit$/.test(pathname),
    title: "Asset Revision",
    subtitle: "Configuration and Lifecycle Editing",
  },
  {
    matcher: (pathname: string) => /^\/it\/assets\/[^/]+$/.test(pathname),
    title: "Asset Profile",
    subtitle: "Detailed Lifecycle and Assignment View",
  },
  {
    matcher: (pathname: string) => pathname === "/it/accessories",
    title: "Accessory Inventory",
    subtitle: "Peripheral Readiness Board",
  },
  {
    matcher: (pathname: string) => pathname === "/it/provisioning",
    title: "Provisioning Flow",
    subtitle: "Fulfillment and Readiness Tracker",
  },
  {
    matcher: (pathname: string) => pathname === "/it/assignments",
    title: "Assignment Ledger",
    subtitle: "Allocation and Return History",
  },
  {
    matcher: (pathname: string) => pathname === "/it/email",
    title: "Email Identities",
    subtitle: "Active Communication Registry",
  },
  {
    matcher: (pathname: string) => pathname === "/it/email/new",
    title: "Email Provisioning",
    subtitle: "Mailbox Creation Workspace",
  },
  {
    matcher: (pathname: string) => pathname === "/admin/reports",
    title: "Executive Reports",
    subtitle: "Insights, Trends, and Performance Signals",
  },
  {
    matcher: (pathname: string) => pathname === "/admin/audit",
    title: "Audit Timeline",
    subtitle: "System Activity and Trace Records",
  },
  {
    matcher: (pathname: string) => pathname === "/admin/users",
    title: "Access Control",
    subtitle: "User Roles and Governance Center",
  },
];

interface SessionUser {
  name?: string | null;
  email?: string | null;
  role?: string;
}

export function UserHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = session?.user as SessionUser | undefined;
  const userName = user?.name || "User";
  const userEmail = user?.email || "";
  const userRole = user?.role || "Member";
  const userInitial = userName[0].toUpperCase();

  const pageHeader = useMemo(
    () =>
      headerContent.find(({ matcher }) => matcher(pathname)) ?? {
        title: "M_AMS Workspace",
        subtitle: "Operational Coordination Hub",
      },
    [pathname],
  );

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { searchQuery, setSearchQuery } = useSearch();

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center border-b border-border bg-card/60 px-6 backdrop-blur-md">
      <div className="min-w-0">
        <p className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-xl font-semibold text-transparent">
          {pageHeader.title}
        </p>
        <p className="truncate text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/80">
          {pageHeader.subtitle}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <div className="relative group hidden sm:block">
          <input
            type="text"
            placeholder="Search everything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-muted px-4 py-1.5 rounded-full text-sm border border-transparent focus:border-primary/30 outline-none transition-all w-48 lg:w-64 focus:w-80"
          />
        </div>
        
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-card" />
          </button>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              "flex items-center gap-3 p-1.5 rounded-xl transition-all duration-200 group",
              isMenuOpen ? "bg-muted" : "hover:bg-muted/50"
            )}
          >
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold leading-none">{userName}</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter mt-0.5">
                {userRole}
              </p>
            </div>
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm ring-2 ring-primary ring-offset-2 ring-offset-card shadow-lg transition-transform group-hover:scale-105">
                {userInitial}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm border border-border">
                <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform duration-200", isMenuOpen && "rotate-180")} />
              </div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in glass z-50">
              <div className="p-4 border-b border-border bg-muted/30">
                <p className="text-sm font-bold">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary">
                  {userRole}
                </div>
              </div>
              
              <div className="p-2">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all group">
                  <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>My Profile</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all group">
                  <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                  <span>Settings</span>
                </button>
              </div>

              <div className="p-2 border-t border-border">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-500/5 rounded-lg transition-all group"
                >
                  <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="font-semibold">Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
