"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Edit2,
  Trash2,
  UserPlus,
  Barcode,
  Box,
  Tag,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/SearchableSelect";

interface AccessoryDetail {
  id: string;
  assetTag: string;
  type: string;
  model?: string;
  serialNumber?: string;
  status: string;
  condition: string;
  currentEmployeeId?: string | null;
  currentEmployee?: {
    id: string;
    fullName: string;
    employeeCode: string;
    photoPath?: string | null;
  } | null;
  createdAt: string;
}

const ACCESSORY_TYPES = [
  { value: "Monitor", label: "Monitor" },
  { value: "Keyboard", label: "Keyboard" },
  { value: "Mouse", label: "Mouse" },
  { value: "Webcam", label: "Webcam" },
  { value: "Headset", label: "Headset" },
  { value: "Docking Station", label: "Docking Station" },
];

const CONDITIONS = [
  { value: "excellent", label: "Excellent - Like New" },
  { value: "good", label: "Good - Normal Wear" },
  { value: "fair", label: "Fair - Visible Wear" },
];

const STATUS_OPTIONS = [
  { value: "available", label: "Available - In Stock" },
  { value: "assigned", label: "In Use - With Employee" },
  { value: "in_repair", label: "In Repair - Being Serviced" },
  { value: "retired", label: "Retired - Out of Service" },
];

