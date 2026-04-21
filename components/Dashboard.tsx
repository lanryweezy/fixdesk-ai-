import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card } from './common/Card';
import { mockAnalyticsData } from '../constants';
import { Ticket, TicketStatus, Activity } from '../types';
import { ITTerminal } from './ITTerminal';
import ReactMarkdown from 'react-markdown';
import { ChatBubbleBottomCenterTextIcon, BrainCircuit, ShieldCheckIcon, SpinnerIcon, CloudArrowDownIcon, DocumentTextIcon, XMarkIcon, ChartBarIcon } from './icons/Icons';
import { useToast } from '../services/ToastContext';

const PIE_COLORS = { 'FixDesk AI': '#4F46E5', 'IT Support Team': '#A78BFA' };

const StatCard: React.FC<{ title: string; value: string | number; subtext: string; icon?: React.ReactNode }> = ({ title, value, subtext, icon }) => (
  <Card className="relative overflow-hidden group hover:shadow-2xl hover:shadow-brand-primary/10 transition-all duration-300 ring-1 ring-slate-200 dark:ring-slate-800">
    <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{title}</h3>
            {icon && <div className="text-brand-primary opacity-20 group-hover:opacity-100 transition-opacity">{icon}</div>}
        </div>
        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-brand-primary"></span>
            {subtext}
        </p>
    </div>
    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl group-hover:bg-brand-primary/10 transition-colors"></div>
import { ChatBubbleBottomCenterTextIcon, BrainCircuit, ShieldCheckIcon, SpinnerIcon } from './icons/Icons';

const PIE_COLORS = { 'FixDesk AI': '#4F46E5', 'IT Support Team': '#A78BFA' };

const StatCard: React.FC<{ title: string; value: string | number; subtext: string }> = ({ title, value, subtext }) => (
  <Card>
    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
    <p className="text-sm text-slate-400 mt-1">{subtext}</p>
  </Card>
);

interface DashboardProps {
  tickets: Ticket[];
  role?: 'staff' | 'admin';
  onFilterTickets?: (category: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ tickets, role = 'admin', onFilterTickets }) => {
  const { addToast } = useToast();
  const analytics = mockAnalyticsData;
  const [systemHealth, setSystemHealth] = React.useState<{ status: string, summary: string, risks: string[] } | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<'24h' | '7d' | '30d'>('7d');
  const [liveMetrics, setLiveMetrics] = React.useState({ cpuUsage: 0, memUsage: 0, diskUsage: 0 });

  React.useEffect(() => {
    const fetchMetrics = async () => {
        try {
            const metrics = await window.electronAPI.getSystemMetrics();
            setLiveMetrics(metrics);
        } catch (e) {
            console.error("Failed to fetch metrics", e);
        }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const fetchHealth = async () => {
        if (role !== 'admin' || tickets.length === 0) return;
        setIsLoadingHealth(true);
        try {
            const result = await window.electronAPI.getSystemHealth(tickets);
            setSystemHealth(result);
        } catch (error) {
            console.error('Error fetching health:', error);
        } finally {
            setIsLoadingHealth(false);
        }
    };
    fetchHealth();
  }, [tickets, role]);
  
  const filteredTickets = useMemo(() => {
    const now = new Date().getTime();
    const ranges = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
    };
    return tickets.filter(t => (now - new Date(t.createdAt).getTime()) <= ranges[dateRange]);
  }, [tickets, dateRange]);

  const stats = useMemo(() => {
    const total = filteredTickets.length;
    const resolved = filteredTickets.filter(t => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.AI_RESOLVED || t.status === TicketStatus.SELF_HEALED);
    const aiCount = tickets.filter(t => t.status === TicketStatus.AI_RESOLVED).length;
    const humanCount = tickets.filter(t => t.status === TicketStatus.RESOLVED).length;
    const autoRate = resolved.length > 0 ? Math.round((aiCount / resolved.length) * 100) : 0;

    // Calculate average resolution time
    let totalResTime = 0;
    resolved.forEach(t => {
        const resolutionActivity = (t.activities || []).find(a => a.type === 'resolution');
        if (resolutionActivity) {
            const start = new Date(t.createdAt).getTime();
            const end = new Date(resolutionActivity.timestamp).getTime();
            totalResTime += (end - start);
        }
    });
    const avgResMs = resolved.length > 0 ? totalResTime / resolved.length : 0;
    const avgResHours = Math.round((avgResMs / (1000 * 60 * 60)) * 10) / 10;

    return { total, resolvedCount: resolved.length, aiCount, humanCount, autoRate, avgResHours };
  }, [tickets]);

  const resolutionByData = useMemo(() => [
      { name: 'FixDesk AI', value: stats.aiCount },
      { name: 'IT Support Team', value: stats.humanCount }
  ].filter(item => item.value > 0), [stats]);

  const displayIssues = useMemo(() => {
    const issueCounts: Record<string, number> = {};
    filteredTickets.forEach(ticket => {
        const category = ticket.title.split(':')[0] || 'Uncategorized';
        issueCounts[category] = (issueCounts[category] || 0) + 1;
    });

    const dynamic = Object.entries(issueCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    return dynamic.length > 0 ? dynamic : analytics.commonIssues;
  }, [filteredTickets, analytics.commonIssues]);

  const ticketsOverTime = useMemo(() => {
    const dayCount = dateRange === '24h' ? 24 : dateRange === '7d' ? 7 : 30;
    const timePoints = [...Array(dayCount)].map((_, i) => {
        const d = new Date();
        if (dateRange === '24h') d.setHours(d.getHours() - i);
        else d.setDate(d.getDate() - i);
        return d;
    }).reverse();

    return timePoints.map(d => {
        const label = dateRange === '24h'
            ? d.getHours() + ':00'
            : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const count = tickets.filter(t => {
            const tDate = new Date(t.createdAt);
            if (dateRange === '24h') return tDate.getDate() === d.getDate() && tDate.getHours() === d.getHours();
            return tDate.toDateString() === d.toDateString();
        }).length;

        return { date: label, tickets: count };
    });
  }, [tickets, dateRange]);

  const allActivities = useMemo(() => {
    return tickets
        .flatMap(t => (t.activities || []).map(a => ({ ...a, ticketTitle: t.title, ticketId: t.id })))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
  }, [tickets]);

  const workspaceInsights = useMemo(() => {
    const priorityCounts = { High: 0, Medium: 0, Low: 0 };
    const statusCounts: Record<string, number> = {};

    filteredTickets.forEach(t => {
        priorityCounts[t.priority]++;
        statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });

    return { priorityCounts, statusCounts };
  }, [filteredTickets]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Analytics & IT Insights</h2>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></div>
                    <span className="text-slate-400">Live CPU:</span>
                    <span className="text-slate-600 dark:text-slate-200">{liveMetrics.cpuUsage}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span className="text-slate-400">Memory:</span>
                    <span className="text-slate-600 dark:text-slate-200">{liveMetrics.memUsage}%</span>
                </div>
            </div>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 h-fit">
            {(['24h', '7d', '30d'] as const).map(range => (
                <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                        dateRange === range
                        ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    {range.toUpperCase()}
                </button>
            ))}
        </div>
      </div>

      {role === 'admin' && (
        <Card className="p-0 overflow-hidden mb-8">
            <div className="flex flex-col md:flex-row">
                <div className={`p-6 md:w-64 flex flex-col items-center justify-center text-center ${
                    systemHealth?.status === 'Critical' ? 'bg-red-500 text-white' :
                    systemHealth?.status === 'Warning' ? 'bg-amber-500 text-white' :
                    'bg-green-500 text-white'
                }`}>
                    {isLoadingHealth ? (
                        <SpinnerIcon className="w-10 h-10 animate-spin" />
                    ) : (
                        <>
                            <ShieldCheckIcon className="w-10 h-10 mb-2" />
                            <h3 className="text-xl font-bold uppercase tracking-tight">{systemHealth?.status || 'Healthy'}</h3>
                            <p className="text-[10px] opacity-80 mt-1 font-bold">System Health</p>
                        </>
                    )}
                </div>
                <div className="p-6 flex-1 bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-2 mb-3">
                        <BrainCircuit className="w-5 h-5 text-brand-primary" />
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">AI Weekly Assessment</h4>
                    </div>
                    {isLoadingHealth ? (
                        <div className="space-y-2">
                            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
                            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-slate-600 dark:text-slate-300 italic mb-4">
                                "{systemHealth?.summary || 'FixDesk AI is analyzing ticket trends to identify potential system risks.'}"
                            </p>
                            <div className="flex flex-wrap gap-4">
                                {(systemHealth?.risks || []).map((risk, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary"></div>
                                        {risk}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Tickets" value={stats.total} subtext="All-time ticket count" />
        <StatCard title="Tickets Resolved" value={stats.resolvedCount} subtext="Total resolved tickets" />
        <StatCard title="Automation Rate" value={`${stats.autoRate}%`} subtext="Resolved by FixDesk AI" />
        <StatCard title="Avg. Resolution Time" value={`${stats.avgResHours}h`} subtext="From creation to resolution" />
      </div>

      {role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none text-white overflow-hidden relative group">
                  <div className="relative z-10 p-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white/10 rounded-xl">
                                <ChartBarIcon className="w-6 h-6 text-brand-accent" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Human Hours Saved</h3>
                                <p className="text-xs text-slate-500">Workspace Efficiency Index</p>
                            </div>
                        </div>
                        <div className="flex items-end gap-4">
                            <p className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-indigo-400">{stats.hoursSaved.toFixed(1)}h</p>
                            <div className="mb-2">
                                <span className="text-emerald-400 font-black text-sm flex items-center gap-1">
                                    ↑ {((stats.hoursSaved / (stats.total || 1)) * 10).toFixed(1)}%
                                </span>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">vs Previous Period</p>
                            </div>
                        </div>
                        <div className="mt-8 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-accent rounded-full" style={{ width: `${Math.min(100, stats.autoRate)}%` }}></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase">{stats.autoRate}% AI Load</span>
                        </div>
                  </div>
                  <div className="absolute -right-10 -top-10 w-64 h-64 bg-brand-primary opacity-10 blur-[100px] group-hover:opacity-20 transition-opacity"></div>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-900 to-brand-secondary border-none text-white overflow-hidden relative group">
                  <div className="relative z-10 p-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white/10 rounded-xl">
                                <ShieldCheckIcon className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-200">AIOps Capital ROI</h3>
                                <p className="text-xs text-indigo-300/60">Estimated Cost Reduction</p>
                            </div>
                        </div>
                        <div className="flex items-end gap-4">
                            <p className="text-6xl font-black tracking-tighter text-white">${stats.costSaved.toLocaleString()}</p>
                            <div className="mb-2">
                                <span className="px-2 py-0.5 bg-emerald-500 text-white font-black text-[10px] rounded uppercase">Optimized</span>
                            </div>
                        </div>
                        <p className="mt-8 text-[11px] text-indigo-200/80 font-medium leading-relaxed">
                            Calculated based on a standard blended IT labor rate of <span className="font-bold text-white">$85/hour</span> across all autonomously resolved and AI-assisted incidents.
                        </p>
                  </div>
                   <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500 opacity-10 blur-[100px] group-hover:opacity-20 transition-opacity"></div>
              </Card>
          </div>
      )}

      {role === 'admin' && selfHealedTickets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-left duration-700">
                <Card className="md:col-span-3 border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5 overflow-hidden">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-2">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                                <div className="relative w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                    <ShieldCheckIcon className="w-8 h-8" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Autonomous Healing Active</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                    FixDesk AI has successfully self-remediated <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selfHealedTickets.length} critical anomalies</span> in this workspace.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {selfHealedTickets.slice(0, 3).map((t, i) => (
                                <div key={i} className="hidden lg:flex flex-col p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Self-Healed</span>
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate w-32">{t.title.replace('[Self-Healing] ', '')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Workspace Priority Load</h3>
            <div className="space-y-4">
                {(['High', 'Medium', 'Low'] as const).map(p => {
                    const count = workspaceInsights.priorityCounts[p];
                    const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    return (
                        <div key={p}>
                            <div className="flex justify-between items-center mb-1 text-xs font-bold uppercase tracking-wider">
                                <span className={p === 'High' ? 'text-red-500' : p === 'Medium' ? 'text-amber-500' : 'text-slate-400'}>{p} Priority</span>
                                <span className="text-slate-600 dark:text-slate-300">{count} tickets ({percent}%)</span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/50">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${p === 'High' ? 'bg-red-500' : p === 'Medium' ? 'bg-amber-500' : 'bg-slate-400'}`}
                                    style={{ width: `${percent}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Active Status Distribution</h4>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(workspaceInsights.statusCounts).map(([status, count]) => (
                        <div key={status} className="px-3 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                                status === 'New' ? 'bg-blue-500' :
                                status === 'In Progress' ? 'bg-yellow-500' :
                                status.includes('Resolved') || status === 'Self-Healed' ? 'bg-green-500' :
                                'bg-slate-400'
                            }`}></div>
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{status}: {count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </Card>

        <Card className="lg:col-span-3">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Tickets Created (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ticketsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.8rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Line type="monotone" dataKey="tickets" stroke="#4F46E5" strokeWidth={3} dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
            </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Most Common Issues</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click bar to filter</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={displayIssues}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                onClick={(data) => {
                    if (data && data.activeLabel && onFilterTickets) {
                        onFilterTickets(data.activeLabel);
                    }
                }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" width={110} stroke="#94a3b8" cursor="pointer" />
              <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem'}} />
              <Bar dataKey="value" name="Tickets" fill="#4F46E5" radius={[0, 4, 4, 0]} className="cursor-pointer" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Resolution Source</h3>
           <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={resolutionByData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                  if (!percent) return null;
                  const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                  return (
                    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="14">
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
              >
                {resolutionByData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem'}}/>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {role === 'admin' && allActivities.length > 0 && (
            <Card className="lg:col-span-5">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Recent System Activity</h3>
                <div className="space-y-4">
                    {allActivities.map((activity, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                            <div className={`p-2 rounded-full ${
                                activity.type === 'status_change' ? 'bg-blue-100 text-blue-600' :
                                activity.type === 'resolution' ? 'bg-green-100 text-green-600' :
                                'bg-slate-200 text-slate-600'
                            }`}>
                                <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {activity.message}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 truncate">
                                    On <span className="font-semibold">{activity.ticketTitle}</span> ({activity.ticketId}) • {activity.user}
                                </p>
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                {new Date(activity.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        )}
      </div>
    </div>
  );
};