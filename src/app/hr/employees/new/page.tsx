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
  Mail,
  Laptop,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { SeatSelectorModal } from "@/components/SeatSelectorModal";

interface ManagerOption {
  value: string;
  label: string;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
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
    upcomingId: searchParams.get("upcomingId") || "",
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

  useEffect(() => {
    // Cleanup preview URL on unmount
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  useEffect(() => {
    const fetchSupportData = async () => {
      try {
        const res = await fetch("/api/employees");
        const employees = await res.json();
        const data = employees.data || employees;
        const managerList = data.map((e: any) => ({
          value: e.id,
          label: `${e.fullName} (${e.employeeCode})`,
          fullName: e.fullName // Keep for matching
        }));
        setManagers(managerList);
        setLoadingManagers(false);
      } catch (error) {
        console.error("Failed to fetch managers:", error);
      }
    };
    fetchSupportData();
  }, []);

  useEffect(() => {
    const fetchUpcomingData = async () => {
      const upcomingId = searchParams.get("upcomingId");
      if (!upcomingId) return;

      try {
        const res = await fetch(`/api/hr/upcoming?id=${upcomingId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        // Match manager name to ID if managers are loaded
        let matchedManagerId = "";
        if (data.reportingManager && managers.length > 0) {
          const match = managers.find(m => 
            m.label.toLowerCase().trim() === data.reportingManager.toLowerCase().trim()
          );
          if (match) matchedManagerId = match.value;
        }

        setFormData(prev => ({
          ...prev,
          fullName: data.fullName || "",
          personalEmail: data.email || "",
          personalPhone: data.phoneNumber || "",
          department: data.department || "",
          designation: data.designation || "",
          companyName: data.companyName || "",
          locationJoining: data.placeOfPosting || "",
          startDate: data.joiningDate ? new Date(data.joiningDate).toISOString().split('T')[0] : "",
          reportingManagerId: matchedManagerId,
          upcomingId: upcomingId
        }));
      } catch (err) {
        console.error("Failed to fetch upcoming candidate data:", err);
      }
    };

    if (!loadingManagers) {
      fetchUpcomingData();
    }
  }, [searchParams, loadingManagers, managers]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null;
    
    if ("files" in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ("dataTransfer" in e) {
      e.preventDefault();
      file = e.dataTransfer.files[0];
    }

    if (!file) return;

    // Validation
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Photo size must be less than 2MB.");
      return;
    }

    setPhoto(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  };

  const removePhoto = () => {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const updateField = (field: string, value: any) => {
// ... updateField logic ...
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

    // Smart Algo: Desktop requires a Physical Seat
    if (provisions.desktop && !formData.workspaceId) {
      setError("Strategic Conflict: Desktop provisioning requires an assigned Physical Seat. Please browse and select a desk from the Seating Map before activating the record.");
      setIsSeatModalOpen(true); // Auto-open the seat selector for them
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const userId = (session?.user as any)?.id || null;
      
      // If there's a photo, upload it first
      let photoPath = "";
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
        createdBy: userId,
        upcomingId: formData.upcomingId,
      };

      // Step 1: Create the employee
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to enroll employee.");
      }

      const employeeId = result.id;

      // Step 2: Auto-create provisioning requests for selected items
      const provisionTypes = Object.entries(provisions)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key);

      for (const type of provisionTypes) {
        const provPayload: Record<string, unknown> = {
          employeeId,
          requestedBy: userId,
          priority: "normal",
        };

        if (type === "email") {
          provPayload.specialRequirements = "Email account provisioning";
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
      setTimeout(() => {
        router.push("/hr/employees");
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
          <h3 className="text-2xl font-black uppercase tracking-tight">
            Employee Enrolled
          </h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-black opacity-60">
            {formData.fullName} is now in the central registry.
          </p>
          {Object.values(provisions).some(Boolean) && (
            <p className="text-[10px] text-primary uppercase tracking-widest font-bold mt-2">
              Provisioning requests sent to IT
            </p>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.4em] font-black animate-pulse">
          Syncing Global Directory
        </p>
      </div>
    );
  }

  const COMPANIES = [
// ... companies ...
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
// ... depts ...
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
// ... designations ...
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
              Enroll Employee
            </h2>
          </div>
          <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest italic pl-16">
            Human Resource & Infrastructure Provisioning
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
            {submitting ? "Enrolling..." : "Activate Record"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-5 rounded-[24px] bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black flex items-center gap-4 animate-shake uppercase tracking-tight shadow-lg shadow-red-500/5">
          <Shield className="w-5 h-5 shrink-0" />
          <span>Onboarding Error: {error}</span>
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
                        <span className="text-[10px] font-black uppercase text-white tracking-widest">Change Photo</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Scan className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="text-center px-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Drop Photo</p>
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
                {photo && (
                   <p className="text-[9px] font-bold text-primary uppercase tracking-tighter truncate max-w-[180px]">
                    {photo.name} ({(photo.size / 1024).toFixed(0)}KB)
                  </p>
                )}
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
                  <div className="flex gap-2">
                    <div className="relative group/field flex-1">
                      <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                      <input
                        type="text"
                        placeholder="Select from Seating Map..."
                        value={formData.deskNumber}
                        readOnly
                        className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs outline-none transition-all font-mono font-black tracking-widest cursor-default"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSeatModalOpen(true)}
                      className="px-6 py-3.5 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all"
                    >
                      Browse
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
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                    Preferred Corp Email
                  </label>
                  <div className="relative group/field">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="firstname.lastname@company.com"
                      className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs outline-none transition-all font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Asset Provisioning */}
            <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative col-span-1 md:col-span-2 z-10">
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                  Infrastructure Requests
                </div>
                {provisions.desktop && !formData.workspaceId && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full animate-pulse">
                    <Shield className="w-3 h-3 text-amber-500" />
                    <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest">Seat Required for Desktop</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 relative z-10">
                {(
                  Object.keys(provisions) as Array<keyof typeof provisions>
                ).map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleProvision(key)}
                    type="button"
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-center",
                      provisions[key]
                        ? "bg-primary/20 border-primary/40 text-primary hover:bg-primary/30"
                        : "bg-muted/10 border-white/5 hover:bg-muted/20 opacity-40 grayscale hover:grayscale-0 hover:opacity-100",
                    )}
                  >
                    {key === "laptop" && <Laptop className="w-5 h-5" />}
                    {key === "desktop" && <Monitor className="w-5 h-5" />}
                    {key === "phone" && <Smartphone className="w-5 h-5" />}
                    {key === "sim" && <SimIcon className="w-5 h-5" />}
                    {key === "email" && <Mail className="w-5 h-5" />}
                    <span className="text-[9px] font-black uppercase tracking-tight">
                      {key}
                    </span>
                  </button>
                ))}
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
                  {formData.designation || "Joining Associate"}
                </p>
                <h4 className="text-2xl font-black tracking-tight text-foreground dark:text-white leading-none truncate px-4">
                  {formData.fullName || "Liam Draft..."}
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
                  <span className="text-green-500 font-black">Verified</span>
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

              <div className="space-y-3">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 text-center italic">
                  Provisioning Stack
                </p>
                <div className="flex justify-center -space-x-2.5">
                  {provisions.laptop && (
                    <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center border-[3px] border-card dark:border-[#0A0A0A] shadow-2xl">
                      <Laptop className="w-4 h-4" />
                    </div>
                  )}
                  {provisions.email && (
                    <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center border-[3px] border-card dark:border-[#0A0A0A] shadow-2xl">
                      <Mail className="w-4 h-4" />
                    </div>
                  )}
                  {provisions.phone && (
                    <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center border-[3px] border-card dark:border-[#0A0A0A] shadow-2xl">
                      <Smartphone className="w-4 h-4" />
                    </div>
                  )}
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
                    Awaiting Onboarding
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
