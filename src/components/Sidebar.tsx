'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  PlusCircle,
  Truck,
  ArrowRightLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarLinks = [
  { group: 'Overview', links: [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  ]},
  { group: 'HR Module', links: [
    { name: 'Employees', href: '/hr/employees', icon: Users },
    { name: 'Joiners', href: '/hr/joiners', icon: UserCheck },
    { name: 'Exits', href: '/hr/exits', icon: UserX },
    { name: 'Seats', href: '/hr/seats', icon: ShieldCheck },
  ]},
  { group: 'IT Module', links: [
    { name: 'Assets', href: '/it/assets', icon: Monitor },
    { name: 'Provisioning', href: '/it/provisioning', icon: Truck },
    { name: 'Assignments', href: '/it/assignments', icon: ArrowRightLeft },
    { name: 'Email Accounts', href: '/it/email', icon: Mail },
    { name: 'Accessories', href: '/it/accessories', icon: HardDrive },
  ]},
  { group: 'Management', links: [
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Audit Log', href: '/admin/audit', icon: History },
    { name: 'Users', href: '/admin/users', icon: Settings },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen border-r border-border bg-card flex flex-col glass fixed left-0 top-0 overflow-y-auto">
      <div className="p-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">M_AMS</h1>
        <p className="text-[10px] text-muted-foreground mt-0.5 tracking-widest uppercase opacity-60">Asset Management</p>
      </div>

      <nav className="flex-1 px-3 pb-6 space-y-4">
        {sidebarLinks.map((group) => (
          <div key={group.group}>
            <h2 className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-2 flex items-center px-2">
              <span>{group.group}</span>
              <span className="ml-auto w-3 h-[1px] bg-border/50"></span>
            </h2>
            <div className="space-y-1">
              {group.links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <link.icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "group-hover:scale-110 transition-transform")} />
                    <span>{link.name}</span>
                    {isActive && (
                      <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <div className="bg-muted p-3 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
            IT
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">IT Admin</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Administrator</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
