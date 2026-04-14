import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  FileText, 
  Download, 
  Search, 
  Filter, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  AlertTriangle,
  Monitor,
  Users,
  Smartphone,
  ChevronDown,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const reports = [
    { title: 'Asset Lifecycle Distribution', type: 'Distribution', stats: '2,450 Total', icon: PieChart, color: 'text-primary' },
    { title: 'Identity Provisioning SLA', type: 'Performance', stats: '98.2% Success', icon: Zap, color: 'text-secondary' },
    { title: 'Hardware Repair Frequency', type: 'Trend', stats: '14 Units/mo', icon: BarChart3, color: 'text-accent' },
    { title: 'Compliance & Audit Log', type: 'System', stats: '0 Critical Violations', icon: ShieldCheck, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Enterprise Intelligence</h2>
          <p className="text-muted-foreground mt-1">Advanced reporting and data visualization for asset health and HR compliance.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2 bg-muted text-muted-foreground hover:text-foreground rounded-xl border border-border transition-all">
            <Download className="w-4 h-4" />
            <span>Export Snapshot</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in delay-100">
        {reports.map((report) => (
          <div key={report.title} className="premium-card rounded-2xl overflow-hidden glass border-border/50 group flex flex-col items-center justify-center text-center p-6 bg-card/60 relative overflow-hidden">
             <div className={cn(
               "w-12 h-12 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110",
               report.color.replace('text-', 'bg-') + '/5 ' + report.color.replace('text-', 'border-') + '/20 ' + report.color
             )}>
                <report.icon className="w-6 h-6" />
             </div>
             <div className="mt-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{report.type}</p>
                <h4 className="text-sm font-bold tracking-tight h-10 line-clamp-2 leading-tight">{report.title}</h4>
                <p className={cn("text-lg font-black tracking-tighter mt-2", report.color)}>{report.stats}</p>
             </div>
             <button className="mt-4 p-2 bg-muted rounded-xl hover:bg-border transition-all">
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
             </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <section className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight">
                <TrendingUp className="w-5 h-5 text-primary" />
                Monthly Procurement Trends
              </h3>
              <div className="flex gap-2">
                 <button className="p-2 hover:bg-muted border border-border rounded-lg transition-all">
                   <Filter className="w-4 h-4" />
                 </button>
              </div>
            </div>
            
            <div className="premium-card rounded-3xl bg-card border border-border p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px] relative overflow-hidden">
               <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
               <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center border border-primary/20 animate-pulse relative z-10">
                 <LineChart className="w-10 h-10 text-primary" />
               </div>
               <div className="space-y-2 relative z-10">
                  <h4 className="text-xl font-bold">Predictive Analytics Engine</h4>
                  <p className="text-sm text-muted-foreground max-w-sm">Generating real-time hardware lifespan projections based on asset performance logs. (2026 AI Insight Feature)</p>
               </div>
               <div className="flex gap-4 relative z-10">
                  <div className="flex flex-col items-center gap-1">
                     <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Confidence</span>
                     <span className="text-xs font-bold text-green-500">94.2%</span>
                  </div>
                  <div className="w-[1px] h-8 bg-border" />
                  <div className="flex flex-col items-center gap-1">
                     <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Data Points</span>
                     <span className="text-xs font-bold text-primary">12.4k</span>
                  </div>
               </div>
            </div>
         </section>

         <aside className="space-y-6 animate-fade-in delay-200">
            <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight">
              <FileText className="w-5 h-5 text-accent" />
              Standard Reports
            </h3>
            <div className="space-y-4">
              {[
                { title: 'Global Handover List', count: '128 Entries', status: 'Active', icon: ChevronRight },
                { title: 'Warranty Expiry Log', count: '5 Upcoming', status: 'Priority', icon: AlertTriangle },
                { title: 'Identity Forwarding Matrix', count: '42 Rules', status: 'Secured', icon: ChevronRight },
                { title: 'Floor Occupancy Matrix', count: '8 Floors', status: 'Updated', icon: ChevronRight },
              ].map((report, i) => (
                <div key={i} className="p-4 rounded-2xl bg-card border border-border premium-card flex items-center justify-between group cursor-pointer hover:border-primary/20 transition-all">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-xl bg-muted group-hover:bg-primary/5 flex items-center justify-center border border-border group-hover:border-primary/20 transition-all">
                       <report.icon className={cn("w-5 h-5", report.status === 'Priority' ? 'text-accent' : 'text-muted-foreground')} />
                    </div>
                    <div className="space-y-0.5">
                       <h4 className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">{report.title}</h4>
                       <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none">{report.count}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              ))}
            </div>
         </aside>
      </div>
    </div>
  );
}
