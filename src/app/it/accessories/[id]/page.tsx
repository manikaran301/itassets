"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Loader2, Edit2, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { SearchableSelect } from "@/components/SearchableSelect";

interface AccessoryDetail {
  id: string;
  assetTag: string;
  type: string;
  model?: string;
  serialNumber?: string;
  status: string;
  condition: string;
  currentEmployeeId?: string | null;
  currentEmployee?: {
    id: string;
    fullName: string;
    employeeCode: string;
  } | null;
  createdAt: string;
}

export default function AccessoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const accessoryId = params.id as string;

  const [accessory, setAccessory] = useState<AccessoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    model: "",
    status: "available",
    condition: "good",
    currentEmployeeId: "",
  });
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetchAccessory();
    fetchEmployees();
  }, [accessoryId]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      const formatted = data.map((emp: any) => ({
        value: emp.id,
        label: `${emp.fullName} (${emp.employeeCode})`,
      }));
      setEmployees(formatted);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchAccessory = async () => {
    try {
      const res = await fetch(`/api/accessories/${accessoryId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAccessory(data);
      setFormData({
        model: data.model || "",
        status: data.status,
        condition: data.condition,
        currentEmployeeId: data.currentEmployeeId || "",
      });
    } catch (error) {
      console.error("Failed to fetch accessory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!accessory) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/accessories/${accessoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      setAccessory(updated);
      setEditing(false);
      alert("Accessory updated successfully!");
    } catch (error) {
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(`Delete ${accessory?.assetTag}? This cannot be undone.`)
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/accessories/${accessoryId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      alert("Accessory deleted successfully!");
      router.push("/it/accessories");
    } catch (error) {
      alert("Failed to delete accessory");
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!accessory) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Accessory not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/it/accessories"
            className="p-2 hover:bg-muted rounded-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tighter">
              {accessory.assetTag}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {accessory.type} • {accessory.model || "No model"}
            </p>
          </div>
        </div>
        {!editing && (
          <div className="flex gap-3">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground hover:opacity-90 rounded-xl transition-all font-semibold"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all font-semibold disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 bg-card/40 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Asset Tag
            </p>
            <p className="text-lg font-black mt-1">{accessory.assetTag}</p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Type
            </p>
            <p className="text-lg font-black mt-1 capitalize">
              {accessory.type}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Model
            </p>
            {editing ? (
              <input
                type="text"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                className="w-full mt-2 px-4 py-3 bg-muted/40 border border-white/10 rounded-xl outline-none focus:border-primary/30 transition-all"
              />
            ) : (
              <p className="text-lg font-black mt-1">
                {accessory.model || "—"}
              </p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Serial Number
            </p>
            <p className="text-lg font-black mt-1">
              {accessory.serialNumber || "—"}
            </p>
          </div>

          {editing && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>

        {/* Sidebar */}
        <div className="bg-card/40 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Status
            </p>
            {editing ? (
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full mt-2 px-4 py-3 bg-muted/40 border border-white/10 rounded-xl outline-none focus:border-primary/30 transition-all"
              >
                <option value="available">Available</option>
                <option value="assigned">In Use</option>
                <option value="in_repair">In Repair</option>
                <option value="retired">Retired</option>
              </select>
            ) : (
              <p className="text-sm font-black mt-1 capitalize">
                {accessory.status === "assigned"
                  ? "In Use"
                  : accessory.status.replace("_", " ")}
              </p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Condition
            </p>
            {editing ? (
              <select
                value={formData.condition}
                onChange={(e) =>
                  setFormData({ ...formData, condition: e.target.value })
                }
                className="w-full mt-2 px-4 py-3 bg-muted/40 border border-white/10 rounded-xl outline-none focus:border-primary/30 transition-all"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            ) : (
              <p className="text-sm font-black mt-1 capitalize">
                {accessory.condition}
              </p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Currently With
            </p>
            {editing ? (
              <div className="mt-2">
                <SearchableSelect
                  options={employees}
                  value={formData.currentEmployeeId}
                  onChange={(val) => {
                    setFormData({ 
                      ...formData, 
                      currentEmployeeId: val,
                      status: val ? "in_use" : formData.status 
                    });
                  }}
                  placeholder="Select Employee..."
                  icon={<UserPlus className="w-4 h-4" />}
                />
              </div>
            ) : (
              <p className="text-sm font-black mt-1">
                {accessory.currentEmployee?.fullName || "In Store"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
