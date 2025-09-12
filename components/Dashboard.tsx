import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from './common/Card';
import { mockAnalyticsData } from '../constants';
import { Ticket, TicketStatus } from '../types';

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
}

export const Dashboard: React.FC<DashboardProps> = ({ tickets }) => {
  const analytics = mockAnalyticsData;
  
  const totalTickets = tickets.length;
  const resolvedTicketsList = tickets.filter(t => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.AI_RESOLVED);
  const resolvedTicketsCount = resolvedTicketsList.length;
  
  const aiResolvedCount = tickets.filter(t => t.status === TicketStatus.AI_RESOLVED).length;
  const humanResolvedCount = tickets.filter(t => t.status === TicketStatus.RESOLVED).length;

  const automationRate = resolvedTicketsCount > 0 ? Math.round((aiResolvedCount / resolvedTicketsCount) * 100) : 0;
  
  const resolutionByData = [
      { name: 'FixDesk AI', value: aiResolvedCount },
      { name: 'IT Support Team', value: humanResolvedCount }
  ].filter(item => item.value > 0);


  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-slate-800">Analytics & IT Insights</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Tickets" value={totalTickets} subtext="All-time ticket count" />
        <StatCard title="Tickets Resolved" value={resolvedTicketsCount} subtext="Total resolved tickets" />
        <StatCard title="Automation Rate" value={`${automationRate}%`} subtext="Resolved by FixDesk AI" />
        <StatCard title="Avg. Resolution Time" value={analytics.avgResolutionTime} subtext="For human-handled tickets" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Most Common Issues</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.commonIssues} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" width={110} stroke="#94a3b8" />
              <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem'}} />
              <Bar dataKey="value" name="Tickets" fill="#4F46E5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Resolution Source</h3>
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
      </div>
    </div>
  );
};