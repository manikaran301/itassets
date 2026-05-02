"use client";

import { 
  Building2, 
  Circle, 
  Grid, 
  Info, 
  Layers, 
  Layout, 
  Loader2, 
  Map, 
  Monitor, 
  MousePointer2, 
  Plus, 
  RefreshCw, 
  RotateCcw, 
  Save, 
  Search, 
  Trash2,
  ZoomIn,
  ZoomOut,
  Lock,
  Boxes,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Edit,
  Users,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useSearch } from "@/contexts/SearchContext";
import { usePermissions } from "@/hooks/usePermissions";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Download, FileSpreadsheet } from "lucide-react";

interface Workspace {
  id: string;
  code: string;
  company: string;
  type: string;
  floor: string;
  capacity: number;
  employeeId: string | null;
  employee: {
    fullName: string;
    employeeCode: string;
    photoPath: string | null;
    email: string | null;
  } | null;
  assets: {
    id: string;
    assetTag: string;
  }[];
  accessories: {
    id: string;
    assetTag: string;
  }[];
}

const formatCompany = (company: string) => {
  if (company === "FIFTY_HERTZ") return "50Hertz";
  return company;
};

// Layout constants
const TABLE_BLOCK_W = 400;
const TABLE_BLOCK_H = 300;
const SEATS_PER_TABLE = 9;
const GRID_COLS = 3;
const SVG_W = GRID_COLS * TABLE_BLOCK_W + 100;

