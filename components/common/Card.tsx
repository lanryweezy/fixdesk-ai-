
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
        onClick={onClick}
      className={`bg-white dark:bg-slate-800 rounded-2xl shadow-glass border border-slate-200/60 dark:border-slate-700/60 p-6 transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
};
