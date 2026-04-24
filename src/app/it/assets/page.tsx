"use client";

import {
  Monitor,
  Server,
  Search,
  Plus,
  ShieldCheck,
  Package,
  Wrench,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Edit2,
  Trash2,
  HardDrive,
  ChevronDown,
  ScreenShare,
  Boxes,
  Copy,
  User,
  Upload,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  X,
  Download,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { AssetListItem } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SearchableSelect } from "@/components/SearchableSelect";

// ── Asset Import Preview Modal ────────────────────────────────────────────────
interface AssetImportRecord {
  id: string;
  assetTag: string;
  type: string;
  make: string;
  model: string;
  serialNumber: string;
  macAddress: string;
  ipAddress: string;
  cpu: string;
  ramGb: string;
  ssdGb: string;
  hddGb: string;
  os: string;
  status: string;
  employeeCode: string;
  purchaseDate?: string;
  cost?: string;
  notes: string;
  isValid: boolean;
  error?: string;
}

function AssetImportPreviewModal({
  data,
  onClose,
  onImport,
}: {
  data: AssetImportRecord[];
  onClose: () => void;
  onImport: (finalData: any[]) => Promise<void>;
}) {
  const [records, setRecords] = useState<AssetImportRecord[]>(data);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const validateRecords = async (recordsToValidate: AssetImportRecord[]) => {
    setIsValidating(true);
    try {
      const res = await fetch("/api/assets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: recordsToValidate }),
      });
      const data = await res.json();
      if (data.results) {
        setRecords((prev) =>
          prev.map((r) => {
            const validation = data.results.find((v: any) => v.id === r.id);
            if (validation) {
              return { ...r, isValid: validation.isValid, error: validation.error };
            }
            return r;
          })
        );
      }
    } catch (error) {
      console.error("Validation error:", error);
    } finally {
      setIsValidating(false);
    }
  };

  const updateRecord = (id: string, field: keyof AssetImportRecord, value: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleFinalImport = async () => {
    const validRecords = records.filter((r) => r.isValid);
    if (validRecords.length === 0) {
      alert("No valid records to import");
      return;
    }
    setIsSubmitting(true);
    await onImport(validRecords);
    setIsSubmitting(false);
  };

  const modalContent = (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999 }} className="flex items-center justify-center p-4">
      <div style={{ position: "fixed", inset: 0 }} className="bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-7xl h-[85vh] bg-card border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              Asset Registry Import & Validation
            </h2>
            <p className="text-[10px] text-muted-foreground/60 mt-1 font-bold">
              Review asset tags, serial numbers and assignments before bulk registry.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase bg-muted px-3 py-1 rounded-full">
              {records.filter(r => r.isValid).length} / {records.length} Valid
            </span>
            <button
              onClick={() => validateRecords(records)}
              disabled={isValidating}
              className="p-2 hover:bg-white/5 rounded-xl transition-all text-primary flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              {isValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Re-Validate
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead className="sticky top-0 bg-card z-20">
              <tr className="bg-muted/30 border-b border-border/50">
                <th className="px-4 py-3 font-black uppercase tracking-widest text-muted-foreground/50">Status</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-muted-foreground/50">Asset Tag</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-muted-foreground/50">Type</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-muted-foreground/50">Make & Model</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-muted-foreground/50">Hardware Specs</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-muted-foreground/50">Serial / MAC</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-muted-foreground/50">Purchase Info</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-muted-foreground/50">Assign To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {records.map((record) => (
                <tr key={record.id} className={cn("hover:bg-white/5 transition-all", !record.isValid && "bg-red-500/5")}>
                  <td className="px-4 py-2">
                    {isValidating ? (
                      <Loader2 className="w-4 h-4 animate-spin opacity-20" />
                    ) : record.isValid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <div className="flex items-center gap-2 text-red-500">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-black uppercase text-[8px] whitespace-nowrap">{record.error || "Error"}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={record.assetTag}
                      onChange={(e) => updateRecord(record.id, "assetTag", e.target.value)}
                      className="w-full bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-1 font-bold uppercase"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={record.type}
                      onChange={(e) => updateRecord(record.id, "type", e.target.value)}
                      className="bg-transparent border-none outline-none font-black uppercase"
                    >
                      <option value="laptop">LAPTOP</option>
                      <option value="desktop">DESKTOP</option>
                      <option value="nuc">NUC</option>
                      <option value="server">SERVER</option>
                      <option value="other">OTHER</option>
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex gap-1">
                      <input
                        value={record.make}
                        placeholder="Make"
                        onChange={(e) => updateRecord(record.id, "make", e.target.value)}
                        className="w-1/2 bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-1 font-bold uppercase"
                      />
                      <input
                        value={record.model}
                        placeholder="Model"
                        onChange={(e) => updateRecord(record.id, "model", e.target.value)}
                        className="w-1/2 bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-1 font-bold uppercase"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex flex-col gap-1 min-w-[120px]">
                      <input
                        value={record.cpu}
                        placeholder="CPU"
                        onChange={(e) => updateRecord(record.id, "cpu", e.target.value)}
                        className="w-full bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-1 font-bold"
                      />
                      <div className="flex gap-1">
                        <input
                          value={record.ramGb}
                          placeholder="RAM"
                          onChange={(e) => updateRecord(record.id, "ramGb", e.target.value)}
                          className="w-1/2 bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-1 font-mono font-black"
                        />
                        <input
                          value={record.ssdGb || record.hddGb}
                          placeholder="Disk"
                          onChange={(e) => updateRecord(record.id, record.ssdGb ? "ssdGb" : "hddGb", e.target.value)}
                          className="w-1/2 bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-1 font-mono font-black"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex flex-col gap-1 min-w-[140px]">
                      <input
                        value={record.serialNumber}
                        placeholder="Serial"
                        onChange={(e) => updateRecord(record.id, "serialNumber", e.target.value)}
                        className="w-full bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-1 font-bold uppercase"
                      />
                      <input
                        value={record.macAddress}
                        placeholder="MAC"
                        onChange={(e) => updateRecord(record.id, "macAddress", e.target.value)}
                        className="w-full bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-1 text-[8px] font-bold"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex flex-col gap-1">
                      <input
                        type="date"
                        value={record.purchaseDate}
                        onChange={(e) => updateRecord(record.id, "purchaseDate", e.target.value)}
                        className="bg-transparent border-none outline-none font-bold"
                      />
                      <input
                        value={record.cost}
                        placeholder="Cost"
                        onChange={(e) => updateRecord(record.id, "cost", e.target.value)}
                        className="w-full bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-1 font-mono font-black"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={record.employeeCode}
                      placeholder="Emp Code"
                      onChange={(e) => updateRecord(record.id, "employeeCode", e.target.value)}
                      className="w-full bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-1 font-bold uppercase"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-white/5 flex items-center justify-between bg-muted/20">
          <p className="text-[10px] font-bold text-muted-foreground italic">
            * Assets with duplicate tags or missing required fields are marked in red.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-border hover:bg-white/5 transition-all">Cancel</button>
            <button
              onClick={handleFinalImport}
              disabled={isSubmitting || records.filter(r => r.isValid).length === 0}
              className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Finalize Registry
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<AssetListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<AssetImportRecord[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch("/api/assets");
        const data = await response.json();
        if (Array.isArray(data)) {
          setAssets(data);
        }
      } catch (error) {
        console.error("Failed to fetch assets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "available":
        return "bg-secondary/10 text-secondary border-secondary/20";
      case "assigned":
        return "bg-primary/10 text-primary border-primary/20";
      case "in_repair":
        return "bg-accent/10 text-accent border-accent/20";
      case "retired":
        return "bg-muted/50 text-muted-foreground border-border";
      case "lost":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-foreground border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available": return CheckCircle2;
      case "assigned": return ShieldCheck;
      case "in_repair": return Wrench;
      case "retired": return XCircle;
      case "lost": return AlertTriangle;
      default: return Package;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "laptop":
      case "desktop": return Monitor;
      case "n_computing": return ScreenShare;
      case "nuc": return Boxes;
      case "server": return Server;
      case "other": return HardDrive;
      default: return Package;
    }
  };

  const formatStatus = (status: string) => status.replace("_", " ");

  const filteredAssets = assets.filter((asset) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      asset.assetTag?.toLowerCase().includes(query) ||
      asset.make?.toLowerCase().includes(query) ||
      asset.model?.toLowerCase().includes(query) ||
      asset.serialNumber?.toLowerCase().includes(query) ||
      asset.currentEmployee?.fullName?.toLowerCase().includes(query);

    const matchesType = typeFilter === "all" || asset.type === typeFilter;
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    });
  };

  const handleDelete = async (id: string, tag: string) => {
    if (!confirm(`Permanently decommission asset ${tag}?`)) return;
    try {
      const response = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (response.ok) {
        setAssets((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleExport = () => {
    // Navigate directly to the export API which triggers a file download
    window.location.href = "/api/assets/export";
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        alert("Empty or invalid CSV");
        setImporting(false);
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim());
      const parsedRecords: AssetImportRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values: string[] = [];
        let currentValue = "";
        let insideQuotes = false;
        for (let j = 0; j < lines[i].length; j++) {
          const char = lines[i][j];
          if (char === '"') insideQuotes = !insideQuotes;
          else if (char === "," && !insideQuotes) {
            values.push(currentValue.trim());
            currentValue = "";
          } else currentValue += char;
        }
        values.push(currentValue.trim());

        const record: any = { id: Math.random().toString(36).substr(2, 9) };
        headers.forEach((header, index) => {
          record[header] = values[index] || "";
        });

        // Basic default validation
        record.isValid = !!record.assetTag;
        if (!record.isValid) record.error = "Missing tag";

        parsedRecords.push(record);
      }

      setPreviewData(parsedRecords);
      setImporting(false);
      e.target.value = ""; // Reset

      // Trigger server-side validation immediately
      fetch("/api/assets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: parsedRecords }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.results) {
            setPreviewData((prev) =>
              prev?.map((r) => {
                const v = data.results.find((res: any) => res.id === r.id);
                return v ? { ...r, isValid: v.isValid, error: v.error } : r;
              }) || null
            );
          }
        });
    };
    reader.readAsText(file);
  };

  const finalizeImport = async (finalRecords: any[]) => {
    try {
      const response = await fetch("/api/assets/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: finalRecords }),
      });
      const data = await response.json();

      if (data.success) {
        alert(`Registry Updated!\nImported: ${data.summary.imported}\nSkipped: ${data.summary.skipped}\nErrors: ${data.summary.errors}`);
        setPreviewData(null);
        window.location.reload(); // Refresh to show new assets
      } else {
        alert(`Import Failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to register assets.");
    }
  };

  const stats = [
    { label: "Total Assets", value: assets.length, icon: Boxes, color: "text-foreground bg-muted border-border" },
    { label: "Assigned Assets", value: assets.filter((a) => a.status === "assigned").length, icon: ShieldCheck, color: "text-primary bg-primary/10 border-primary/20" },
    { label: "Available", value: assets.filter((a) => a.status === "available").length, icon: CheckCircle2, color: "text-secondary bg-secondary/10 border-secondary/20" },
    { label: "Maintenance", value: assets.filter((a) => a.status === "in_repair").length, icon: Wrench, color: "text-accent bg-accent/10 border-accent/20" },
  ];

  return (
    <div className="space-y-4 animate-fade-in pb-20 pt-4">
      {previewData && (
        <AssetImportPreviewModal
          data={previewData}
          onClose={() => setPreviewData(null)}
          onImport={finalizeImport}
        />
      )}

      {/* Action Row */}
      <div className="flex justify-end items-center gap-2 px-1">
        <input
          type="file"
          id="asset-import"
          accept=".csv"
          className="hidden"
          onChange={handleImport}
          disabled={importing}
        />
        <label
          htmlFor="asset-import"
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground transition-all cursor-pointer",
            importing && "opacity-50 cursor-not-allowed"
          )}
        >
          {importing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          Import CSV
        </label>
        <a
          href="/templates/asset_import_template.csv"
          download
          className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Template
        </a>
        <button 
          onClick={handleExport}
          disabled={loading || filteredAssets.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>
        <Link href="/it/assets/new" className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> Register Asset
        </Link>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card border border-border/60 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
            <div className="space-y-0.5">
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">{stat.label}</p>
              <h4 className="text-xl font-black">{loading ? "..." : stat.value}</h4>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border border-transparent transition-all", stat.color.replace('bg-muted', 'bg-muted/50'))}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Unified Filter Strip */}
      <div className="bg-card/50 border border-border p-1.5 rounded-2xl flex flex-col lg:flex-row gap-2 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="SEARCH BY TAG, MAKE, MODEL, SERIAL OR EMPLOYEE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent pl-11 pr-4 py-2.5 rounded-xl text-[10px] font-bold border border-transparent focus:bg-background outline-none transition-all placeholder:text-[8px] placeholder:font-black placeholder:tracking-widest opacity-80"
          />
        </div>
        
        <div className="flex gap-2 w-full lg:w-auto">
          <div className="w-full lg:w-48">
            <SearchableSelect
              options={[
                { value: "all", label: "ALL TYPES" },
                { value: "laptop", label: "LAPTOPS" },
                { value: "desktop", label: "DESKTOPS" },
                { value: "n_computing", label: "N-COMPUTING" },
                { value: "nuc", label: "NUC" },
                { value: "server", label: "SERVERS" },
                { value: "other", label: "OTHER" }
              ]}
              value={typeFilter}
              onChange={(val) => setTypeFilter(val || "all")}
              placeholder="ALL TYPES"
              compact
            />
          </div>
          <div className="w-full lg:w-48">
            <SearchableSelect
              options={[
                { value: "all", label: "ALL STATUS" },
                { value: "available", label: "AVAILABLE" },
                { value: "assigned", label: "ASSIGNED" },
                { value: "in_repair", label: "IN REPAIR" },
                { value: "retired", label: "RETIRED" },
                { value: "lost", label: "LOST" }
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val || "all")}
              placeholder="ALL STATUS"
              compact
            />
          </div>
        </div>
      </div>

      {/* High-Density Grid Container */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Syncing Registry...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center opacity-30">
              <Boxes className="w-8 h-8" />
              <p className="text-[10px] font-black uppercase tracking-widest">No assets localized</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50">
                  <th className="pl-6 pr-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Asset Tag \ Type</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Make & Model</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Specifications</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">IP Address</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Assigned To \ Seat</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Status</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {filteredAssets.map((asset, idx) => {
                  const StatusIcon = getStatusIcon(asset.status);
                  const TypeIcon = getTypeIcon(asset.type);
                  return (
                    <tr
                      key={`${asset.id}-${idx}`}
                      className="group hover:bg-muted/20 cursor-pointer transition-all border-l-2 border-l-transparent hover:border-l-primary"
                      onClick={() => router.push(`/it/assets/${asset.id}`)}
                    >
                      <td className="pl-6 pr-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black tracking-tight">{asset.assetTag}</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">{asset.type}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-[10px] font-black uppercase">{asset.make || "Generic"}</p>
                        <p className="text-[9px] text-muted-foreground font-bold italic">{asset.model || "Standard"}</p>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {asset.cpu && <span className="text-[7px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-muted/60 border border-border text-foreground/70">{asset.cpu}</span>}
                          {asset.ramGb && <span className="text-[7px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-primary/5 border border-primary/10 text-primary">{asset.ramGb}GB</span>}
                          {asset.ssdGb && <span className="text-[7px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-secondary/5 border border-secondary/10 text-secondary">{asset.ssdGb}GB SSD</span>}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-[9px] font-bold opacity-60">
                        {asset.ipAddress || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {asset.currentEmployee ? (
                          <div className="flex items-center gap-3">
                            <div className="relative group/avatar">
                              {asset.currentEmployee.photoPath ? (
                                <img 
                                  src={asset.currentEmployee.photoPath} 
                                  alt={asset.currentEmployee.fullName}
                                  className="w-9 h-9 rounded-xl object-cover border border-white/10 group-hover/avatar:scale-110 transition-transform shadow-lg"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary uppercase group-hover/avatar:scale-110 transition-transform">
                                  {asset.currentEmployee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                              )}
                              {asset.currentEmployee.deskNumber && (
                                <div className="absolute -right-1.5 -bottom-1 px-1.5 py-0.5 bg-background border border-white/5 rounded-md text-[7px] font-black uppercase text-muted-foreground shadow-xl">
                                  {asset.currentEmployee.deskNumber}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <p className="text-[11px] font-black tracking-tight uppercase leading-none mb-1">{asset.currentEmployee.fullName}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] opacity-40 font-black uppercase tracking-widest">{asset.currentEmployee.employeeCode}</span>
                                {asset.currentEmployee.deskNumber && (
                                  <span className="text-[8px] text-primary/40 font-black uppercase tracking-widest leading-none">• SEAT {asset.currentEmployee.deskNumber}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 opacity-20">
                            <div className="w-9 h-9 rounded-xl bg-muted border border-border/50 flex items-center justify-center">
                              <User className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">In Store</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest", getStatusStyle(asset.status))}>
                          <StatusIcon className="w-3 h-3" />
                          {formatStatus(asset.status)}
                        </div>
                      </td>

                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={(e) => { e.stopPropagation(); router.push(`/it/assets/${asset.id}`); }} className="p-1.5 text-muted-foreground hover:text-primary transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(asset.id, asset.assetTag); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
