import { 
  History, 
  Search, 
  Filter, 
  Download, 
  User, 
  Database, 
  FileText, 
  ShieldAlert,
  ArrowRightLeft,
  Settings,
  Mail,
  MoreVertical,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuditLogPage() {
  const audits = [
    { id: 1024, entity: 'employee', entityId: 'EMP-001', action: 'updated', user: 'Admin Jane', time: '2 mins ago', details: 'Status changed to Active' },
    { id: 1023, entity: 'asset', entityId: 'LPT-230', action: 'status_changed', user: 'IT Ramesh', time: '15 mins ago', details: 'Status: Assigned -> In Repair' },
    { id: 1022, entity: 'email_account', entityId: 'mail_992', action: 'created', user: 'System Auto', time: '1 hour ago', details: 'Created personal email for NEW-012' },
    { id: 1021, entity: 'system_user', entityId: 'usr_002', action: 'status_changed', user: 'Master Admin', time: '3 hours ago', details: 'Locked due to failed attempts' },
    { id: 1020, entity: 'assignment_history', entityId: 'LOG-882', action: 'created', user: 'IT Suresh', time: 'Yesterday', details: 'Reassigned monitor to Desk D-12' },
  ];

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'employee': return User;
      case 'asset': return Database;
      case 'email_account': return Mail;
      case 'system_user': return ShieldAlert;
      case 'assignment_history': return ArrowRightLeft;
      default: return FileText;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'updated': return 'bg-primary/10 text-primary border-primary/20';
      case 'deleted': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'status_changed': return 'bg-accent/10 text-accent border-accent/20';
      default: return 'bg-muted text-foreground';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Enterprise Audit Log</h2>
          <p className="text-muted-foreground mt-1">Immutable record of all system changes and user actions.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2 bg-muted text-muted-foreground hover:text-foreground rounded-xl border border-border transition-all">
            <Download className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-2xl premium-card border-border/50">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Filter by user, entity ID or action..." 
            className="w-full bg-muted/50 pl-10 pr-4 py-2 rounded-xl text-sm border border-transparent focus:border-primary/20 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-border transition-all">
            <Filter className="w-3 h-3" />
            Entity Type
          </button>
        </div>
      </div>

      <div className="premium-card rounded-2xl overflow-hidden glass border-border/50 shadow-2xl animate-fade-in delay-100">
        <div className="px-6 py-4 bg-muted/30 border-b border-border flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live Stream Monitoring Active</span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Entity</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Action</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Performed By</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Details</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {audits.map((log) => {
              const Icon = getEntityIcon(log.entity);
              return (
                <tr key={log.id} className="hover:bg-muted/20 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold tracking-tight uppercase group-hover:text-primary transition-colors">{log.entityId}</p>
                        <p className="text-[10px] text-muted-foreground font-mono tracking-tighter">{log.entity}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "text-[10px] uppercase font-black px-3 py-1 rounded-full border shadow-sm whitespace-nowrap",
                      getActionColor(log.action)
                    )}>
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-sm font-semibold italic text-muted-foreground">
                      <Settings className="w-3 h-3" />
                      {log.user}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium tracking-tight h-5 line-clamp-1">{log.details}</td>
                  <td className="px-6 py-5 text-xs text-muted-foreground font-mono text-right">{log.time}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
