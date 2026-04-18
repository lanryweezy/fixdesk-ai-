
import React, { useState } from 'react';
import { UserIcon, ShieldCheckIcon, IdentificationIcon } from './icons/Icons';

interface HeaderProps {
  role: 'staff' | 'admin';
  userName: string;
  userAvatar: string;
  activeWorkspaceId?: string;
  onWorkspaceChange?: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ role, userName, userAvatar, activeWorkspaceId = 'DEFAULT', onWorkspaceChange }) => {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const handleJoinWorkspace = () => {
    if (joinCode.trim() && onWorkspaceChange) {
        onWorkspaceChange(joinCode.toUpperCase().trim());
        setIsJoinModalOpen(false);
        setJoinCode('');
    }
  };

import React from 'react';
import { UserIcon, ShieldCheckIcon } from './icons/Icons';

interface HeaderProps {
  role: 'staff' | 'admin';
  userName: string;
  userAvatar: string;
  activeWorkspaceId?: string;
  onWorkspaceChange?: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ role, userName, userAvatar, activeWorkspaceId = 'DEFAULT', onWorkspaceChange }) => {
  return (
    <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between h-16 px-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
            {role === 'admin' ? (
                <>
                    <ShieldCheckIcon className="w-4 h-4 text-brand-primary" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Admin Portal</span>
                </>
            ) : (
                <>
                    <UserIcon className="w-4 h-4 text-brand-secondary" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Self Service</span>
                </>
            )}
          </div>

          {onWorkspaceChange && (
              <div className="flex items-center gap-4">
                <select
                    value={activeWorkspaceId}
                    onChange={(e) => onWorkspaceChange(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-slate-500 hover:text-brand-primary outline-none cursor-pointer uppercase tracking-widest"
                >
                    <option value="DEFAULT">Default Workspace</option>
                    <option value="ACME_CORP">ACME Corp</option>
                    <option value="GLOBEX">Globex Corporation</option>
                    <option value="STARK_IND">Stark Industries</option>
                    <option value={activeWorkspaceId}>{activeWorkspaceId}</option>
                </select>
                <button
                    onClick={() => setIsJoinModalOpen(true)}
                    className="flex items-center gap-1.5 text-[10px] font-black text-brand-primary hover:text-brand-primary/80 transition-colors uppercase tracking-tighter"
                >
                    <IdentificationIcon className="w-3.5 h-3.5" />
                    Join
                </button>
              </div>
              <select
                  value={activeWorkspaceId}
                  onChange={(e) => onWorkspaceChange(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-slate-500 hover:text-brand-primary outline-none cursor-pointer uppercase tracking-widest"
              >
                  <option value="DEFAULT">Default Workspace</option>
                  <option value="ACME_CORP">ACME Corp</option>
                  <option value="GLOBEX">Globex Corporation</option>
                  <option value="STARK_IND">Stark Industries</option>
              </select>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold text-slate-700 dark:text-slate-100">{userName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{role === 'admin' ? 'IT Support Agent' : 'Employee'}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
            {userAvatar}
          </div>
        </div>
      </div>

      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-brand-primary/10 rounded-lg">
                        <IdentificationIcon className="w-6 h-6 text-brand-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Join Workspace</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Enter the workspace code provided by your IT department to link this agent.</p>
                <input
                    autoFocus
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="e.g. COMPANY_XYZ"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-slate-800 dark:text-slate-100 font-mono mb-6"
                />
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsJoinModalOpen(false)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleJoinWorkspace}
                        disabled={!joinCode.trim()}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-brand-primary text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        Join
                    </button>
                </div>
            </div>
        </div>
      )}
    </header>
  );
};
