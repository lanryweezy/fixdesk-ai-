
import React from 'react';
import { UserIcon, ShieldCheckIcon } from './icons/Icons';

interface HeaderProps {
  role: 'staff' | 'admin';
  userName: string;
  userAvatar: string;
}

export const Header: React.FC<HeaderProps> = ({ role, userName, userAvatar }) => {
  return (
    <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between h-16 px-8">
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
