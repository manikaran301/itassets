"use client";

import { useSession } from "next-auth/react";
import { MapPin, Globe, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function ScopeSelector() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const user = session?.user as any;
  const locations = user?.authorizedLocations || [];
  
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);

  useEffect(() => {
    // Read from cookie (most reliable for SSR sync)
    const cookies = document.cookie.split(';');
    const scopeCookie = cookies.find(c => c.trim().startsWith('x-mams-scope-location='));
    if (scopeCookie) {
      setActiveLocationId(scopeCookie.split('=')[1]);
    }
  }, []);

  const handleSelect = (id: string | null) => {
    setActiveLocationId(id);
    if (id) {
      document.cookie = `x-mams-scope-location=${id}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      document.cookie = `x-mams-scope-location=; path=/; max-age=0; SameSite=Lax`;
    }
    setIsOpen(false);
    
    // Refresh to apply new scope filters across all server components
    window.location.reload();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't show if there's nothing to select (except for admins and IT who can see everything)
  if (locations.length === 0 && user?.role !== "admin" && user?.role !== "it") return null;

  const activeLocation = locations.find((l: any) => l.id === activeLocationId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2.5 px-4 py-2 rounded-2xl border transition-all duration-300 shadow-sm",
          isOpen 
            ? "bg-primary/10 border-primary/30 ring-4 ring-primary/5 shadow-primary/10" 
            : "bg-card/40 border-white/5 hover:bg-muted/50 hover:border-border"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center transition-colors shadow-inner",
          activeLocationId ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary-foreground"
        )}>
          {activeLocationId ? <MapPin className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
        </div>
        
        <div className="flex flex-col items-start text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none mb-1">
            Site Context
          </p>
          <p className="text-xs font-bold leading-none truncate max-w-[120px]">
            {activeLocation ? activeLocation.name : "Global Fleet"}
          </p>
        </div>
        
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground/40 transition-transform duration-300 ml-1", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-64 bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 glass z-[60]">
          <div className="p-4 border-b border-border bg-muted/20">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Authority Scope</h3>
            <p className="text-[9px] text-muted-foreground font-medium mt-1 uppercase italic">Select physical site isolation</p>
          </div>
          
          <div className="p-2 max-h-80 overflow-y-auto">
            {/* Global/All Option */}
            <button
              onClick={() => handleSelect(null)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group",
                !activeLocationId 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                  !activeLocationId ? "bg-primary shadow-lg shadow-primary/20 text-primary-foreground" : "bg-muted group-hover:bg-card border border-white/5"
                )}>
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold">All Authorized Sites</span>
                  <span className="text-[9px] opacity-60 font-black uppercase tracking-tighter">Unified Fleet View</span>
                </div>
              </div>
              {!activeLocationId && <Check className="w-4 h-4" />}
            </button>

            <div className="my-2 border-t border-border/50 mx-4" />
            
            {/* Specific Locations */}
            <div className="space-y-1">
              {locations.map((loc: any) => (
                <button
                  key={loc.id}
                  onClick={() => handleSelect(loc.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group",
                    activeLocationId === loc.id 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                      activeLocationId === loc.id ? "bg-primary shadow-lg shadow-primary/20 text-primary-foreground" : "bg-muted group-hover:bg-card border border-white/5"
                    )}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-bold">{loc.name}</span>
                      <span className="text-[9px] opacity-60 font-black uppercase tracking-tighter">Localized Operations</span>
                    </div>
                  </div>
                  {activeLocationId === loc.id && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-muted/30 border-t border-border flex justify-center">
             <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
               Isolation Layer: Relational Matrix v1.0
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
