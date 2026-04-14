import { 
  Mail, 
  MoreVertical, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowRightLeft, 
  Plus, 
  Search, 
  Filter, 
  Database, 
  Globe, 
  CheckCircle2, 
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EmailAccountsPage() {
  const accounts = [
    { email: 'john.doe@company.com', name: 'John Doe', type: 'Personal', status: 'Active', platform: 'Google Workspace', employee: 'EMP-001' },
    { email: 'support@company.com', name: 'Support Queue', type: 'Shared', status: 'Active', platform: 'Google Workspace', employee: 'Group IT' },
    { email: 'dev.billing@company.com', name: 'Dev Billing', type: 'Alias', status: 'Suspended', platform: 'Zoho', employee: 'EMP-005' },
    { email: 'hr.info@company.com', name: 'HR Info', type: 'Distribution', status: 'Active', platform: 'Microsoft 365', employee: 'Group HR' },
    { email: 'jane.smith@company.com', name: 'Jane Smith', type: 'Personal', status: 'Deactivated', platform: 'Google Workspace', employee: 'EMP-002' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return CheckCircle2;
      case 'Suspended': return ShieldAlert;
      case 'Deactivated': return ShieldCheck;
      default: return Mail;
    }
  };

  const statusColors = {
    'Active': 'bg-green-500/10 text-green-600 border-green-500/20',
    'Suspended': 'bg-accent/10 text-accent border-accent/20',
    'Deactivated': 'bg-red-500/10 text-red-600 border-red-500/20',
    'Deleted': 'bg-muted text-muted-foreground border-border',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Email Identities</h2>
          <p className="text-muted-foreground mt-1">Manage corporate email accounts, aliases, and forwarding rules.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-xl shadow-primary/10 transition-all font-semibold">
            <Plus className="w-5 h-5" />
            <span>New Account</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in delay-100">
        {accounts.map((acc) => {
          const StatusIcon = getStatusIcon(acc.status);
          return (
            <div key={acc.email} className="premium-card rounded-3xl overflow-hidden glass border-border/50 group flex flex-col h-full bg-card/60">
              <div className="p-6 space-y-5 flex-1 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700" />
                
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-2xl bg-muted border border-border group-hover:bg-primary/5 transition-colors">
                    <Mail className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <span className={cn(
                    "text-[10px] uppercase font-black px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5",
                    statusColors[acc.status as keyof typeof statusColors]
                  )}>
                    <StatusIcon className="w-3 h-3" />
                    {acc.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold tracking-tight truncate group-hover:text-primary transition-colors">{acc.email}</h4>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-black mt-1">{acc.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Platform</span>
                      <span className="text-xs font-semibold flex items-center gap-1.5 truncate">
                        <Globe className="w-3 h-3 text-secondary" />
                        {acc.platform}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Linked Employee</span>
                      <span className="text-xs font-semibold flex items-center gap-1.5 truncate">
                        <UserPlus className="w-3 h-3 text-primary" />
                        {acc.employee}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button className="flex-1 py-2 bg-muted/50 hover:bg-muted text-foreground rounded-xl text-[10px] font-black uppercase tracking-widest border border-border transition-all">
                    Settings
                  </button>
                  <button className="p-2 bg-muted/50 hover:bg-primary/10 hover:text-primary border border-border rounded-xl transition-all">
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-muted/50 hover:bg-accent/10 hover:text-accent border border-border rounded-xl transition-all">
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
