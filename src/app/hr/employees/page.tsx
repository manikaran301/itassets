"use client";

import {
  Users,
  Search,
  Plus,
  Download,
  Edit2,
  Trash2,
  Loader2,
  ChevronRight,
  Building2,
  Calendar,
  MapPin,
  Briefcase,
  Lock,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import type { EmployeeListItem } from "@/lib/types";
import Link from "next/link";
import { format } from "date-fns";

export default function EmployeesPage() {
  const PAGE_SIZE = 50;
  const router = useRouter();
  const { checkPermission, loading: permsLoading } = usePermissions();
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchEmployees = useCallback(async (skip = 0, append = false) => {
    try {
      if (skip === 0) setLoading(true);
      else setLoadingMore(true);

      const response = await fetch(
        `/api/employees?skip=${skip}&take=${PAGE_SIZE}`,
      );
      const result = await response.json();

      const data: EmployeeListItem[] = result.data;
      setTotal(result.total);
      setHasMore(result.hasMore);

      if (append) {
        setEmployees((prev) => [...prev, ...data]);
      } else {
        setEmployees(data);
      }

      // Build filter lists from all loaded data
      if (!append) {
        // Fetch all unique filter values in one lightweight call
        const allRes = await fetch("/api/employees");
        const allData: EmployeeListItem[] = await allRes.json();

        const deptList = [
          ...new Set(allData.map((e) => e.department).filter(Boolean)),
        ] as string[];
        setDepartments(deptList.sort());
        setDepartmentCount(deptList.length);

        const companyList = [
          ...new Set(allData.map((e) => e.companyName).filter(Boolean)),
        ] as string[];
        setCompanies(companyList.sort());

        const locationList = [
          ...new Set(allData.map((e) => e.locationJoining).filter(Boolean)),
        ] as string[];
        setLocations(locationList.sort());
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees(0);
  }, [fetchEmployees]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const loader = loaderRef.current;
    const scrollContainer = scrollRef.current;
    if (!loader || !scrollContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchEmployees(employees.length, true);
        }
      },
      { root: scrollContainer, threshold: 0.1 },
    );

    observer.observe(loader);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, employees.length, fetchEmployees]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setEmployees((prev) => prev.filter((e) => e.id !== id));
      } else if (response.status === 409) {
        // Conflict - cannot delete due to dependencies
        const message = data.details
          ? `Cannot delete employee:\n\n${data.details.join("\n")}`
          : data.error || "Cannot delete this employee.";
        alert(message);
      } else {
        const message = data.details
          ? `${data.error}\n\n${data.details}`
          : data.error || "Failed to delete employee.";
        alert(message);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  // Filter employees based on search and department
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      emp.fullName?.toLowerCase().includes(q) ||
      emp.employeeCode?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q) ||
      emp.designation?.toLowerCase().includes(q) ||
      emp.companyName?.toLowerCase().includes(q) ||
      emp.locationJoining?.toLowerCase().includes(q);

    const matchesDepartment =
      selectedDepartment === "all" || emp.department === selectedDepartment;
    const matchesCompany =
      selectedCompany === "all" || emp.companyName === selectedCompany;
    const matchesLocation =
      selectedLocation === "all" || emp.locationJoining === selectedLocation;

    return (
      matchesSearch && matchesDepartment && matchesCompany && matchesLocation
    );
  });

  const stats = [
    { label: "Active Workforce", value: total || employees.length, icon: Users, color: "text-primary bg-primary/10 border-primary/20" },
    { label: "Legal Entities", value: companies.length, icon: Building2, color: "text-secondary bg-secondary/10 border-secondary/20" },
    { label: "Departments", value: departments.length, icon: Briefcase, color: "text-foreground bg-muted/50 border-border" },
    { label: "Total Locations", value: locations.length, icon: MapPin, color: "text-accent bg-accent/10 border-accent/20" },
  ];

  if (loading || permsLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
          {permsLoading ? "Securing HR Registry..." : "Synchronizing Associate Matrix..."}
        </p>
      </div>
    );
  }

  // Permission Check: View
  if (!checkPermission("HR", "EMPLOYEES", "canView")) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
          <Lock className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-black tracking-tight uppercase">Access Restricted</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You do not have authorization to view the <span className="font-bold text-foreground">Employee Registry</span>. 
            Please contact your system administrator to request <code className="bg-muted px-1.5 py-0.5 rounded text-primary">HR_EMPLOYEES_VIEW</code> clearance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-20 pt-4 h-full flex flex-col">
      <div className="flex justify-end items-center gap-2 px-1">
        <button onClick={() => fetchEmployees(0)} className="p-2.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-muted-foreground transition-all">
          <Loader2 className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
        {checkPermission("HR", "EMPLOYEES", "canCreate") && (
          <Link href="/hr/employees/new" className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <Plus className="w-4 h-4" /> Enroll Employee
          </Link>
        )}
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card border border-border/60 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
            <div className="space-y-0.5">
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">{stat.label}</p>
              <h4 className="text-xl font-black">{loading ? "..." : stat.value}</h4>
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
            placeholder="SEARCH BY NAME, DEPT, COMPANY, CODE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent pl-11 pr-4 py-2.5 rounded-xl text-[10px] font-bold border border-transparent focus:bg-background outline-none transition-all placeholder:text-[8px] placeholder:font-black placeholder:tracking-widest opacity-80"
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]">
            <option value="all">DEPARTMENTS</option>
            {departments.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
          </select>
          <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]">
            <option value="all">COMPANIES</option>
            {companies.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
          </select>
          <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="bg-muted/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer transition-all min-w-[140px]">
            <option value="all">LOCATIONS</option>
            {locations.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {/* High-Density Registry Container */}
      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-0">
        <div ref={scrollRef} className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/50 backdrop-blur-md border-b border-border/50">
                <th className="pl-6 pr-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Associate Registry</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Designation & Dept</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Business Units</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Location</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Joining Date</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-right pr-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Synchronizing Workforce...</p>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-muted-foreground opacity-30 uppercase tracking-[0.2em] text-[9px] font-black">
                    Registry Vacant
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, idx) => (
                  <tr key={`${emp.id}-${idx}`} className="group hover:bg-muted/20 cursor-default transition-all border-l-2 border-l-transparent hover:border-l-primary" onClick={() => router.push(`/hr/employees/${emp.id}/edit`)}>
                    <td className="pl-6 pr-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 overflow-hidden shrink-0">
                          {emp.photoPath ? (
                            <img 
                              src={emp.photoPath} 
                              alt={emp.fullName} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-tighter">
                              {emp.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-black tracking-tight">{emp.fullName}</p>
                            <span className={cn("w-1 h-1 rounded-full", emp.status === "active" ? "bg-green-500" : "bg-red-500")} />
                          </div>
                          <p className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest">{emp.employeeCode}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-tight">{emp.designation || "STAFF SOURCE"}</p>
                      <p className="text-[9px] text-muted-foreground/50 font-bold italic">{emp.department || "N/A"}</p>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70 uppercase tracking-tighter">
                        <Building2 className="w-3 h-3 opacity-30" />
                        {emp.companyName || "—"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70 uppercase tracking-tighter">
                          <MapPin className="w-3 h-3 opacity-30" />
                          {emp.locationJoining || "—"}
                        </div>
                        { (emp.workspace?.code || emp.deskNumber) && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[8px] font-black uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded tracking-[0.1em]">
                              SEAT {emp.workspace?.code || emp.deskNumber}
                            </span>
                            { emp.workspace?.floor && (
                              <span className="text-[7px] font-black text-muted-foreground/40 uppercase tracking-widest">
                                • FLOOR {emp.workspace.floor}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <p className="text-[9px] font-black tracking-widest text-foreground/80 uppercase">
                        {emp.startDate ? format(new Date(emp.startDate), "MMM dd, yyyy") : "n/a"}
                      </p>
                      <p className="text-[8px] text-muted-foreground/50 font-bold italic">
                        {emp.startDate ? (() => {
                          const start = new Date(emp.startDate);
                          const diff = new Date().getTime() - start.getTime();
                          const years = diff / (1000 * 60 * 60 * 24 * 365.25);
                          if (years < 1) {
                            const months = Math.floor(years * 12);
                            return months === 0 ? "New Joiner" : `${months} Months`;
                          }
                          return `${years.toFixed(1)} Years`;
                        })() : "—"}
                      </p>
                    </td>

                    <td className="px-6 py-3 text-right pr-10">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
                        {checkPermission("HR", "EMPLOYEES", "canEdit") && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); router.push(`/hr/employees/${emp.id}/edit`); }} 
                            className="p-1.5 text-muted-foreground hover:text-primary transition-all"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {checkPermission("HR", "EMPLOYEES", "canDelete") && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(emp.id, emp.fullName); }} 
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-all"
                            title="Remove Associate"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          <div ref={loaderRef} className="py-6 flex items-center justify-center">
            {loadingMore ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin opacity-40" />
            ) : !hasMore && employees.length > 0 && (
              <p className="text-[8px] font-black uppercase tracking-widest opacity-20">End of Registry</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
