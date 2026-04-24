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
  currentEmployee?: { fullName: string; employeeCode: string; photoPath?: string | null } | null;
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
    <div className="space-y-6 animate-fade-in relative pb-20">
      
      {/* ── Premium Header & Actions ── */}
      <div className="sticky top-14 z-[100] bg-background/80 backdrop-blur-xl -mx-4 md:-mx-6 px-4 md:px-6 py-4 mb-2 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-end gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Import/Export Action Group */}
          <div className="flex items-center gap-2 mr-2">
            <input
              type="file"
              id="accessory-import"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="accessory-import"
              className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Import CSV
            </label>
            <a
              href="/templates/accessory_import_template.csv"
              download
              className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Template
            </a>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              Export
            </button>
          </div>

          <Link
            href="/it/accessories/new"
            className="px-8 py-3 bg-primary text-primary-foreground rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-3"
          >
            <Plus className="w-5 h-5" />
            Add Accessory
          </Link>
        </div>
      </div>

      {/* ── Compact Stats Overview ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Stock", value: accessories.length, icon: Package, color: "text-foreground bg-muted border-border" },
          { label: "In Operation", value: accessories.filter(a => a.status === 'assigned').length, icon: MousePointer2, color: "text-primary bg-primary/10 border-primary/20" },
          { label: "Available", value: accessories.filter(a => a.status === 'available').length, icon: CheckCircle2, color: "text-secondary bg-secondary/10 border-secondary/20" },
          { label: "Maintenance", value: accessories.filter(a => a.status === 'in_repair').length, icon: Usb, color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border/60 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all overflow-hidden relative">
            <div className="space-y-0.5 relative z-10">
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <h4 className="text-xl font-black">{stat.value}</h4>
                <span className="text-[8px] font-black text-muted-foreground/20 uppercase">Units</span>
              </div>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border border-transparent transition-all relative z-10", stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search Tag, Model, Serial, or Associate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-muted/20 border border-white/5 pl-14 pr-6 py-4 rounded-[22px] outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all text-xs font-bold"
          />
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <div className="w-full lg:w-48">
            <SearchableSelect
              options={[
                { value: "all", label: "All Types" },
                ...ACCESSORY_TYPES.map((type) => ({ value: type, label: type }))
              ]}
              value={typeFilter}
              onChange={(val) => setTypeFilter(val || "all")}
              placeholder="All Types"
              icon={<Filter className="w-4 h-4" />}
              compact
            />
          </div>

          <div className="w-full lg:w-48">
            <SearchableSelect
              options={[
                { value: "all", label: "All Status" },
                { value: "available", label: "Available" },
                { value: "assigned", label: "In Use" },
                { value: "in_repair", label: "In Repair" },
                { value: "retired", label: "Retired" }
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val || "all")}
              placeholder="All Status"
              icon={<Filter className="w-4 h-4" />}
              compact
            />
          </div>
        </div>
      </div>

      {/* ── Inventory Grid Table ── */}
      <div className="premium-card rounded-[32px] overflow-hidden border border-white/5 bg-card/20 relative group">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-white/5">
                <th className="pl-6 pr-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Identifier & Type</th>
                <th className="px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Condition</th>
                <th className="px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Status</th>
                <th className="px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Associate</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAccessories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/10" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">No matching accessories found in current cell</p>
                  </td>
                </tr>
              ) : (
                filteredAccessories.map((acc, idx) => (
                  <tr
                    key={acc.id}
                    onClick={() => router.push(`/it/accessories/${acc.id}`)}
                    className="group/row hover:bg-white/[0.03] transition-all cursor-pointer border-l-2 border-l-transparent hover:border-l-primary"
                  >
                    <td className="pl-6 pr-4 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 group-hover/row:scale-110 transition-transform">
                          {getTypeIcon(acc.type)}
                        </div>
                        <div>
                          <p className="text-xs font-black tracking-tight uppercase">{acc.assetTag}</p>
                          <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{acc.type.replace('_', ' ')} • {acc.model || 'Generic'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        acc.condition === 'excellent' ? "text-green-500" : 
                        acc.condition === 'good' ? "text-primary" : "text-yellow-500"
                      )}>
                        {acc.condition.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[8px] font-black uppercase tracking-widest transition-all shadow-sm",
                        getStatusColor(acc.status)
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", acc.status === 'available' ? "bg-green-500" : "bg-primary")} />
                        {getStatusLabel(acc.status)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {acc.currentEmployee ? (
                        <div className="flex items-center gap-3">
                          <div className="relative group/avatar">
                            {acc.currentEmployee.photoPath ? (
                              <img 
                                src={acc.currentEmployee.photoPath} 
                                alt={acc.currentEmployee.fullName}
                                className="w-9 h-9 rounded-xl object-cover border border-white/10 group-hover/avatar:scale-110 transition-transform shadow-lg"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary uppercase group-hover/avatar:scale-110 transition-transform">
                                {acc.currentEmployee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] font-black truncate max-w-[150px] uppercase leading-none mb-1">{acc.currentEmployee.fullName}</p>
                            <p className="text-[9px] opacity-40 font-black uppercase tracking-widest">{acc.currentEmployee.employeeCode}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[9px] font-black opacity-20 uppercase tracking-[0.2em] italic">In Warehouse</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-all">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/it/accessories/${acc.id}`); }}
                          className="p-2 hover:bg-primary/10 text-muted-foreground/40 hover:text-primary rounded-xl transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(acc.id, acc.assetTag); }}
                          disabled={deleting === acc.id}
                          className="p-2 hover:bg-red-500/10 text-muted-foreground/40 hover:text-red-500 rounded-xl transition-all disabled:opacity-50"
                        >
                          {deleting === acc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/20 ml-2" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
