import { 
  Users, 
  Monitor, 
  Mail, 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  History,
  ShieldCheck,
  BarChart3
} from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      <section className="animate-fade-in">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Dashboard Overview</h2>
            <p className="text-muted-foreground mt-1">Real-time metrics for HR, IT, and Asset Management.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground hover:text-foreground rounded-xl border border-border transition-all">
              <History className="w-4 h-4" />
              <span>Audit Log</span>
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-lg shadow-primary/20 transition-all font-semibold">
              <Plus className="w-5 h-5" />
              <span>New Request</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard 
            title="Total Employees"
            value="1,280"
            count="+24 new"
            description="Active workforce tracking across 8 departments."
            icon={Users}
            trend="up"
            trendValue="12.4%"
            className="border-l-4 border-l-primary"
          />
          <StatsCard 
            title="Active Assets"
            value="2,450"
            count="32 in repair"
            description="Laptops, desktops, and mobile devices managed."
            icon={Monitor}
            trend="up"
            trendValue="3.1%"
            className="border-l-4 border-l-secondary"
          />
          <StatsCard 
            title="Provisioning"
            value="18"
            count="Pending IT"
            description="Hardware and software setup for new joiners."
            icon={Truck}
            trend="down"
            trendValue="8.2%"
            className="border-l-4 border-l-accent"
          />
          <StatsCard 
            title="Email Accounts"
            value="1,310"
            count="42 shared"
            description="Workplace identities managed on Google Workspace."
            icon={Mail}
            trend="neutral"
            trendValue="0%"
            className="border-l-4 border-l-muted-foreground"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6 animate-fade-in delay-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight">
              <TrendingUp className="w-5 h-5 text-primary" />
              Recent Asset Movements
            </h3>
            <button className="text-xs font-semibold text-primary hover:underline uppercase tracking-widest">View All</button>
          </div>
          
          <div className="premium-card rounded-2xl overflow-hidden glass border-border/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Log Code</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Employee</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Asset Tag</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Action</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { id: 'LOG-001', emp: 'Rahul Sharma', asset: 'LPT-230', action: 'Assigned', date: 'Oct 12, 2026', status: 'primary' },
                  { id: 'LOG-002', emp: 'Anjali Gupta', asset: 'ACC-M01', action: 'Return', date: 'Oct 11, 2026', status: 'secondary' },
                  { id: 'LOG-003', emp: 'Vikram Singh', asset: 'DSK-990', action: 'Repair', date: 'Oct 10, 2026', status: 'accent' },
                  { id: 'LOG-004', emp: 'Priya Verma', asset: 'LPT-401', action: 'Assigned', date: 'Oct 09, 2026', status: 'primary' },
                  { id: 'LOG-005', emp: 'Amit Patel', asset: 'SIM-012', action: 'Assigned', date: 'Oct 08, 2026', status: 'primary' },
                ].map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors group cursor-default">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-semibold bg-muted px-2 py-1 rounded border border-border group-hover:bg-primary/10 transition-colors">{row.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold ring-1 ring-border shadow-sm">
                          {row.emp.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium">{row.emp}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-muted-foreground">{row.asset}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] uppercase font-bold px-2 py-1 rounded-full",
                        row.action === 'Assigned' ? "bg-primary/10 text-primary" : 
                        row.action === 'Return' ? "bg-secondary/10 text-secondary" : 
                        "bg-accent/10 text-accent"
                      )}>
                        {row.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6 animate-fade-in delay-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight">
              <AlertCircle className="w-5 h-5 text-accent" />
              Critical Alerts
            </h3>
            <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
          </div>

          <div className="space-y-4">
            {[
              { title: 'Warranty Expiry', desc: '5 Laptops (Dell XPS 13) expiring in 15 days.', type: 'warning', icon: Clock },
              { title: 'Provisioning Overdue', desc: 'Employee ID EMP-992 (Joining Tomorrow) pending phone setup.', type: 'danger', icon: Cpu },
              { title: 'Suspicious Login', desc: 'Failed login attempt detected from admin-backup account.', type: 'info', icon: ShieldCheck },
            ].map((alert, i) => (
              <div key={i} className="p-4 rounded-2xl bg-card border border-border premium-card flex gap-4 group">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  alert.type === 'warning' ? "bg-accent/10 text-accent" : 
                  alert.type === 'danger' ? "bg-red-500/10 text-red-500" : 
                  "bg-primary/10 text-primary"
                )}>
                  <alert.icon className="w-5 h-5 group-hover:scale-125 transition-transform" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold uppercase tracking-wide">{alert.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{alert.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-primary-foreground shadow-2xl relative overflow-hidden group border border-white/10">
            <div className="relative z-10">
              <h4 className="text-lg font-bold">IT Infrastructure Report</h4>
              <p className="text-xs text-primary-foreground/70 mt-2">Generate a comprehensive audit of all enterprise assets and email identities.</p>
              <button className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all">
                Download PDF
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <BarChart3 className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:rotate-12 transition-transform duration-700" />
          </div>
        </aside>
      </div>
    </div>
  );
}
