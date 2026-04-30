"use client";

import {
  Users,
  Plus,
  Search,
  Calendar,
  MapPin,
  UserCircle,
  Building2,
  Edit,
  Trash2,
  Loader2,
  History,
  PlaneTakeoff,
  Map,
  Briefcase,
  Download,
  FileSpreadsheet,
  UserCheck,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { format, isThisWeek, isThisMonth } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

interface UpcomingJoining {
  id: string;
  fullName: string;
  designation: string;
  department: string | null;
  companyName: string;
  reportingManager: string;
  joiningDate: string;
  experience: string | null;
  placeOfPosting: string;
  joiningLocation: string;
  status: string;
  statusReason: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  upcoming: { label: "Upcoming", color: "text-blue-500", bg: "bg-blue-500/10" },
  joined: { label: "Joined", color: "text-green-500", bg: "bg-green-500/10" },
  on_hold: { label: "On Hold", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  not_joined: { label: "Not Joined", color: "text-red-500", bg: "bg-red-500/10" },
  retained: { label: "Retained", color: "text-orange-500", bg: "bg-orange-500/10" },
  cancelled: { label: "Cancelled", color: "text-gray-500", bg: "bg-gray-500/10" },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

export default function UpcomingJoiningPage() {
  const PAGE_SIZE = 50;
  const router = useRouter();
  const [data, setData] = useState<UpcomingJoining[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [managerPhotos, setManagerPhotos] = useState<Record<string, string>>({});
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<{ id: string; rect: DOMRect } | null>(null);
  const [showReasonModal, setShowReasonModal] = useState<{ id: string; status: string } | null>(null);
  const [reasonText, setReasonText] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData(0);
    fetchManagerPhotos();
    fetchFilterOptions();
  }, []);

  const [allDataForFilters, setAllDataForFilters] = useState<UpcomingJoining[]>([]);
  
  const fetchFilterOptions = async () => {
    try {
      const res = await fetch("/api/hr/upcoming");
      const json = await res.json();
      setAllDataForFilters(Array.isArray(json) ? json : []);
    } catch (error) {
      console.error("Filter fetch error:", error);
    }
  };

  const fetchData = async (skip = 0, append = false) => {
    try {
      if (skip === 0) setLoading(true);
      else setLoadingMore(true);

      const res = await fetch(`/api/hr/upcoming?skip=${skip}&take=${PAGE_SIZE}`);
      if (!res.ok) throw new Error("Failed to fetch data");
      const result = await res.json();
      
      const newItems = result.data || result;
      setTotal(result.total || newItems.length);
      setHasMore(result.hasMore ?? false);

      if (append) {
        setData(prev => [...prev, ...newItems]);
      } else {
        setData(newItems);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setData([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader || !hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchData(data.length, true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loader);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, data.length]);

  const fetchManagerPhotos = async () => {
    try {
      const res = await fetch("/api/employees");
      const employees = await res.json();
      const empList = employees.data || employees;
      const photoMap: Record<string, string> = {};
      empList.forEach((e: any) => {
        if (e.fullName && e.photoPath) {
          photoMap[e.fullName] = e.photoPath;
        }
      });
      setManagerPhotos(photoMap);
    } catch (error) {
      console.error("Failed to fetch manager photos:", error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the pipeline?`)) return;
    try {
      const res = await fetch(`/api/hr/upcoming?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleOnboard = (item: UpcomingJoining) => {
    const params = new URLSearchParams({
      upcomingId: item.id,
    });
    router.push(`/hr/employees/new?${params.toString()}`);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (["on_hold", "not_joined", "retained", "cancelled"].includes(newStatus)) {
      setShowReasonModal({ id, status: newStatus });
      setActiveDropdown(null);
      return;
    }
    try {
      await fetch(`/api/hr/upcoming?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, statusReason: null }),
      });
      fetchData();
    } catch (error) {
      console.error("Status change error:", error);
    }
    setActiveDropdown(null);
  };

  const submitStatusWithReason = async () => {
    if (!showReasonModal) return;
    try {
      await fetch(`/api/hr/upcoming?id=${showReasonModal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: showReasonModal.status, statusReason: reasonText }),
      });
      fetchData();
    } catch (error) {
      console.error("Status change error:", error);
    }
    setShowReasonModal(null);
    setReasonText("");
  };

  // Derived filter options (using all data)
  const companies = [...new Set(allDataForFilters.map((d) => d.companyName).filter(Boolean))].sort();
  const locations = [...new Set(allDataForFilters.map((d) => d.placeOfPosting).filter(Boolean))].sort();

  // Stats (using all data)
  const thisMonthCount = allDataForFilters.filter((item) => {
    try { return isThisMonth(new Date(item.joiningDate)); } catch { return false; }
  }).length;

  const thisWeekCount = allDataForFilters.filter((item) => {
    try { return isThisWeek(new Date(item.joiningDate), { weekStartsOn: 1 }); } catch { return false; }
  }).length;

  const locationCount = new Set(allDataForFilters.map((i) => i.placeOfPosting).filter(Boolean)).size;

  // Filtering
  const filteredData = data.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      item.fullName?.toLowerCase().includes(q) ||
      item.designation?.toLowerCase().includes(q) ||
      item.department?.toLowerCase().includes(q) ||
      item.companyName?.toLowerCase().includes(q) ||
      item.reportingManager?.toLowerCase().includes(q) ||
      item.placeOfPosting?.toLowerCase().includes(q) ||
      item.joiningLocation?.toLowerCase().includes(q);

    const matchesCompany =
      selectedCompany === "all" || item.companyName === selectedCompany;
    const matchesLocation =
      selectedLocation === "all" || item.placeOfPosting === selectedLocation;

    let matchesPeriod = true;
    if (selectedPeriod === "week") {
      try { matchesPeriod = isThisWeek(new Date(item.joiningDate), { weekStartsOn: 1 }); } catch { matchesPeriod = false; }
    } else if (selectedPeriod === "month") {
      try { matchesPeriod = isThisMonth(new Date(item.joiningDate)); } catch { matchesPeriod = false; }
    }

    const matchesStatus =
      selectedStatus === "all" || item.status === selectedStatus;

    return matchesSearch && matchesCompany && matchesLocation && matchesPeriod && matchesStatus;
  });

  const stats = [
    { label: "Total Pipeline", value: allDataForFilters.length, icon: PlaneTakeoff, color: "text-primary bg-primary/10 border-primary/20" },
    { label: "This Week", value: thisWeekCount, icon: Calendar, color: "text-secondary bg-secondary/10 border-secondary/20" },
    { label: "This Month", value: thisMonthCount, icon: Briefcase, color: "text-foreground bg-muted/50 border-border" },
    { label: "Locations", value: locationCount, icon: MapPin, color: "text-accent bg-accent/10 border-accent/20" },
  ];

  const exportCSV = () => {
    const headers = ["Full Name", "Designation", "Company", "Reporting Manager", "Joining Date", "Experience", "Place of Posting", "Joining Location", "Status"];
    const rows = filteredData.map((item) => [
      item.fullName,
      item.designation,
      item.companyName,
      item.reportingManager,
      item.joiningDate ? format(new Date(item.joiningDate), "dd-MMM-yyyy") : "",
      item.experience || "",
      item.placeOfPosting,
      item.joiningLocation,
      item.status,
    ]);
    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `upcoming_joinings_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
          Synchronizing Pipeline...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-20 pt-4 h-full flex flex-col">
      {/* Top Actions */}
      <div className="flex justify-end items-center gap-2 px-1">
        <button onClick={() => fetchData()} className="p-2.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-muted-foreground transition-all">
          <Loader2 className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>

        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
          Export CSV
        </button>

        <Link href="/hr/upcoming/new" className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> Add Joiner
        </Link>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card border border-border/60 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
            <div className="space-y-0.5">
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">{stat.label}</p>
              <h4 className="text-xl font-black">{stat.value}</h4>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border border-transparent transition-all", stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Unified Multi-Filter Ribbon */}
      <div className="bg-card/50 border border-border p-1.5 rounded-2xl flex flex-col lg:flex-row gap-2 items-center shrink-0">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="SEARCH BY NAME, DESIGNATION, COMPANY, MANAGER..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent pl-11 pr-4 py-2.5 rounded-xl text-[10px] font-bold border border-transparent focus:bg-background outline-none transition-all placeholder:text-[8px] placeholder:font-black placeholder:tracking-widest opacity-80"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]">
            <option value="all">ALL TIME</option>
            <option value="week">THIS WEEK</option>
            <option value="month">THIS MONTH</option>
          </select>
          <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]">
            <option value="all">COMPANIES</option>
            {companies.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
          </select>
          <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]">
            <option value="all">LOCATIONS</option>
            {locations.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]">
            <option value="all">ALL STATUSES</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {/* High-Density Table */}
      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/50 backdrop-blur-md border-b border-border/50">
                <th className="pl-6 pr-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Candidate</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Designation & Company</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Reporting Manager</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">DOJ & Experience</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Posting Details</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Status</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Process</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-right pr-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-muted-foreground opacity-30 uppercase tracking-[0.2em] text-[9px] font-black">
                    Pipeline Empty
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={`${item.id}-${idx}`} className="group hover:bg-muted/20 cursor-default transition-all border-l-2 border-l-transparent hover:border-l-primary" onClick={() => router.push(`/hr/upcoming/${item.id}`)}>
                    <td className="pl-6 pr-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shrink-0">
                          <span className="text-[10px] font-black uppercase tracking-tighter">
                            {item.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-black tracking-tight">{item.fullName}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-tight">{item.designation || "—"}</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{item.department || "—"}</p>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-foreground/70 uppercase tracking-tighter mt-1">
                        <Building2 className="w-3 h-3 opacity-30" />
                        {item.companyName || "—"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/10 shrink-0 overflow-hidden">
                          {item.reportingManager && managerPhotos[item.reportingManager] ? (
                            <img
                              src={managerPhotos[item.reportingManager]}
                              alt={item.reportingManager}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] font-black uppercase tracking-tighter">
                              {item.reportingManager ? item.reportingManager.split(' ').map(n => n[0]).join('').slice(0, 2) : "—"}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold">{item.reportingManager || "—"}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <p className="text-[9px] font-black tracking-widest text-foreground/80 uppercase">
                        {item.joiningDate ? format(new Date(item.joiningDate), "MMM dd, yyyy") : "N/A"}
                      </p>
                      <div className="flex items-center justify-center gap-1.5 mt-1 text-muted-foreground/50">
                        <History className="w-3 h-3" />
                        <p className="text-[8px] font-bold uppercase italic">{item.experience || "Fresher"}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70 uppercase tracking-tighter">
                        <MapPin className="w-3 h-3 opacity-30" />
                        {item.placeOfPosting || "—"}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
                        <Map className="w-3 h-3 opacity-30" />
                        {item.joiningLocation || "—"}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveDropdown(activeDropdown?.id === item.id ? null : { id: item.id, rect });
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 mx-auto hover:scale-105 shadow-sm shadow-black/5",
                          STATUS_CONFIG[item.status]?.bg || "bg-gray-500/10",
                          STATUS_CONFIG[item.status]?.color || "text-gray-500",
                          "border-current/20"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_CONFIG[item.status]?.color?.replace('text', 'bg'))} />
                        {STATUS_CONFIG[item.status]?.label || item.status}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </button>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {item.status === "upcoming" ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOnboard(item); }}
                          className="flex items-center gap-2 px-4 py-1.5 bg-green-500 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all mx-auto"
                        >
                          <UserCheck className="w-3 h-3" />
                          Onboard
                        </button>
                      ) : (
                        <span className="text-[7px] font-black text-muted-foreground/30 uppercase tracking-widest">Locked</span>
                      )}
                    </td>

                    <td className="px-6 py-3 text-right pr-10">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/hr/upcoming/${item.id}`}
                          className="p-1.5 text-muted-foreground hover:text-primary transition-all"
                          title="View Details"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/hr/upcoming/${item.id}/edit`}
                          className="p-1.5 text-muted-foreground hover:text-primary transition-all"
                          title="Edit Record"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.fullName); }}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-all"
                          title="Remove from Pipeline"
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
          
          {/* Infinite Scroll Loader */}
          {hasMore && (
            <div ref={loaderRef} className="py-8 flex items-center justify-center border-t border-border/5">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Loading more joiners...</p>
              </div>
            </div>
          )}

          {!hasMore && data.length > 0 && (
             <div className="py-8 text-center border-t border-border/5">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/20">End of pipeline reached</p>
             </div>
          )}
        </div>
      </div>

      {/* Dropdown Portal */}
      {activeDropdown && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed z-[9999] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 min-w-[160px]"
          style={{ 
            top: activeDropdown.rect.bottom + 8,
            left: activeDropdown.rect.left + (activeDropdown.rect.width / 2),
            transform: 'translateX(-50%)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(activeDropdown.id, s)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-muted/80 transition-all",
                  STATUS_CONFIG[s]?.color
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", STATUS_CONFIG[s]?.bg, "ring-2 ring-current/10")} />
                {STATUS_CONFIG[s]?.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowReasonModal(null)}>
          <div className="bg-card border border-border w-full max-w-md rounded-[32px] shadow-2xl p-8 space-y-6 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", STATUS_CONFIG[showReasonModal.status]?.bg)}>
                  <AlertCircle className={cn("w-5 h-5", STATUS_CONFIG[showReasonModal.status]?.color)} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Status Change Remarks</h3>
                  <p className={cn("text-[10px] font-black uppercase tracking-widest", STATUS_CONFIG[showReasonModal.status]?.color)}>
                    Transitioning to {STATUS_CONFIG[showReasonModal.status]?.label}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowReasonModal(null)} className="p-2 hover:bg-muted rounded-xl transition-all">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                Provide Context / Reason
              </label>
              <textarea
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Briefly state the reason for this change..."
                rows={3}
                className="w-full bg-muted/25 border border-border/70 focus:border-primary/40 rounded-2xl px-4 py-3 text-xs text-foreground outline-none transition-all font-bold placeholder:text-muted-foreground/40 resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowReasonModal(null)}
                className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitStatusWithReason}
                className={cn(
                  "px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:scale-105 active:scale-95",
                  STATUS_CONFIG[showReasonModal.status]?.bg.replace('/10', ''),
                  "bg-primary"
                )}
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
