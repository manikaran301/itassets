"use client";

import {
  UserX,
  Briefcase,
  Calendar,
  Trash2,
  Mail,
  Truck,
  AlertTriangle,
  ShieldAlert,
  RefreshCcw,
  CheckCircle2,
  Search,
  Filter,
  MapPin,
  Building2,
  Loader2,
  ChevronRight,
  ArrowRightLeft,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ExitEmployee {
  id: string;
  employeeCode: string;
  fullName: string;
  department: string | null;
  designation: string | null;
  companyName: string | null;
  locationJoining: string | null;
  exitDate: string | null;
  status: string;
  manager?: { fullName: string; employeeCode: string };
  emailAccounts?: any[];
  assetRequirements?: any[];
  currentAssets?: any[];
}

export default function ExitsPage() {
  const PAGE_SIZE = 50;
  const router = useRouter();
  const [exits, setExits] = useState<ExitEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("exit_pending");

  const [allExitsForFilters, setAllExitsForFilters] = useState<ExitEmployee[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchExits = useCallback(async (skip = 0, append = false) => {
    try {
      if (skip === 0) setLoading(true);
      else setLoadingMore(true);

      const statusFilter = selectedStatus === "all" ? "notice_period,exit_pending,inactive" : selectedStatus;
      const response = await fetch(
        `/api/employees?status=${statusFilter}&skip=${skip}&take=${PAGE_SIZE}`,
      );
      const result = await response.json();

      const data = result.data || result;
      setTotal(result.total || data.length);
      setHasMore(result.hasMore ?? false);

      if (append) {
        setExits((prev) => [...prev, ...data]);
      } else {
        setExits(data);
      }

      if (skip === 0) {
        const allRes = await fetch(`/api/employees?status=exit_pending,inactive`);
        const allData = await allRes.json();
        setAllExitsForFilters(Array.isArray(allData) ? allData : (allData.data || []));
      }
    } catch (error) {
      console.error("Failed to fetch exits:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchExits(0);
  }, [fetchExits]);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader || !hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchExits(exits.length, true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loader);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, exits.length, fetchExits]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const response = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (response.ok) {
        setExits((prev) => prev.filter((e) => e.id !== id));
        setTotal(prev => prev - 1);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // Register Exit Modal States
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [empResults, setEmpResults] = useState<ExitEmployee[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<ExitEmployee | null>(null);
  const [exitDate, setExitDate] = useState("");
  const [exitReason, setExitReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (empSearch.length < 2) {
        setEmpResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(`/api/employees?status=active`);
        const data = await res.json();
        const results = (data.data || data).filter((e: any) => 
          e.fullName.toLowerCase().includes(empSearch.toLowerCase()) ||
          e.employeeCode.toLowerCase().includes(empSearch.toLowerCase())
        );
        setEmpResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [empSearch]);

  const handleRegisterExit = async () => {
    if (!selectedEmp || !exitDate) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/employees/${selectedEmp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "notice_period",
          exitDate,
          statusReason: exitReason,
        }),
      });
      if (res.ok) {
        setShowRegisterModal(false);
        fetchExits(0);
        setSelectedEmp(null);
        setEmpSearch("");
        setExitDate("");
        setExitReason("");
      } else {
        alert("Failed to register exit");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const companies = [...new Set(allExitsForFilters.map((e) => e.companyName).filter((c): c is string => !!c))].sort();
  const departments = [...new Set(allExitsForFilters.map((e) => e.department).filter((d): d is string => !!d))].sort();
  const locations = [...new Set(allExitsForFilters.map((e) => e.locationJoining).filter((l): l is string => !!l))].sort();

  const filteredExits = exits.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      emp.fullName?.toLowerCase().includes(q) ||
      emp.employeeCode?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q) ||
      emp.companyName?.toLowerCase().includes(q);

    const matchesCompany = selectedCompany === "all" || emp.companyName === selectedCompany;
    const matchesDept = selectedDepartment === "all" || emp.department === selectedDepartment;
    const matchesLocation = selectedLocation === "all" || emp.locationJoining === selectedLocation;

    return matchesSearch && matchesCompany && matchesDept && matchesLocation;
  });

  const stats = [
    { label: "Notice Period", value: allExitsForFilters.filter(e => e.status === 'notice_period').length, icon: UserX, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    { label: "Exit Pending", value: allExitsForFilters.filter(e => e.status === 'exit_pending').length, icon: AlertTriangle, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
    { label: "Completed Exits", value: allExitsForFilters.filter(e => e.status === 'inactive').length, icon: CheckCircle2, color: "text-red-500 bg-red-500/10 border-red-500/20" },
    { label: "Hardware Recovery", value: allExitsForFilters.filter(e => (e.currentAssets?.length || 0) > 0).length, icon: Truck, color: "text-primary bg-primary/10 border-primary/20" },
    { label: "Identity Locks", value: allExitsForFilters.filter(e => (e.emailAccounts?.length || 0) > 0).length, icon: Mail, color: "text-secondary bg-secondary/10 border-secondary/20" },
  ];

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
          Analyzing Offboarding Pipeline...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-20 pt-2 h-full flex flex-col">
      <div className="flex justify-end items-center px-1">
        <div className="flex gap-2">
          <button onClick={() => fetchExits(0)} className="p-2.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-muted-foreground transition-all">
            <RefreshCcw className={cn("w-3.5 h-3.5", loadingMore && "animate-spin")} />
          </button>
          <button 
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <UserX className="w-4 h-4" /> Register Exit
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 shrink-0">
        {stats.map((stat, i) => (
          <div key={i} className="flex-1 min-w-[140px] bg-card/40 border border-border/50 px-4 py-2.5 rounded-xl flex items-center justify-between group hover:border-primary/30 transition-all">
            <div className="space-y-0.5">
              <p className="text-[7px] font-black uppercase tracking-[0.1em] text-muted-foreground/50">{stat.label}</p>
              <h4 className="text-sm font-black tracking-tight">{stat.value}</h4>
            </div>
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border border-transparent transition-all", stat.color)}>
              <stat.icon className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>

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
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]">
            <option value="notice_period">NOTICE PERIOD</option>
            <option value="exit_pending">EXIT PENDING</option>
            <option value="inactive">HISTORICAL EXITS</option>
            <option value="all">ALL EXITS</option>
          </select>
          <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]">
            <option value="all">COMPANIES</option>
            {companies.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
          </select>
          <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]">
            <option value="all">DEPARTMENTS</option>
            {departments.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
          </select>
          <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]">
            <option value="all">LOCATIONS</option>
            {locations.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/50 backdrop-blur-md border-b border-border/50">
                <th className="pl-6 pr-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Candidate</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Position & Entity</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Manager</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">LWD & Timeline</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Hardware Status</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Identity Status</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Status</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-right pr-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {filteredExits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-muted-foreground opacity-30 uppercase tracking-[0.2em] text-[9px] font-black">
                    No Exit Records Found
                  </td>
                </tr>
              ) : (
                filteredExits.map((emp, idx) => (
                  <tr key={`${emp.id}-${idx}`} className="group hover:bg-muted/20 cursor-default transition-all border-l-2 border-l-transparent hover:border-l-red-500" onClick={() => router.push(`/hr/employees/${emp.id}`)}>
                    <td className="pl-6 pr-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/5 flex items-center justify-center text-red-500 border border-red-500/10 shrink-0">
                          <span className="text-[10px] font-black uppercase tracking-tighter">
                            {emp.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-black tracking-tight">{emp.fullName}</p>
                          <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">{emp.employeeCode}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-tight">{emp.designation || "—"}</p>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-foreground/70 uppercase tracking-tighter mt-1">
                        <Building2 className="w-3 h-3 opacity-30" />
                        {emp.companyName || "—"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shrink-0">
                           <span className="text-[8px] font-black uppercase">
                            {emp.manager?.fullName ? emp.manager.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) : "—"}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold">{emp.manager?.fullName || "—"}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <p className="text-[9px] font-black tracking-widest text-red-500 uppercase">
                        {emp.exitDate ? format(new Date(emp.exitDate), "MMM dd, yyyy") : "TBD"}
                      </p>
                      <p className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-tighter mt-0.5 italic">Last Working Day</p>
                    </td>

                    <td className="px-4 py-3 text-center">
                       {(emp.currentAssets?.length || 0) > 0 ? (
                         <div className="flex flex-col items-center gap-1">
                            <Truck className="w-4 h-4 text-amber-500 animate-pulse" />
                            <span className="text-[8px] font-black text-amber-500 uppercase">{emp.currentAssets?.length} Items Outstanding</span>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center gap-1 opacity-20">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Recovered</span>
                         </div>
                       )}
                    </td>

                    <td className="px-4 py-3 text-center">
                       {(emp.emailAccounts?.length || 0) > 0 ? (
                         <div className="flex flex-col items-center gap-1">
                            <ShieldAlert className="w-4 h-4 text-red-500" />
                            <span className="text-[8px] font-black text-red-500 uppercase">Active Identity</span>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center gap-1 opacity-20">
                            <Mail className="w-4 h-4 text-green-500" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Deactivated</span>
                         </div>
                       )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                        emp.status === 'notice_period' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                        emp.status === 'exit_pending' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : 
                        "bg-red-500/10 text-red-500 border-red-500/20"
                      )}>
                        {emp.status === 'notice_period' ? "Notice Period" : 
                         emp.status === 'exit_pending' ? "Exit Pending" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-3 text-right pr-10">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/hr/employees/${emp.id}`}
                          className="p-1.5 text-muted-foreground hover:text-primary transition-all"
                          title="View Full Record"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(emp.id, emp.fullName); }}
                          className="p-1.5 text-muted-foreground hover:text-red-500 transition-all"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {hasMore && (
            <div ref={loaderRef} className="py-8 flex items-center justify-center border-t border-border/5">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Analyzing further records...</p>
              </div>
            </div>
          )}

          {!hasMore && exits.length > 0 && (
             <div className="py-8 text-center border-t border-border/5">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/20">End of Offboarding Archive</p>
             </div>
          )}
        </div>
      </div>

      {showRegisterModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tight text-red-500 flex items-center gap-2">
                  <UserX className="w-5 h-5" />
                  Initiate Exit Process
                </h3>
                <button onClick={() => setShowRegisterModal(false)} className="p-2 hover:bg-muted rounded-xl transition-all">
                  <ArrowRightLeft className="w-4 h-4 text-muted-foreground rotate-45" />
                </button>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Search active employees to record resignation or termination
              </p>
            </div>

            <div className="px-8 py-4 space-y-6 flex-1 overflow-auto">
              {!selectedEmp ? (
                <div className="space-y-4">
                   <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="ENTER NAME OR EMPLOYEE CODE..."
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                      className="w-full bg-muted/30 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:bg-background transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-auto pr-2 custom-scrollbar">
                    {searching ? (
                      <div className="py-10 text-center opacity-40 animate-pulse">
                        <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Searching Registry...</p>
                      </div>
                    ) : empResults.length > 0 ? (
                      empResults.map(emp => (
                        <button
                          key={emp.id}
                          onClick={() => setSelectedEmp(emp)}
                          className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-primary/10 border border-white/5 rounded-2xl transition-all group"
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                              {emp.fullName[0]}
                            </div>
                            <div>
                              <p className="text-xs font-black">{emp.fullName}</p>
                              <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">{emp.employeeCode} · {emp.department}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </button>
                      ))
                    ) : empSearch.length >= 2 ? (
                      <div className="py-10 text-center opacity-20 italic">
                        <p className="text-[9px] font-black uppercase tracking-widest">No matching active employees found</p>
                      </div>
                    ) : (
                       <div className="py-10 text-center opacity-10">
                        <UserX className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Start typing to search</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 font-black">
                        {selectedEmp.fullName[0]}
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-red-500/60 tracking-widest">Selected Employee</p>
                        <p className="text-sm font-black">{selectedEmp.fullName}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedEmp(null)} className="text-[9px] font-black uppercase text-muted-foreground hover:text-foreground">Change</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Last Working Day</label>
                      <input
                        type="date"
                        value={exitDate}
                        onChange={(e) => setExitDate(e.target.value)}
                        className="w-full bg-muted/30 border border-white/5 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-background transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Reason (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Personal Reasons..."
                        value={exitReason}
                        onChange={(e) => setExitReason(e.target.value)}
                        className="w-full bg-muted/30 border border-white/5 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-background transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-muted/10 border-t border-white/5 flex gap-3">
               <button
                onClick={() => setShowRegisterModal(false)}
                className="flex-1 px-6 py-3 bg-muted border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted/80 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={!selectedEmp || !exitDate || isUpdating}
                onClick={handleRegisterExit}
                className="flex-[2] px-6 py-3 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
              >
                {isUpdating ? "Processing..." : "Initiate Exit Process"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
