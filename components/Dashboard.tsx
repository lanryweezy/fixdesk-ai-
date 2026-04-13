import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card } from './common/Card';
import { mockAnalyticsData } from '../constants';
import { Ticket, TicketStatus, Activity } from '../types';
import { ChatBubbleBottomCenterTextIcon, BrainCircuit, ShieldCheckIcon, SpinnerIcon } from './icons/Icons';

const PIE_COLORS = { 'FixDesk AI': '#4F46E5', 'IT Support Team': '#A78BFA' };

const StatCard: React.FC<{ title: string; value: string | number; subtext: string }> = ({ title, value, subtext }) => (
  <Card>
    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
    <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
    <p className="text-sm text-slate-400 mt-1">{subtext}</p>
  </Card>
);

interface DashboardProps {
  tickets: Ticket[];
  role?: 'staff' | 'admin';
}

export const Dashboard: React.FC<DashboardProps> = ({ tickets, role = 'admin' }) => {
  const analytics = mockAnalyticsData;
  const [systemHealth, setSystemHealth] = React.useState<{ status: string, summary: string, risks: string[] } | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = React.useState(false);

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
  
  const stats = useMemo(() => {
    const total = tickets.length;
    const resolved = tickets.filter(t => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.AI_RESOLVED);
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
    tickets.forEach(ticket => {
        const category = ticket.title.split(':')[0] || 'Uncategorized';
        issueCounts[category] = (issueCounts[category] || 0) + 1;
    });

    const dynamic = Object.entries(issueCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    return dynamic.length > 0 ? dynamic : analytics.commonIssues;
  }, [tickets, analytics.commonIssues]);

  const ticketsOverTime = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tickets: tickets.filter(t => t.createdAt.startsWith(date)).length
    }));
  }, [tickets]);

  const allActivities = useMemo(() => {
    return tickets
        .flatMap(t => (t.activities || []).map(a => ({ ...a, ticketTitle: t.title, ticketId: t.id })))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
  }, [tickets]);

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-slate-800">Analytics & IT Insights</h2>

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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-5">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Tickets Created (Last 7 Days)</h3>
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
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Most Common Issues</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={displayIssues} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" width={110} stroke="#94a3b8" />
              <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem'}} />
              <Bar dataKey="value" name="Tickets" fill="#4F46E5" radius={[0, 4, 4, 0]} />
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
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                  if (!percent) return null;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
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