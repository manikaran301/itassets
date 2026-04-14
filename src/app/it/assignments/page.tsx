import { 
  ArrowRightLeft, 
  Plus, 
  Search, 
  Filter, 
  Monitor, 
  HardDrive, 
  User, 
  Clock, 
  MoreVertical, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AssignmentsPage() {
  const assignments = [
    { id: 'LOG-8801', employee: 'Rahul Sharma', asset: 'LPT-230', category: 'Asset', type: 'new_assignment', date: '2026-10-12', status: 'Active' },
    { id: 'LOG-8802', employee: 'Anjali Gupta', asset: 'ACC-M01', category: 'Accessory', type: 'reassignment', date: '2026-10-11', status: 'Active' },
    { id: 'LOG-8803', employee: 'Vikram Singh', asset: 'DSK-990', category: 'Asset', type: 'repair_send', date: '2026-10-10', status: 'In Repair' },
    { id: 'LOG-8804', employee: 'Priya Verma', asset: 'LPT-401', category: 'Asset', type: 'new_assignment', date: '2026-10-09', status: 'Active' },
    { id: 'LOG-8805', employee: 'Amit Patel', asset: 'ACC-K12', category: 'Accessory', type: 'recovery_exit', date: '2026-10-08', status: 'Returned' },
  ];

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'new_assignment': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'reassignment': return 'bg-primary/10 text-primary border-primary/20';
      case 'repair_send': return 'bg-accent/10 text-accent border-accent/20';
      case 'recovery_exit': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Asset Assignments</h2>
          <p className="text-muted-foreground mt-1">Movement logs for all corporate hardware and accessories.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-xl shadow-primary/10 transition-all font-semibold">
            <Plus className="w-5 h-5" />
            <span>New Log</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-2xl premium-card border-border/50">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search by log code, employee or asset tag..." 
            className="w-full bg-muted/50 pl-10 pr-4 py-2 rounded-xl text-sm border border-transparent focus:border-primary/20 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-border transition-all">
            <Filter className="w-3 h-3" />
            Action Type
          </button>
        </div>
      </div>

      <div className="premium-card rounded-2xl overflow-hidden glass border-border/50 shadow-2xl animate-fade-in delay-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Log Code</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Asset & Category</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Assigned To</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Action Type</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Date</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground text-right border-l border-border/10">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assignments.map((log) => (
              <tr key={log.id} className="hover:bg-muted/20 transition-all group">
                <td className="px-6 py-5">
                  <span className="text-xs font-mono font-bold bg-muted px-2 py-1 rounded border border-border group-hover:bg-primary/10 transition-colors uppercase">{log.id}</span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-primary">
                      {log.category === 'Asset' ? <Monitor className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold tracking-tight">{log.asset}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{log.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center">
                      <User className="w-3 h-3 text-secondary" />
                    </div>
                    <span className="text-sm font-medium">{log.employee}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={cn(
                    "text-[10px] uppercase font-black px-3 py-1 rounded-full border shadow-sm whitespace-nowrap",
                    getTypeStyle(log.type)
                  )}>
                    {log.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Clock className="w-3 h-3" />
                    {log.date}
                  </div>
                </td>
                <td className="px-6 py-5 border-l border-border/10 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-all" title="View Full Log">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-muted rounded-lg transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
