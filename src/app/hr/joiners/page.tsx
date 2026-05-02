"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  ShieldCheck,
  Mail,
  Laptop,
  MapPin,
  Loader2,
  SendHorizonal,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Upload,
  X,
  FileSpreadsheet,
  Download,
  Plus,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { createPortal } from "react-dom";
import { usePermissions } from "@/hooks/usePermissions";
import Papa from "papaparse";
import { format } from "date-fns";

interface PipelineStep {
  status: string;
  label: string;
}

interface Joiner {
  id: string;
  employeeCode: string;
  fullName: string;
  department: string | null;
  companyName: string | null;
  locationJoining: string | null;
  deskNumber: string | null;
  startDate: string | null;
  photoPath: string | null;
  createdAt: string;
  pipeline: {
    identity: PipelineStep;
    hardware: PipelineStep;
    seating: PipelineStep;
    access: PipelineStep;
  };
  provisioningRequests: {
    id: string;
    requestCode: string;
    deviceTypeNeeded: string | null;
    specialRequirements: string | null;
    status: string;
  }[];
  isFullyOnboarded: boolean;
}

export default function JoinersPage() {
  const { data: session } = useSession();
  const [joiners, setJoiners] = useState<Joiner[]>([]);
  const [loading, setLoading] = useState(true);
  const [raising, setRaising] = useState<string | null>(null);

  // Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [onboardingStatus, setOnboardingStatus] = useState<
    "active" | "completed"
  >("active");

  const { checkPermission, loading: permsLoading } = usePermissions();

  // Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRecords, setImportRecords] = useState<{ id: string; isValid: boolean; error?: string; data: any }[]>([]);
  const [validatingImport, setValidatingImport] = useState(false);
  const [importingBatch, setImportingBatch] = useState(false);

  const validateImportRecords = async (recordsToValidate: any[]) => {
    setValidatingImport(true);
    try {
      const res = await fetch("/api/employees/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: recordsToValidate.map(r => r.data) }),
      });
      const data = await res.json();
      setImportRecords(data.results);
    } catch (err) {
      console.error("Validation error:", err);
      alert("Failed to validate import data");
    } finally {
      setValidatingImport(false);
    }
  };

  const updateImportRecord = (id: string, field: string, value: string) => {
    setImportRecords(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, data: { ...r.data, [field]: value } };
      }
      return r;
    }));
  };

  useEffect(() => {
    fetchJoiners();
  }, []);

  const fetchJoiners = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/joiners");
      const data = await res.json();
      setJoiners(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch joiners:", error);
    } finally {
      setLoading(false);
    }
  };

  // Derived filter options
  const companies = [
    ...new Set(
      joiners.map((j) => j.companyName).filter((c): c is string => !!c),
    ),
  ].sort();
  const departments = [
    ...new Set(
      joiners.map((j) => j.department).filter((d): d is string => !!d),
    ),
  ].sort();
  const locations = [
    ...new Set(
      joiners.map((j) => j.locationJoining).filter((l): l is string => !!l),
    ),
  ].sort();

  const filteredJoiners = joiners.filter((j) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      j.fullName.toLowerCase().includes(q) ||
      j.employeeCode.toLowerCase().includes(q) ||
      (j.department || "").toLowerCase().includes(q) ||
      (j.companyName || "").toLowerCase().includes(q);

    const matchesCompany =
      selectedCompany === "all" || j.companyName === selectedCompany;
    const matchesDept =
      selectedDepartment === "all" || j.department === selectedDepartment;
    const matchesLocation =
      selectedLocation === "all" || j.locationJoining === selectedLocation;

    const matchesStatus =
      onboardingStatus === "active" ? !j.isFullyOnboarded : j.isFullyOnboarded;

    return (
      matchesSearch &&
      matchesCompany &&
      matchesDept &&
      matchesLocation &&
      matchesStatus
    );
  });

  const raiseRequest = async (
    employeeId: string,
    type: "laptop" | "desktop" | "email",
  ) => {
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      alert("Session error. Please log in again.");
      return;
    }

    setRaising(`${employeeId}-${type}`);
    try {
      const payload: Record<string, unknown> = {
        employeeId,
        requestedBy: userId,
        priority: "normal",
      };

      if (type === "email") {
        payload.specialRequirements = "Email account provisioning";
      } else {
        payload.deviceTypeNeeded = type;
      }

      const res = await fetch("/api/provisioning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to raise request");
        return;
      }

      await fetchJoiners();
    } catch {
      alert("Something went wrong");
    } finally {
      setRaising(null);
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === "ready")
      return "bg-green-500/10 border-green-500/20 text-green-500";
    if (status === "awaiting_it")
      return "bg-blue-500/10 border-blue-500/20 text-blue-500 animate-pulse";
    if (status === "pending")
      return "bg-amber-500/10 border-amber-500/20 text-amber-500";
    return "bg-muted/10 border-white/10 text-muted-foreground";
  };

  const getStatusIcon = (status: string) => {
    if (status === "ready") return CheckCircle2;
    if (status === "awaiting_it") return Clock;
    return AlertCircle;
  };

  // Check if a request type already exists for this joiner
  const hasRequest = (joiner: Joiner, type: string) => {
    return joiner.provisioningRequests.some(
      (r) => r.deviceTypeNeeded === type && r.status !== "cancelled",
    );
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/joiners/export');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Onboarding_Pipeline_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data');
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
        const dataWithIds = rawData.map((d, i) => ({
          id: i.toString(),
          isValid: false,
          data: d
        }));
        setImportRecords(dataWithIds);
        setShowImportModal(true);
        await validateImportRecords(dataWithIds);
      },
    });
    e.target.value = "";
  };

  const processImport = async () => {
    const validRecords = importRecords.filter((r) => r.isValid).map(r => r.data);
    if (validRecords.length === 0) return;

    setImportingBatch(true);
    try {
      const res = await fetch("/api/employees/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: validRecords }),
      });

      if (!res.ok) throw new Error("Import failed");

      alert(`Successfully imported ${validRecords.length} employees!`);
      setShowImportModal(false);
      fetchJoiners();
    } catch (err) {
      console.error("Import error:", err);
      alert("Failed to complete import process");
    } finally {
      setImportingBatch(false);
    }
  };

  if (loading || permsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
          Synchronizing Pipeline Stream...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in text-sm px-1">
      {/* Action Strip */}
      <div className="shrink-0 py-4 flex justify-end items-center gap-2">
        <button onClick={fetchJoiners} className="p-2.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-muted-foreground transition-all">
          <Loader2 className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>

        {checkPermission("HR", "EMPLOYEES", "canImport") && (
          <>
            <input
              type="file"
              id="joiner-import"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="joiner-import"
              className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Joiners
            </label>

            <a
              href="/templates/employee_import_template.csv"
              download
              className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Template
            </a>
          </>
        )}

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
          Export Pipeline
        </button>

        {checkPermission("HR", "EMPLOYEES", "canCreate") && (
          <Link href="/hr/employees/new" className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <Plus className="w-4 h-4" /> Enroll Employee
          </Link>
        )}
      </div>

      {/* Header */}
      <div className="shrink-0 pb-4 space-y-4">
        {/* Unified Multi-Filter Ribbon */}
        <div className="bg-card/50 border border-border p-1.5 rounded-2xl flex flex-col lg:flex-row gap-2 items-center shrink-0">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="SEARCH BY NAME, CODE, DEPT, COMPANY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent pl-11 pr-4 py-2.5 rounded-xl text-[10px] font-bold border border-transparent focus:bg-background outline-none transition-all placeholder:text-[8px] placeholder:font-black placeholder:tracking-widest opacity-80"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <select
              value={onboardingStatus}
              onChange={(e) =>
                setOnboardingStatus(e.target.value as "active" | "completed")
              }
              className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]"
            >
              <option value="active">ACTIVE JOINERS</option>
              <option value="completed">COMPLETED</option>
            </select>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]"
            >
              <option value="all">COMPANIES</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c.toUpperCase()}
                </option>
              ))}
            </select>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]"
            >
              <option value="all">DEPARTMENTS</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d.toUpperCase()}
                </option>
              ))}
            </select>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]"
            >
              <option value="all">LOCATIONS</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pipeline Legend */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              icon: ShieldCheck,
              label: "Identity",
              desc: "HR Verified",
              color: "text-green-500 bg-green-500/10",
            },
            {
              icon: Laptop,
              label: "Hardware",
              desc: "IT Asset",
              color: "text-primary bg-primary/10",
            },
            {
              icon: MapPin,
              label: "Seating",
              desc: "Desk Alloc.",
              color: "text-amber-500 bg-amber-500/10",
            },
            {
              icon: Mail,
              label: "Access",
              desc: "Email Setup",
              color: "text-blue-500 bg-blue-500/10",
            },
          ].map((step, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-card border border-white/10 flex items-center gap-3"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  step.color,
                )}
              >
                <step.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                  {step.label}
                </p>
                <p className="text-[11px] font-bold">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table — fills remaining space */}
      <div className="flex-1 min-h-0 bg-card/40 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-white/10 bg-card">
                <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 bg-card">
                  Employee
                </th>
                <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 bg-card">
                  Location
                </th>
                <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 bg-card text-center">
                  Onboarding Pipeline
                </th>
                <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 bg-card text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredJoiners.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-16 text-center text-muted-foreground/50"
                  >
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-bold">
                      {searchQuery
                        ? "No matching " +
                          (onboardingStatus === "active"
                            ? "joiners"
                            : "completed onboardings") +
                          " found"
                        : onboardingStatus === "active"
                          ? "No new joiners in the last 120 days"
                          : "No completed onboardings"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredJoiners.map((joiner) => {
                  const steps = joiner.pipeline;
                  return (
                    <tr
                      key={joiner.id}
                      className={cn(
                        "group hover:bg-white/[0.02] transition-all",
                        joiner.isFullyOnboarded &&
                          onboardingStatus === "active" &&
                          "opacity-60",
                      )}
                    >
                      {/* Employee */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/10 overflow-hidden shrink-0">
                            {joiner.photoPath ? (
                              <img
                                src={joiner.photoPath}
                                alt={joiner.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              joiner.fullName[0]
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold group-hover:text-primary transition-colors">
                              {joiner.fullName}
                            </p>
                            <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest">
                              {joiner.employeeCode} ·{" "}
                              {joiner.companyName || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-foreground/80">
                          {joiner.locationJoining || "—"}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase">
                          Seat: {joiner.deskNumber || "Pending"}
                        </p>
                      </td>

                      {/* Pipeline Status */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2 max-w-[480px] mx-auto">
                          {(
                            Object.entries(steps) as [string, PipelineStep][]
                          ).map(([key, step]) => {
                            const Icon = getStatusIcon(step.status);
                            return (
                              <div
                                key={key}
                                className="flex flex-col items-center gap-1.5 flex-1"
                              >
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                                  {key}
                                </p>
                                <div
                                  className={cn(
                                    "w-full px-2 py-1.5 rounded-lg text-[9px] font-black text-center border flex items-center justify-center gap-1",
                                    getStatusStyle(step.status),
                                  )}
                                >
                                  <Icon className="w-3 h-3" />
                                  {step.label}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Raise Hardware Request */}
                          {steps.hardware.status !== "ready" &&
                            !hasRequest(joiner, "laptop") && (
                              <button
                                onClick={() =>
                                  raiseRequest(joiner.id, "laptop")
                                }
                                disabled={raising === `${joiner.id}-laptop`}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-primary/20 disabled:opacity-50"
                              >
                                {raising === `${joiner.id}-laptop` ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Laptop className="w-3 h-3" />
                                )}
                                Hardware
                              </button>
                            )}

                          {/* Raise Email Request */}
                          {steps.access.status !== "ready" &&
                            !joiner.provisioningRequests.some(
                              (r) =>
                                r.specialRequirements ===
                                  "Email account provisioning" &&
                                r.status !== "cancelled",
                            ) && (
                              <button
                                onClick={() => raiseRequest(joiner.id, "email")}
                                disabled={raising === `${joiner.id}-email`}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-blue-500/20 disabled:opacity-50"
                              >
                                {raising === `${joiner.id}-email` ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Mail className="w-3 h-3" />
                                )}
                                Email
                              </button>
                            )}

                          {/* All done */}
                          {joiner.isFullyOnboarded && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-[10px] font-bold uppercase">
                              <CheckCircle2 className="w-3 h-3" />
                              Complete
                            </span>
                          )}

                          {/* Show pending request codes */}
                          {joiner.provisioningRequests.filter(
                            (r) =>
                              r.status === "pending" ||
                              r.status === "in_progress",
                          ).length > 0 &&
                            !joiner.isFullyOnboarded && (
                              <span className="text-[9px] text-muted-foreground/50 font-bold">
                                <SendHorizonal className="w-3 h-3 inline mr-1" />
                                {
                                  joiner.provisioningRequests.filter(
                                    (r) =>
                                      r.status === "pending" ||
                                      r.status === "in_progress",
                                  ).length
                                }{" "}
                                pending
                              </span>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Joiner/Employee Import Preview Modal ── */}
      {showImportModal && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-7xl bg-card border border-border rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Bulk Pipeline Injection & Validation
                </h3>
                <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest">
                  Review candidate details and reporting structures before pipeline entry.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase bg-muted px-4 py-1.5 rounded-full border border-border/50">
                  {importRecords.filter(r => r.isValid).length} / {importRecords.length} Valid
                </span>
                <button
                  onClick={() => validateImportRecords(importRecords)}
                  disabled={validatingImport}
                  className="px-4 py-2 hover:bg-white/5 rounded-xl transition-all text-primary flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-primary/20"
                >
                  {validatingImport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Re-Validate
                </button>
                <button onClick={() => setShowImportModal(false)} className="p-3 hover:bg-muted rounded-2xl transition-all"><X className="w-6 h-6" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {validatingImport && importRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Running integrity checks...</p>
                </div>
              ) : (
                <div className="rounded-3xl border border-border overflow-hidden">
                  <table className="w-full text-left table-fixed">
                    <thead className="bg-muted/40 text-[9px] font-black uppercase tracking-widest sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 w-20">Status</th>
                        <th className="px-4 py-4 w-32">Emp Code</th>
                        <th className="px-4 py-4 w-48">Full Name</th>
                        <th className="px-4 py-4 w-40">Department & Company/Subsidiary</th>
                        <th className="px-4 py-4 w-40">Reporting Mgr</th>
                        <th className="px-4 py-4 w-32">Start Date</th>
                        <th className="px-6 py-4 w-64">Validation Intelligence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 bg-card/50">
                      {importRecords.map((record, i) => (
                        <tr key={i} className={cn("text-[11px] transition-all hover:bg-muted/10", !record.isValid && "bg-red-500/5")}>
                          <td className="px-6 py-4 text-center">
                            {validatingImport ? (
                              <Loader2 className="w-4 h-4 animate-spin opacity-20 mx-auto" />
                            ) : record.isValid ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500 mx-auto" />
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={record.data.employeeCode || ""}
                              onChange={(e) => updateImportRecord(record.id, "employeeCode", e.target.value)}
                              className="w-full bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-2 font-mono font-black"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={record.data.fullName || ""}
                              onChange={(e) => updateImportRecord(record.id, "fullName", e.target.value)}
                              className="w-full bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-2 font-black uppercase"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex flex-col gap-1">
                              <input
                                value={record.data.department || ""}
                                placeholder="Dept"
                                onChange={(e) => updateImportRecord(record.id, "department", e.target.value)}
                                className="w-full bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-1 font-bold uppercase opacity-60"
                              />
                              <input
                                value={record.data.companyName || ""}
                                placeholder="Company/Subsidiary"
                                onChange={(e) => updateImportRecord(record.id, "companyName", e.target.value)}
                                className="w-full bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-1 font-bold uppercase opacity-60"
                              />
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={record.data.managerCode || ""}
                              placeholder="Manager Code"
                              onChange={(e) => updateImportRecord(record.id, "managerCode", e.target.value)}
                              className="w-full bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-2 font-bold uppercase"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="date"
                              value={record.data.startDate || ""}
                              onChange={(e) => updateImportRecord(record.id, "startDate", e.target.value)}
                              className="w-full bg-transparent border-none outline-none p-2 font-bold uppercase text-primary"
                            />
                          </td>
                          <td className="px-6 py-4">
                            {record.error ? (
                              <p className="text-red-500 font-black text-[9px] uppercase tracking-tight leading-tight">• {record.error}</p>
                            ) : (
                              <p className="text-green-500/60 font-black text-[9px] uppercase tracking-tight">Verified & Secure</p>
                            )}
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
                disabled={importRecords.filter(r => r.isValid).length === 0 || importingBatch || validatingImport}
                onClick={processImport}
                className="px-10 py-3.5 bg-primary text-primary-foreground rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-3 disabled:opacity-30"
              >
                {importingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importingBatch ? "Processing Batch..." : `Finalize Pipeline Entry (${importRecords.filter(r => r.isValid).length} Associates)`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
