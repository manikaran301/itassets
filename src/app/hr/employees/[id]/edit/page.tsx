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
  Plus,
  Activity,
  Trash2,
  RotateCcw,
  MapPin,
  Calendar,
  Briefcase,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { SeatSelectorModal } from "@/components/SeatSelectorModal";

interface ManagerOption {
  value: string;
  label: string;
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
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);

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
    workspaceId: "",
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [provisions, setProvisions] = useState({
    laptop: false,
    desktop: false,
    phone: false,
    sim: false,
    email: false,
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

  const fetchInfrastructure = useCallback(async () => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`);
      if (!response.ok) throw new Error("Failed to fetch employee details");
      const data = await response.json();

      setInfrastructure({
        requirements: data.assetRequirements || [],
        requests: data.provisioningRequests || [],
        assets: data.currentAssets || [],
        emails: data.emailAccounts || [],
      });
    } catch (err) {
      console.error("Error refreshing infrastructure:", err);
    }
  }, [employeeId]);

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
          deskNumber: data.workspace?.code || data.deskNumber || "",
          startDate: data.startDate
            ? new Date(data.startDate).toISOString().split("T")[0]
            : "",
          status: data.status || "active",
          workspaceId: data.workspaceId || "",
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

  const handleRecall = async (type: 'requirement' | 'request', id: string) => {
    if (!confirm(`Are you sure you want to recall this ${type}?`)) return;

    try {
      const endpoint = type === 'request' ? `/api/provisioning/${id}` : `/api/hr/requirements/${id}`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!res.ok) throw new Error('Failed to recall');
      
      await fetchInfrastructure();
    } catch (err) {
      console.error('Recall error:', err);
      alert('Failed to recall. Please try again.');
    }
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

      // Step 2: Auto-create provisioning requests for NEWLY selected items
      const provisionTypes = Object.entries(provisions)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key);

      for (const type of provisionTypes) {
        const provPayload: Record<string, unknown> = {
          employeeId,
          requestedBy: (session?.user as any)?.id || null,
          priority: "normal",
        };

        if (type === "email") {
          provPayload.specialRequirements = "New Email account provisioning requested via Edit";
        } else {
          provPayload.deviceTypeNeeded = type;
        }

        await fetch("/api/provisioning", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(provPayload),
        });
      }

      setSubmitSuccess(true);
      router.push(`/hr/employees/${employeeId}`);
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
    { value: "Manikaran Power Limited (MPL)", label: "Manikaran Power Limited (MPL)" },
    { value: "Manikaran Renewables Limited (MRL)", label: "Manikaran Renewables Limited (MRL)" },
    { value: "Manikaran Analytics Limited (MAL)", label: "Manikaran Analytics Limited (MAL)" },
    { value: "Manikaran Hydro Private Limited (MHPL)", label: "Manikaran Hydro Private Limited (MHPL)" },
    { value: "50Hertz Limted", label: "50Hertz Limted" },
    { value: "Manikaran Utility Services Company Limited", label: "Manikaran Utility Services Company Limited" },
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
              href={`/hr/employees/${employeeId}`}
              className="p-2.5 hover:bg-white/5 rounded-2xl border border-white/5 transition-all text-muted-foreground/60 hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-xl font-black tracking-tight uppercase bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent leading-none">
              Restructure Profile
            </h2>
          </div>
          <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest italic pl-16">
            Admin Mode • Global Directory Update
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <Link
            href={`/hr/employees/${employeeId}`}
            className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-all"
          >
            Discard
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
            {submitting ? "Updating..." : "Commit Changes"}
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
        {/* Form Column - Now taking more space since ID card is gone */}
        <div className="xl:col-span-8 space-y-6">
          {/* Section 1: Core Corporate Identity */}
          <div className="premium-card p-8 rounded-[40px] border border-white/5 bg-card/40 relative overflow-visible group z-30">
             <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <Building2 className="w-48 h-48" />
             </div>
            
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-8 relative z-10">
              <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]" />
              Primary Organizational Identity
            </div>

            <div className="flex flex-col lg:flex-row gap-10 relative z-10">
               {/* Photo Upload Zone */}
               <div className="flex flex-col items-center gap-4 shrink-0">
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handlePhotoChange}
                  className={cn(
                    "w-48 h-60 rounded-[48px] border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center gap-4 relative overflow-hidden group/upload shadow-2xl",
                    isDragging ? "border-primary bg-primary/5 scale-105" : "border-white/10 bg-muted/20 hover:border-primary/30",
                    photoPreview && "border-solid border-primary/20"
                  )}
                >
                  {photoPreview ? (
                    <>
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover/upload:scale-110" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/upload:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-4 backdrop-blur-md">
                         <button 
                          onClick={removePhoto}
                          className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-red-500/20"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <span className="text-[10px] font-black uppercase text-white tracking-[0.2em]">Replace Image</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover/upload:rotate-12 transition-transform">
                        <Scan className="w-7 h-7" />
                      </div>
                      <div className="text-center px-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Attach Identity</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1.5 opacity-60">Passport Size Recommended</p>
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
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">
                      Legal Associate Name
                    </label>
                    <div className="relative group/field">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/30 group-focus-within/field:text-primary transition-colors" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => updateField("fullName", e.target.value)}
                        className="w-full bg-muted/20 border border-white/5 focus:border-primary/30 focus:bg-muted/40 rounded-2xl pl-12 pr-6 py-4 text-xs font-black tracking-tight outline-none transition-all placeholder:font-bold placeholder:text-muted-foreground/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">
                      Employee Code
                    </label>
                    <div className="relative group/field">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/30 group-focus-within/field:text-primary transition-colors" />
                      <input
                        type="text"
                        placeholder="EMP-001"
                        value={formData.employeeCode}
                        onChange={(e) => updateField("employeeCode", e.target.value)}
                        className="w-full bg-muted/20 border border-white/5 focus:border-primary/30 focus:bg-muted/40 rounded-2xl pl-12 pr-6 py-4 text-xs font-mono font-black tracking-widest outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Company/Subsidiary</label>
                    <SearchableSelect
                      options={COMPANIES}
                      value={formData.companyName}
                      onChange={(val) => updateField("companyName", val)}
                      placeholder="Select Company/Subsidiary..."
                      allowCustom
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Department</label>
                    <SearchableSelect
                      options={DEPARTMENTS}
                      value={formData.department}
                      onChange={(val) => updateField("department", val)}
                      placeholder="Select Department..."
                      allowCustom
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Official Designation</label>
                  <SearchableSelect
                    options={DESIGNATIONS}
                    value={formData.designation}
                    onChange={(val) => updateField("designation", val)}
                    placeholder="Select Seniority..."
                    allowCustom
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Personal Connectivity & Logistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative group z-20">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-secondary mb-6">
                  <Mail className="w-3.5 h-3.5" />
                  Connectivity Profile
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Personal Email</label>
                      <input
                        type="email"
                        placeholder="private@mail.com"
                        value={formData.personalEmail}
                        onChange={(e) => updateField("personalEmail", e.target.value)}
                        className="w-full bg-muted/15 border border-white/5 focus:border-secondary/40 rounded-2xl px-6 py-3.5 text-xs font-bold outline-none transition-all"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Secure Contact No.</label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                        <input
                          type="tel"
                          placeholder="+91 XXXX XXX XXX"
                          value={formData.personalPhone}
                          onChange={(e) => updateField("personalPhone", e.target.value)}
                          className="w-full bg-muted/15 border border-white/5 focus:border-secondary/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs font-bold outline-none transition-all"
                        />
                      </div>
                   </div>
                </div>
            </div>

            <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative group z-20">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-6">
                  <Globe className="w-3.5 h-3.5" />
                  Deployment Logistics
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Reporting Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                        <input
                          type="text"
                          placeholder="Campus / Site Name"
                          value={formData.locationJoining}
                          onChange={(e) => updateField("locationJoining", e.target.value)}
                          className="w-full bg-muted/15 border border-white/5 focus:border-amber-500/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs font-bold outline-none transition-all"
                        />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Commencement Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => updateField("startDate", e.target.value)}
                          className="w-full bg-muted/15 border border-white/5 focus:border-amber-500/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs font-bold outline-none transition-all appearance-none"
                        />
                      </div>
                   </div>
                </div>
            </div>
          </div>

          {/* Section 3: Hierarchy & Stationing */}
          <div className="premium-card p-8 rounded-[40px] border border-white/5 bg-card/40 relative overflow-visible group z-10">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-8 relative z-10">
              <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]" />
              Hierarchy & Physical Stationing
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Reporting Authority</label>
                    <SearchableSelect
                      options={managers}
                      value={formData.reportingManagerId}
                      onChange={(val) => updateField("reportingManagerId", val)}
                      placeholder="Assign Manager..."
                      icon={<Briefcase className="w-4 h-4" />}
                      limit={5}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Associate Registry Status</label>
                    <SearchableSelect
                      options={[
                        { value: "active", label: "ACTIVE REGISTRY" },
                        { value: "inactive", label: "INACTIVE / DEPARTED" },
                        { value: "exit_pending", label: "OFFBOARDING PENDING" },
                      ]}
                      value={formData.status}
                      onChange={(val) => updateField("status", val)}
                      placeholder="Status"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                  Designated Workspace Code
                </label>
                <div className="flex gap-3">
                  <div className="relative group/field flex-1">
                    <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/30 group-focus-within/field:text-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="Select Workspace..."
                      value={formData.deskNumber}
                      readOnly
                      className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[20px] pl-12 pr-6 py-4 text-xs font-mono font-black tracking-[0.2em] outline-none transition-all cursor-default"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSeatModalOpen(true)}
                    className="px-8 py-4 bg-primary/10 text-primary border border-primary/20 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all shadow-xl shadow-primary/5 active:scale-95"
                  >
                    Select
                  </button>
                </div>

                <SeatSelectorModal
                  isOpen={isSeatModalOpen}
                  onClose={() => setIsSeatModalOpen(false)}
                  selectedId={formData.workspaceId}
                  onSelect={(ws) => {
                    updateField("workspaceId", ws.id);
                    updateField("deskNumber", ws.code);
                    setIsSeatModalOpen(false);
                  }}
                />
                <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-3 px-2">Workspace linking enables precision hardware tracking</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Infrastructure Lifecycle */}
        <div className="xl:col-span-4 space-y-6 sticky top-14">
          <div className="premium-card p-0 rounded-[48px] border border-white/5 bg-card/60 backdrop-blur-3xl relative overflow-hidden group shadow-2xl">
            <div className="p-8 border-b border-white/5 bg-muted/20 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                  <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]" />
                  Infrastructure Lifecycle
                </div>
              </div>
              <div className="flex -space-x-2">
                <div className="w-9 h-9 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary backdrop-blur-md shadow-lg">
                  <Monitor className="w-4 h-4" />
                </div>
                <div className="w-9 h-9 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 backdrop-blur-md shadow-lg">
                  <Mail className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Hardware Status */}
              <div className="space-y-4">
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
                      "relative group/item p-5 rounded-[32px] border transition-all duration-700",
                      isFullySetup ? "bg-green-500/[0.03] border-green-500/10" : "bg-muted/10 border-white/5"
                    )}>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-lg",
                            isFullySetup ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-primary/10 text-primary border-primary/20"
                          )}>
                            {type === 'desktop' ? <Monitor className="w-6 h-6" /> : <Laptop className="w-6 h-6" />}
                          </div>
                          <div>
                            <h5 className="text-sm font-black uppercase tracking-tight">{type}</h5>
                            {isFullySetup && (
                              <p className="text-[9px] font-black text-green-500 uppercase tracking-[0.2em] flex items-center gap-1.5 mt-1">
                                <CheckCircle2 className="w-3 h-3" /> Fully Provisioned
                              </p>
                            )}
                          </div>
                        </div>
                        {asset ? (
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Asset Tag</p>
                            <p className="text-xs font-black uppercase font-mono mt-0.5">{asset.assetTag}</p>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            {ticket && ticket.status !== 'fulfilled' && ticket.status !== 'cancelled' && (
                              <button 
                                onClick={() => handleRecall('request', ticket.id)}
                                className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                                title="Recall Ticket"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                            {req && req.status !== 'fulfilled' && req.status !== 'cancelled' && !ticket && (
                               <button 
                                onClick={() => handleRecall('requirement', req.id)}
                                className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                                title="Delete Requirement"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className={cn(
                          "p-3 rounded-2xl border flex flex-col gap-1 transition-all",
                          req ? (req.status === 'fulfilled' ? "bg-green-500/[0.05] border-green-500/10" : (req.status === 'cancelled' ? "bg-red-500/[0.05] border-red-500/10 opacity-50" : "bg-amber-500/[0.05] border-amber-500/10")) : "bg-muted/5 border-white/5 opacity-30"
                        )}>
                          <p className="text-[8px] font-black uppercase text-muted-foreground/50 tracking-widest">Requirement</p>
                          <p className="text-[10px] font-black uppercase truncate">{req ? req.status : 'Pending'}</p>
                        </div>
                        <div className={cn(
                          "p-3 rounded-2xl border flex flex-col gap-1 transition-all",
                          ticket ? (ticket.status === 'fulfilled' ? "bg-green-500/[0.05] border-green-500/10" : (ticket.status === 'cancelled' ? "bg-red-500/[0.05] border-red-500/10 opacity-50" : "bg-blue-500/[0.05] border-blue-500/10")) : "bg-muted/5 border-white/5 opacity-30"
                        )}>
                          <p className="text-[8px] font-black uppercase text-muted-foreground/50 tracking-widest">IT Pipeline</p>
                          <p className="text-[10px] font-black uppercase truncate">{ticket ? ticket.status : 'Awaiting'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Digital Identity Status */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/60 px-2 flex items-center gap-3">
                   Digital Identity
                   <div className="h-px flex-1 bg-blue-500/10" />
                </h5>
                <div className="space-y-3">
                  {infrastructure.emails.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-white/5 rounded-[32px] space-y-3 opacity-20">
                       <Mail className="w-10 h-10 mx-auto" />
                       <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Active Mailbox</p>
                    </div>
                  ) : (
                    infrastructure.emails.map((email, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-3xl border border-blue-500/10 bg-blue-500/[0.03] group/email hover:bg-blue-500/[0.06] transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/10 shadow-lg shadow-blue-500/5 group-hover/email:rotate-6 transition-transform">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                             <p className="text-[11px] font-black text-foreground truncate max-w-[180px]">{email.emailAddress}</p>
                             <p className="text-[8px] font-black text-blue-500/50 uppercase tracking-widest mt-0.5">{email.platform || 'Corporate'}</p>
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                           <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Provisioning Controller */}
              <div className="pt-8 border-t border-white/5 space-y-6">
                <div className="flex items-center justify-between px-2">
                   <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Service Trigger</h5>
                   <Activity className={cn("w-4 h-4 text-primary", Object.values(provisions).some(Boolean) && "animate-pulse")} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(provisions) as Array<keyof typeof provisions>).map((key) => (
                    <button
                      key={key}
                      onClick={() => toggleProvision(key)}
                      type="button"
                      className={cn(
                        "group/btn relative h-20 rounded-3xl border transition-all duration-500 flex flex-col items-center justify-center gap-2 overflow-hidden shadow-lg shadow-black/5",
                        provisions[key]
                          ? "bg-primary/20 border-primary/40 text-primary"
                          : "bg-muted/10 border-white/5 opacity-40 hover:opacity-100 hover:scale-105 hover:bg-muted/20",
                      )}
                    >
                      {key === "laptop" && <Laptop className="w-5 h-5" />}
                      {key === "desktop" && <Monitor className="w-5 h-5" />}
                      {key === "phone" && <Smartphone className="w-5 h-5" />}
                      {key === "sim" && <SimIcon className="w-5 h-5" />}
                      {key === "email" && <Mail className="w-5 h-5" />}
                      <span className="text-[9px] font-black uppercase tracking-widest">{key}</span>
                      {provisions[key] && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full animate-ping" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