export default function WorkspacesPage() {
  const { searchQuery, setSearchQuery } = useSearch();
  const { checkPermission, loading: permsLoading } = usePermissions();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [occupancyFilter, setOccupancyFilter] = useState("all");
  const [activeFloor, setActiveFloor] = useState("all");
  const [viewMode, setViewMode] = useState<"registry" | "layout">("registry");
  const [showModal, setShowModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Layout interaction state
  const [scale, setScale] = useState(0.8);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const [formData, setFormData] = useState({
    code: "",
    company: "MPL",
    type: "workstation",
    floor: "00",
    capacity: 1
  });

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch("/api/workspaces");
      const data = await res.json();
      setWorkspaces(data);
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (ws?: Workspace) => {
    if (ws) {
      setEditingWorkspace(ws);
      setFormData({
        code: ws.code,
        company: ws.company,
        type: ws.type,
        floor: ws.floor,
        capacity: ws.capacity
      });
    } else {
      setEditingWorkspace(null);
      setFormData({
        code: "",
        company: "MPL",
        type: "workstation",
        floor: activeFloor === "all" ? "00" : activeFloor,
        capacity: 1
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingWorkspace(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const method = editingWorkspace ? "PUT" : "POST";
      const url = editingWorkspace ? `/api/workspaces?id=${editingWorkspace.id}` : "/api/workspaces";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save seat");
      }

      fetchWorkspaces();
      handleCloseModal();
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingWorkspace) return;
    if (!confirm("Are you sure you want to delete this seat? All asset linkages will be removed.")) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/workspaces?id=${editingWorkspace.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete seat");
      }

      fetchWorkspaces();
      handleCloseModal();
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Pan handlers
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setPanX(prev => prev + dx);
    setPanY(prev => prev + dy);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  const onWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.3, scale + delta), 2.5);
    setScale(newScale);
  };

  const filteredWorkspaces = workspaces.filter((ws) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      ws.code.toLowerCase().includes(query) ||
      ws.employee?.fullName?.toLowerCase().includes(query) ||
      ws.employee?.employeeCode?.toLowerCase().includes(query) ||
      ((ws.employee as any)?.email || "").toLowerCase().includes(query) ||
      ws.assets.some((a) => (a.assetTag || "").toLowerCase().includes(query)) ||
      ws.accessories.some((a) => (a.assetTag || "").toLowerCase().includes(query));

    const matchesCompany = companyFilter === "all" || ws.company === companyFilter;
    const matchesType = typeFilter === "all" || ws.type === typeFilter;
    
    let matchesOccupancy = true;
    if (occupancyFilter === "occupied") matchesOccupancy = !!ws.employee;
    if (occupancyFilter === "vacant") matchesOccupancy = !ws.employee;

    const matchesFloor = 
      activeFloor === "all" ||
      ws.floor === activeFloor || 
      String(parseInt(ws.floor)) === String(parseInt(activeFloor));

    return matchesSearch && matchesCompany && matchesType && matchesOccupancy && matchesFloor;
  });

  const companies = ["all", ...new Set(workspaces.map((ws) => ws.company))];
  const types = ["all", ...new Set(workspaces.map((ws) => ws.type))];

  // Helper to generate a table path (rounded rectangle with a curve cut)
  const getTablePath = (x: number, y: number, w: number, h: number) => {
    const r = 20;
    return `M ${x+r} ${y} L ${x+w-r} ${y} Q ${x+w} ${y} ${x+w} ${y+r} L ${x+w} ${y+h-r} Q ${x+w} ${y+h} ${x+w-r} ${y+h} L ${x+r} ${y+h} Q ${x} ${y+h} ${x} ${y+h-r} L ${x} ${y+r} Q ${x} ${y} ${x+r} ${y} Z`;
  };

  const tableCount = Math.max(6, Math.ceil(filteredWorkspaces.length / SEATS_PER_TABLE));
  const gridRows = Math.ceil(tableCount / GRID_COLS);
  const svgH = Math.max(1200, gridRows * TABLE_BLOCK_H + 200);

  // 1. Loading States
  if (loading || permsLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest">
          {permsLoading ? "Securing Workspace..." : "Mapping floor layout..."}
        </p>
      </div>
    );
  }

  // 2. Permission Check: View
  if (!checkPermission("FACILITY", "SEATS", "canView")) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
          <Lock className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-black tracking-tight uppercase">Access Restricted</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You do not have authorization to view <span className="font-bold text-foreground">Seats & Workspaces</span>. 
            Please contact your system administrator to request <code className="bg-muted px-1.5 py-0.5 rounded text-primary">FACILITY_SEATS_VIEW</code> clearance.
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Inventory", value: workspaces.length, icon: Grid, color: "text-foreground bg-muted/50 border-border" },
    { label: "Active Occupancy", value: workspaces.filter(w => w.employeeId).length, icon: Users, color: "text-primary bg-primary/10 border-primary/20" },
    { label: "Vacant Potential", value: workspaces.filter(w => !w.employeeId).length, icon: Circle, color: "text-green-500 bg-green-500/10 border-green-500/20" },
    { label: "Floor Distribution", value: new Set(workspaces.map(w => w.floor)).size, icon: Layers, color: "text-accent bg-accent/10 border-accent/20" },
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4 animate-fade-in">
      {/* Header & Controls Section */}
      <div className="flex justify-between items-center px-1 shrink-0">
        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/50">
          <button 
            onClick={() => setViewMode("registry")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
              viewMode === "registry" ? "bg-background text-primary shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Grid className="w-3.5 h-3.5" />
            Registry
          </button>
          <button 
            onClick={() => setViewMode("layout")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
              viewMode === "layout" ? "bg-background text-primary shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Map className="w-3.5 h-3.5" />
            Layout
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => fetchWorkspaces()} className="p-2.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-muted-foreground transition-all">
            <Loader2 className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>

          <button 
            onClick={() => {
              const csv = filteredWorkspaces
                .map(w => `${w.code},${w.company},${w.floor},${w.employee?.fullName || "VACANT"},${w.assets.length},${w.accessories.length}`)
                .join("\n");
              const blob = new Blob(["Code,Company,Floor,Occupant,Assets,Accessories\n" + csv], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `workspaces-registry-${new Date().toISOString().split("T")[0]}.csv`;
              a.click();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          {checkPermission("FACILITY", "SEATS", "canCreate") && (
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              Add Seat
            </button>
          )}
        </div>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card border border-border/60 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
            <div className="space-y-0.5">
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">{stat.label}</p>
              <h4 className="text-xl font-black">{loading ? "..." : stat.value}</h4>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border border-transparent transition-all", stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Unified Multi-Filter Ribbon */}
      <div className="bg-card/50 border border-border p-1.5 rounded-2xl flex flex-col lg:flex-row gap-2 items-center shrink-0">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="FILTER BY SEAT CODE, EMPLOYEE, ASSET TAG..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent pl-11 pr-4 py-2.5 rounded-xl text-[10px] font-bold border border-transparent focus:bg-background outline-none transition-all placeholder:text-[8px] placeholder:font-black placeholder:tracking-widest opacity-80"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <div className="w-full lg:w-40">
            <SearchableSelect
              options={[
                { value: "all", label: "ALL FLOORS" },
                { value: "00", label: "GROUND FLOOR" },
                { value: "01", label: "1ST FLOOR" },
                { value: "02", label: "2ND FLOOR" },
                { value: "03", label: "3RD FLOOR" },
                { value: "04", label: "4TH FLOOR" },
                { value: "05", label: "5TH FLOOR" }
              ]}
              value={activeFloor}
              onChange={(val) => setActiveFloor(val || "all")}
              placeholder="FLOOR"
              compact
            />
          </div>
          <div className="w-full lg:w-44">
            <SearchableSelect
              options={companies.map(c => ({ value: c, label: c === "all" ? "ALL COMPANIES" : formatCompany(c).toUpperCase() }))}
              value={companyFilter}
              onChange={(val) => setCompanyFilter(val || "all")}
              placeholder="COMPANY"
              compact
            />
          </div>
          <div className="w-full lg:w-44">
            <SearchableSelect
              options={types.map(t => ({ value: t, label: t === "all" ? "ALL TYPES" : t.toUpperCase() }))}
              value={typeFilter}
              onChange={(val) => setTypeFilter(val || "all")}
              placeholder="SEAT TYPE"
              compact
            />
          </div>
          <div className="w-full lg:w-40">
            <SearchableSelect
              options={[
                { value: "all", label: "ALL STATUS" },
                { value: "occupied", label: "OCCUPIED" },
                { value: "vacant", label: "VACANT" }
              ]}
              value={occupancyFilter}
              onChange={(val) => setOccupancyFilter(val || "all")}
              placeholder="OCCUPANCY"
              compact
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto min-h-0 pr-1">
        {viewMode === "registry" ? (
          /* Registry Grid View */
          filteredWorkspaces.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20">
              <Boxes className="w-12 h-12" />
              <p className="text-[12px] font-black uppercase tracking-widest">No matching workspaces localized</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredWorkspaces.map((ws) => (
                <div 
                  key={ws.id} 
                  onClick={() => handleOpenModal(ws)}
                  className={cn(
                    "relative bg-card border rounded-2xl p-4 transition-all group hover:scale-[1.02] hover:shadow-xl cursor-pointer",
                    ws.employee ? "border-primary/20 hover:border-primary/40 shadow-sm" : "border-border/60 hover:border-border opacity-80 hover:opacity-100"
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black tracking-tight uppercase">{ws.code}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">{ws.type}</span>
                    </div>
                    <div className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                      ws.company === 'MPL' ? "bg-blue-500/10 text-blue-500" :
                      ws.company === 'MAL' ? "bg-purple-500/10 text-purple-500" :
                      (ws.company === 'FIFTY_HERTZ' || ws.company === '50Hertz') ? "bg-purple-500/10 text-purple-500" :
                      "bg-orange-500/10 text-orange-500"
                    )}>
                      {formatCompany(ws.company)}
                    </div>
                  </div>

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
                  </div>

                  <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-all">
                     <Edit className="w-4 h-4 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Premium Visual Layout (Always Visible Template) */
          <div 
            className="w-full h-full min-h-[600px] bg-card/20 border border-border/40 rounded-[32px] relative overflow-hidden cursor-grab active:cursor-grabbing z-0"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
          >
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transformOrigin: "center",
                transform: `scale(${scale}) translate(${panX / scale}px, ${panY / scale}px)`,
                transition: isDragging.current ? "none" : "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <svg 
                viewBox={`0 0 ${SVG_W} ${svgH}`} 
                className="w-full max-w-[1200px] min-w-[600px] min-h-[600px] h-auto drop-shadow-2xl border-2 border-red-500/20"
              >
                {/* Visual grid system */}
                <defs>
                  <pattern id="dotGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="var(--primary)" fillOpacity="0.1" />
                  </pattern>
                </defs>
                <rect width={SVG_W} height={svgH} fill="url(#dotGrid)" rx="40" />

                {/* Table Blocks */}
                {Array.from({ length: tableCount }).map((_, i) => {
                  const row = Math.floor(i / GRID_COLS);
                  const col = i % GRID_COLS;
                  const x = col * TABLE_BLOCK_W + 50;
                  const y = row * TABLE_BLOCK_H + 50;
                  
                  const tablePath = getTablePath(x, y, 300, 180);
                  
                  return (
                    <g key={i} className="transition-all duration-700">
                      {/* Table Surface */}
                      <path 
                        d={tablePath} 
                        fill="#4f46e5" 
                        fillOpacity="0.8" 
                        stroke="#818cf8" 
                        strokeWidth="4" 
                      />
                      
                      {/* Seats around the table */}
                      {Array.from({ length: SEATS_PER_TABLE }).map((_, si) => {
                        let sx, sy;
                        if (si < 4) { sx = x + (si * 75) + 35; sy = y - 30; }
                        else if (si < 8) { sx = x + ((si-4) * 75) + 35; sy = y + 180 + 30; }
                        else { sx = x - 30; sy = y + 90; }

                        return (
                          <circle 
                            key={si} 
                            cx={sx} 
                            cy={sy} 
                            r="18" 
                            fill="#06b6d4" 
                            stroke="#22d3ee" 
                            strokeWidth="2" 
                          />
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Initialize/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-border w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-muted/30 px-8 py-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight uppercase">
                  {editingWorkspace ? "Revise Workspace" : "Provision Seat"}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Infrastructure Allocation Engine
                </p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-muted rounded-xl transition-all">
                <RotateCcw className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Info className="w-3 h-3" /> Workspace Code
                  </label>
                  <input
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="E.G. MPL-WS-001"
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/30 uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Building2 className="w-3 h-3" /> Company
                  </label>
                  <select
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-background outline-none transition-all cursor-pointer"
                  >
                    <option value="MPL">MPL</option>
                    <option value="MAL">MAL</option>
                    <option value="FIFTY_HERTZ">50Hertz</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Layout className="w-3 h-3" /> Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-background outline-none transition-all cursor-pointer"
                  >
                    <option value="workstation">WORKSTATION (WS)</option>
                    <option value="cabin">PRIVATE CABIN</option>
                    <option value="meeting_room">MEETING ROOM</option>
                    <option value="other">OTHER</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Layers className="w-3 h-3" /> Floor
                  </label>
                  <select
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-background outline-none transition-all cursor-pointer"
                  >
                    <option value="00">GROUND FLOOR</option>
                    <option value="01">1ST FLOOR</option>
                    <option value="02">2ND FLOOR</option>
                    <option value="03">3RD FLOOR</option>
                    <option value="04">4TH FLOOR</option>
                    <option value="05">5TH FLOOR</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Users className="w-3 h-3" /> Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              {editingWorkspace?.employee && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                  <Circle className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-tight">
                    This seat is currently occupied by {editingWorkspace.employee.fullName}. 
                    Asset linkages will be preserved if you change seat details.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 gap-4">
                {editingWorkspace && checkPermission("FACILITY", "SEATS", "canDelete") && (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleDelete}
                    className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Seat
                  </button>
                )}
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  {((!editingWorkspace && checkPermission("FACILITY", "SEATS", "canCreate")) || 
                    (editingWorkspace && checkPermission("FACILITY", "SEATS", "canEdit"))) && (
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {editingWorkspace ? "Update Seat" : "Create Seat"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
