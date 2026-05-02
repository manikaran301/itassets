"use client";

import {
  Plus,
  MousePointer2,
  Keyboard,
  Monitor,
  Headphones,
  Usb,
  Webcam,
  Package,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Edit2,
  Trash2,
  Loader2,
  Upload,
  Download,
  X,
  ArrowRight,
  RefreshCw,
  Copy,
  User,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Papa from "papaparse";
import { SearchableSelect } from "@/components/SearchableSelect";
import { usePermissions } from "@/hooks/usePermissions";

interface Accessory {
  id: string;
  assetTag: string;
  type: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  status: string;
  condition: string;
  currentEmployeeId?: string | null;
  currentEmployee?: { 
    fullName: string; 
    employeeCode: string; 
    photoPath?: string | null;
    department?: string | null;
    manager?: { fullName: string } | null;
    workspace?: { code: string } | null;
  } | null;
  createdAt: string;
}

const ACCESSORY_TYPES = [
  "Monitor",
  "Keyboard",
  "Mouse",
  "Webcam",
  "Headset",
  "Docking Station",
];

// ── Accessory Import Preview Modal ──────────────────────────────────────────
interface AccessoryImportRecord {
  assetTag: string;
  type: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  condition: string;
  employeeCode?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  notes?: string;
  // Validation state
  isValid?: boolean;
  errors?: string[];
  warnings?: string[];
}

export default function AccessoriesPage() {
  const router = useRouter();
  const { checkPermission, loading: permsLoading } = usePermissions();
  const canViewAccessories = checkPermission("IT", "ACCESSORIES", "canView");
  const canCreateAccessories = checkPermission("IT", "ACCESSORIES", "canCreate");
  const canEditAccessories = checkPermission("IT", "ACCESSORIES", "canEdit");
  const canDeleteAccessories = checkPermission("IT", "ACCESSORIES", "canDelete");
  const canImportAccessories = checkPermission("IT", "ACCESSORIES", "canImport");
  const canExportAccessories = checkPermission("IT", "ACCESSORIES", "canExport");
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  // Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRecords, setImportRecords] = useState<AccessoryImportRecord[]>([]);
  const [validatingImport, setValidatingImport] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!permsLoading && canViewAccessories) {
      fetchAccessories();
    }
  }, [permsLoading, canViewAccessories]);

  const fetchAccessories = async () => {
    try {
      const res = await fetch("/api/accessories");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAccessories(data);
    } catch (error) {
      console.error("Failed to fetch accessories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/accessories/export');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Accessory_Inventory_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export accessories');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rawData = results.data as any[];
        setValidatingImport(true);
        setShowImportModal(true);

        try {
          const res = await fetch("/api/accessories/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: rawData }),
          });
          const data = await res.json();
          setImportRecords(data.items);
        } catch (err) {
          console.error("Validation error:", err);
          alert("Failed to validate import data");
        } finally {
          setValidatingImport(false);
        }
      },
    });
    e.target.value = "";
  };

  const processImport = async () => {
    const validRecords = importRecords.filter((r) => r.isValid);
    if (validRecords.length === 0) return;

    setImporting(true);
    try {
      const res = await fetch("/api/accessories/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: validRecords }),
      });

      if (!res.ok) throw new Error("Import failed");

      alert(`Successfully imported ${validRecords.length} accessories!`);
      setShowImportModal(false);
      fetchAccessories();
    } catch (err) {
      console.error("Import error:", err);
      alert("Failed to complete import process");
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string, assetTag: string) => {
    if (!window.confirm(`Delete ${assetTag}? This cannot be undone.`)) {
      return;
    }

    setDeleting(id);
    try {
      const res = await fetch(`/api/accessories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setAccessories(accessories.filter((acc) => acc.id !== id));
      alert("Accessory deleted successfully!");
    } catch (error) {
      alert("Failed to delete accessory");
    } finally {
      setDeleting(null);
    }
  };

  const filteredAccessories = accessories.filter((acc) => {
    const matchesSearch =
      searchTerm === "" ||
      acc.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.currentEmployee?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.currentEmployee?.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || acc.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || acc.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type: string): React.ReactNode => {
    switch (type.toLowerCase()) {
      case "mouse":
        return <MousePointer2 className="w-5 h-5" />;
      case "keyboard":
        return <Keyboard className="w-5 h-5" />;
      case "monitor":
        return <Monitor className="w-5 h-5" />;
      case "headset":
        return <Headphones className="w-5 h-5" />;
      case "docking station":
      case "docking_station":
        return <Usb className="w-5 h-5" />;
      case "webcam":
        return <Webcam className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "assigned":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "in_repair":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "retired":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "assigned": return "In Use";
      case "available": return "Available";
      case "in_repair": return "In Repair";
      case "retired": return "Retired";
      default: return status;
    }
  };

  if (permsLoading || (canViewAccessories && loading)) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 animate-pulse">Scanning Hardware Registry...</p>
      </div>
    );
  }

  if (!canViewAccessories) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-black tracking-tight uppercase">Access Restricted</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You do not have permission to view <span className="font-bold text-foreground">IT Accessories</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in pt-4 px-6 space-y-4">
      <div className="flex justify-end items-center gap-2 px-1 shrink-0">
        <button onClick={() => fetchAccessories()} className="p-2.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-muted-foreground transition-all">
          <Loader2 className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>

        {canImportAccessories && (
          <>
            <input type="file" id="accessory-import" accept=".csv" className="hidden" onChange={handleFileUpload} />
            <label 
              htmlFor="accessory-import" 
              className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Import CSV
            </label>
            <a
              href="/templates/accessory_import_template.csv"
              download
              className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Template
            </a>
          </>
        )}
        
        {canExportAccessories && (
          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        )}

        {canCreateAccessories && (
          <Link href="/it/accessories/new" className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <Plus className="w-4 h-4" /> Enroll Accessory
          </Link>
        )}
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {[
          { label: "Total Inventory", value: accessories.length, icon: Package, color: "text-foreground bg-muted/50 border-border" },
          { label: "Available Stock", value: accessories.filter(a => a.status === 'available').length, icon: CheckCircle2, color: "text-green-500 bg-green-500/10 border-green-500/20" },
          { label: "Active Assignments", value: accessories.filter(a => a.status === 'assigned').length, icon: ArrowRight, color: "text-primary bg-primary/10 border-primary/20" },
          { label: "In Maintenance", value: accessories.filter(a => a.status === 'in_repair').length, icon: RefreshCw, color: "text-accent bg-accent/10 border-accent/20" },
        ].map((stat, i) => (
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
            placeholder="SEARCH BY TAG, MODEL, SERIAL, OR ASSOCIATE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent pl-11 pr-4 py-2.5 rounded-xl text-[10px] font-bold border border-transparent focus:bg-background outline-none transition-all placeholder:text-[8px] placeholder:font-black placeholder:tracking-widest opacity-80"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <div className="w-full lg:w-48">
            <SearchableSelect
              options={[{ value: "all", label: "ALL TYPES" }, ...ACCESSORY_TYPES.map(type => ({ value: type, label: type.toUpperCase() }))]}
              value={typeFilter}
              onChange={(val) => setTypeFilter(val || "all")}
              placeholder="CATEGORY"
              compact
            />
          </div>
          <div className="w-full lg:w-48">
            <SearchableSelect
              options={[
                { value: "all", label: "ALL STATUS" },
                { value: "available", label: "AVAILABLE" },
                { value: "assigned", label: "IN USE" },
                { value: "in_repair", label: "REPAIR" },
                { value: "retired", label: "RETIRED" }
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val || "all")}
              placeholder="STATUS"
              compact
            />
          </div>
        </div>
      </div>

      {/* High-Density Registry Container */}
      <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-auto scrollbar-hide flex-1">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/50 backdrop-blur-md border-b border-border/50">
                <th className="pl-6 pr-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Identifier & Unit</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Status</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Condition</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Current Stakeholder</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Serial / Make</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-right pr-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredAccessories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Package className="w-10 h-10 mx-auto mb-4 text-primary/10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Inventory Empty</p>
                  </td>
                </tr>
              ) : (
                filteredAccessories.map((acc) => (
                  <tr 
                    key={acc.id} 
                    onClick={() => router.push(`/it/accessories/${acc.id}`)}
                    className="group hover:bg-white/[0.02] transition-colors border-white/5 cursor-pointer"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                          {getTypeIcon(acc.type)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black truncate leading-tight uppercase">{acc.assetTag}</p>
                          <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest truncate">{acc.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-2.5 text-center">
                      <span className={cn(
                        "text-[8px] font-black uppercase px-2 py-0.5 rounded-md border tracking-tighter",
                        getStatusColor(acc.status)
                      )}>
                        {getStatusLabel(acc.status)}
                      </span>
                    </td>

                    <td className="px-4 py-2.5 text-center">
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-[0.1em]",
                        acc.condition === 'excellent' ? "text-green-500" : acc.condition === 'good' ? "text-primary" : "text-amber-500"
                      )}>
                        {acc.condition.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-2.5">
                      {acc.currentEmployee ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden">
                            {acc.currentEmployee.photoPath ? (
                              <img src={acc.currentEmployee.photoPath} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[9px] font-black text-muted-foreground/40 uppercase">
                                {acc.currentEmployee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold truncate leading-tight group-hover:text-primary transition-colors">{acc.currentEmployee.fullName}</p>
                            <p className="text-[8px] font-black uppercase text-muted-foreground/30 tracking-widest">{acc.currentEmployee.employeeCode}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[9px] font-black text-muted-foreground/10 italic uppercase tracking-widest">In Warehouse</span>
                      )}
                    </td>

                    <td className="px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold truncate leading-tight text-muted-foreground/60">{acc.serialNumber || 'No SN'}</p>
                        <p className="text-[8px] font-black uppercase text-muted-foreground/30 tracking-widest truncate">{acc.make || 'Generic'} {acc.model || ''}</p>
                      </div>
                    </td>

                    <td className="px-4 py-2.5 text-right pr-6">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {canEditAccessories && (
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/it/accessories/${acc.id}`); }}
                          className="p-1.5 hover:bg-primary/10 text-muted-foreground/40 hover:text-primary rounded-lg transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        )}
                        {canDeleteAccessories && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(acc.id, acc.assetTag); }}
                          disabled={deleting === acc.id}
                          className="p-1.5 hover:bg-red-500/10 text-muted-foreground/40 hover:text-red-500 rounded-lg transition-all disabled:opacity-50"
                        >
                          {deleting === acc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info strip */}
        <div className="shrink-0 bg-white/[0.02] border-t border-white/5 px-6 py-2 flex items-center justify-between">
          <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
            Accessory Inventory System · Authorized Personnel Access Only
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">Database Synchronized</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Import Preview Modal ── */}
      {showImportModal && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-6xl bg-card border border-border rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Upload className="w-5 h-5 text-primary" />
                  Accessory Ingestion & Validation
                </h3>
                <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest">
                  Review hardware details, unit conditions, and assignments before bulk registry.
                </p>
              </div>
              <div className="flex items-center gap-4">
                 <span className="text-[10px] font-black uppercase bg-muted px-4 py-1.5 rounded-full border border-border/50">
                  {importRecords.filter(r => r.isValid).length} / {importRecords.length} Valid
                </span>
                <button onClick={() => setShowImportModal(false)} className="p-3 hover:bg-muted rounded-2xl transition-all"><X className="w-6 h-6" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {validatingImport ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Running integrity checks...</p>
                </div>
              ) : (
                <div className="rounded-3xl border border-border overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-muted/40 text-[9px] font-black uppercase tracking-widest sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 w-20">Status</th>
                        <th className="px-4 py-4 w-40">Asset Tag</th>
                        <th className="px-4 py-4 w-48">Type & Model</th>
                        <th className="px-4 py-4 w-40">Assigned To</th>
                        <th className="px-6 py-4">Validation Intelligence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 bg-card/50">
                      {importRecords.map((record, i) => (
                        <tr key={i} className={cn("text-[11px] transition-all hover:bg-muted/10", !record.isValid && "bg-red-500/5")}>
                          <td className="px-6 py-4 text-center">
                            {record.isValid ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <AlertTriangle className="w-4 h-4 text-red-500 mx-auto" />}
                          </td>
                          <td className="px-4 py-4 font-mono font-black">{record.assetTag}</td>
                          <td className="px-4 py-4 font-bold uppercase">
                            <span className="text-primary">{record.type}</span>
                            <span className="mx-2 text-muted-foreground/30">•</span>
                            <span className="opacity-60">{record.make} {record.model || 'Generic'}</span>
                          </td>
                          <td className="px-4 py-4 font-mono font-bold text-foreground/70">{record.employeeCode || <span className="opacity-20 italic">UNASSIGNED</span>}</td>
                          <td className="px-6 py-4">
                            {record.errors?.map((err, ei) => <p key={ei} className="text-red-500 font-black text-[9px] uppercase tracking-tight leading-tight">• {err}</p>)}
                            {record.isValid && <p className="text-green-500/60 font-black text-[9px] uppercase tracking-tight">Verified & Secure</p>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-border bg-muted/20 flex justify-end gap-4">
              <button onClick={() => setShowImportModal(false)} className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-all">Cancel Batch</button>
              <button
                disabled={importRecords.filter(r => r.isValid).length === 0 || importing}
                onClick={processImport}
                className="px-10 py-3.5 bg-primary text-primary-foreground rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-3 disabled:opacity-30"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? "Processing Batch..." : `Finalize Entry (${importRecords.filter(r => r.isValid).length} Units)`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
