
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
    </header>
  );
};
