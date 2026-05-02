"use client";

import { useState, useEffect } from "react";
import { 
  Building2, 
  Users2, 
  Briefcase, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  X,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";

type DataType = "companies" | "departments" | "designations" | "locations";

interface MasterItem {
  id: string;
  name: string;
  code?: string;
  address?: string;
  isActive: boolean;
}

const TABS = [
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "departments", label: "Departments", icon: Users2 },
  { id: "designations", label: "Designations", icon: Briefcase },
  { id: "locations", label: "Locations", icon: MapPin },
] as const;

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState<DataType>("companies");
  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "", address: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/master-data/${activeTab}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item?: MasterItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({ 
        name: item.name, 
        code: item.code || "", 
        address: item.address || "" 
      });
    } else {
      setEditingItem(null);
      setFormData({ name: "", code: "", address: "" });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const method = editingItem ? "PUT" : "POST";
      const body = editingItem ? { ...formData, id: editingItem.id } : formData;
      
      const res = await fetch(`/api/admin/master-data/${activeTab}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        fetchItems();
      } else {
        const err = await res.json();
        alert(err.error || "Operation failed");
      }
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This might fail if records are linked to employees.")) return;
    try {
      const res = await fetch(`/api/admin/master-data/${activeTab}?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchItems();
      else {
        const err = await res.json();
        alert(err.error || "Delete failed");
      }
    } catch (error) {
      alert("Delete failed");
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in px-1">
      {/* Header */}
      <div className="shrink-0 py-6 space-y-1">
        <h1 className="text-2xl font-black tracking-tight uppercase">Master Data Management</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
          Govern central organizational entities and taxonomies
        </p>
      </div>

      {/* Tabs & Actions */}
      <div className="shrink-0 flex flex-col md:flex-row gap-4 justify-between items-center bg-card/50 border border-border p-2 rounded-2xl mb-6">
        <div className="flex gap-1 bg-muted/30 p-1 rounded-xl w-full md:w-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab.id 
                  ? "bg-background text-primary shadow-sm border border-border" 
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 group min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={`SEARCH ${activeTab.toUpperCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/20 pl-10 pr-4 py-2 rounded-xl text-[10px] font-bold border border-transparent focus:border-primary/20 outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="shrink-0 flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-card/40 border border-border rounded-2xl overflow-hidden flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-40">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest">Synchronizing Registry...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20">
              <AlertCircle className="w-12 h-12" />
              <p className="text-[10px] font-black uppercase tracking-widest text-center">
                No {activeTab} defined in the central registry
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-card/80 backdrop-blur-md">
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Registry Name</th>
                  {activeTab === "companies" && (
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Entity Code</th>
                  )}
                  {activeTab === "locations" && (
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Address</th>
                  )}
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Status</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="group hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-black text-sm tracking-tight">{item.name}</td>
                    {activeTab === "companies" && (
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-muted rounded text-[10px] font-mono font-bold">{item.code || "—"}</span>
                      </td>
                    )}
                    {activeTab === "locations" && (
                      <td className="px-6 py-4 text-[10px] text-muted-foreground font-bold">{item.address || "—"}</td>
                    )}
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                        item.isActive ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                      )}>
                        {item.isActive ? "Operational" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleOpenModal(item)}
                          className="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">
                  {editingItem ? "Edit" : "Add New"} {activeTab.slice(0, -1)}
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Update central taxonomy record
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Name / Title <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-muted/30 border border-border rounded-2xl px-5 py-4 text-sm font-bold focus:bg-background transition-all outline-none"
                  placeholder={`e.g. ${activeTab === 'companies' ? 'FiftyHertz' : 'Finance'}`}
                />
              </div>

              {activeTab === "companies" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Entity Code</label>
                  <input
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-muted/30 border border-border rounded-2xl px-5 py-4 text-sm font-bold focus:bg-background transition-all outline-none font-mono"
                    placeholder="e.g. 50H"
                  />
                </div>
              )}

              {activeTab === "locations" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Address</label>
                  <textarea
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-muted/30 border border-border rounded-2xl px-5 py-4 text-sm font-bold focus:bg-background transition-all outline-none min-h-[100px]"
                    placeholder="Enter location address details..."
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-4 bg-muted border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] px-6 py-4 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {submitting ? "Processing..." : editingItem ? "Save Changes" : "Create Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
