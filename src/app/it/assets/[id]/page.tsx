"use client";

import {
  ArrowLeft,
  Monitor,
  Cpu,
  Network,
  History,
  UserPlus,
  Edit2,
  Trash2,
  Wrench,
  XCircle,
  Loader2,
  IndianRupee,
  Activity,
  User,
  ChevronRight,
  Save,
  PlusCircle,
} from "lucide-react";
import { useState, useEffect, use } from "react";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/SearchableSelect";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface AssetDetailProps {
  params: Promise<{ id: string }>;
}

export default function AssetDetailPage({ params }: AssetDetailProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // overview, history, maintenance

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetRes, employeesRes] = await Promise.all([
          fetch(`/api/assets/${id}`),
          fetch("/api/employees"),
        ]);

        const assetData = await assetRes.json();
        const employeesData = await employeesRes.json();

        if (assetData.error) throw new Error(assetData.error);

        setAsset(assetData);
        setEmployees(employeesData.map((emp: any) => ({
          value: emp.id,
          label: `${emp.fullName} (${emp.employeeCode})`,
          image: emp.photoPath,
          initials: emp.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
        })));
        if (assetData.currentEmployeeId)
          setSelectedEmployee(assetData.currentEmployeeId);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleReassign = async () => {
    setAssigning(true);
    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentEmployeeId: selectedEmployee || null,
          status: selectedEmployee ? "assigned" : "available",
          changedBy: (session?.user as any)?.id,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setAsset(updated);
        // We'd ideally re-fetch the asset to get the included employee object
        const refreshRes = await fetch(`/api/assets/${id}`);
        setAsset(await refreshRes.json());
        alert("Assignment updated successfully!");
      }
    } catch (error) {
      console.error("Reassign error:", error);
    } finally {
      setAssigning(false);
    }
  };

  const handleRetire = async () => {
    if (
      !confirm(
        `Are you sure you want to permanently retire and delete asset ${asset.assetTag}?`,
      )
    )
      return;

    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Asset retired successfully.");
        router.push("/it/assets");
      } else {
        alert("Failed to retire asset.");
      }
    } catch (error) {
      console.error("Retire error:", error);
      alert("Something went wrong.");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500/10 text-green-500 border-green-500/20";
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
          Scanning infrastructure...
        </p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="w-16 h-16 text-red-500/20" />
        <h2 className="text-xl font-black uppercase tracking-widest text-muted-foreground">
          Asset Not Found
        </h2>
        <Link
          href="/it/assets"
          className="px-6 py-2 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest"
        >
          Back to Inventory
        </Link>
      </div>
    );
  }

  // Brand Logo URL
  const brandLogoUrl =
    asset.make &&
    !["Other", "Assembled", "OEM / White Box"].includes(asset.make)
      ? `https://cdn.simpleicons.org/${asset.make.toLowerCase().replace(/\s+/g, "")}`
      : null;

  return (
    <div className="space-y-6 animate-fade-in text-sm pb-32">
      {/* Sticky Top Bar Actions */}
      <div className="sticky top-14 z-[100] bg-background/80 backdrop-blur-xl -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-2 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/it/assets"
            className="p-2 hover:bg-white/5 rounded-xl border border-white/5 transition-all text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-0.5">
            <h2 className="text-xl font-black tracking-tight text-foreground uppercase flex items-center gap-3">
              {asset.assetTag}
              <span
                className={cn(
                  "text-[8px] px-2.5 py-1 rounded-full border uppercase tracking-widest",
                  getStatusStyle(asset.status),
                )}
              >
                {asset.status.replace("_", " ")}
              </span>
            </h2>
            <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest leading-none">
              {asset.type} • {asset.serialNumber || "No Serial"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/it/assets/${asset.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-muted/50 text-muted-foreground hover:text-foreground rounded-2xl border border-white/5 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Details</span>
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent hover:bg-accent/30 rounded-2xl border border-accent/20 transition-all text-[10px] font-black uppercase tracking-widest">
            <Wrench className="w-3.5 h-3.5" />
            <span>Maintenance</span>
          </button>
          <button
            onClick={handleRetire}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-2xl border border-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Retire</span>
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/5 pb-px">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative",
            activeTab === "overview"
              ? "text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Overview
          {activeTab === "overview" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative",
            activeTab === "history"
              ? "text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Activity History
          {activeTab === "history" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Left Column: Visual Card & Quick Stats */}
          <div className="lg:col-span-4 space-y-6">
            <div className="premium-card rounded-[32px] overflow-hidden group/card relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-50" />

              <div className="p-10 pb-8 relative z-10 flex flex-col items-center text-center space-y-6">
                <div className="relative inline-block">
                  <div className="w-40 h-40 rounded-[48px] bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center border border-primary/20 shadow-lg relative z-10 group-hover/card:scale-105 transition-transform duration-500 overflow-hidden">
                    {brandLogoUrl ? (
                      <Image
                        src={brandLogoUrl}
                        alt={asset.make}
                        width={80}
                        height={80}
                        className="object-contain opacity-80 group-hover/card:opacity-100 transition-opacity invert"
                        unoptimized
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          if (target.nextElementSibling) {
                            (
                              target.nextElementSibling as HTMLElement
                            ).style.display = "block";
                          }
                        }}
                      />
                    ) : null}
                    <Monitor
                      className={cn(
                        "w-20 h-20 text-primary/40",
                        brandLogoUrl ? "hidden" : "block",
                      )}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-background border border-border shadow-xl flex items-center justify-center text-primary rotate-12 group-hover/card:rotate-0 transition-transform duration-500">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight uppercase">
                    {asset.make || "Generic"}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-black tracking-widest uppercase italic opacity-60">
                    {asset.model || "Standard Device"}
                  </p>
                </div>

                {/* Status Tags */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {asset.warrantyExpiry && (
                    <span
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm",
                        new Date(asset.warrantyExpiry) > new Date()
                          ? "bg-blue-500/10 text-blue-500 border border-blue-500/10"
                          : "bg-red-500/10 text-red-500 border border-red-500/10",
                      )}
                    >
                      {new Date(asset.warrantyExpiry) > new Date()
                        ? "🛡️ In Warranty"
                        : "⚠️ Expired"}
                    </span>
                  )}
                  {asset.cost && (
                    <span className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 border border-green-500/10 shadow-sm">
                      ₹{asset.cost.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress / Health Bar */}
              <div className="px-6 py-4 bg-muted/20 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col gap-1 flex-1 px-4">
                  <div className="flex items-center justify-between text-[8px] font-black uppercase text-muted-foreground/60">
                    <span>Device Utilization</span>
                    <span>94%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-[94%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Details List */}
            <div className="bg-card rounded-[32px] p-6 border border-white/5 premium-card space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
                <IndianRupee className="w-3.5 h-3.5 text-primary" />
                Purchase Meta
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">
                    Purchase Date
                  </p>
                  <p className="text-xs font-bold">
                    {asset.purchaseDate
                      ? new Date(asset.purchaseDate).toLocaleDateString(
                          "en-GB",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )
                      : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">
                    Warranty End
                  </p>
                  <p className="text-xs font-bold">
                    {asset.warrantyExpiry
                      ? new Date(asset.warrantyExpiry).toLocaleDateString(
                          "en-GB",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )
                      : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">
                    Current Value
                  </p>
                  <p className="text-xs font-bold">
                    ₹{(asset.cost || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">
                    Added By
                  </p>
                  <p
                    className="text-xs font-bold text-primary truncate max-w-[100px]"
                    title={asset.creator?.fullName || "System"}
                  >
                    {asset.creator?.fullName || "System"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Info & Maintenance */}
          <div className="lg:col-span-8 space-y-6">
            {/* Assignment Section (Focus Area) */}
            <div className="bg-card/40 rounded-[32px] p-6 border border-white/5 premium-card shadow-lg relative z-[20] overflow-visible group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <UserPlus className="w-40 h-40 text-primary" />
              </div>

              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-6">
                <User className="w-4 h-4 text-primary" />
                Resource Assignment
              </h4>

              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                {/* Current Assignee */}
                  <div className="relative group/avatar">
                    {asset.currentEmployee?.photoPath ? (
                      <img 
                        src={asset.currentEmployee.photoPath} 
                        className="w-20 h-20 rounded-[28px] object-cover border border-primary/20 shadow-xl group-hover/avatar:scale-105 transition-transform duration-500"
                        alt=""
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl font-black text-primary border border-primary/20 shadow-xl group-hover/avatar:scale-105 transition-transform duration-500 ring-4 ring-primary/5">
                        {asset.currentEmployee ? (
                          asset.currentEmployee.fullName.split(' ').map((n: any) => n[0]).join('').slice(0, 2)
                        ) : (
                          <Activity className="w-10 h-10 opacity-20" />
                        )}
                      </div>
                    )}
                    {asset.currentEmployee?.deskNumber && (
                      <div className="absolute -right-2 -bottom-2 px-2 py-1 bg-background border border-border rounded-lg text-[8px] font-black uppercase text-primary shadow-xl">
                        Seat {asset.currentEmployee.deskNumber}
                      </div>
                    )}
                  </div>

                <div className="hidden md:block">
                  <ChevronRight className="w-8 h-8 text-muted-foreground/20" />
                </div>

                {/* Reassignment Controls */}
                <div className="flex-1 w-full space-y-4">
                  <div className="bg-muted/10 p-4 rounded-[24px] border border-white/5 space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">
                      Assign to Employee
                    </label>
                    <div className="flex gap-2">
                      <SearchableSelect
                        options={employees}
                        value={selectedEmployee}
                        onChange={setSelectedEmployee}
                        placeholder="Select assignee..."
                        icon={<User className="w-4 h-4" />}
                        showAvatars
                      />
                      <button
                        onClick={handleReassign}
                        disabled={
                          assigning ||
                          selectedEmployee === (asset.currentEmployeeId || "")
                        }
                        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/10 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-2 disabled:opacity-30 disabled:grayscale disabled:scale-100"
                      >
                        {assigning ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        {assigning ? "Updating..." : "Update"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Spec Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* HardWare Specs */}
              <div className="bg-card rounded-[32px] p-6 border border-white/5 premium-card space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  Technical Identity
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center group/spec py-1 border-b border-white/[0.03]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                      Processor
                    </span>
                    <span className="text-xs font-bold group-hover:text-primary transition-colors">
                      {asset.cpu || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center group/spec py-1 border-b border-white/[0.03]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                      Memory (RAM)
                    </span>
                    <span className="text-xs font-bold">
                      {asset.ramGb ? `${asset.ramGb}GB DDR` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center group/spec py-1 border-b border-white/[0.03]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                      SSD Capacity
                    </span>
                    <span className="text-xs font-bold">
                      {asset.ssdGb ? `${asset.ssdGb}GB NVMe` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center group/spec py-1 border-b border-white/[0.03]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                      HDD Capacity
                    </span>
                    <span className="text-xs font-bold">
                      {asset.hddGb ? `${asset.hddGb}GB Mechanical` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* OS & Network Specs */}
              <div className="bg-card rounded-[32px] p-6 border border-white/5 premium-card space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Network className="w-4 h-4 text-primary" />
                  System & Connectivity
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center group/spec py-1 border-b border-white/[0.03]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                      Operating System
                    </span>
                    <span className="text-xs font-bold">
                      {asset.os || "—"} {asset.osVersion}
                    </span>
                  </div>
                  <div className="flex justify-between items-center group/spec py-1 border-b border-white/[0.03]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                      IP Address
                    </span>
                    <span className="text-xs font-mono font-black text-primary/80">
                      {asset.ipAddress || "Dynamic"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center group/spec py-1 border-b border-white/[0.03]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                      MAC Address
                    </span>
                    <span
                      className="text-[10px] font-mono text-muted-foreground truncate ml-4"
                      title={asset.macAddress}
                    >
                      {asset.macAddress || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center group/spec py-1 border-b border-white/[0.03]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                      Shield / AV
                    </span>
                    <span
                      className={cn(
                        "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                        asset.antivirusStatus === "yes"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20",
                      )}
                    >
                      {asset.antivirusStatus === "yes"
                        ? "Verified"
                        : "Unprotected"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-card rounded-[32px] p-6 border border-white/5 premium-card min-h-[140px]">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary" />
                Administrator Remarks
              </h4>
              <div className="p-4 bg-muted/10 rounded-[20px] border border-white/5 italic text-muted-foreground text-xs leading-relaxed">
                {asset.notes ||
                  "No administrative notes have been recorded for this asset yet."}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
          <div className="bg-card rounded-[32px] p-8 border border-white/5 premium-card">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-3">
                <History className="w-5 h-5 text-primary" />
                Operational Ledger
              </h4>
              <div className="px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
                { (asset.logs?.length || 0) + (asset.assignments?.length || 0) } Transactions
              </div>
            </div>

            <div className="space-y-3">
              {(() => {
                // Merge and sort all activities
                const allEvents = [
                  ...(asset.logs?.map((l: any) => ({ ...l, type: 'audit', date: new Date(l.changedAt) })) || []),
                  ...(asset.assignments?.map((a: any) => ({ ...a, type: 'assignment', date: new Date(a.createdAt) })) || [])
                ].sort((a, b) => b.date.getTime() - a.date.getTime());

                if (allEvents.length === 0) {
                  return (
                    <div className="py-20 text-center space-y-4 opacity-20">
                      <Activity className="w-12 h-12 mx-auto" />
                      <p className="text-xs font-black uppercase tracking-[0.3em]">No historical data found</p>
                    </div>
                  );
                }

                return allEvents.map((event: any) => (
                  <div key={event.id} className="group relative flex gap-4 p-4 bg-muted/10 hover:bg-muted/20 border border-white/5 rounded-2xl transition-all items-start">
                    {/* Event Icon/Type */}
                    <div className="shrink-0 mt-1">
                      {event.type === 'assignment' ? (
                        <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                          <UserPlus className="w-4 h-4 text-primary" />
                        </div>
                      ) : event.action === 'created' ? (
                        <div className="w-8 h-8 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                          <PlusCircle className="w-4 h-4 text-green-500" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                          <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                            event.type === 'assignment' ? "bg-primary text-primary-foreground border-primary" : 
                            event.action === 'created' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                            "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          )}>
                            {event.type === 'assignment' ? (event.actionType?.replace('_', ' ') || 'Assignment') : event.action}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground/40 font-bold">
                            {event.logCode || event.id.slice(0, 8)}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-foreground">
                          {event.type === 'assignment' ? (
                            <>Deployed to <span className="text-primary">{event.employee.fullName}</span></>
                          ) : event.action === 'created' ? (
                            "Inventory Initialization"
                          ) : (
                            "Resource Specification Update"
                          )}
                        </p>
                      </div>

                      {/* Details Column */}
                      <div className="md:col-span-5">
                        {event.type === 'audit' && event.action === 'updated' && (
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {(() => {
                              const oldVal = event.oldValue as any;
                              const newVal = event.newValue as any;
                              if (!oldVal || !newVal) return null;
                              
                              return Object.keys(newVal)
                                .filter(k => k !== "updatedAt" && k !== "logs" && JSON.stringify(oldVal[k]) !== JSON.stringify(newVal[k]))
                                .map(key => (
                                  <div key={key} className="flex items-center gap-1.5 bg-background/40 px-2 py-0.5 rounded-lg border border-white/5">
                                    <span className="text-[8px] font-black uppercase text-muted-foreground/40">{key.replace('currentEmployeeId', 'Assignee')}:</span>
                                    <span className="text-[9px] font-bold text-muted-foreground line-through opacity-30">{String(oldVal[key] || 'Empty').slice(0, 15)}</span>
                                    <span className="text-primary">→</span>
                                    <span className="text-[9px] font-black text-primary/80">{String(newVal[key] || 'Cleared').slice(0, 15)}</span>
                                  </div>
                                ));
                            })()}
                          </div>
                        )}
                        {event.type === 'assignment' && (
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                            <span className="px-2 py-0.5 bg-white/5 rounded-md border border-white/5">Transaction Complete</span>
                          </div>
                        )}
                      </div>

                      {/* Meta Column */}
                      <div className="md:col-span-3 flex flex-col items-end gap-1">
                        <time className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter">
                          {new Date(event.date).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short"
                          })}, {new Date(event.date).toLocaleTimeString("en-GB", {
                            hour: "2-digit", minute: "2-digit", hour12: false
                          })}
                        </time>
                        <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <div className="w-5 h-5 rounded-lg overflow-hidden bg-primary/20 flex items-center justify-center border border-white/5">
                            { (event.user || event.assigner)?.photoPath ? (
                              <img src={(event.user || event.assigner).photoPath} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <span className="text-[8px] font-black text-primary uppercase">
                                {(event.user || event.assigner)?.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || "S"}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] font-black text-muted-foreground/60">
                            {(event.user || event.assigner)?.fullName || "System"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
