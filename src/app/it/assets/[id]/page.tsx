'use client';

import { 
  ArrowLeft, 
  Monitor, 
  Smartphone, 
  Cpu, 
  HardDrive, 
  Network, 
  ShieldCheck, 
  History, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Wrench, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Calendar,
  IndianRupee,
  Activity,
  User,
  ExternalLink,
  ChevronRight,
  Save,
  Eraser,
  PlusCircle
} from 'lucide-react';
import { useState, useEffect, use } from 'react';
import { cn } from '@/lib/utils';
import { SearchableSelect } from '@/components/SearchableSelect';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AssetDetailProps {
  params: Promise<{ id: string }>;
}

export default function AssetDetailPage({ params }: AssetDetailProps) {
  const { id } = use(params);
  const router = useRouter();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, history, maintenance

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetRes, employeesRes] = await Promise.all([
          fetch(`/api/assets/${id}`),
          fetch('/api/employees')
        ]);
        
        const assetData = await assetRes.json();
        const employeesData = await employeesRes.json();

        if (assetData.error) throw new Error(assetData.error);
        
        setAsset(assetData);
        setEmployees(employeesData);
        if (assetData.currentEmployeeId) setSelectedEmployee(assetData.currentEmployeeId);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleReassign = async () => {
    setAssigning(true);
    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentEmployeeId: selectedEmployee || null,
          status: selectedEmployee ? 'assigned' : 'available'
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setAsset(updated);
        // We'd ideally re-fetch the asset to get the included employee object
        const refreshRes = await fetch(`/api/assets/${id}`);
        setAsset(await refreshRes.json());
        alert('Assignment updated successfully!');
      }
    } catch (error) {
      console.error('Reassign error:', error);
    } finally {
      setAssigning(false);
    }
  };

  const handleRetire = async () => {
    if (!confirm(`Are you sure you want to permanently retire and delete asset ${asset.assetTag}?`)) return;

    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Asset retired successfully.');
        router.push('/it/assets');
      } else {
        alert('Failed to retire asset.');
      }
    } catch (error) {
      console.error('Retire error:', error);
      alert('Something went wrong.');
    }
  };

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Scanning infrastructure...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="w-16 h-16 text-red-500/20" />
        <h2 className="text-xl font-black uppercase tracking-widest text-muted-foreground">Asset Not Found</h2>
        <Link href="/it/assets" className="px-6 py-2 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest">Back to Inventory</Link>
      </div>
    );
  }

  // Brand Logo URL
  const brandLogoUrl = asset.make && !['Other', 'Assembled', 'OEM / White Box'].includes(asset.make)
    ? `https://cdn.simpleicons.org/${asset.make.toLowerCase().replace(/\s+/g, '')}`
    : null;

  return (
    <div className="space-y-6 animate-fade-in text-sm pb-32">
      
      {/* Sticky Top Bar Actions */}
      <div className="sticky top-14 z-[100] bg-background/80 backdrop-blur-xl -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-2 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/it/assets" className="p-2 hover:bg-white/5 rounded-xl border border-white/5 transition-all text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-0.5">
            <h2 className="text-xl font-black tracking-tight text-foreground uppercase flex items-center gap-3">
              {asset.assetTag}
              <span className={cn(
                "text-[8px] px-2.5 py-1 rounded-full border uppercase tracking-widest",
                getStatusStyle(asset.status)
              )}>
                {asset.status.replace('_', ' ')}
              </span>
            </h2>
            <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest leading-none">
              {asset.type} • {asset.serialNumber || 'No Serial'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link 
            href={`/it/assets/${asset.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-muted/50 text-muted-foreground hover:text-foreground rounded-2xl border border-white/5 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Details</span>
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent hover:bg-accent/30 rounded-2xl border border-accent/20 transition-all text-[10px] font-black uppercase tracking-widest">
            <Wrench className="w-3.5 h-3.5" />
            <span>Maintenance</span>
          </button>
          <button 
            onClick={handleRetire}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-2xl border border-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Retire</span>
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/5 pb-px">
        <button 
          onClick={() => setActiveTab('overview')}
          className={cn(
            "px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative",
            activeTab === 'overview' ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Overview
          {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative",
            activeTab === 'history' ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Activity History
          {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          {/* Left Column: Visual Card & Quick Stats */}
          <div className="lg:col-span-4 space-y-6">
            <div className="premium-card rounded-[32px] overflow-hidden group/card relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-50" />
              
              <div className="p-10 pb-8 relative z-10 flex flex-col items-center text-center space-y-6">
                <div className="relative inline-block">
                  <div className="w-40 h-40 rounded-[48px] bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center border border-primary/20 shadow-lg relative z-10 group-hover/card:scale-105 transition-transform duration-500 overflow-hidden">
                    {brandLogoUrl ? (
                      <img 
                        src={brandLogoUrl} 
                        alt={asset.make} 
                        className="w-20 h-20 object-contain opacity-80 group-hover/card:opacity-100 transition-opacity invert" 
                        onError={(e) => {
                          (e.target as any).style.display = 'none';
                          (e.target as any).nextElementSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <Monitor className={cn("w-20 h-20 text-primary/40", brandLogoUrl ? "hidden" : "block")} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-background border border-border shadow-xl flex items-center justify-center text-primary rotate-12 group-hover/card:rotate-0 transition-transform duration-500">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight uppercase">{asset.make || 'Generic'}</h3>
                  <p className="text-[10px] text-muted-foreground font-black tracking-widest uppercase italic opacity-60">
                    {asset.model || 'Standard Device'}
                  </p>
                </div>

                {/* Status Tags */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {asset.warrantyExpiry && (
                    <span className={cn(
                      "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm",
                      new Date(asset.warrantyExpiry) > new Date() 
                        ? "bg-blue-500/10 text-blue-500 border border-blue-500/10" 
                        : "bg-red-500/10 text-red-500 border border-red-500/10"
                    )}>
                      {new Date(asset.warrantyExpiry) > new Date() ? '🛡️ In Warranty' : '⚠️ Expired'}
                    </span>
                  )}
                  {asset.cost && (
                    <span className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 border border-green-500/10 shadow-sm">
                      ₹{asset.cost.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress / Health Bar */}
              <div className="px-6 py-4 bg-muted/20 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col gap-1 flex-1 px-4">
                  <div className="flex items-center justify-between text-[8px] font-black uppercase text-muted-foreground/60">
                    <span>Device Utilization</span>
                    <span>94%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-[94%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Details List */}
            <div className="bg-card rounded-[32px] p-6 border border-white/5 premium-card space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
                <IndianRupee className="w-3.5 h-3.5 text-primary" />
                Purchase Meta
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Purchase Date</p>
                  <p className="text-xs font-bold">{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Warranty End</p>
                  <p className="text-xs font-bold">{asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Current Value</p>
                  <p className="text-xs font-bold">₹{(asset.cost || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Added By</p>
                  <p className="text-xs font-bold text-primary truncate max-w-[100px]" title={asset.logs?.find((l:any) => l.action === 'created')?.user?.fullName || 'System'}>
                    {asset.logs?.find((l:any) => l.action === 'created')?.user?.fullName || 'System'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Info & Maintenance */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Assignment Section (Focus Area) */}
            <div className="bg-card/40 rounded-[32px] p-6 border border-white/5 premium-card shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <UserPlus className="w-40 h-40 text-primary" />
              </div>
              
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-6">
                <User className="w-4 h-4 text-primary" />
                Resource Assignment
              </h4>

              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                {/* Current Assignee */}
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xl font-black text-primary border border-primary/20 ring-4 ring-primary/5">
                    {asset.currentEmployee ? asset.currentEmployee.fullName[0] : <Activity className="w-8 h-8 opacity-20" />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground uppercase tracking-tight">
                      {asset.currentEmployee?.fullName || 'Currently Unassigned'}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mt-0.5 leading-none">
                      {asset.currentEmployee?.employeeCode || 'Inventory Pool'}
                    </p>
                  </div>
                </div>

                <div className="hidden md:block">
                  <ChevronRight className="w-8 h-8 text-muted-foreground/20" />
                </div>

                {/* Reassignment Controls */}
                <div className="flex-1 w-full space-y-4">
                  <div className="bg-muted/10 p-4 rounded-[24px] border border-white/5 space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Assign to Employee</label>
                    <div className="flex gap-2">
                      <SearchableSelect
                        options={employees.map(emp => ({ value: emp.id, label: `${emp.fullName} (${emp.employeeCode})` }))}
                        value={selectedEmployee}
                        onChange={setSelectedEmployee}
                        placeholder="Select assignee..."
                        icon={<User className="w-4 h-4" />}
                      />
                      <button 
                        onClick={handleReassign}
                        disabled={assigning}
                        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/10 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {assigning ? 'Updating...' : 'Update'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Spec Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* HardWare Specs */}
              <div className="bg-card rounded-[32px] p-6 border border-white/5 premium-card space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  Technical Identity
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center group/spec py-1 border-b border-white/[0.03]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Processor</span>
                    <span className="text-xs font-bold group-hover:text-primary transition-colors">{asset.cpu || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center group/spec py-1 border-b border-white/[0.03]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Memory (RAM)</span>
                    <span className="text-xs font-bold">{asset.ramGb ? `${asset.ramGb}GB DDR` : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center group/spec py-1 border-b border-white/[0.03]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">SSD Capacity</span>
                    <span className="text-xs font-bold">{asset.ssdGb ? `${asset.ssdGb}GB NVMe` : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center group/spec py-1 border-b border-white/[0.03]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">HDD Capacity</span>
                    <span className="text-xs font-bold">{asset.hddGb ? `${asset.hddGb}GB Mechanical` : '—'}</span>
                  </div>
                </div>
              </div>

              {/* OS & Network Specs */}
              <div className="bg-card rounded-[32px] p-6 border border-white/5 premium-card space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Network className="w-4 h-4 text-primary" />
                  System & Connectivity
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center group/spec py-1 border-b border-white/[0.03]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Operating System</span>
                    <span className="text-xs font-bold">{asset.os || '—'} {asset.osVersion}</span>
                  </div>
                  <div className="flex justify-between items-center group/spec py-1 border-b border-white/[0.03]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">IP Address</span>
                    <span className="text-xs font-mono font-black text-primary/80">{asset.ipAddress || 'Dynamic'}</span>
                  </div>
                  <div className="flex justify-between items-center group/spec py-1 border-b border-white/[0.03]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">MAC Address</span>
                    <span className="text-[10px] font-mono text-muted-foreground truncate ml-4" title={asset.macAddress}>{asset.macAddress || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center group/spec py-1 border-b border-white/[0.03]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Shield / AV</span>
                    <span className={cn(
                      "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                      asset.antivirusStatus === 'yes' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>{asset.antivirusStatus === 'yes' ? 'Verified' : 'Unprotected'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-card rounded-[32px] p-6 border border-white/5 premium-card min-h-[140px]">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary" />
                Administrator Remarks
              </h4>
              <div className="p-4 bg-muted/10 rounded-[20px] border border-white/5 italic text-muted-foreground text-xs leading-relaxed">
                {asset.notes || 'No administrative notes have been recorded for this asset yet.'}
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-500 max-w-4xl mx-auto">
          <div className="bg-card rounded-[32px] p-8 border border-white/5 premium-card">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-foreground mb-8 flex items-center gap-3">
              <History className="w-5 h-5 text-primary" />
              Full Lifecycle Ledger
            </h4>

            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/40 before:to-transparent">
              {asset.logs?.map((log: any, idx: number) => (
                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  {/* Icon */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border border-border bg-card absolute left-0 md:left-1/2 md:-ml-4 z-10 group-hover:border-primary/50 transition-colors">
                    {log.action === 'created' ? <PlusCircle className="w-4 h-4 text-green-500" /> :
                     log.action === 'updated' ? <Edit2 className="w-3.5 h-3.5 text-blue-500" /> :
                     log.action === 'deleted' ? <Trash2 className="w-4 h-4 text-red-500" /> :
                     <Activity className="w-4 h-4 text-primary" />}
                  </div>

                  {/* Content Card */}
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-muted/20 border border-white/5 shadow-sm ml-12 md:ml-0 group-hover:bg-muted/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        {log.action.replace('_', ' ')}
                      </span>
                      <time className="text-[9px] font-bold text-muted-foreground/40">
                        {new Date(log.changedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    <p className="text-[11px] font-bold text-foreground mb-1">
                      {log.action === 'created' ? (
                        <span className="text-green-500/80">Inventory Initialization</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 items-center">
                          {(() => {
                            const oldVal = log.oldValue as any;
                            const newVal = log.newValue as any;
                            if (!oldVal || !newVal) return <span className="text-muted-foreground/60 italic font-medium tracking-tight">System configuration update</span>;
                            
                            const changes = Object.keys(newVal).filter(key => 
                              key !== 'updatedAt' && 
                              key !== 'logs' &&
                              JSON.stringify(oldVal[key]) !== JSON.stringify(newVal[key])
                            );

                            if (changes.length === 0) return <span className="text-muted-foreground/60 italic font-medium tracking-tight">Metadata refresh</span>;

                            return changes.map((c, i) => (
                              <span key={c} className="flex items-center gap-1">
                                <span className="text-primary/70">
                                  {(() => {
                                    if (c === 'currentEmployeeId') {
                                      const newEmp = newVal.currentEmployee;
                                      return newEmp ? `Assigned to ${newEmp.fullName}` : 'Unassigned from Employee';
                                    }
                                    return c.charAt(0).toUpperCase() + c.slice(1).replace(/([A-Z])/g, ' $1').replace('Id', '');
                                  })()}
                                </span>
                                {i < changes.length - 1 && <span className="px-1 text-muted-foreground/20 text-[8px]">•</span>}
                              </span>
                            ));
                          })()}
                        </div>
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-black text-primary">
                        {log.user?.fullName?.[0] || 'S'}
                      </div>
                      <span className="text-[10px] font-black lowercase text-muted-foreground/60 tracking-tight">
                        by {log.user?.fullName || 'System Admin'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Assignment logs intermixed if any */}
              {asset.assignments?.map((asn: any) => (
                <div key={asn.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border border-border bg-card absolute left-0 md:left-1/2 md:-ml-4 z-10 group-hover:border-primary/50 transition-colors">
                    <UserPlus className="w-4 h-4 text-primary" />
                  </div>
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm ml-12 md:ml-0 group-hover:bg-primary/10 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Assignment</span>
                        <time className="text-[9px] font-bold text-primary/40">
                          {new Date(asn.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </time>
                    </div>
                    <p className="text-xs font-bold text-foreground">
                      Deployed to <span className="text-primary">{asn.employee.fullName}</span>
                    </p>
                    <p className="text-[9px] text-muted-foreground/60 italic mt-1 font-bold uppercase tracking-widest">
                      Reason: {asn.actionType.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
