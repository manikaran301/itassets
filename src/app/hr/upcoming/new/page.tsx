"use client";

import {
  ArrowLeft,
  Shield,
  Save,
  User,
  Calendar,
  MapPin,
  Briefcase,
  Building2,
  Loader2,
  History,
  PlaneTakeoff,
  Map,
  CheckCircle2,
  Mail,
  Phone,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchableSelect } from "@/components/SearchableSelect";
import { usePermissions } from "@/hooks/usePermissions";
import { ShieldAlert } from "lucide-react";

function formatExperience(isFresher: boolean, years: number, months: number) {
  if (isFresher) return "Fresher";
  if (years === 0 && months === 0) return "Fresher";
  
  const parts = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
  }
  return parts.join(" ");
}

export default function NewUpcomingJoiningPage() {
  const router = useRouter();
  const { checkPermission, loading: permissionsLoading } = usePermissions();
  const [managers, setManagers] = useState<{ value: string; label: string }[]>([]);
  const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
  const [designations, setDesignations] = useState<{ value: string; label: string }[]>([]);
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [masterCompanies, setMasterCompanies] = useState<any[]>([]);
  const [masterLocations, setMasterLocations] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");

  const [isFresher, setIsFresher] = useState(true);
  const [expYears, setExpYears] = useState(0);
  const [expMonths, setExpMonths] = useState(0);

  const handleFresherToggle = (fresher: boolean) => {
    setIsFresher(fresher);
    if (fresher) {
      updateField("experience", "Fresher");
    } else {
      updateField("experience", formatExperience(false, expYears, expMonths));
    }
  };

  const handleExpChange = (years: number, months: number) => {
    setExpYears(years);
    setExpMonths(months);
    updateField("experience", formatExperience(false, years, months));
  };

  const [formData, setFormData] = useState({
    fullName: "",
    designation: "",
    department: "",
    email: "",
    phoneNumber: "",
    companyName: "",
    companyId: "",
    reportingManager: "",
    joiningDate: "",
    experience: "Fresher",
    placeOfPosting: "",
    locationId: "",
    joiningLocation: "",
  });

  // Permission Check
  const canCreate = checkPermission("HR", "REQUIREMENTS", "canCreate");

  useEffect(() => {
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    try {
      // Fetch Managers from existing employees
      const empRes = await fetch("/api/employees");
      const empData = await empRes.json();
      const managerList = (empData.data || empData).map((e: any) => ({
        value: `${e.fullName} (${e.employeeCode})`,
        label: `${e.fullName} (${e.employeeCode})`,
      }));
      setManagers(managerList);

      // Fetch Master Data
      const [companiesRes, deptsRes, desigsRes, locsRes] = await Promise.all([
        fetch("/api/admin/master-data/companies"),
        fetch("/api/admin/master-data/departments"),
        fetch("/api/admin/master-data/designations"),
        fetch("/api/admin/master-data/locations"),
      ]);

      const [companiesData, deptsData, desigsData, locsData] = await Promise.all([
        companiesRes.json(),
        deptsRes.json(),
        desigsRes.json(),
        locsRes.json(),
      ]);

      if (Array.isArray(companiesData)) {
        setMasterCompanies(companiesData);
        setCompanies(companiesData.map(c => ({ value: c.id, label: c.name })));
      }
      if (Array.isArray(deptsData)) {
        setDepartments(deptsData.map(d => ({ value: d.name, label: d.name })));
      }
      if (Array.isArray(desigsData)) {
        setDesignations(desigsData.map(d => ({ value: d.name, label: d.name })));
      }
      if (Array.isArray(locsData)) {
        setMasterLocations(locsData);
        setLocations(locsData.map(l => ({ value: l.id, label: l.state ? `${l.name} (${l.state})` : l.name })));
      }
    } catch (error) {
      console.error("Failed to fetch support data:", error);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.designation || !formData.joiningDate) {
      setError("Please fill in all required fields (Name, Designation, DOJ).");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/hr/upcoming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to save record.");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push("/hr/upcoming");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (permissionsLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Verifying security clearances...</p>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-6 animate-fade-in">
        <div className="w-24 h-24 rounded-[40px] bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-2xl shadow-red-500/10 text-red-500">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Access Restricted</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-black opacity-60 max-w-sm mx-auto leading-relaxed">
            Your current security profile does not have authorization to add new candidates to the pipeline.
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-8 py-3 bg-card border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
        >
          Return to Previous Page
        </button>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 animate-fade-in">
        <div className="w-24 h-24 rounded-[40px] bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-2xl shadow-green-500/10 animate-bounce text-green-500">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tight">Record Activated</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-black opacity-60">
            {formData.fullName} has been added to the pipeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      <div className="sticky top-14 z-[100] bg-background/80 backdrop-blur-xl -mx-4 md:-mx-6 px-4 md:px-6 py-4 mb-2 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Link
              href="/hr/upcoming"
              className="p-2.5 hover:bg-white/5 rounded-2xl border border-white/5 transition-all text-muted-foreground/60 hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-xl font-black tracking-tight uppercase bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent leading-none">
              New Upcoming Joining
            </h2>
          </div>
          <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest italic pl-16">
            Talent Acquisition & Onboarding Pipeline
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <Link
            href="/hr/upcoming"
            className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-all"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-10 py-3.5 bg-primary text-primary-foreground rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {submitting ? "Saving..." : "Save Candidate"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-5 rounded-[24px] bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black flex items-center gap-4 animate-shake uppercase tracking-tight shadow-lg shadow-red-500/5">
          <Shield className="w-5 h-5 shrink-0" />
          <span>Pipeline Error: {error}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="premium-card p-8 rounded-[32px] border border-white/5 bg-card/40 relative group z-20 overflow-visible">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8">
            <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
            Candidate Information
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/85 ml-1">
                Full Name of Employee
              </label>
              <div className="relative group/field">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="E.g. Jane Smith"
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className="w-full bg-muted/25 border border-border/70 focus:border-primary/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-foreground outline-none transition-all font-bold placeholder:font-semibold placeholder:text-muted-foreground/70"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                Designation
              </label>
              <SearchableSelect
                options={designations}
                value={formData.designation}
                onChange={(val) => updateField("designation", val)}
                placeholder="Select Title..."
                allowCustom
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                Department
              </label>
              <SearchableSelect
                options={departments}
                value={formData.department}
                onChange={(val) => updateField("department", val)}
                placeholder="Select Department..."
                allowCustom
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                Company Name
              </label>
              <SearchableSelect
                options={companies}
                value={formData.companyId || formData.companyName}
                onChange={(val) => {
                  const comp = masterCompanies.find(c => c.id === val || c.name === val);
                  if (comp) {
                    setFormData(prev => ({ ...prev, companyName: comp.name, companyId: comp.id }));
                  } else {
                    setFormData(prev => ({ ...prev, companyName: val, companyId: "" }));
                  }
                  if (error) setError("");
                }}
                placeholder="Select Entity..."
                allowCustom
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                Reporting Manager
              </label>
              <SearchableSelect
                options={managers}
                value={formData.reportingManager}
                onChange={(val) => updateField("reportingManager", val)}
                placeholder="Select Manager..."
                allowCustom
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                Date of Joining (DOJ)
              </label>
              <div className="relative group/field">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => updateField("joiningDate", e.target.value)}
                  className="w-full bg-muted/25 border border-border/70 focus:border-primary/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-foreground outline-none transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-2 col-span-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                  Total Experience
                </label>
                <div className="text-[9px] font-black text-primary bg-primary/5 px-2.5 py-0.5 rounded border border-primary/10 tracking-widest uppercase">
                  {formData.experience || "Fresher"}
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-muted/25 border border-border/70 rounded-2xl px-4 py-3 transition-all">
                {/* Fresher toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  <GraduationCap className={cn("w-4 h-4 transition-colors", isFresher ? "text-primary" : "text-muted-foreground/40")} />
                  <span className="text-[9px] font-black uppercase tracking-tight">Fresher</span>
                  <label className="relative inline-flex items-center cursor-pointer ml-1">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isFresher}
                      onChange={(e) => handleFresherToggle(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Divider */}
                <div className="w-px h-5 bg-border/40 shrink-0" />

                {/* Years */}
                <select
                  disabled={isFresher}
                  value={expYears}
                  onChange={(e) => handleExpChange(parseInt(e.target.value), expMonths)}
                  className={cn(
                    "flex-1 bg-transparent border-none outline-none text-xs font-bold transition-all cursor-pointer",
                    isFresher && "opacity-30 cursor-not-allowed"
                  )}
                >
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i} value={i}>{i} {i === 1 ? 'Year' : 'Years'}</option>
                  ))}
                </select>

                {/* Divider */}
                <div className="w-px h-5 bg-border/40 shrink-0" />

                {/* Months */}
                <select
                  disabled={isFresher}
                  value={expMonths}
                  onChange={(e) => handleExpChange(expYears, parseInt(e.target.value))}
                  className={cn(
                    "flex-1 bg-transparent border-none outline-none text-xs font-bold transition-all cursor-pointer",
                    isFresher && "opacity-30 cursor-not-allowed"
                  )}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>{i} {i === 1 ? 'Month' : 'Months'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                Place of Posting
              </label>
              <SearchableSelect
                options={locations}
                value={formData.locationId || formData.placeOfPosting}
                onChange={(val) => {
                  const loc = masterLocations.find(l => l.id === val || l.name === val);
                  if (loc) {
                    setFormData(prev => ({ ...prev, placeOfPosting: loc.name, locationId: loc.id }));
                  } else {
                    setFormData(prev => ({ ...prev, placeOfPosting: val, locationId: "" }));
                  }
                  if (error) setError("");
                }}
                placeholder="Select Location..."
                allowCustom
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                Joining Location Details
              </label>
              <SearchableSelect
                options={locations}
                value={formData.joiningLocation}
                onChange={(val) => {
                  const loc = masterLocations.find(l => l.id === val || l.name === val);
                  if (loc) {
                    updateField("joiningLocation", loc.name);
                  } else {
                    updateField("joiningLocation", val);
                  }
                }}
                placeholder="Select Joining Location..."
                icon={<MapPin className="w-4 h-4" />}
                allowCustom
              />
            </div>

          </div>
        </div>

        {/* Contact Information */}
        <div className="premium-card p-8 rounded-[32px] border border-white/5 bg-card/40 relative group z-10 overflow-visible">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8">
            <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
            Contact Information
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                Personal Email
              </label>
              <div className="relative group/field">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                <input
                  type="email"
                  placeholder="e.g. name@example.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full bg-muted/25 border border-border/70 focus:border-primary/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-foreground outline-none transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                Phone Number
              </label>
              <div className="relative group/field">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phoneNumber}
                  onChange={(e) => updateField("phoneNumber", e.target.value)}
                  className="w-full bg-muted/25 border border-border/70 focus:border-primary/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-foreground outline-none transition-all font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 p-6 rounded-[24px] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <PlaneTakeoff className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Pre-boarding Activation</p>
            <p className="text-[9px] text-muted-foreground font-bold italic">
              Once saved, this candidate will appear in the upcoming joining pipeline and can be converted to an employee record on their DOJ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
