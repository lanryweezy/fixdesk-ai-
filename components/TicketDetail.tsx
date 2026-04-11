import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus } from '../types';
import { Card } from './common/Card';
import { ArrowUturnLeftIcon, CogIcon, SpinnerIcon } from './icons/Icons';

interface TicketDetailProps {
  ticket: Ticket;
  onBack: () => void;
  onUpdate?: (ticket: Ticket) => void;
  onRequestRemote?: (ticketId: string) => void;
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

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticket: initialTicket, onBack, onUpdate, onRequestRemote }) => {
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [resolutionText, setResolutionText] = useState(ticket.resolution || '');

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (newStatus === TicketStatus.RESOLVED) {
        setIsResolutionModalOpen(true);
        return;
    }
    setIsUpdatingStatus(true);
    try {
      const updatedTicket = await window.electronAPI.updateTicketStatus(ticket.id, newStatus);
      setTicket(updatedTicket);
      if (onUpdate) onUpdate(updatedTicket);
    } catch (error) {
      alert(`Failed to update status: ${(error as Error).message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveResolution = async () => {
    setIsUpdatingStatus(true);
    try {
        const updatedTicket = {
            ...ticket,
            status: TicketStatus.RESOLVED,
            resolution: resolutionText
        };
        const savedTicket = await window.electronAPI.updateTicket(updatedTicket);
        setTicket(savedTicket);
        if (onUpdate) onUpdate(savedTicket);
        setIsResolutionModalOpen(false);
    } catch (error) {
        alert(`Failed to save resolution: ${(error as Error).message}`);
    } finally {
        setIsUpdatingStatus(false);
    }
  };

  const handleRequestAssistance = () => {
    setIsRequesting(true);
    if (onRequestRemote) {
        onRequestRemote(ticket.id);
    }
  };

  const {
    id, title, description, status, reportedBy, assignedTo, createdAt, resolution, logs, videoUrl
  } = ticket;

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
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={status} />
            <select
                value={status}
                disabled={isUpdatingStatus}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-xs py-1"
            >
                {Object.values(TicketStatus).map((s) => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>
          </div>
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

      {isResolutionModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Resolve Ticket</h3>
            <p className="text-sm text-slate-500 mb-4">Please describe how this issue was resolved.</p>
            <textarea
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              className="w-full h-32 p-2 border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary mb-6"
              placeholder="Resolution details..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsResolutionModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveResolution}
                disabled={!resolutionText.trim() || isUpdatingStatus}
                className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:bg-slate-300"
              >
                {isUpdatingStatus ? 'Saving...' : 'Mark as Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};