"use client";

import {
  Layout,
  Search,
  Filter,
  User,
  Monitor,
  MousePointer2,
  Building2,
  MapPin,
  Loader2,
  CheckCircle2,
  XCircle,
  Boxes,
  Circle,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Workspace {
  id: string;
  code: string;
  company: string;
  type: string;
  floor: string;
  capacity: number;
  employee?: {
    id: string;
    fullName: string;
    employeeCode: string;
    photoPath?: string;
  } | null;
  assets: {
    id: string;
    assetTag: string;
    type: string;
  }[];
  accessories: {
    id: string;
    assetTag: string;
    type: string;
  }[];
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [occupancyFilter, setOccupancyFilter] = useState("all");

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces");
      const data = await res.json();
      if (Array.isArray(data)) {
        setWorkspaces(data);
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const filteredWorkspaces = workspaces.filter((ws) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      ws.code.toLowerCase().includes(query) ||
      ws.employee?.fullName?.toLowerCase().includes(query) ||
      ws.employee?.employeeCode?.toLowerCase().includes(query) ||
      ws.assets.some((a) => a.assetTag.toLowerCase().includes(query));

    const matchesCompany = companyFilter === "all" || ws.company === companyFilter;
    const matchesType = typeFilter === "all" || ws.type === typeFilter;
    
    let matchesOccupancy = true;
    if (occupancyFilter === "occupied") matchesOccupancy = !!ws.employee;
    if (occupancyFilter === "vacant") matchesOccupancy = !ws.employee;

    return matchesSearch && matchesCompany && matchesType && matchesOccupancy;
  });

  const companies = ["all", ...new Set(workspaces.map((ws) => ws.company))];
  const types = ["all", ...new Set(workspaces.map((ws) => ws.type))];

  return (
    <div className="space-y-6 animate-fade-in pb-20 pt-4 h-full flex flex-col">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2 uppercase">
            <Layout className="w-6 h-6 text-primary" />
            Workspace Inventory
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
            Real-time occupancy and asset distribution across Floor {workspaces[0]?.floor || "03"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchWorkspaces}
            className="p-2.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-muted-foreground transition-all"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <div className="px-4 py-2 bg-card border border-border rounded-xl flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest">{workspaces.filter(w => !!w.employee).length} Occupied</span>
            </div>
            <div className="w-[1px] h-3 bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground/40">
              <span className="w-2 h-2 rounded-full bg-muted border border-border" />
              <span className="text-[9px] font-black uppercase tracking-widest">{workspaces.filter(w => !w.employee).length} Vacant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Ribbon */}
      <div className="bg-card/50 border border-border p-2 rounded-2xl flex flex-col lg:flex-row gap-3 items-center shrink-0">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="SEARCH BY SEAT CODE, EMPLOYEE OR ASSET TAG..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent pl-12 pr-4 py-3 rounded-xl text-[11px] font-bold border border-transparent focus:bg-background outline-none transition-all placeholder:text-[9px] placeholder:font-black placeholder:tracking-widest opacity-80"
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <select 
            value={companyFilter} 
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]"
          >
            {companies.map(c => <option key={c} value={c}>{c === "all" ? "ALL COMPANIES" : c}</option>)}
          </select>
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]"
          >
            {types.map(t => <option key={t} value={t}>{t === "all" ? "ALL TYPES" : t.toUpperCase()}</option>)}
          </select>
          <select 
            value={occupancyFilter} 
            onChange={(e) => setOccupancyFilter(e.target.value)}
            className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]"
          >
            <option value="all">ALL OCCUPANCY</option>
            <option value="occupied">OCCUPIED</option>
            <option value="vacant">VACANT</option>
          </select>
        </div>
      </div>

      {/* High-Density Grid */}
      <div className="flex-1 overflow-auto min-h-0 pr-1">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest">Mapping floor layout...</p>
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20">
            <Boxes className="w-12 h-12" />
            <p className="text-[12px] font-black uppercase tracking-widest">No matching workspaces localized</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredWorkspaces.map((ws) => (
              <div 
                key={ws.id} 
                className={cn(
                  "relative bg-card border rounded-2xl p-4 transition-all group hover:scale-[1.02] hover:shadow-xl",
                  ws.employee ? "border-primary/20 hover:border-primary/40 shadow-sm" : "border-border/60 hover:border-border opacity-80 hover:opacity-100"
                )}
              >
                {/* Seat ID & Company Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-black tracking-tight">{ws.code}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">{ws.type}</span>
                  </div>
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                    ws.company === 'MPL' ? "bg-blue-500/10 text-blue-500" :
                    ws.company === 'MAL' ? "bg-purple-500/10 text-purple-500" :
                    "bg-orange-500/10 text-orange-500"
                  )}>
                    {ws.company}
                  </div>
                </div>

                {/* Occupant Info */}
                <div className="mb-4">
                  {ws.employee ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 overflow-hidden shrink-0">
                        {ws.employee.photoPath ? (
                          <img src={ws.employee.photoPath} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-primary">
                            {ws.employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black truncate uppercase tracking-tight">{ws.employee.fullName}</p>
                        <p className="text-[8px] font-bold text-muted-foreground/60 uppercase">{ws.employee.employeeCode}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 opacity-30">
                      <div className="w-10 h-10 rounded-xl bg-muted border border-border border-dashed flex items-center justify-center">
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest italic">Vacant Seat</span>
                    </div>
                  )}
                </div>

                {/* Asset Strip */}
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-border/10">
                  {ws.assets.map(asset => (
                    <div key={asset.id} title={asset.assetTag} className="flex items-center gap-1 px-1.5 py-0.5 bg-muted/50 rounded-md border border-border/50">
                      <Monitor className="w-2.5 h-2.5 text-primary/60" />
                      <span className="text-[7px] font-black text-muted-foreground/80">{asset.assetTag}</span>
                    </div>
                  ))}
                  {ws.accessories.map(acc => (
                    <div key={acc.id} title={acc.assetTag} className="flex items-center gap-1 px-1.5 py-0.5 bg-muted/30 rounded-md border border-border/30">
                      <MousePointer2 className="w-2.5 h-2.5 text-secondary/60" />
                      <span className="text-[7px] font-bold text-muted-foreground/60 italic">{acc.assetTag}</span>
                    </div>
                  ))}
                  {ws.assets.length === 0 && ws.accessories.length === 0 && (
                    <span className="text-[7px] font-black uppercase tracking-widest opacity-20 italic">No hardware bound</span>
                  )}
                </div>

                {/* Hover Action */}
                <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-all">
                   <ChevronRight className="w-4 h-4 text-primary" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
