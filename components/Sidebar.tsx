import React from 'react';
import { Page } from '../App';
import { ChartBarIcon, TicketIcon, BrainCircuit, ComputerDesktopIcon, ShieldCheckIcon, UserGroupIcon } from './icons/Icons';

interface SidebarProps {
  currentPage: string;
  setPage: (page: Page) => void;
  onReportIssue: () => void;
}

const navItems = [
  { name: 'Dashboard', icon: ChartBarIcon, page: 'dashboard' },
  { name: 'My Tickets', icon: TicketIcon, page: 'tickets' },
  { name: 'Start Remote Session', icon: UserGroupIcon, page: 'start-remote-session' },
];

const adminNavItems = [
    { name: 'Remote Control', icon: ShieldCheckIcon, page: 'remote' },
]

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, onReportIssue }) => {
  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-4">
      <div className="flex items-center gap-2 px-2 mb-8">
        <BrainCircuit className="h-8 w-8 text-brand-primary" />
        <h1 className="text-2xl font-bold text-slate-800">FixDesk AI</h1>
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
            {navItems.map((item) => (
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

          <div className="mt-8">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin Tools</p>
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
        </div>

        <div className="p-4 bg-slate-100 rounded-lg text-center">
            <p className="text-sm text-slate-600">
                Having trouble? Our AI is here to help you get back on track, fast.
            </p>
        </div>
      </nav>
    </div>
  );
};