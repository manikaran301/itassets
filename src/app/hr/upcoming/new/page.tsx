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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchableSelect } from "@/components/SearchableSelect";

const COMPANIES = [
  { value: "Manikaran Power Limited (MPL)", label: "Manikaran Power Limited (MPL)" },
  { value: "Manikaran Renewables Limited (MRL)", label: "Manikaran Renewables Limited (MRL)" },
  { value: "Manikaran Analytics Limited (MAL)", label: "Manikaran Analytics Limited (MAL)" },
  { value: "Manikaran Hydro Private Limited (MHPL)", label: "Manikaran Hydro Private Limited (MHPL)" },
  { value: "50Hertz Limted", label: "50Hertz Limted" },
  { value: "Manikaran Utility Services Company Limited", label: "Manikaran Utility Services Company Limited" },
];

const DESIGNATIONS = [
  { value: "Associate", label: "Associate" },
  { value: "Senior Associate", label: "Senior Associate" },
  { value: "Lead", label: "Lead" },
  { value: "Manager", label: "Manager" },
  { value: "Director", label: "Director" },
  { value: "Executive", label: "Executive" },
  { value: "Intern", label: "Intern" },
  { value: "Technician", label: "Technician" },
];

export default function NewUpcomingJoiningPage() {
  const router = useRouter();
  const [managers, setManagers] = useState<{ value: string; label: string }[]>([]);
  const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    designation: "",
    department: "",
    email: "",
    phoneNumber: "",
    companyName: "",
    reportingManager: "",
    joiningDate: "",
    experience: "",
    placeOfPosting: "",
    joiningLocation: "",
  });

  useEffect(() => {
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    try {
      const res = await fetch("/api/employees");
      const employees = await res.json();
      const data = employees.data || employees;

      const managerList = data.map((e: any) => ({
        value: e.fullName,
        label: `${e.fullName} (${e.employeeCode})`,
      }));
      setManagers(managerList);

      const locList = [...new Set(data.map((e: any) => e.locationJoining).filter(Boolean))].map(
        (l: any) => ({ value: l as string, label: (l as string).toUpperCase() })
      );
      setLocations(locList);

      const deptList = [...new Set(data.map((e: any) => e.department).filter(Boolean))].map(
        (d: any) => ({ value: d as string, label: d as string })
      );
      setDepartments(deptList);
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
                options={DESIGNATIONS}
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
                options={COMPANIES}
                value={formData.companyName}
                onChange={(val) => updateField("companyName", val)}
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

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                Total Experience
              </label>
              <div className="relative group/field">
                <History className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="E.g. 4.5 Years"
                  value={formData.experience}
                  onChange={(e) => updateField("experience", e.target.value)}
                  className="w-full bg-muted/25 border border-border/70 focus:border-primary/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-foreground outline-none transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                Place of Posting
              </label>
              <SearchableSelect
                options={locations}
                value={formData.placeOfPosting}
                onChange={(val) => updateField("placeOfPosting", val)}
                placeholder="Select Location..."
                allowCustom
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                Joining Location Details
              </label>
              <div className="relative group/field">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="E.g. Main Reception, Block B, Floor 4"
                  value={formData.joiningLocation}
                  onChange={(e) => updateField("joiningLocation", e.target.value)}
                  className="w-full bg-muted/25 border border-border/70 focus:border-primary/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-foreground outline-none transition-all font-bold"
                />
              </div>
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
