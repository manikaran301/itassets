'use client';

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    matcher: (pathname: string) => pathname === "/hr/seats",
    title: "Seat Allocation",
    subtitle: "Workspace Capacity Ledger",
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

export function UserHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || "User";
  const userInitial = userName[0].toUpperCase();
  const pageHeader = useMemo(
    () =>
      headerContent.find(({ matcher }) => matcher(pathname)) ?? {
        title: "M_AMS Workspace",
        subtitle: "Operational Coordination Hub",
      },
    [pathname],
  );

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
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search assets..." 
            className="bg-muted px-4 py-1.5 rounded-full text-sm border border-transparent focus:border-primary/30 outline-none transition-all w-64 group-hover:w-80"
          />
        </div>
        <ThemeToggle />
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <p className="text-xs font-bold leading-none">{userName}</p>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">{(session?.user as any)?.role || 'Member'}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xs ring-2 ring-primary ring-offset-2 ring-offset-card shadow-lg">
            {userInitial}
          </div>
        </div>
      </div>
    </header>
  );
}
