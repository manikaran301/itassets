'use client';

import { useSession } from "next-auth/react";
import { Search } from "lucide-react";

export function UserHeader() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "User";
  const userInitial = userName[0].toUpperCase();

  return (
    <header className="h-14 border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30 flex items-center px-6">
      <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Enterprise Assets</h1>
      <div className="ml-auto flex items-center gap-4">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search assets..." 
            className="bg-muted px-4 py-1.5 rounded-full text-sm border border-transparent focus:border-primary/30 outline-none transition-all w-64 group-hover:w-80"
          />
        </div>
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
