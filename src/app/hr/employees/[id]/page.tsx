"use client";

import {
  ArrowLeft,
  Edit2,
  Calendar,
  Mail,
  Phone,
  Building2,
  User,
  Shield,
  Loader2,
  XCircle,
  Clock,
  Briefcase,
  MapPin,
  Laptop,
  Monitor,
  Smartphone,
  PhoneCall as SimIcon,
  LayoutGrid,
  Activity,
  UserCheck,
  ExternalLink,
  UserX,
} from "lucide-react";
import { useState, useEffect, use } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EmployeeDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitDate, setExitDate] = useState("");
  const [exitReason, setExitReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/employees/${id}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setEmployee(data);
      } catch (error) {
        console.error("Failed to fetch employee details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
          Decrypting personal records...
        </p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="w-16 h-16 text-red-500/20" />
        <h2 className="text-xl font-black uppercase tracking-widest text-muted-foreground">
          Employee Not Found
        </h2>
        <Link
          href="/hr/employees"
          className="px-6 py-2 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest"
        >
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-sm pb-32">
      {/* Sticky Top Bar Actions */}
      <div className="sticky top-14 z-[100] bg-background/80 backdrop-blur-xl -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-2 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/hr/employees"
            className="p-2 hover:bg-white/5 rounded-xl border border-white/5 transition-all text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-0.5">
            <h2 className="text-xl font-black tracking-tight text-foreground uppercase flex items-center gap-3">
              {employee.fullName}
              <span className="text-[8px] px-2.5 py-1 rounded-full border border-green-500/20 bg-green-500/10 text-green-500 uppercase tracking-widest">
                {employee.status || "Active"}
              </span>
            </h2>
            <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest leading-none">
              {employee.employeeCode} • {employee.designation}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {employee.status !== "inactive" && employee.status !== "exit_pending" && (
            <button
              onClick={() => setShowExitModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Initiate Exit</span>
            </button>
          )}
          <Link
            href={`/hr/employees/${employee.id}/edit`}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.03] transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </Link>
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
          onClick={() => setActiveTab("assets")}
          className={cn(
            "px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative",
            activeTab === "assets"
              ? "text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Assigned Assets
          {activeTab === "assets" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Left Column: ID Card Visual */}
          <div className="lg:col-span-4 space-y-6">
            <div className="premium-card rounded-[40px] overflow-hidden group/card relative bg-card/60 backdrop-blur-3xl border border-white/10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
              
              <div className="p-10 pb-8 relative z-10 flex flex-col items-center text-center space-y-8">
                <div className="relative group/photo">
                  <div className="w-44 h-56 rounded-[48px] bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center text-6xl font-black text-primary border border-primary/20 shadow-2xl relative z-10 overflow-hidden">
                    {employee.photoPath ? (
                      <img src={employee.photoPath} className="w-full h-full object-cover" alt={employee.fullName} />
                    ) : (
                      <span>{employee.fullName[0]}</span>
                    )}
                    <div className="absolute top-0 inset-x-0 h-0.5 bg-primary/60 shadow-[0_0_15px_var(--primary)] animate-scan z-20" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight uppercase text-foreground leading-none">
                    {employee.fullName}
                  </h3>
                  <p className="text-[10px] text-primary font-black tracking-[0.3em] uppercase">
                    {employee.designation}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full pt-4">
                    <div className="p-4 bg-muted/20 rounded-3xl border border-white/5 space-y-1">
                        <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">Employee Code</p>
                        <p className="text-xs font-black text-foreground font-mono">{employee.employeeCode}</p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-3xl border border-white/5 space-y-1">
                        <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">Status</p>
                        <p className="text-xs font-black text-green-500 uppercase">Verified</p>
                    </div>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-card rounded-[32px] p-6 border border-white/5 premium-card space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
                    <UserCheck className="w-3.5 h-3.5 text-primary" />
                    Personal Contact Info
                </h4>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none mb-1">Email Address</p>
                            <p className="text-xs font-bold truncate" title={employee.personalEmail}>
                                {employee.personalEmail || "Not Provided"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none mb-1">Phone Number</p>
                            <p className="text-xs font-bold">
                                {employee.personalPhone || "Not Provided"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Right Column: Organizational Details */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Organizational */}
                <div className="bg-card rounded-[32px] p-8 border border-white/5 premium-card space-y-8 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                        <Building2 className="w-32 h-32 text-primary" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary" />
                        Corporate Hierarchy
                    </h4>
                    <div className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Entity / Group</p>
                            <p className="text-base font-black text-foreground uppercase tracking-tight leading-tight">{employee.companyName}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Department</p>
                            <p className="text-base font-bold text-foreground">{employee.department || "General Operations"}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Reporting Manager</p>
                            {employee.manager ? (
                                <Link 
                                    href={`/hr/employees/${employee.manager.id}`}
                                    className="flex items-center gap-3 group/mgr hover:bg-primary/[0.03] p-2 -m-2 rounded-2xl transition-all border border-transparent hover:border-primary/10"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm group-hover/mgr:scale-110 transition-transform">
                                        {employee.manager.fullName?.[0] || "M"}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-bold text-primary flex items-center gap-2">
                                            {employee.manager.fullName}
                                            <ExternalLink className="w-3 h-3 opacity-0 group-hover/mgr:opacity-100 transition-opacity" />
                                        </p>
                                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest truncate">{employee.manager.employeeCode || "N/A"}</p>
                                    </div>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-3 opacity-40">
                                    <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground font-black text-sm">
                                        ?
                                    </div>
                                    <p className="text-sm font-bold text-muted-foreground italic">Not Assigned</p>
                                </div>
                            )}
                        </div>

                        {employee.emailAccounts?.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-white/5 mt-4">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Official Email Accounts</p>
                                <div className="space-y-2">
                                    {employee.emailAccounts.map((email: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-blue-500/[0.03] rounded-2xl border border-blue-500/10 group/email">
                                            <Mail className="w-4 h-4 text-blue-500 opacity-40 group-hover/email:opacity-100 transition-opacity" />
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-[11px] font-bold text-foreground truncate">{email.emailAddress}</p>
                                                <p className="text-[8px] font-black text-blue-500/50 uppercase tracking-widest">{email.platform || "Corporate"}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Workspace & Location */}
                <div className="bg-card rounded-[32px] p-8 border border-white/5 premium-card space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                        <LayoutGrid className="w-32 h-32 text-secondary" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-secondary" />
                        Physical Station
                    </h4>
                    <div className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Base Location</p>
                            <p className="text-base font-black text-foreground uppercase">{employee.locationJoining || "Remote / Global"}</p>
                        </div>
                        <div className="space-y-4">
                             <div className="p-5 bg-muted/10 rounded-[28px] border border-white/5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Assigned Seat</p>
                                    <p className="text-xl font-black text-primary font-mono tracking-tighter">
                                        {employee.workspace?.code || employee.deskNumber || "HOT-DESK"}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                                    <LayoutGrid className="w-6 h-6" />
                                </div>
                             </div>
                             <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 italic uppercase tracking-tighter">
                                <Calendar className="w-3 h-3" />
                                Joined on {employee.startDate ? format(new Date(employee.startDate), "dd MMM, yyyy") : "TBD"}
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Infrastructure Allocation */}
            <div className="bg-card/40 rounded-[32px] p-8 border border-white/5 premium-card">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-6">
                <Shield className="w-4 h-4 text-primary" />
                Infrastructure Provisioning Status
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: Laptop, label: "Laptop", active: true },
                    { icon: Mail, label: "Email", active: true },
                    { icon: Smartphone, label: "Mobile", active: false },
                    { icon: SimIcon, label: "Sim Card", active: false },
                ].map((item, idx) => (
                    <div key={idx} className={cn(
                        "p-4 rounded-3xl border flex flex-col items-center gap-3 transition-all",
                        item.active 
                            ? "bg-primary/10 border-primary/20 text-primary" 
                            : "bg-muted/10 border-white/5 text-muted-foreground/40 opacity-40 grayscale"
                    )}>
                        <item.icon className="w-6 h-6" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Assigned Inventory</h3>
                <span className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-[10px] font-black uppercase text-primary">
                    {employee.assets?.length || 0} Assets Deployed
                </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employee.assets?.length > 0 ? (
                    employee.assets.map((asset: any) => (
                        <Link 
                            href={`/it/assets/${asset.id}`}
                            key={asset.id} 
                            className="group bg-card hover:bg-muted/20 border border-white/5 rounded-[28px] p-6 transition-all flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Monitor className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{asset.assetTag}</p>
                                    <p className="text-sm font-bold text-foreground">{asset.make} {asset.model}</p>
                                </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center space-y-4 opacity-20">
                        <Activity className="w-12 h-12 mx-auto" />
                        <p className="text-xs font-black uppercase tracking-[0.3em]">No hardware assets currently assigned</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Exit Initiation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-[32px] p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase tracking-tight text-red-500 flex items-center gap-2">
                <UserX className="w-5 h-5" />
                Initiate Offboarding
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Start exit process for {employee.fullName}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Last Working Day (LWD)</label>
                <input
                  type="date"
                  value={exitDate}
                  onChange={(e) => setExitDate(e.target.value)}
                  className="w-full bg-muted/30 border border-white/5 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-background transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Reason / Remarks</label>
                <textarea
                  placeholder="Reason for resignation or termination..."
                  value={exitReason}
                  onChange={(e) => setExitReason(e.target.value)}
                  className="w-full bg-muted/30 border border-white/5 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-background transition-all outline-none min-h-[100px] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 px-6 py-3 bg-muted border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted/80 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={!exitDate || isUpdating}
                onClick={async () => {
                  try {
                    setIsUpdating(true);
                    const res = await fetch(`/api/employees/${employee.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        status: "exit_pending",
                        exitDate,
                        statusReason: exitReason, // Note: making sure this matches schema or backend handling
                      }),
                    });
                    if (res.ok) {
                      window.location.reload();
                    } else {
                      alert("Failed to initiate exit");
                    }
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsUpdating(false);
                  }
                }}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
              >
                {isUpdating ? "Processing..." : "Confirm Exit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
