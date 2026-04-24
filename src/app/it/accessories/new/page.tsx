"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  Barcode,
  Box,
  Tag,
  Layers,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/SearchableSelect";

const ACCESSORY_TYPES = [
  { value: "Monitor", label: "Monitor", icon: Box },
  { value: "Keyboard", label: "Keyboard", icon: Box },
  { value: "Mouse", label: "Mouse", icon: Box },
  { value: "Webcam", label: "Webcam", icon: Box },
  { value: "Headset", label: "Headset", icon: Box },
  { value: "Docking Station", label: "Docking Station", icon: Box },
];

const CONDITIONS = [
  { value: "Excellent", label: "Excellent - Like New" },
  { value: "Good", label: "Good - Normal Wear" },
  { value: "Fair", label: "Fair - Visible Wear" },
];

const STATUS_OPTIONS = [
  { value: "available", label: "Available - In Stock" },
  { value: "in_use", label: "In Use - With Employee" },
  { value: "in_repair", label: "In Repair - Being Serviced" },
  { value: "retired", label: "Retired - Out of Service" },
];

export default function NewAccessoryPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    assetTag: "",
    type: "Monitor",
    model: "",
    serialNumber: "",
    condition: "Good",
    status: "available",
    currentEmployeeId: "",
  });

  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch("/api/employees");
        const data = await response.json();
        const formatted = data.map((emp: any) => ({
          value: emp.id,
          label: `${emp.fullName} (${emp.employeeCode})`,
        }));
        setEmployees(formatted);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
  }, []);

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);

    try {
      if (!formData.assetTag.trim()) {
        setError("Asset tag is required");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/accessories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create");

      setSubmitSuccess(true);
      setTimeout(() => router.push("/it/accessories"), 2000);
    } catch (error: any) {
      setError(error.message || "Failed to create accessory");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tight">
            Accessory Registered
          </h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
            {formData.assetTag} has been added to the inventory.
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold animate-pulse">
          Redirecting to accessories...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in text-sm relative pb-20">
      {/* Page Header (Sticky) */}
      <div className="sticky top-14 z-[100] bg-background/80 backdrop-blur-xl -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-2 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Link
              href="/it/accessories"
              className="p-2 hover:bg-white/5 rounded-xl border border-white/5 transition-all text-muted-foreground/60 hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-xl font-black tracking-tight bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent uppercase leading-none">
              Register Accessory
            </h2>
          </div>
          <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest italic pl-14">
            Inventory Accessories Enrollment
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <Link
            href="/it/accessories"
            className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-all"
          >
            Discard
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-10 py-3 bg-primary text-primary-foreground rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/10 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {submitting ? "Registering..." : "Register Accessory"}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-3 animate-fade-in">
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form (8 Cols) */}
        <div className="xl:col-span-8 space-y-6">
          {/* Section 1: Accessory Identity */}
          <div className="premium-card p-6 rounded-[32px] border border-white/5 relative group z-50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:scale-110 transition-transform" />

            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 relative z-10">
              <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
              <span>1. Accessory Identity</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 relative z-[60]">
              {/* Asset Tag */}
              <div className="group/field space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85 ml-1">
                  Asset Tag *
                </label>
                <div className="relative">
                  <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <input
                    type="text"
                    placeholder="MONITOR-2026-001"
                    value={formData.assetTag}
                    onChange={(e) =>
                      setFormData({ ...formData, assetTag: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl outline-none focus:border-primary/50 focus:bg-white/5 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Type */}
              <div className="group/field space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85 ml-1">
                  Type *
                </label>
                <SearchableSelect
                  options={ACCESSORY_TYPES.map(t => ({ value: t.value, label: t.label }))}
                  value={formData.type}
                  onChange={(val) => setFormData({ ...formData, type: val })}
                  placeholder="Select accessory type..."
                  icon={<Tag className="w-4 h-4" />}
                />
              </div>

              {/* Model */}
              <div className="group/field space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85 ml-1">
                  Model
                </label>
                <input
                  type="text"
                  placeholder="e.g., Dell U2719D"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl outline-none focus:border-primary/50 focus:bg-white/5 transition-all text-sm"
                />
              </div>

              {/* Serial Number */}
              <div className="group/field space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85 ml-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  placeholder="e.g., SN123456789"
                  value={formData.serialNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, serialNumber: e.target.value })
                  }
                  className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl outline-none focus:border-primary/50 focus:bg-white/5 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Status & Condition */}
          <div className="premium-card p-6 rounded-[32px] border border-white/5 relative group z-40">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] pointer-events-none group-hover:scale-110 transition-transform" />

            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-secondary mb-6 relative z-10">
              <div className="w-1.5 h-1.5 bg-secondary rounded-full shadow-[0_0_8px_var(--secondary)]" />
              <span>2. Status & Condition</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 relative z-[60]">
              {/* Status */}
              <div className="group/field space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85 ml-1">
                  Status
                </label>
                <SearchableSelect
                  options={STATUS_OPTIONS}
                  value={formData.status}
                  onChange={(val) => setFormData({ ...formData, status: val })}
                  placeholder="Select status..."
                />
              </div>

              {/* Condition */}
              <div className="group/field space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85 ml-1">
                  Condition
                </label>
                <SearchableSelect
                  options={CONDITIONS}
                  value={formData.condition}
                  onChange={(val) => setFormData({ ...formData, condition: val })}
                  placeholder="Select condition..."
                />
              </div>

              {/* Assignment (Optional) */}
              <div className="group/field space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85 ml-1">
                  Assign To Employee (Optional)
                </label>
                <SearchableSelect
                  options={employees}
                  value={formData.currentEmployeeId}
                  onChange={(val) => {
                    setFormData({ 
                      ...formData, 
                      currentEmployeeId: val,
                      status: val ? "in_use" : formData.status 
                    });
                  }}
                  placeholder="Search by name or employee code..."
                  icon={<UserPlus className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Summary (4 Cols) */}
        <div className="xl:col-span-4 space-y-4">
          <div className="premium-card p-6 rounded-[32px] border border-white/5 relative group sticky top-32">
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-[100px] pointer-events-none group-hover:scale-110 transition-transform" />

            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-6 relative z-10">
              <div className="w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_8px_var(--accent)]" />
              <span>Summary</span>
            </div>

            <div className="space-y-4 relative z-[60]">
              <div className="space-y-1">
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-bold">
                  Asset Tag
                </p>
                <p className="text-sm font-black tracking-tight truncate">
                  {formData.assetTag || "—"}
                </p>
              </div>

              <div className="h-px bg-white/5" />

              <div className="space-y-1">
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-bold">
                  Type
                </p>
                <p className="text-sm font-black tracking-tight">
                  {formData.type}
                </p>
              </div>

              <div className="h-px bg-white/5" />

              <div className="space-y-1">
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-bold">
                  Model
                </p>
                <p className="text-sm font-black tracking-tight">
                  {formData.model || "—"}
                </p>
              </div>

              <div className="h-px bg-white/5" />

              <div className="space-y-1">
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-bold">
                  Condition
                </p>
                <p className="text-sm font-black tracking-tight">
                  {formData.condition}
                </p>
              </div>

              <div className="h-px bg-white/5" />

              <div className="space-y-1">
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-bold">
                  Status
                </p>
                <p className="text-sm font-black tracking-tight capitalize">
                  {formData.status.replace("_", " ")}
                </p>
              </div>

              {formData.currentEmployeeId && (
                <>
                  <div className="h-px bg-white/5" />
                  <div className="space-y-1">
                    <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-bold">
                      Assigned To
                    </p>
                    <p className="text-sm font-black tracking-tight text-primary">
                      {employees.find(e => e.value === formData.currentEmployeeId)?.label || "Selected Employee"}
                    </p>
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
