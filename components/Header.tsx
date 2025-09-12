
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200">
      <div className="flex items-center justify-end h-16 px-8">
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold text-slate-700">Alex Smith</p>
            <p className="text-xs text-slate-500">Software Engineer</p>
          </div>
          <img
            className="h-10 w-10 rounded-full object-cover"
            src="https://picsum.photos/id/237/100/100"
            alt="User avatar"
          />
        </div>
      </div>
    </header>
  );
};
