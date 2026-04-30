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
  CheckCircle2,
  History,
  Activity,
  UserCheck,
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

export default function UpcomingJoiningDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/hr/upcoming?id=${id}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setRecord(data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleOnboard = () => {
    const params = new URLSearchParams({
      upcomingId: record.id,
    });
    router.push(`/hr/employees/new?${params.toString()}`);
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "joined":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "upcoming":
        return "bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]";
      case "on hold":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "not joined":
      case "cancelled":
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
          Retrieving candidate dossier...
        </p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="w-16 h-16 text-red-500/20" />
        <h2 className="text-xl font-black uppercase tracking-widest text-muted-foreground">
          Record Not Found
        </h2>
        <Link
          href="/hr/upcoming"
          className="px-6 py-2 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest"
        >
          Back to Pipeline
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
            href="/hr/upcoming"
            className="p-2 hover:bg-white/5 rounded-xl border border-white/5 transition-all text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-0.5">
            <h2 className="text-xl font-black tracking-tight text-foreground uppercase flex items-center gap-3">
              {record.fullName}
              <span
                className={cn(
                  "text-[8px] px-2.5 py-1 rounded-full border uppercase tracking-widest animate-pulse",
                  getStatusStyle(record.status),
                )}
              >
                {record.status || "Upcoming"}
              </span>
            </h2>
            <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest leading-none">
              {record.designation} • {record.department || "No Department"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {record.status !== 'joined' && (
            <button
              onClick={handleOnboard}
              className="flex items-center gap-2 px-8 py-3 bg-green-500 text-white rounded-2xl shadow-lg shadow-green-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <UserCheck className="w-4 h-4" />
              <span>Onboard Associate</span>
            </button>
          )}
          <Link
            href={`/hr/upcoming/${record.id}/edit`}
            className="flex items-center gap-2 px-6 py-3 bg-card border border-white/10 text-foreground hover:bg-muted/50 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit</span>
          </Link>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Left Column: Candidate Quick Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="premium-card rounded-[32px] overflow-hidden group/card relative p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                        <User className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Candidate ID</p>
                        <p className="text-[11px] font-black font-mono">{record.id.slice(0, 8)}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black tracking-tight uppercase leading-none">
                            {record.fullName}
                        </h3>
                        <p className="text-[10px] text-primary font-black tracking-[0.3em] uppercase">
                            {record.designation}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 pt-4">
                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group/info">
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-primary opacity-40 group-hover/info:opacity-100 transition-opacity" />
                                <span className="text-[11px] font-bold truncate max-w-[160px]">{record.email || "No Email"}</span>
                            </div>
                            {record.email && (
                                <Link href={`mailto:${record.email}`} className="text-[8px] font-black uppercase text-primary opacity-0 group-hover/info:opacity-100 transition-all">Send</Link>
                            )}
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group/info">
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-primary opacity-40 group-hover/info:opacity-100 transition-opacity" />
                                <span className="text-[11px] font-bold tracking-wider">{record.phoneNumber || "No Phone"}</span>
                            </div>
                            {record.phoneNumber && (
                                <Link href={`tel:${record.phoneNumber}`} className="text-[8px] font-black uppercase text-primary opacity-0 group-hover/info:opacity-100 transition-all">Call</Link>
                            )}
                        </div>
                    </div>
                </div>
              </div>
            </div>

            {/* Joining Timeline Stepper */}
            <div className="bg-card rounded-[32px] p-8 border border-white/5 premium-card space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Onboarding Readiness
                </h4>
                
                <div className="space-y-6 relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                    <div className="relative group">
                        <div className="absolute -left-[19px] top-1.5 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_var(--green-500)]" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-foreground">Pipeline Registered</p>
                            <p className="text-[9px] text-muted-foreground/60 font-bold italic">Verification Complete</p>
                        </div>
                    </div>
                    <div className="relative group">
                        <div className={cn(
                            "absolute -left-[19px] top-1.5 w-2 h-2 rounded-full",
                            record.status === 'joined' ? "bg-green-500 shadow-[0_0_8px_var(--green-500)]" : "bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]"
                        )} />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-foreground">Pre-Boarding Phase</p>
                            <p className="text-[9px] text-muted-foreground/60 font-bold italic">
                                {record.status === 'joined' ? "Phase Completed" : "Current Active Stage"}
                            </p>
                        </div>
                    </div>
                    <div className="relative group opacity-40">
                        <div className={cn(
                            "absolute -left-[19px] top-1.5 w-2 h-2 rounded-full",
                            record.status === 'joined' ? "bg-green-500 shadow-[0_0_8px_var(--green-500)]" : "bg-white/10"
                        )} />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase">Official Enrollment</p>
                            <p className="text-[9px] font-bold italic text-muted-foreground/60">
                                {record.status === 'joined' ? `Joined on ${format(new Date(record.joiningDate), "dd MMM")}` : "Awaiting Final Activation"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Timeline Stats */}
            <div className="bg-card rounded-[32px] p-6 border border-white/5 premium-card space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Key Dates
              </h4>
              <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none mb-1">Joining Date</p>
                    <p className="text-xs font-bold">
                        {record.joiningDate ? format(new Date(record.joiningDate), "dd MMM, yyyy") : "Not Set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                    <History className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none mb-1">Experience</p>
                    <p className="text-xs font-bold">
                        {record.experience ? `${record.experience} Years` : "Fresher"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Info */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employment Details */}
                <div className="bg-card rounded-[32px] p-6 border border-white/5 premium-card space-y-6 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                        <Building2 className="w-32 h-32 text-primary" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary" />
                        Company & Position
                    </h4>
                    <div className="space-y-4 relative z-10">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Entity</p>
                            <p className="text-sm font-bold text-foreground uppercase tracking-tight">{record.companyName}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Department</p>
                            <p className="text-sm font-bold text-foreground">{record.department || "General Administration"}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Reporting To</p>
                            <p className="text-sm font-bold text-primary italic underline decoration-primary/20 underline-offset-4">{record.reportingManager}</p>
                        </div>
                    </div>
                </div>

                {/* Logistics */}
                <div className="bg-card rounded-[32px] p-6 border border-white/5 premium-card space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                        <MapPin className="w-32 h-32 text-secondary" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-secondary" />
                        Location Details
                    </h4>
                    <div className="space-y-4 relative z-10">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Place of Posting</p>
                            <p className="text-sm font-bold text-foreground uppercase">{record.placeOfPosting}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Joining Location Info</p>
                            <p className="text-sm font-bold text-foreground leading-relaxed">
                                {record.joiningLocation || "Standard Corporate Office"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status & Reason */}
            <div className="bg-card/40 rounded-[32px] p-8 border border-white/5 premium-card">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-6">
                <Shield className="w-4 h-4 text-primary" />
                Pipeline Status
              </h4>
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className={cn(
                    "px-10 py-5 rounded-3xl border text-xl font-black uppercase tracking-widest shadow-lg",
                    getStatusStyle(record.status)
                )}>
                    {record.status || "Upcoming"}
                </div>
                {record.statusReason && (
                    <div className="flex-1 space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Status Reason / Remarks</p>
                        <p className="text-xs font-bold text-muted-foreground italic leading-relaxed">
                            "{record.statusReason}"
                        </p>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
