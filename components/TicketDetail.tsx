import React, { useState } from 'react';
import { Ticket, TicketStatus } from '../types';
import { Card } from './common/Card';
import { ArrowUturnLeftIcon, CogIcon, SpinnerIcon } from './icons/Icons';

interface TicketDetailProps {
  ticket: Ticket;
  onBack: () => void;
}

const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const baseClasses = 'px-3 py-1 text-sm font-semibold rounded-full inline-flex items-center gap-2';
  const statusClasses = {
    [TicketStatus.NEW]: 'bg-blue-100 text-blue-800',
    [TicketStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
    [TicketStatus.RESOLVED]: 'bg-green-100 text-green-800',
    [TicketStatus.AI_RESOLVED]: 'bg-purple-100 text-purple-800',
    [TicketStatus.NEEDS_ATTENTION]: 'bg-red-100 text-red-800',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>
    {status === TicketStatus.AI_RESOLVED && <CogIcon className="w-4 h-4" />}
    {status}
  </span>;
};

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, onBack }) => {
  const { 
    id, title, description, status, reportedBy, assignedTo, createdAt, resolution, logs, videoUrl 
  } = ticket;
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestAssistance = () => {
    setIsRequesting(true);
    // In a real application, an API call would be made here.
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-primary mb-6 transition-colors"
      >
        <ArrowUturnLeftIcon className="w-5 h-5" />
        Back to all tickets
      </button>

      <Card className="p-8">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-slate-500">{id}</p>
            <h2 className="text-3xl font-bold text-slate-800 mt-1">{title}</h2>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-6 border-b border-t border-slate-200 py-4">
          <div>
            <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Reported By</h4>
            <p className="text-slate-700 font-medium">{reportedBy}</p>
          </div>
          <div>
            <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Assigned To</h4>
            <p className="text-slate-700 font-medium">{assignedTo || 'Unassigned'}</p>
          </div>
          <div>
            <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Date Created</h4>
            <p className="text-slate-700 font-medium">{new Date(createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Problem Description</h3>
            <p className="text-slate-600 leading-relaxed">{description}</p>
          </div>

          {videoUrl && (
             <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Video Evidence</h3>
                <div className="aspect-video bg-slate-200 rounded-lg flex items-center justify-center">
                    <p className="text-slate-500">(Mock video player for {videoUrl})</p>
                </div>
             </div>
          )}

          {resolution && (
            <div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Resolution</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 leading-relaxed">{resolution}</p>
              </div>
            </div>
          )}

          {logs && logs.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Diagnostics & Activity Log</h3>
              <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 font-mono text-xs text-slate-600 space-y-2">
                {logs.map((log, index) => <p key={index}>{log}</p>)}
              </div>
            </div>
          )}
          
          {status !== TicketStatus.RESOLVED && status !== TicketStatus.AI_RESOLVED && (
            <div className="text-center pt-6 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Still need help?</h3>
              <p className="text-slate-500 mt-1 mb-4">An IT agent can start a remote session to fix this directly.</p>
              <button
                onClick={handleRequestAssistance}
                disabled={isRequesting}
                className="inline-flex items-center justify-center rounded-lg bg-brand-secondary px-6 py-2 font-semibold text-white shadow-sm transition-all hover:bg-brand-secondary/90 disabled:cursor-not-allowed disabled:bg-brand-secondary/70"
              >
                {isRequesting ? (
                  <>
                    <SpinnerIcon className="mr-3 h-5 w-5" />
                    Request Sent...
                  </>
                ) : (
                  'Request Remote Assistance'
                )}
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};