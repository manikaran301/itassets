'use client';

import { 
  Monitor, 
  Server, 
  Search,
  Filter,
  Plus,
  Zap,
  ShieldCheck,
  Package,
  Wrench,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Download,
  Edit2,
  Trash2,
  Eye,
  HardDrive,
  ChevronDown,
  ScreenShare,
  Boxes,
  Copy
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('/api/assets');
        const data = await response.json();
        if (Array.isArray(data)) {
          setAssets(data);
        }
      } catch (error) {
        console.error('Failed to fetch assets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'assigned': return 'bg-primary/10 text-primary border-primary/20';
      case 'in_repair': return 'bg-accent/10 text-accent border-accent/20';
      case 'retired': return 'bg-muted/50 text-muted-foreground border-border';
      case 'lost': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return CheckCircle2;
      case 'assigned': return ShieldCheck;
      case 'in_repair': return Wrench;
      case 'retired': return XCircle;
      case 'lost': return AlertTriangle;
      default: return Package;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'laptop': return Monitor;
      case 'desktop': return Monitor;
      case 'n_computing': return ScreenShare;
      case 'nuc': return Boxes;
      case 'server': return Server;
      case 'other': return HardDrive;
      default: return Package;
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ');
  };

  /* Filtering */
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = searchQuery === '' ||
      asset.assetTag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.currentEmployee?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || asset.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      // Fallback for non-HTTPS HTTP environments (execCommand)
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (error) {
        console.error('Fallback copy failed', error);
      }
      textArea.remove();
    }
  };

  const handleDelete = async (id: string, tag: string) => {
    if (!confirm(`Are you sure you want to delete asset ${tag}?`)) return;

    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAssets(prev => prev.filter(a => a.id !== id));
      } else {
        alert('Failed to delete asset.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Something went wrong.');
    }
  };

  const stats = [
    { label: 'Available', value: assets.filter(a => a.status === 'available').length, icon: CheckCircle2, color: 'text-green-500 bg-green-500/10 border-green-500/10' },
    { label: 'Assigned', value: assets.filter(a => a.status === 'assigned').length, icon: ShieldCheck, color: 'text-primary bg-primary/10 border-primary/10' },
    { label: 'In Repair', value: assets.filter(a => a.status === 'in_repair').length, icon: Wrench, color: 'text-accent bg-accent/10 border-accent/10' },
    { label: 'Total Inventory', value: assets.length, icon: Package, color: 'text-muted-foreground bg-muted border-border' },
  ];

  return (
    <div className="space-y-4 animate-fade-in max-w-full pb-20 text-sm">

      <div className="flex justify-end">
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground hover:text-foreground rounded-2xl border border-white/5 transition-all text-[10px] font-black uppercase tracking-widest">
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <Link
            href="/it/assets/new"
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:scale-105 active:scale-95 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            <span>Register Asset</span>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="p-3 rounded-xl bg-card border border-border premium-card flex items-center justify-between group">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80">{stat.label}</p>
              <h4 className="text-xl font-bold mt-0.5 tracking-tighter group-hover:text-primary transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mt-1" /> : stat.value}
              </h4>
            </div>
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border transition-transform group-hover:scale-110 duration-500", stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center bg-card p-2.5 rounded-2xl premium-card border border-white/5">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search by tag, make, model, serial or employee..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/20 pl-12 pr-4 py-2 rounded-xl text-xs border border-transparent focus:border-primary/20 outline-none transition-all placeholder:text-[9px] placeholder:uppercase placeholder:font-black placeholder:opacity-30"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none bg-muted px-4 pr-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none border border-transparent focus:border-primary/20 transition-all cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="laptop">Laptops</option>
              <option value="desktop">Desktops</option>
              <option value="n_computing">N-Computing</option>
              <option value="nuc">NUC</option>
              <option value="server">Servers</option>
              <option value="other">Other</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-muted px-4 pr-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none border border-transparent focus:border-primary/20 transition-all cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="in_repair">In Repair</option>
              <option value="retired">Retired</option>
              <option value="lost">Lost</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="premium-card rounded-[32px] overflow-hidden glass border border-white/5 overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Asset Inventory...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center border border-white/5">
              <Package className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest">No Assets Found</p>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                {assets.length === 0 
                  ? 'Start by registering your first enterprise device.' 
                  : 'No assets match your current filters. Try adjusting your search.'}
              </p>
            </div>
            {assets.length === 0 && (
              <Link
                href="/it/assets/new"
                className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl shadow-md shadow-primary/10 text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                Register First Asset
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Asset Tag & Type</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Make & Model</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Specifications</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">IP Address</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Assigned To / Seat</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Status</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredAssets.map((asset) => {
                const StatusIcon = getStatusIcon(asset.status);
                const TypeIcon = getTypeIcon(asset.type);
                return (
                  <tr 
                    key={asset.id} 
                    className="hover:bg-white/[0.02] cursor-pointer transition-all bg-white/[0.01] even:bg-transparent group"
                    onClick={() => router.push(`/it/assets/${asset.id}`)}
                  >
                    {/* Asset Tag & Type */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary border border-primary/10 group-hover:scale-110 transition-transform duration-300">
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-sm font-black group-hover:text-primary transition-colors truncate uppercase tracking-tight">{asset.assetTag}</p>
                          <p className="text-[9px] font-black tracking-widest text-muted-foreground/80 uppercase">{asset.type}</p>
                        </div>
                      </div>
                    </td>

                    {/* Make & Model */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-black text-foreground/80 tracking-tight">{asset.make || '—'}</p>
                        <p className="text-[9px] text-muted-foreground font-black italic truncate max-w-[180px]">{asset.model || '—'}</p>
                      </div>
                    </td>

                    {/* Specifications */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {asset.cpu && (
                          <span className="text-[8px] bg-muted px-2 py-0.5 rounded border border-border/50 text-muted-foreground uppercase tracking-widest font-black truncate max-w-[120px]">{asset.cpu}</span>
                        )}
                        {asset.ramGb && (
                          <span className="text-[8px] bg-primary/5 px-2 py-0.5 rounded border border-primary/10 text-primary uppercase tracking-widest font-black">{asset.ramGb}GB</span>
                        )}
                        {asset.ssdGb && (
                          <span className="text-[8px] bg-secondary/5 px-2 py-0.5 rounded border border-secondary/10 text-secondary uppercase tracking-widest font-black">{asset.ssdGb}GB SSD</span>
                        )}
                        {asset.hddGb && (
                          <span className="text-[8px] bg-accent/5 px-2 py-0.5 rounded border border-accent/10 text-accent uppercase tracking-widest font-black">{asset.hddGb}GB HDD</span>
                        )}
                        {!asset.cpu && !asset.ramGb && !asset.ssdGb && !asset.hddGb && (
                          <span className="text-[9px] text-muted-foreground/20 italic">No specs</span>
                        )}
                      </div>
                    </td>

                    {/* IP Address */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {asset.ipAddress ? (
                          <div className="flex items-center gap-1.5 group/ip">
                            <p className="text-[10px] font-mono text-foreground/90 font-bold truncate max-w-[120px]" title={asset.ipAddress}>
                              {asset.ipAddress}
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(asset.ipAddress);
                                // Optional visual feedback can be added securely
                              }}
                              className="opacity-0 group-hover/ip:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded-md text-muted-foreground hover:text-primary"
                              title="Copy IP"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] font-mono text-muted-foreground/30 font-bold truncate max-w-[140px]">
                            —
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Assigned To / Seat */}
                    <td className="px-4 py-3">
                      {asset.currentEmployee ? (
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center text-[8px] font-black text-secondary border border-secondary/10 shrink-0">
                            {asset.currentEmployee.fullName.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-[11px] font-black text-foreground/90 truncate max-w-[120px]">{asset.currentEmployee.fullName}</p>
                            <p className="text-[8px] font-mono text-muted-foreground/60 font-bold uppercase tracking-widest">
                              {asset.currentEmployee.employeeCode} 
                              {asset.currentEmployee.deskNumber ? <span className="ml-1 text-secondary/70">· SEAT: {asset.currentEmployee.deskNumber}</span> : ''}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60 italic font-black">Unassigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "text-[8px] uppercase font-black px-3 py-1 rounded-full border inline-flex items-center gap-1.5",
                        getStatusStyle(asset.status)
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {formatStatus(asset.status)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/it/assets/${asset.id}`}
                          className="p-2 hover:bg-primary/10 text-muted-foreground/50 hover:text-primary rounded-xl border border-transparent hover:border-primary/10 transition-all font-black" 
                          title="View"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link 
                          href={`/it/assets/${asset.id}/edit`}
                          className="p-2 hover:bg-primary/10 text-muted-foreground/50 hover:text-primary rounded-xl border border-transparent hover:border-primary/10 transition-all font-black" 
                          title="Edit"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(asset.id, asset.assetTag)}
                          className="p-2 hover:bg-red-500/10 text-muted-foreground/50 hover:text-red-500 rounded-xl border border-transparent hover:border-red-500/10 transition-all font-black" 
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Footer */}
      {!loading && filteredAssets.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
            Showing {filteredAssets.length} of {assets.length} assets
          </p>
        </div>
      )}
    </div>
  );
}