export default function AccessoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const accessoryId = params.id as string;

  const [accessory, setAccessory] = useState<AccessoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    model: "",
    status: "available",
    condition: "good",
    currentEmployeeId: "",
  });
  const [employees, setEmployees] = useState<{ value: string; label: string; image?: string | null; initials: string }[]>([]);

  useEffect(() => {
    fetchAccessory();
    fetchEmployees();
  }, [accessoryId]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      const formatted = data.map((emp: any) => ({
        value: emp.id,
        label: `${emp.fullName} (${emp.employeeCode})`,
        image: emp.photoPath,
        initials: emp.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
      }));
      setEmployees(formatted);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchAccessory = async () => {
    try {
      const res = await fetch(`/api/accessories/${accessoryId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAccessory(data);
      setFormData({
        model: data.model || "",
        status: data.status,
        condition: data.condition,
        currentEmployeeId: data.currentEmployeeId || "",
      });
    } catch (error) {
      console.error("Failed to fetch accessory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!accessory) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/accessories/${accessoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      setAccessory(updated);
      setEditing(false);
      alert("Accessory updated successfully!");
    } catch (error) {
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${accessory?.assetTag}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/accessories/${accessoryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      alert("Accessory deleted successfully!");
      router.push("/it/accessories");
    } catch (error) {
      alert("Failed to delete accessory");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 animate-pulse">Accessing Hardware Vault...</p>
      </div>
    );
  }

  if (!accessory) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mx-auto mb-6">
          <Trash2 className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight">Record Nullified</h3>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-2">Accessory has been purged or does not exist.</p>
        <Link href="/it/accessories" className="inline-block mt-8 text-primary font-black uppercase tracking-widest text-[10px] hover:underline underline-offset-8 transition-all">← Back to Registry</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in text-sm relative pb-20">
      {/* Sticky Header */}
      <div className="sticky top-14 z-[100] bg-background/80 backdrop-blur-xl -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-2 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/it/accessories" className="p-2 hover:bg-white/5 rounded-xl border border-white/5 transition-all text-muted-foreground/60 hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-black tracking-tight uppercase leading-none">{accessory.assetTag}</h2>
            <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest italic mt-1">{accessory.type} • System Metadata</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={handleDelete} disabled={deleting} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-all flex items-center gap-2">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Purge Record
          </button>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="px-10 py-3 bg-primary text-primary-foreground rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/10 hover:scale-[1.03] transition-all flex items-center gap-3">
              <Edit2 className="w-5 h-5" />
              Unlock For Edit
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="px-10 py-3 bg-green-600 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-md shadow-green-600/10 hover:scale-[1.03] transition-all flex items-center gap-3">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {saving ? "Commiting..." : "Commit Changes"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Details */}
        <div className="xl:col-span-8 space-y-6">
          {/* Identity Section */}
          <div className="premium-card p-6 rounded-[32px] border border-white/5 relative group z-50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:scale-110" />
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 relative z-10">
              <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
              <span>1. Accessory Identity</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 relative z-[60]">
              <div className="space-y-1 opacity-80">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Asset Tag</p>
                <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl">
                  <Barcode className="w-4 h-4 text-muted-foreground/30" />
                  <span className="text-sm font-black">{accessory.assetTag}</span>
                </div>
              </div>

              <div className="space-y-1 opacity-80">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Hardware Type</p>
                <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl">
                  <Tag className="w-4 h-4 text-muted-foreground/30" />
                  <span className="text-sm font-black uppercase">{accessory.type}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Model Name</p>
                {editing ? (
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-3.5 bg-white/[0.05] border border-primary/20 rounded-2xl outline-none focus:border-primary transition-all text-sm font-bold"
                  />
                ) : (
                  <div className="px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold">
                    {accessory.model || "—"}
                  </div>
                )}
              </div>

              <div className="space-y-1 opacity-80">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Serial Registry</p>
                <div className="px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold">
                  {accessory.serialNumber || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="premium-card p-6 rounded-[32px] border border-white/5 relative group z-40">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] pointer-events-none group-hover:scale-110" />
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-secondary mb-6 relative z-10">
              <div className="w-1.5 h-1.5 bg-secondary rounded-full shadow-[0_0_8px_var(--secondary)]" />
              <span>2. Status & Condition</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 relative z-[60]">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85 ml-1">Current Status</label>
                {editing ? (
                  <SearchableSelect
                    options={STATUS_OPTIONS}
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                  />
                ) : (
                  <div className="px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold uppercase">
                    {accessory.status.replace("_", " ")}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85 ml-1">Physical Condition</label>
                {editing ? (
                  <SearchableSelect
                    options={CONDITIONS}
                    value={formData.condition}
                    onChange={(val) => setFormData({ ...formData, condition: val })}
                  />
                ) : (
                  <div className="px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold uppercase">
                    {accessory.condition}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85 ml-1">Assigned Associate</label>
                {editing ? (
                  <SearchableSelect
                    options={employees}
                    value={formData.currentEmployeeId}
                    onChange={(val) => setFormData({ ...formData, currentEmployeeId: val, status: val ? "assigned" : formData.status })}
                    icon={<UserPlus className="w-4 h-4" />}
                    showAvatars
                  />
                ) : accessory.currentEmployee ? (
                  <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl group hover:border-primary/30 transition-all">
                    <div className="relative group/avatar">
                      {accessory.currentEmployee.photoPath ? (
                        <img src={accessory.currentEmployee.photoPath} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-black text-primary">
                          {accessory.currentEmployee.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase leading-tight">{accessory.currentEmployee.fullName}</p>
                      <p className="text-[9px] opacity-40 font-black uppercase tracking-[0.2em] mt-1">{accessory.currentEmployee.employeeCode}</p>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                    Unassigned — In Stock Inventory
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Summary */}
        <div className="xl:col-span-4 space-y-4">
          <div className="premium-card p-6 rounded-[32px] border border-white/5 relative group sticky top-32">
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-[100px] pointer-events-none group-hover:scale-110" />
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-6 relative z-10">
              <div className="w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_8px_var(--accent)]" />
              <span>Live Summary</span>
            </div>

            <div className="space-y-4 relative z-[60]">
              <div className="space-y-1">
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-black">Asset Tag</p>
                <p className="text-sm font-black tracking-tight">{accessory.assetTag}</p>
              </div>
              <div className="h-px bg-white/5" />
              <div className="space-y-1">
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-black">Category</p>
                <p className="text-sm font-black tracking-tight">{accessory.type}</p>
              </div>
              <div className="h-px bg-white/5" />
              <div className="space-y-1">
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-black">Hardware Model</p>
                <p className="text-sm font-black tracking-tight">{formData.model || accessory.model || "—"}</p>
              </div>
              <div className="h-px bg-white/5" />
              <div className="space-y-1">
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-black">Current Status</p>
                <p className={cn("text-sm font-black tracking-tight uppercase", formData.status === 'available' ? "text-green-500" : "text-primary")}>
                  {formData.status.replace("_", " ")}
                </p>
              </div>
              <div className="h-px bg-white/5" />
              <div className="space-y-1">
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-black">Condition</p>
                <p className="text-sm font-black tracking-tight uppercase">{formData.condition}</p>
              </div>

              {formData.currentEmployeeId && (
                <>
                  <div className="h-px bg-white/5" />
                  <div className="space-y-3">
                    <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-black">Assigned To</p>
                    <div className="flex items-center gap-3 p-2 bg-primary/5 border border-primary/10 rounded-xl">
                      <div className="relative">
                        {employees.find(e => e.value === formData.currentEmployeeId)?.image ? (
                          <img 
                            src={employees.find(e => e.value === formData.currentEmployeeId)?.image!} 
                            className="w-8 h-8 rounded-lg object-cover border border-white/10"
                            alt=""
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary uppercase">
                            {employees.find(e => e.value === formData.currentEmployeeId)?.initials || "???"}
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] font-black tracking-tight text-primary uppercase truncate">
                        {employees.find(e => e.value === formData.currentEmployeeId)?.label || "Active Assignment"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
