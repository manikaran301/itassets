"use client";

import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Edit2,
  Trash2,
  Laptop,
  Loader2,
  ChevronRight,
  Building2,
  Calendar,
  Mail,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { EmployeeListItem } from "@/lib/types";
import Link from "next/link";
import { format } from "date-fns";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      setEmployees(data);

      // Calculate distinct departments
      const deptList = [
        ...new Set(
          data.map((e: EmployeeListItem) => e.department).filter(Boolean),
        ),
      ] as string[];
      setDepartments(deptList);
      setDepartmentCount(deptList.length);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEmployees((prev) => prev.filter((e) => e.id !== id));
      } else {
        alert("Failed to delete employee.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong.");
    }
  };

  // Filter employees based on search and department
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      searchQuery === "" ||
      emp.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment =
      selectedDepartment === "all" || emp.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      <div className="flex justify-end">
        <div className="flex items-center gap-3">
          <button className="p-3 bg-card/40 border border-white/5 rounded-2xl hover:bg-card/60 transition-all text-muted-foreground hover:text-foreground">
            <Download className="w-4 h-4" />
          </button>
          <Link
            href="/hr/employees/new"
            className="group flex items-center gap-3 px-8 py-3 bg-primary text-primary-foreground rounded-[22px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>Enroll Associate</span>
          </Link>
        </div>
      </div>

      {/* Stats Mini Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary/5 rounded-[24px] p-6 border border-primary/10 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
            Active Capacity
          </p>
          <div className="flex items-end justify-between">
            <h4 className="text-3xl font-black tracking-tighter">
              {employees.length}
            </h4>
            <div className="text-[9px] font-black uppercase bg-primary/20 px-3 py-1 rounded-full text-primary">
              Live Associates
            </div>
          </div>
        </div>
        <div className="bg-muted/10 rounded-[24px] p-6 border border-white/5 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
            Business Units
          </p>
          <div className="flex items-end justify-between">
            <h4 className="text-3xl font-black text-foreground/80 tracking-tighter">
              {departmentCount.toString().padStart(2, "0")}
            </h4>
            <div className="text-[9px] font-black uppercase text-muted-foreground/40">
              Departments
            </div>
          </div>
        </div>
        <div className="bg-muted/10 rounded-[24px] p-6 border border-white/5 space-y-1 opacity-60">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
            Infrastructure Load
          </p>
          <div className="flex items-end justify-between">
            <h4 className="text-3xl font-black text-muted-foreground/60 tracking-tighter">
              00
            </h4>
            <div className="text-[9px] font-black uppercase text-muted-foreground/30 italic">
              Provisioning Rate
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-8 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by ID, Name or Department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card/40 border border-white/5 focus:border-primary/20 rounded-2xl pl-12 pr-4 py-3 text-xs outline-none transition-all font-bold placeholder:font-normal placeholder:opacity-30"
          />
        </div>
        <div className="lg:col-span-4 flex gap-2">
          <div className="flex-1 relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full appearance-none bg-card/40 border border-white/5 rounded-2xl pl-12 pr-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-card/60 transition-all outline-none cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-20 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Directory Table */}
      <div className="bg-card/40 border border-white/5 rounded-[32px] overflow-hidden premium-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.03] bg-muted/20">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Identity & Status
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Unit & Logic
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-center">
                  Infrastructure
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Onboarding Date
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-right pr-8">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                      Synchronizing Workforce...
                    </p>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-20 text-center text-muted-foreground"
                  >
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p className="text-sm font-bold opacity-30 uppercase tracking-widest">
                      Registry Empty
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="group hover:bg-white/[0.015] transition-colors relative"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary/10 transition-all">
                          <span className="text-xs font-black text-primary uppercase">
                            {emp.fullName
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-black tracking-tight group-hover:text-primary transition-colors">
                            {emp.fullName}
                          </p>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                emp.status === "active"
                                  ? "bg-green-500"
                                  : "bg-amber-500",
                              )}
                            />
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
                              {emp.employeeCode}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-tight text-foreground/80">
                          <Building2 className="w-3.5 h-3.5 text-primary opacity-40" />
                          {emp.department || "General"}
                        </div>
                        <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest">
                          {emp.designation}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className="w-8 h-8 bg-muted/20 rounded-xl flex items-center justify-center text-muted-foreground/20 hover:text-primary/40 transition-colors"
                          title="Laptop"
                        >
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div
                          className="w-8 h-8 bg-muted/20 rounded-xl flex items-center justify-center text-muted-foreground/20 hover:text-primary/40 transition-colors"
                          title="Identity Email"
                        >
                          <Mail className="w-4 h-4" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground/20" />
                        <div>
                          <p className="text-[11px] font-black text-foreground/80 uppercase tracking-tight">
                            {format(new Date(emp.startDate), "MMM dd, yyyy")}
                          </p>
                          <p className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest">
                            Onboarding Complete
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right pr-8">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <Link
                          href={`/hr/employees/${emp.id}/edit`}
                          className="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-all border border-transparent hover:border-primary/10 block"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(emp.id, emp.fullName)}
                          className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-500/10"
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
        </div>
      </div>
    </div>
  );
}
