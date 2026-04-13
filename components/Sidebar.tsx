import React from 'react';
import { Page } from '../App';
import { ChartBarIcon, TicketIcon, BrainCircuit, ComputerDesktopIcon, ShieldCheckIcon, UserGroupIcon, Cog8ToothIcon } from './icons/Icons';

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
  { name: 'My Tickets', icon: TicketIcon, page: 'tickets', roles: ['staff', 'admin'] },
  { name: 'Knowledge Base', icon: BrainCircuit, page: 'knowledge-base', roles: ['staff', 'admin'] },
  { name: 'Start Remote Session', icon: UserGroupIcon, page: 'start-remote-session', roles: ['staff'] },
  { name: 'Settings', icon: Cog8ToothIcon, page: 'settings', roles: ['staff', 'admin'] },
];

const adminNavItems = [
    { name: 'Remote Control', icon: ShieldCheckIcon, page: 'remote', roles: ['admin'] },
]

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, onReportIssue, role, onRoleToggle, tickets, userName }) => {
  const unassignedCount = tickets.filter(t => !t.assignedTo && t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.AI_RESOLVED).length;
  const staffActiveCount = tickets.filter(t => t.reportedBy === userName && t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.AI_RESOLVED).length;

  return (
    <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col p-4">
      <div className="flex items-center gap-2 px-2 mb-8">
        <BrainCircuit className="h-8 w-8 text-brand-primary" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">FixDesk AI</h1>
      </div>
      
      <nav className="flex-1 flex flex-col justify-between">
        <div>
          <button
            onClick={onReportIssue}
            className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
          >
            <ComputerDesktopIcon className="w-5 h-5" />
            Report an Issue
          </button>
          
          <ul className="mt-8 space-y-2">
            {navItems.filter(item => item.roles.includes(role)).map((item) => (
              <li key={item.name}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(item.page);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors ${
                    currentPage === item.page
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="flex-1">{item.name}</span>
                  {item.page === 'tickets' && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        currentPage === 'tickets' ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                        {role === 'admin' ? unassignedCount : staffActiveCount}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>

          {role === 'admin' && (
            <div className="mt-8">
                <p className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Admin Tools</p>
                <ul className="mt-2 space-y-2">
                    {adminNavItems.map((item) => (
                        <li key={item.name}>
                        <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setPage(item.page);
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors ${
                            currentPage === item.page
                            ? 'bg-brand-primary/10 text-brand-primary'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                        >
                        <item.icon className="w-6 h-6" />
                        {item.name}
                        </a>
                    </li>
                    ))}
                </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
            <button
                onClick={onRoleToggle}
                className="w-full flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors group"
            >
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${role === 'admin' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize">{role} Mode</span>
                </div>
                <span className="text-xs text-slate-400 group-hover:text-brand-primary">Switch</span>
            </button>

            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
                Having trouble? Our AI is here to help you get back on track, fast.
            </p>
        </div>
      </nav>
    </div>
  );
};