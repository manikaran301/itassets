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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Accessory {
  id: string;
  assetTag: string;
  type: string;
  model?: string;
  serialNumber?: string;
  status: string;
  condition: string;
  currentEmployeeId?: string | null;
  currentEmployee?: { fullName: string } | null;
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

export default function AccessoriesPage() {
  const router = useRouter();
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);

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
      console.error(error);
    } finally {
      setDeleting(null);
    }
  };

  // Calculate stats
  const stats = {
    total: accessories.length,
    assigned: accessories.filter((a) => a.currentEmployeeId).length,
    available: accessories.filter(
      (a) => !a.currentEmployeeId && a.status === "available",
    ).length,
    inRepair: accessories.filter((a) => a.status === "in_repair").length,
  };

  // Filter accessories
  const filteredAccessories = accessories.filter((acc) => {
    const matchesSearch =
      searchTerm === "" ||
      acc.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.currentEmployee?.fullName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || acc.type === typeFilter;
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
      case "assigned": // Database enum is "assigned", display as "in_use"
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
      case "assigned":
        return "In Use";
      case "available":
        return "Available";
      case "in_repair":
        return "In Repair";
      case "retired":
        return "Retired";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Action Row */}
      <div className="flex justify-end px-1">
        <Link
          href="/it/accessories/new"
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground hover:scale-[1.02] active:scale-95 rounded-2xl shadow-xl shadow-primary/20 transition-all text-[10px] font-black uppercase tracking-widest"
        >
          <Plus className="w-5 h-5" />
          Add Accessory
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                Total
              </p>
              <p className="text-2xl font-black tracking-tighter mt-2">
                {stats.total}
              </p>
            </div>
            <Package className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-4 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                Available
              </p>
              <p className="text-2xl font-black tracking-tighter mt-2">
                {stats.available}
              </p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl p-4 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                Assigned
              </p>
              <p className="text-2xl font-black tracking-tighter mt-2">
                {stats.assigned}
              </p>
            </div>
            <AlertTriangle className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-2xl p-4 border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                In Repair
              </p>
              <p className="text-2xl font-black tracking-tighter mt-2">
                {stats.inRepair}
              </p>
            </div>
            <Usb className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-end">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <input
            type="text"
            placeholder="Search asset tag, type, model, or employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card/40 border border-white/5 pl-12 pr-4 py-3 rounded-xl outline-none focus:border-primary/30 transition-all text-sm"
          />
        </div>

        <div className="w-full lg:w-48 relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-card/40 border border-white/5 pl-12 pr-4 py-3 rounded-xl outline-none focus:border-primary/30 transition-all text-sm appearance-none cursor-pointer"
          >
            <option value="all">All Types</option>
            {ACCESSORY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full lg:w-48 relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-card/40 border border-white/5 pl-12 pr-4 py-3 rounded-xl outline-none focus:border-primary/30 transition-all text-sm appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="in_repair">In Repair</option>
            <option value="retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="premium-card rounded-2xl overflow-hidden glass border-border/50 animate-fade-in delay-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Asset Tag
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Type
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Model
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Condition
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Currently With
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredAccessories.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No accessories found
                  </p>
                </td>
              </tr>
            ) : (
              filteredAccessories.map((acc) => (
                <tr
                  key={acc.id}
                  onClick={() => router.push(`/it/accessories/${acc.id}`)}
                  className="hover:bg-muted/20 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border group-hover:bg-primary/10">
                        {getTypeIcon(acc.type)}
                      </div>
                      <span className="text-sm font-black uppercase">
                        {acc.assetTag}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-semibold">{acc.type}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm text-muted-foreground">
                      {acc.model || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        getStatusColor(acc.status),
                      )}
                    >
                      {acc.status === "available" && (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {(acc.status === "in_repair" ||
                        acc.status === "assigned") && (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {getStatusLabel(acc.status)}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={cn(
                        "text-xs font-bold uppercase tracking-widest",
                        acc.condition === "excellent"
                          ? "text-green-600"
                          : acc.condition === "good"
                            ? "text-primary"
                            : "text-yellow-600",
                      )}
                    >
                      {acc.condition.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-medium">
                      {acc.currentEmployee?.fullName || (
                        <span className="text-muted-foreground/50">
                          In Store
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/it/accessories/${acc.id}`);
                        }}
                        className="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(acc.id, acc.assetTag);
                        }}
                        disabled={deleting === acc.id}
                        className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-xl transition-all disabled:opacity-50"
                      >
                        {deleting === acc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
