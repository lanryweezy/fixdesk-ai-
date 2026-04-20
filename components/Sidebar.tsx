import React from 'react';
import { Page } from '../App';
import { ChartBarIcon, TicketIcon, BrainCircuit, ComputerDesktopIcon, ShieldCheckIcon, UserGroupIcon, Cog8ToothIcon, CogIcon } from './icons/Icons';

import { Ticket, TicketStatus } from '../types';

interface SidebarProps {
  currentPage: string;
  setPage: (page: Page) => void;
  onReportIssue: () => void;
  role: 'staff' | 'admin';
  onRoleToggle: () => void;
  tickets: Ticket[];
  userName: string;
}

const navItems = [
  { name: 'Dashboard', icon: ChartBarIcon, page: 'dashboard', roles: ['admin'] },
  { name: 'Tickets', icon: TicketIcon, page: 'tickets', roles: ['staff', 'admin'] },
  { name: 'Knowledge Base', icon: BrainCircuit, page: 'knowledge-base', roles: ['staff', 'admin'] },
  { name: 'Help & Support', icon: UserGroupIcon, page: 'start-remote-session', roles: ['staff'] },
  { name: 'Settings', icon: Cog8ToothIcon, page: 'settings', roles: ['staff', 'admin'] },
];

const adminNavItems = [
    { name: 'Remote Control', icon: ShieldCheckIcon, page: 'remote', roles: ['admin'] },
    { name: 'Automation Rules', icon: CogIcon, page: 'automation-rules', roles: ['admin'] },
]

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, onReportIssue, role, onRoleToggle, tickets, userName }) => {
  const unassignedCount = tickets.filter(t => !t.assignedTo && t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.AI_RESOLVED).length;
  const staffActiveCount = tickets.filter(t => t.reportedBy === userName && t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.AI_RESOLVED).length;

  return (
    <div className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-5">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="p-1.5 bg-brand-primary rounded-xl shadow-lg shadow-brand-primary/20">
            <BrainCircuit className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">FixDesk <span className="text-brand-primary">AI</span></h1>
      </div>
      
      <nav className="flex-1 flex flex-col justify-between">
        <div>
          <button
            onClick={onReportIssue}
            className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-brand-primary/25 transition-all duration-300 active:scale-95"
          >
            <ComputerDesktopIcon className="w-5 h-5" />
            Report an Issue
          </button>
          
          <ul className="mt-10 space-y-1">
            {navItems.filter(item => item.roles.includes(role)).map((item) => (
              <li key={item.name}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(item.page as Page);
                  }}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    currentPage === item.page
                      ? 'bg-white dark:bg-slate-800 text-brand-primary shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-colors ${currentPage === item.page ? 'text-brand-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="flex-1">{item.name}</span>
                  {item.page === 'tickets' && (
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                        currentPage === 'tickets' ? 'bg-brand-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                        {role === 'admin' ? unassignedCount : staffActiveCount}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>

          {role === 'admin' && (
            <div className="mt-10">
                <p className="px-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Systems Admin</p>
                <ul className="space-y-1">
                    {adminNavItems.map((item) => (
                        <li key={item.name}>
                        <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setPage(item.page as Page);
                        }}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            currentPage === item.page
                            ? 'bg-white dark:bg-slate-800 text-brand-primary shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                        >
                        <item.icon className={`w-5 h-5 transition-colors ${currentPage === item.page ? 'text-brand-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        {item.name}
                        </a>
                    </li>
                    ))}
                </ul>
            </div>
          )}
        </div>

        <div className="space-y-5">
            <button
                onClick={onRoleToggle}
                className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-brand-primary transition-all group"
            >
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${role === 'admin' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-200 uppercase tracking-widest">{role} Mode</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 group-hover:text-brand-primary uppercase">Switch</span>
            </button>

            <div className="p-5 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl text-white shadow-xl shadow-brand-primary/20">
                <p className="text-xs font-bold opacity-90 leading-relaxed">
                    FixDesk AI is actively monitoring your workspace for anomalies.
                </p>
            </div>
        </div>
      </nav>
    </div>
  );
};