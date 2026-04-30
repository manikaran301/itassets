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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Papa from "papaparse";
import { SearchableSelect } from "@/components/SearchableSelect";

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
    fetchAccessories();
  }, []);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 animate-pulse">Scanning Hardware Registry...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in pt-4 px-6 space-y-4">
      {/* Header & Stats Strip */}
      <div className="shrink-0 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight leading-none">Accessory Inventory</h1>
            <p className="text-[10px] font-bold text-muted-foreground/50 mt-1 uppercase tracking-widest">Managing {accessories.length} components in active stock</p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {[
            { label: "Available", count: accessories.filter(a => a.status === 'available').length, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "In Use", count: accessories.filter(a => a.status === 'assigned').length, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Repair", count: accessories.filter(a => a.status === 'in_repair').length, color: "text-amber-500", bg: "bg-amber-500/10" }
          ].map(s => (
            <div key={s.label} className={cn("px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-3", s.bg)}>
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{s.label}</span>
              <span className={cn("text-xs font-black", s.color)}>{s.count}</span>
            </div>
          ))}
          
          <div className="h-8 w-px bg-white/10 mx-1" />
          
          <div className="flex items-center gap-2">
            <input type="file" id="accessory-import" accept=".csv" className="hidden" onChange={handleFileUpload} />
            <label htmlFor="accessory-import" className="p-2 bg-muted/30 hover:bg-muted/50 rounded-lg border border-white/5 transition-all cursor-pointer" title="Import CSV">
              <Upload className="w-4 h-4 text-muted-foreground" />
            </label>
            <button onClick={handleExport} className="p-2 bg-muted/30 hover:bg-muted/50 rounded-lg border border-white/5 transition-all" title="Export CSV">
              <Download className="w-4 h-4 text-muted-foreground" />
            </button>
            <Link href="/it/accessories/new" className="ml-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />
              Add Unit
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="shrink-0 bg-card/40 border border-white/5 p-1.5 rounded-2xl flex flex-col md:flex-row gap-2 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="FILTER BY TAG, MODEL, SERIAL, OR ASSOCIATE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent pl-11 pr-4 py-2 rounded-xl text-[10px] font-bold border border-transparent focus:bg-background/40 outline-none transition-all placeholder:text-[8px] placeholder:font-black placeholder:tracking-widest"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="w-40">
            <SearchableSelect
              options={[{ value: "all", label: "ALL TYPES" }, ...ACCESSORY_TYPES.map(type => ({ value: type, label: type.toUpperCase() }))]}
              value={typeFilter}
              onChange={(val) => setTypeFilter(val || "all")}
              placeholder="CATEGORY"
              compact
            />
          </div>
          <div className="w-40">
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

      {/* High-Density Table Grid */}
      <div className="flex-1 min-h-0 bg-card/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        <div className="overflow-auto scrollbar-hide flex-1">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-10 bg-[#0f1115]/95 backdrop-blur-md">
              <tr className="border-b border-white/5">
                <th className="w-[18%] px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Identifier & Unit</th>
                <th className="w-[12%] px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 text-center">Status</th>
                <th className="w-[12%] px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 text-center">Condition</th>
                <th className="w-[22%] px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Current Stakeholder</th>
                <th className="w-[20%] px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Serial / Make</th>
                <th className="w-[10%] px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 text-right pr-6">Actions</th>
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
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/it/accessories/${acc.id}`); }}
                          className="p-1.5 hover:bg-primary/10 text-muted-foreground/40 hover:text-primary rounded-lg transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(acc.id, acc.assetTag); }}
                          disabled={deleting === acc.id}
                          className="p-1.5 hover:bg-red-500/10 text-muted-foreground/40 hover:text-red-500 rounded-lg transition-all disabled:opacity-50"
                        >
                          {deleting === acc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
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
          <div className="w-full max-w-6xl bg-card border border-white/5 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-muted/20">
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase tracking-tight">Bulk Accessory Ingestion</h3>
                <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest">Validating stream data against global registry</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-auto p-8">
              {validatingImport ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Running integrity checks...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex gap-6 mb-8">
                    <div className="flex-1 p-6 rounded-[32px] bg-green-500/5 border border-green-500/10 text-center">
                      <p className="text-[10px] font-black uppercase text-green-500/60 mb-1">Ready for Import</p>
                      <p className="text-3xl font-black text-green-500">{importRecords.filter(r => r.isValid).length}</p>
                    </div>
                    <div className="flex-1 p-6 rounded-[32px] bg-red-500/5 border border-red-500/10 text-center">
                      <p className="text-[10px] font-black uppercase text-red-500/60 mb-1">Conflict Detected</p>
                      <p className="text-3xl font-black text-red-500">{importRecords.filter(r => !r.isValid).length}</p>
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-white/5 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-muted/40 text-[9px] font-black uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-4 py-4">Asset Tag</th>
                          <th className="px-4 py-4">Type & Model</th>
                          <th className="px-4 py-4">Employee Code</th>
                          <th className="px-6 py-4">Validation Intelligence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {importRecords.map((record, i) => (
                          <tr key={i} className="text-[11px] bg-white/[0.01]">
                            <td className="px-6 py-4 text-center">
                              {record.isValid ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <AlertTriangle className="w-4 h-4 text-red-500 mx-auto" />}
                            </td>
                            <td className="px-4 py-4 font-black">{record.assetTag}</td>
                            <td className="px-4 py-4 opacity-60 font-bold uppercase">{record.type} • {record.model || 'Generic'}</td>
                            <td className="px-4 py-4 font-mono font-bold text-primary">{record.employeeCode || '-'}</td>
                            <td className="px-6 py-4">
                              {record.errors?.map((err, ei) => <p key={ei} className="text-red-500 font-black text-[9px] uppercase tracking-tight mb-1">• {err}</p>)}
                              {record.isValid && <p className="text-green-500/60 font-black text-[9px] uppercase tracking-tight">Verified & Secure</p>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-white/5 bg-muted/20 flex justify-end gap-4">
              <button onClick={() => setShowImportModal(false)} className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-all">Cancel Batch</button>
              <button
                disabled={importRecords.filter(r => r.isValid).length === 0 || importing}
                onClick={processImport}
                className="px-10 py-3.5 bg-primary text-primary-foreground rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-3 disabled:opacity-30"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? "Processing Batch..." : `Finalize Import (${importRecords.filter(r => r.isValid).length} Units)`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
