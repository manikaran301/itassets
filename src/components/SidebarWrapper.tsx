"use client";

import { Sidebar } from "@/components/Sidebar";
import { UserHeader } from "@/components/UserHeader";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <>
      <Sidebar />
      <main 
        className={cn(
          "min-h-screen bg-background transition-all duration-300 ease-in-out",
          isCollapsed ? "pl-20" : "pl-64"
        )}
      >
        <UserHeader />
        <div className="p-4 md:p-6 pb-20">{children}</div>
      </main>
    </>
  );
}
