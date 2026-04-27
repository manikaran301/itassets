"use client";

import {
  Search,
  Layout,
  X,
  Check,
  Monitor,
  MousePointer2,
  Loader2,
  Circle,
  Building2,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface Workspace {
  id: string;
  code: string;
  company: string;
  type: string;
  floor: string;
  employee?: {
    fullName: string;
  } | null;
}

interface SeatSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (workspace: Workspace) => void;
  selectedId?: string | null;
  title?: string;
}

export function SeatSelectorModal({
  isOpen,
  onClose,
  onSelect,
  selectedId,
  title = "Select Workspace / Seat",
}: SeatSelectorModalProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [occupancyFilter, setOccupancyFilter] = useState("all");

  useEffect(() => {
    if (isOpen) {
      const fetchWorkspaces = async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/workspaces");
          const data = await res.json();
          if (Array.isArray(data)) setWorkspaces(data);
        } catch (error) {
          console.error("Failed to fetch workspaces:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchWorkspaces();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredWorkspaces = workspaces.filter((ws) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === "" || ws.code.toLowerCase().includes(q) || ws.employee?.fullName?.toLowerCase().includes(q);
    const matchesCompany = companyFilter === "all" || ws.company === companyFilter;
    let matchesOccupancy = true;
    if (occupancyFilter === "vacant") matchesOccupancy = !ws.employee;
    if (occupancyFilter === "occupied") matchesOccupancy = !!ws.employee;

    return matchesSearch && matchesCompany && matchesOccupancy;
  });

  const companies = ["all", ...new Set(workspaces.map((ws) => ws.company))];

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-6xl h-[85vh] bg-card border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Layout className="w-4 h-4 text-primary" />
              {title}
            </h2>
            <p className="text-[10px] text-muted-foreground/60 mt-1 font-bold">
              Select an available seat on Floor 03 for assignment.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-muted/20 border-b border-white/5 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="SEARCH BY SEAT CODE OR OCCUPANT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background/50 pl-10 pr-4 py-2 rounded-xl text-[10px] font-bold border border-border/50 focus:border-primary/30 outline-none transition-all"
            />
          </div>
          <select 
            value={companyFilter} 
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="bg-background/50 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border/50 focus:border-primary/30 outline-none cursor-pointer"
          >
            {companies.map(c => <option key={c} value={c}>{c === "all" ? "ALL COMPANIES" : c}</option>)}
          </select>
          <select 
            value={occupancyFilter} 
            onChange={(e) => setOccupancyFilter(e.target.value)}
            className="bg-background/50 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border/50 focus:border-primary/30 outline-none cursor-pointer"
          >
            <option value="all">ALL OCCUPANCY</option>
            <option value="vacant">VACANT ONLY</option>
            <option value="occupied">OCCUPIED</option>
          </select>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest">Loading floor plan...</p>
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20 text-center">
              <Users className="w-10 h-10 mx-auto" />
              <p className="text-[11px] font-black uppercase tracking-widest">No matching seats found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {filteredWorkspaces.map((ws) => {
                const isSelected = selectedId === ws.id;
                return (
                  <button
                    key={ws.id}
                    onClick={() => onSelect(ws)}
                    className={cn(
                      "relative group p-3 rounded-2xl border transition-all flex flex-col items-center text-center gap-2",
                      isSelected ? "bg-primary border-primary text-primary-foreground shadow-lg scale-105" : 
                      ws.employee ? "bg-muted/30 border-border/40 opacity-60 hover:opacity-100 hover:border-border" :
                      "bg-card border-border/60 hover:border-primary/50 hover:shadow-md"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center mb-1 transition-all",
                      isSelected ? "bg-white/20" : "bg-primary/5 group-hover:bg-primary/10"
                    )}>
                      <Layout className={cn("w-4 h-4", isSelected ? "text-white" : "text-primary")} />
                    </div>
                    <span className="text-[10px] font-black tracking-tight uppercase leading-none">{ws.code}</span>
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isSelected ? "bg-white" : ws.employee ? "bg-red-500" : "bg-green-500"
                      )} />
                      <span className="text-[7px] font-black uppercase tracking-widest opacity-60">
                        {ws.employee ? "Occupied" : "Vacant"}
                      </span>
                    </div>
                    {ws.employee && !isSelected && (
                      <span className="text-[6px] font-bold text-muted-foreground truncate w-full mt-1">
                        {ws.employee.fullName}
                      </span>
                    )}
                    {isSelected && (
                      <div className="absolute top-1 right-1">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/30 border-t border-white/5 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
