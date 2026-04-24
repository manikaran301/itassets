"use client";

import {
  ArrowLeft,
  Shield,
  Save,
  User,
  Smartphone,
  PhoneCall as SimIcon,
  Monitor,
  CheckCircle2,
  Loader2,
  LayoutGrid,
  Hash,
  Scan,
  QrCode,
  Building2,
  Mail,
  Laptop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { SearchableSelect } from "@/components/SearchableSelect";

interface ManagerOption {
  value: string;
  label: string;
}

interface EmployeeData {
  id: string;
  fullName: string;
  employeeCode: string;
  personalEmail: string | null;
  personalPhone: string | null;
  department: string | null;
  designation: string | null;
  companyName: string | null;
  reportingManagerId: string | null;
  locationJoining: string | null;
  deskNumber: string | null;
  startDate: string;
  exitDate: string | null;
  status: string;
  assetRequirements: any[];
  provisioningRequests: any[];
  currentAssets: any[];
  emailAccounts: any[];
}

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;
  const { data: session } = useSession();

  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [, setLoadingManagers] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    employeeCode: "",
    personalEmail: "",
    personalPhone: "",
    department: "",
    designation: "",
    companyName: "",
    reportingManagerId: "",
    locationJoining: "",
    deskNumber: "",
    startDate: "",
    status: "active",
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [provisions, setProvisions] = useState({
    laptop: true,
    desktop: false,
    phone: false,
    sim: false,
    email: true,
  });

  const [infrastructure, setInfrastructure] = useState<{
    requirements: any[];
    requests: any[];
    assets: any[];
    emails: any[];
  }>({
    requirements: [],
    requests: [],
    assets: [],
    emails: [],
  });

  useEffect(() => {
    // Cleanup preview URL ONLY if it was created locally
    return () => {
      if (photoPreview && photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  // Fetch all managers for dropdown
  useEffect(() => {
// ... fetchManagers logic ...
    const fetchManagers = async () => {
      try {
        const response = await fetch("/api/employees");
        const data = await response.json();

        const reportCounts: Record<string, number> = {};
        data.forEach((emp: any) => {
          if (emp.reportingManagerId) {
            reportCounts[emp.reportingManagerId] =
              (reportCounts[emp.reportingManagerId] || 0) + 1;
          }
        });

        const formatted = data
          .filter((emp: any) => emp.id !== employeeId)
          .map((emp: any) => ({
            value: emp.id,
            label: `${emp.fullName} (${emp.employeeCode})`,
            reportCount: reportCounts[emp.id] || 0,
          }))
          .sort((a: any, b: any) => b.reportCount - a.reportCount);

        setManagers(formatted);
      } catch (err) {
        console.error("Error fetching managers:", err);
      } finally {
        setLoadingManagers(false);
      }
    };
    fetchManagers();
  }, [employeeId]);

  // Fetch specific employee details
  useEffect(() => {
    if (!employeeId) return;
    const fetchDetails = async () => {
      try {
        const response = await fetch(`/api/employees/${employeeId}`);
        if (!response.ok) throw new Error("Failed to fetch employee details");
        const data = await response.json();

        setFormData({
          fullName: data.fullName || "",
          employeeCode: data.employeeCode || "",
          personalEmail: data.personalEmail || "",
          personalPhone: data.personalPhone || "",
          department: data.department || "",
          designation: data.designation || "",
          companyName: data.companyName || "",
          reportingManagerId: data.reportingManagerId || "",
          locationJoining: data.locationJoining || "",
          deskNumber: data.deskNumber || "",
          startDate: data.startDate
            ? new Date(data.startDate).toISOString().split("T")[0]
            : "",
          status: data.status || "active",
        });

        if (data.photoPath) {
          setPhotoPreview(data.photoPath);
        }

        setInfrastructure({
          requirements: data.assetRequirements || [],
          requests: data.provisioningRequests || [],
          assets: data.currentAssets || [],
          emails: data.emailAccounts || [],
        });
      } catch (err) {
        setError("Error loading employee record.");
      } finally {
        setLoadingData(false);
      }
    };
    fetchDetails();
  }, [employeeId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null;
    
    if ("files" in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ("dataTransfer" in e) {
      e.preventDefault();
      file = e.dataTransfer.files[0];
    }

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Photo size must be less than 2MB.");
      return;
    }

    setPhoto(file);
    if (photoPreview && photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  };

  const removePhoto = () => {
    setPhoto(null);
    if (photoPreview && photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const toggleProvision = (key: keyof typeof provisions) => {
    setProvisions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.employeeCode) {
      setError("Required: Name and Employee Code.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let photoPath = photoPreview && !photoPreview.startsWith("blob:") ? photoPreview : "";
      
      if (photo) {
        const uploadData = new FormData();
        uploadData.append("file", photo);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });
        const uploadResult = await uploadRes.json();
        if (uploadRes.ok) photoPath = uploadResult.path;
      }

      const payload = {
        ...formData,
        photoPath,
        updatedBy: (session?.user as any)?.id || null,
      };

      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update employee.");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push("/hr/employees");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-32 animate-fade-in">
        <Loader2 className="w-12 h-12 text-primary animate-spin opacity-50" />
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
          <h3 className="text-2xl font-black uppercase tracking-tight">
            Identity Updated
          </h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-black opacity-60">
            {formData.fullName}'s records have been modified in the central
            registry.
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.4em] font-black animate-pulse">
          Syncing Global Directory
        </p>
      </div>
    );
  }

  const COMPANIES = [
    {
      value: "Manikaran Power Limited (MPL)",
      label: "Manikaran Power Limited (MPL)",
    },
    {
      value: "Manikaran Renewables Limited (MRL)",
      label: "Manikaran Renewables Limited (MRL)",
    },
    {
      value: "Manikaran Analytics Limited (MAL)",
      label: "Manikaran Analytics Limited (MAL)",
    },
    {
      value: "Manikaran Hydro Private Limited (MHPL)",
      label: "Manikaran Hydro Private Limited (MHPL)",
    },
    { value: "50Hertz Limted", label: "50Hertz Limted" },
    {
      value: "Manikaran Utility Services Company Limited",
      label: "Manikaran Utility Services Company Limited",
    },
  ];

  const DEPARTMENTS = [
    { value: "Engineering", label: "Engineering" },
    { value: "Operations", label: "Operations" },
    { value: "HR", label: "HR" },
    { value: "Marketing", label: "Marketing" },
    { value: "Sales", label: "Sales" },
    { value: "Logistics", label: "Logistics" },
    { value: "Finance", label: "Finance" },
    { value: "Compliance", label: "Compliance" },
    { value: "IT Support", label: "IT Support" },
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

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      {/* Dynamic Header */}
      <div className="sticky top-14 z-[100] bg-background/80 backdrop-blur-xl -mx-4 md:-mx-6 px-4 md:px-6 py-4 mb-2 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Link
              href="/hr/employees"
              className="p-2.5 hover:bg-white/5 rounded-2xl border border-white/5 transition-all text-muted-foreground/60 hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-xl font-black tracking-tight uppercase bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent leading-none">
              Modify Associate
            </h2>
          </div>
          <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest italic pl-16">
            Human Resource & Infrastructure Metadata
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <Link
            href="/hr/employees"
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
            {submitting ? "Updating..." : "Save Updates"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-5 rounded-[24px] bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black flex items-center gap-4 animate-shake uppercase tracking-tight shadow-lg shadow-red-500/5">
          <Shield className="w-5 h-5 shrink-0" />
          <span>Update Error: {error}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="xl:col-span-8 space-y-4">
          {/* Identity & Discovery */}
          <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative group z-40">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 relative z-10">
              <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
              Corporate Identity & Profile
            </div>

            <div className="flex flex-col md:flex-row gap-8 relative z-10">
               {/* Photo Upload Zone */}
               <div className="flex flex-col items-center gap-4">
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handlePhotoChange}
                  className={cn(
                    "w-48 h-60 rounded-[40px] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-4 relative overflow-hidden group/upload",
                    isDragging ? "border-primary bg-primary/5 scale-105" : "border-white/10 bg-muted/20 hover:border-primary/30",
                    photoPreview && "border-solid border-primary/20"
                  )}
                >
                  {photoPreview ? (
                    <>
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                         <button 
                          onClick={removePhoto}
                          className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"
                        >
                          <Shield className="w-4 h-4 rotate-45" />
                        </button>
                        <span className="text-[10px] font-black uppercase text-white tracking-widest">Update Photo</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Scan className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="text-center px-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Change Photo</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1">Passport Size</p>
                      </div>
                      <input 
                        type="file" 
                        onChange={handlePhotoChange} 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Identity Fields */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/85 ml-1">
                      Full Legal Name
                    </label>
                    <div className="relative group/field">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                      <input
                        type="text"
                        placeholder="Johnathon Doe"
                        value={formData.fullName}
                        onChange={(e) => updateField("fullName", e.target.value)}
                        className="w-full bg-muted/25 border border-border/70 focus:border-primary/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-foreground outline-none transition-all font-bold placeholder:font-semibold placeholder:text-muted-foreground/70"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/85 ml-1">
                      Employee ID Card
                    </label>
                    <div className="relative group/field">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                      <input
                        type="text"
                        placeholder="EMP-XXX"
                        value={formData.employeeCode}
                        onChange={(e) =>
                          updateField("employeeCode", e.target.value)
                        }
                        className="w-full bg-muted/25 border border-border/70 focus:border-primary/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-foreground outline-none transition-all font-black tracking-widest font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                      Company / Subsidiary
                    </label>
                    <SearchableSelect
                      options={COMPANIES}
                      value={formData.companyName}
                      onChange={(val) => updateField("companyName", val)}
                      placeholder="Select Company..."
                      allowCustom
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                      Department
                    </label>
                    <SearchableSelect
                      options={DEPARTMENTS}
                      value={formData.department}
                      onChange={(val) => updateField("department", val)}
                      placeholder="Select Dept..."
                      allowCustom
                    />
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
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                      Reporting Manager
                    </label>
                    <SearchableSelect
                      options={managers}
                      value={formData.reportingManagerId}
                      onChange={(val) => updateField("reportingManagerId", val)}
                      placeholder="Type to search..."
                      icon={<Shield className="w-4 h-4" />}
                      limit={5}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact & Location */}
            <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative z-30">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4 relative z-10">
                <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                Contact & Logistics
              </div>

              <div className="space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="Campus / Remote"
                      value={formData.locationJoining}
                      onChange={(e) =>
                        updateField("locationJoining", e.target.value)
                      }
                      className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 rounded-2xl px-6 py-3.5 text-xs outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                      Join Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => updateField("startDate", e.target.value)}
                      className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 rounded-2xl px-6 py-3.5 text-xs outline-none transition-all font-bold text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                    Personal Contact Info
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="email"
                      placeholder="personal@email.com"
                      value={formData.personalEmail}
                      onChange={(e) =>
                        updateField("personalEmail", e.target.value)
                      }
                      className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 rounded-2xl px-6 py-3.5 text-xs outline-none transition-all font-bold "
                    />
                    <input
                      type="tel"
                      placeholder="+91-XXXX-XXXXX"
                      value={formData.personalPhone}
                      onChange={(e) =>
                        updateField("personalPhone", e.target.value)
                      }
                      className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 rounded-2xl px-6 py-3.5 text-xs outline-none transition-all font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Station & Digital Identity */}
            <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative z-20">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4 relative z-10">
                <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                Station & Digital Identity
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                    Assigned Seat / Desk
                  </label>
                  <div className="relative group/field">
                    <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="e.g. F1-WS-024"
                      value={formData.deskNumber}
                      onChange={(e) =>
                        updateField("deskNumber", e.target.value)
                      }
                      className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs outline-none transition-all font-mono font-black tracking-widest"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                    Account Status
                  </label>
                  <SearchableSelect
                    options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                    value={formData.status}
                    onChange={(val) => updateField("status", val)}
                    placeholder="Status"
                  />
                </div>
              </div>
            </div>

            {/* Consolidated Infrastructure Lifecycle */}
            <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative z-10">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 relative z-10">
                <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                Infrastructure Lifecycle & Assets
              </div>

              <div className="space-y-4 relative z-10">
                {/* 1. Hardware Lifecycle Cards */}
                <div className="grid grid-cols-1 gap-3">
                  {Array.from(new Set([
                    ...infrastructure.requirements.map(r => r.assetType?.toLowerCase()),
                    ...infrastructure.requests.filter(r => r.deviceTypeNeeded).map(r => r.deviceTypeNeeded?.toLowerCase()),
                    ...infrastructure.assets.map(a => a.type?.toLowerCase())
                  ].filter(Boolean))).map((type, idx) => {
                    const req = infrastructure.requirements.find(r => r.assetType?.toLowerCase() === type);
                    const ticket = infrastructure.requests.find(r => r.deviceTypeNeeded?.toLowerCase() === type);
                    const asset = infrastructure.assets.find(a => a.type?.toLowerCase() === type);
                    const isFullySetup = !!asset;

                    return (
                      <div key={idx} className={cn(
                        "p-4 rounded-3xl border transition-all duration-500 flex flex-col gap-4",
                        isFullySetup 
                          ? "bg-green-500/[0.03] border-green-500/10 hover:border-green-500/30" 
                          : "bg-muted/10 border-white/5 hover:border-primary/20"
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all",
                              isFullySetup ? "bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]" : "bg-primary/10 text-primary border-primary/20"
                            )}>
                              {type === 'desktop' ? <Monitor className="w-6 h-6" /> : <Laptop className="w-6 h-6" />}
                            </div>
                            <div>
                              <h5 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                                {type}
                                {isFullySetup && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-green-500/30 animate-in fade-in zoom-in duration-500">
                                    <CheckCircle2 className="w-3 h-3" /> In Possession
                                  </span>
                                )}
                              </h5>
                              <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">Hardware Lifecycle</p>
                            </div>
                          </div>
                          {asset && (
                            <div className="text-right">
                              <p className="text-[10px] font-black text-foreground uppercase tracking-widest">{asset.assetTag}</p>
                              <p className="text-[8px] font-bold text-muted-foreground/50 uppercase">{asset.model}</p>
                            </div>
                          )}
                        </div>

                        {/* Lifecycle Steps */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className={cn(
                            "p-3 rounded-2xl border flex flex-col gap-1",
                            req ? (req.status === 'fulfilled' ? "bg-green-500/5 border-green-500/10" : "bg-amber-500/5 border-amber-500/10") : "bg-muted/5 border-white/5 opacity-40"
                          )}>
                            <p className="text-[7px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Step 1: Requirement</p>
                            <p className="text-[10px] font-bold uppercase">{req ? req.status : 'None Raised'}</p>
                          </div>
                          <div className={cn(
                            "p-3 rounded-2xl border flex flex-col gap-1",
                            ticket ? (ticket.status === 'fulfilled' ? "bg-green-500/5 border-green-500/10" : "bg-blue-500/5 border-blue-500/10") : "bg-muted/5 border-white/5 opacity-40"
                          )}>
                            <p className="text-[7px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Step 2: IT Provisioning</p>
                            <p className="text-[10px] font-bold uppercase">{ticket ? `${ticket.requestCode} · ${ticket.status}` : 'No Active Ticket'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Email Accounts Section */}
                <div className="pt-4">
                  <h5 className="text-[9px] font-black uppercase tracking-widest text-blue-500/50 mb-3 px-1 flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    Assigned Email Accounts
                  </h5>
                  <div className="grid grid-cols-1 gap-2">
                    {infrastructure.emails.length === 0 ? (
                      <div className="p-6 rounded-3xl border border-dashed border-blue-500/20 bg-blue-500/[0.02] text-center group/empty hover:bg-blue-500/[0.05] transition-all">
                        <Mail className="w-6 h-6 text-blue-500/20 mx-auto mb-2 group-hover/empty:scale-110 transition-transform" />
                        <p className="text-[10px] font-bold text-blue-500/30 uppercase tracking-widest italic">No Active Emails Assigned</p>
                      </div>
                    ) : (
                      infrastructure.emails.map((email, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-3xl border border-blue-500/10 bg-blue-500/[0.03] hover:bg-blue-500/[0.06] transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                              <Shield className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-foreground truncate max-w-[240px] tracking-tight">{email.emailAddress}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[8px] font-black uppercase text-blue-500/50 tracking-widest">{email.platform}</span>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                                <span className="text-[8px] font-black uppercase text-green-500 tracking-widest">{email.status}</span>
                              </div>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-500 rounded-xl text-[8px] font-black uppercase tracking-widest border border-blue-500/30">
                            ACTIVE ACCOUNT
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Card Column */}
        <div className="xl:col-span-4 sticky top-10 flex flex-col items-center gap-8">
          {/* THE CORPORATE ID CARD */}
          <div className="w-full max-w-[340px] bg-card/60 dark:bg-[#0A0A0A] backdrop-blur-3xl rounded-[48px] border border-black/5 dark:border-white/10 shadow-[0_64px_128px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_64px_128px_-16px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col group/id transition-all duration-500">
            {/* Badge Background Visuals */}
            <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-primary/10 dark:from-primary/20 to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

            <div className="px-10 pt-10 text-center relative z-10">
            </div>

            <div className="p-10 pb-6 relative z-10 text-center space-y-6">
              <div className="relative inline-block group/photo">
                <div className="w-40 h-52 rounded-[40px] bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center text-6xl font-black text-primary border border-primary/20 shadow-2xl relative z-10 group-hover/photo:scale-105 transition-transform duration-500 overflow-hidden">
                   {photoPreview ? (
                    <img src={photoPreview} alt="Passport" className="w-full h-full object-cover" />
                  ) : (
                    <span className="relative z-10 transition-transform duration-700">
                      {formData.fullName ? formData.fullName[0] : "?"}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-primary/20 animate-pulse pointer-events-none" />
                   {/* Scanning Effect Overlay */}
                   <div className="absolute top-0 inset-x-0 h-0.5 bg-primary/60 shadow-[0_0_15px_var(--primary)] animate-scan z-20" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <Scan className="w-full h-full scale-[1.5] rotate-45" />
                  </div>
                </div>
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-12 h-4 bg-muted/20 rounded-full border border-black/5 dark:border-white/5" />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                  {formData.designation || "Active Member"}
                </p>
                <h4 className="text-2xl font-black tracking-tight text-foreground dark:text-white leading-none truncate px-4">
                  {formData.fullName || " Liam Draft..."}
                </h4>
              </div>
            </div>

            <div className="px-10 pb-8 space-y-4 relative z-10">
              <div className="p-4 bg-muted/30 dark:bg-white/5 rounded-[24px] border border-black/5 dark:border-white/5 space-y-4">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/40">
                  <span className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    Compliance
                  </span>
                  <span
                    className={cn(
                      "font-black",
                      formData.status === "active"
                        ? "text-green-500"
                        : "text-amber-500",
                    )}
                  >
                    {formData.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/40">
                  <span className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-secondary" />
                    Employee ID
                  </span>
                  <span className="text-foreground dark:text-white font-black">
                    {formData.employeeCode || "TBD"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/40">
                  <span className="flex items-center gap-2 text-primary">
                    <Building2 className="w-3.5 h-3.5" />
                    Company
                  </span>
                  <span className="text-foreground dark:text-white font-black truncate max-w-[120px] text-right">
                    {formData.companyName || "TBD"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-auto bg-primary/5 p-8 border-t border-black/5 dark:border-white/5 flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <QrCode className="w-8 h-8 text-primary shadow-primary" />
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                    Transit Status
                  </p>
                  <p className="text-[10px] font-black text-primary/60 italic uppercase tracking-tighter">
                    System Entry Verified
                  </p>
                </div>
              </div>
              <div className="w-full h-8 flex items-end justify-between px-2 gap-1 overflow-hidden opacity-20 dark:opacity-40">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-primary"
                    style={{
                      width: Math.random() > 0.5 ? "2px" : "4px",
                      height: `${Math.random() * 100}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
