import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & { title?: string };

export const ChartBarIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', title, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

export const TicketIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', title, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h3m-3 0h-3m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9H5.625z" />
  </svg>
);

export const VideoCameraIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', title, ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" />
    </svg>
);

export const BrainCircuit: React.FC<IconProps> = ({ className = 'w-6 h-6', title, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className} {...rest}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.47 2.118 2.25 2.25 0 0 1-2.47-2.118c0-.62.28-1.186.74-1.544l2.186-1.64m5.78 1.128a3 3 0 0 1 5.78-1.128m-5.78 1.128-2.186-1.64m5.78 1.128v-2.828m0 0a3 3 0 0 0-5.78-1.128 2.25 2.25 0 0 1-2.47-2.118 2.25 2.25 0 0 1 2.47-2.118c.62 0 1.186.28 1.544.74l2.186 1.64m-5.78-1.128a3 3 0 0 1 5.78 1.128m0 0a3 3 0 0 1-5.78 1.128M15 4.5a3 3 0 0 1 5.78-1.128 2.25 2.25 0 0 0 2.47-2.118 2.25 2.25 0 0 0-2.47-2.118c-.62 0-1.186.28-1.544.74l-2.186 1.64m-5.78 1.128a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.47 2.118c-.62 0-1.186.28-1.544.74l-2.186 1.64M4.5 15a3 3 0 0 0 5.78 1.128 2.25 2.25 0 0 1 2.47 2.118c.62 0 1.186-.28 1.544.74l2.186-1.64m5.78-1.128a3 3 0 0 1-5.78-1.128 2.25 2.25 0 0 0-2.47-2.118 2.25 2.25 0 0 0-2.47 2.118c0 .62-.28 1.186-.74 1.544l-2.186 1.64" />
  </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', title, ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

export const XCircleIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', title, ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

export const ArrowUturnLeftIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', title, ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
);

export const CogIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', title, ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15.036-6.364l-1.06-1.06M21.75 16.5l-1.06-1.06M4.504 20.25l1.06-1.06M18.45 5.25l1.06-1.06M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0v-3.375c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125V21Zm-3.375 0v-3.375c0-.621-.504-1.125-1.125-1.125h-1.5c-.621 0-1.125.504-1.125 1.125V21Zm-2.25-12.375c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125V12h-3.75V8.625Zm10.5 0c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125V12h-3.75V8.625Z" />
    </svg>
);

// FIX: Added SpinnerIcon as it was missing from the file.
export const SpinnerIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', title, ...rest }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={`animate-spin ${className}`}
      {...rest}
    >
      {title && <title>{title}</title>}
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
);

// FIX: The ComputerDesktopIcon component was incomplete due to a file truncation.
export const ComputerDesktopIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', title, ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" />
    </svg>
);
