import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Ticket, TicketStatus, Solution, Activity } from '../types';
import { Card } from './common/Card';
import { ArrowUturnLeftIcon, CogIcon, SpinnerIcon, BrainCircuit, PaperAirplaneIcon, ChatBubbleBottomCenterTextIcon, BookmarkIcon, SparklesIcon, ListBulletIcon } from './icons/Icons';
import { useToast } from '../services/ToastContext';

interface TicketDetailProps {
  ticket: Ticket;
  onBack: () => void;
  onUpdate?: (ticket: Ticket) => void;
  onRequestRemote?: (ticketId: string) => void;
  role?: 'staff' | 'admin';
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

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticket: initialTicket, onBack, onUpdate, onRequestRemote, role = 'admin' }) => {
  const { addToast } = useToast();
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [resolutionText, setResolutionText] = useState(ticket.resolution || '');
  const [internalNote, setInternalNote] = useState('');
  const [recommendedSolutions, setRecommendedSolutions] = useState<Solution[]>([]);
  const [isLoadingSolutions, setIsLoadingSolutions] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    const fetchRecommendedSolutions = async () => {
        setIsLoadingSolutions(true);
        try {
            const solutions = await window.electronAPI.findSolutions(ticket.title + ' ' + ticket.description);
            setRecommendedSolutions(solutions);
        } catch (error) {
            console.error('Error finding solutions:', error);
        } finally {
            setIsLoadingSolutions(false);
        }
    };
    if (ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.AI_RESOLVED) {
        fetchRecommendedSolutions();
    }
  }, [ticket.id]);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (newStatus === TicketStatus.RESOLVED) {
        setIsResolutionModalOpen(true);
        return;
    }
    setIsUpdatingStatus(true);
    try {
        const activity: Activity = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            type: 'status_change',
            message: `Changed status from ${ticket.status} to ${newStatus}`,
            user: 'Alex Smith'
        };
        const updatedTicketData = {
            ...ticket,
            status: newStatus,
            activities: [...(ticket.activities || []), activity]
        };
        const updatedTicket = await window.electronAPI.updateTicket(updatedTicketData);
        setTicket(updatedTicket);
        if (onUpdate) onUpdate(updatedTicket);
        addToast(`Status updated to ${newStatus}`, 'success');
    } catch (error) {
      addToast(`Failed to update status: ${(error as Error).message}`, 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveResolution = async () => {
    setIsUpdatingStatus(true);
    try {
        const activity: Activity = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            type: 'resolution',
            message: `Resolved issue: ${resolutionText}`,
            user: 'Alex Smith'
        };
        const updatedTicket = {
            ...ticket,
            status: TicketStatus.RESOLVED,
            resolution: resolutionText,
            activities: [...(ticket.activities || []), activity]
        };
        const savedTicket = await window.electronAPI.updateTicket(updatedTicket);
        setTicket(savedTicket);
        if (onUpdate) onUpdate(savedTicket);
        setIsResolutionModalOpen(false);
        addToast('Ticket marked as resolved', 'success');
    } catch (error) {
        addToast(`Failed to save resolution: ${(error as Error).message}`, 'error');
    } finally {
        setIsUpdatingStatus(false);
    }
  };

  const handleAssignToMe = async () => {
    setIsUpdatingStatus(true);
    try {
        const activity: Activity = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            type: 'assignment',
            message: `Assigned ticket to Alex Smith`,
            user: 'Alex Smith'
        };
        const updatedTicket = {
            ...ticket,
            assignedTo: 'Alex Smith', // Mocked user
            activities: [...(ticket.activities || []), activity]
        };
        const savedTicket = await window.electronAPI.updateTicket(updatedTicket);
        setTicket(savedTicket);
        if (onUpdate) onUpdate(savedTicket);
        addToast('Ticket assigned to you', 'success');
    } catch (error) {
        addToast(`Failed to assign ticket: ${(error as Error).message}`, 'error');
    } finally {
        setIsUpdatingStatus(false);
    }
  };

  const handleConvertToKB = async () => {
    if (!ticket.resolution) return;
    setIsUpdatingStatus(true);
    try {
        const aiArticle = await window.electronAPI.generateKbArticle(ticket);

        const solutionData = {
            problemDescription: ticket.title,
            solutionDescription: aiArticle,
            actions: []
        };
        await window.electronAPI.createSolution(solutionData);

        const activity: Activity = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            type: 'note',
            message: `Converted this resolved ticket into a Knowledge Base solution.`,
            user: 'Alex Smith'
        };
        const updatedTicket = await window.electronAPI.updateTicket({
            ...ticket,
            activities: [...(ticket.activities || []), activity]
        });
        setTicket(updatedTicket);
        if (onUpdate) onUpdate(updatedTicket);

        addToast('Added to Knowledge Base', 'success');
    } catch (error) {
        addToast('Failed to add to Knowledge Base', 'error');
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatMessage('');
    setIsTyping(true);

    try {
        const aiResponse = await window.electronAPI.askAboutTicket(ticket, userMsg);
        setChatHistory(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
        setChatHistory(prev => [...prev, { role: 'ai', content: "I'm sorry, I encountered an error. Please try again." }]);
    } finally {
        setIsTyping(false);
    }
  };

  const handleSuggestResponse = async () => {
    setIsDrafting(true);
    try {
        const draft = await window.electronAPI.draftAiResponse(ticket);
        setChatMessage(draft);
        addToast('AI Draft generated', 'success');
    } catch (error) {
        addToast('Failed to draft response', 'error');
    } finally {
        setIsDrafting(false);
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
        const result = await window.electronAPI.summarizeTicket(ticket);
        setSummary(result);
        addToast('Ticket summary ready', 'success');
    } catch (error) {
        addToast('Failed to summarize ticket', 'error');
    } finally {
        setIsSummarizing(false);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNote.trim()) return;

    setIsUpdatingStatus(true);
    try {
        const activity: Activity = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            type: 'note',
            message: `Internal Note: ${internalNote}`,
            user: 'Alex Smith'
        };
        const updatedTicket = await window.electronAPI.updateTicket({
            ...ticket,
            activities: [...(ticket.activities || []), activity]
        });
        setTicket(updatedTicket);
        if (onUpdate) onUpdate(updatedTicket);
        setInternalNote('');
        addToast('Internal note added', 'success');
    } catch (error) {
        addToast('Failed to add internal note', 'error');
    } finally {
        setIsUpdatingStatus(false);
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
          <div className="flex-1">
            <div className="flex items-center gap-3">
                <p className="text-sm text-slate-500">{id}</p>
                {role === 'admin' && (
                    <button
                        onClick={handleSummarize}
                        disabled={isSummarizing}
                        className="flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors"
                    >
                        <ListBulletIcon className="w-3.5 h-3.5" />
                        {isSummarizing ? 'Summarizing...' : 'AI Summary'}
                    </button>
                )}
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{title}</h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={status} />
            {role === 'admin' && (
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
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-6 border-b border-t border-slate-200 py-4">
          <div>
            <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Reported By</h4>
            <p className="text-slate-700 font-medium">{reportedBy}</p>
          </div>
          <div>
            <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Assigned To</h4>
            <div className="flex items-center gap-2">
                <p className="text-slate-700 font-medium">{assignedTo || 'Unassigned'}</p>
                {role === 'admin' && !assignedTo && (
                    <button
                        onClick={handleAssignToMe}
                        disabled={isUpdatingStatus}
                        className="text-[10px] font-bold text-brand-primary hover:underline uppercase"
                    >
                        Assign to me
                    </button>
                )}
            </div>
          </div>
          <div>
            <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Date Created</h4>
            <p className="text-slate-700 font-medium">{new Date(createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {summary && (
             <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl">
                <h3 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    FixDesk AI Summary
                </h3>
                <p className="text-sm text-amber-900 dark:text-amber-200 italic leading-relaxed">{summary}</p>
             </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Problem Description</h3>
            <div className="text-slate-600 dark:text-slate-400 leading-relaxed prose dark:prose-invert max-w-none prose-sm">
                <ReactMarkdown>{description}</ReactMarkdown>
            </div>
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
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-slate-700">Resolution</h3>
                {role === 'admin' && (
                    <button
                        onClick={handleConvertToKB}
                        disabled={isUpdatingStatus}
                        className="flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors"
                    >
                        <BookmarkIcon className="w-3.5 h-3.5" />
                        Convert to Knowledge Base
                    </button>
                )}
              </div>
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50 rounded-lg p-4">
                <div className="text-green-800 dark:text-green-200 leading-relaxed prose dark:prose-invert max-w-none prose-sm">
                    <ReactMarkdown>{resolution}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {ticket.activities && ticket.activities.length > 0 && (
            <div className="pt-8 border-t border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Activity Timeline</h3>
                    {role === 'admin' && (
                        <form onSubmit={handleAddInternalNote} className="flex gap-2">
                            <input
                                type="text"
                                value={internalNote}
                                onChange={(e) => setInternalNote(e.target.value)}
                                placeholder="Add internal note..."
                                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary min-w-[200px]"
                            />
                            <button
                                type="submit"
                                disabled={!internalNote.trim() || isUpdatingStatus}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors disabled:bg-slate-300"
                            >
                                Add
                            </button>
                        </form>
                    )}
                </div>
                <div className="flow-root">
                    <ul role="list" className="-mb-8">
                        {ticket.activities.map((activity, idx) => (
                            <li key={activity.id}>
                                <div className="relative pb-8">
                                    {idx !== ticket.activities!.length - 1 ? (
                                        <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                    ) : null}
                                    <div className="relative flex space-x-3">
                                        <div>
                                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                                activity.type === 'status_change' ? 'bg-blue-500' :
                                                activity.type === 'resolution' ? 'bg-green-500' :
                                                'bg-gray-400'
                                            }`}>
                                                <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                            </span>
                                        </div>
                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                            <div>
                                                <div className="text-sm text-gray-500 dark:text-slate-400 prose dark:prose-invert max-w-none prose-xs">
                                                    <ReactMarkdown>{`${activity.message} **by ${activity.user}**`}</ReactMarkdown>
                                                </div>
                                            </div>
                                            <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                                <time dateTime={activity.timestamp}>{new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
          )}

          {logs && logs.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Diagnostics Log</h3>
              <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 font-mono text-xs text-slate-600 space-y-2">
                {logs.map((log, index) => <p key={index}>{log}</p>)}
              </div>
            </div>
          )}

          {status !== TicketStatus.RESOLVED && status !== TicketStatus.AI_RESOLVED && (
            <div className="pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                    <BrainCircuit className="w-5 h-5 text-brand-primary" />
                    <h3 className="text-lg font-semibold text-slate-700">AI Recommended Solutions</h3>
                </div>
                {isLoadingSolutions ? (
                    <div className="flex justify-center py-4">
                        <SpinnerIcon className="w-6 h-6 text-brand-primary" />
                    </div>
                ) : recommendedSolutions.length > 0 ? (
                    <div className="space-y-4">
                        {recommendedSolutions.map((solution) => (
                            <div key={solution.id} className="p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-lg">
                                <h4 className="font-bold text-slate-800 text-sm mb-1">{solution.problemDescription}</h4>
                                <p className="text-slate-600 text-sm">{solution.solutionDescription}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 italic">No similar solutions found in knowledge base yet.</p>
                )}
            </div>
          )}

          <div className="pt-8 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-4">
                <BrainCircuit className="w-6 h-6 text-brand-primary" />
                <h3 className="text-xl font-bold text-slate-800">Ask FixDesk AI About This Ticket</h3>
            </div>

            <div ref={chatContainerRef} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 min-h-[150px] max-h-[350px] overflow-y-auto mb-4 border border-slate-200 dark:border-slate-800 space-y-4 scroll-smooth">
                {chatHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <BrainCircuit className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-3" />
                        <p className="text-slate-400 dark:text-slate-600 text-sm italic">Ask me anything about this ticket's status,<br/>logs, or potential fixes.</p>
                    </div>
                ) : (
                    chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm ${
                                msg.role === 'user'
                                ? 'bg-brand-primary text-white rounded-br-none'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                            }`}>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm">
                            <SpinnerIcon className="w-4 h-4 text-brand-primary animate-spin" />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end mb-2">
                {role === 'admin' && (
                    <button
                        onClick={handleSuggestResponse}
                        disabled={isDrafting || isTyping}
                        className="flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors"
                    >
                        <SparklesIcon className="w-3.5 h-3.5" />
                        {isDrafting ? 'Drafting...' : 'Suggest Professional Response'}
                    </button>
                )}
            </div>

            <form onSubmit={handleSendMessage} className="relative">
                <textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder={role === 'admin' ? "Type a response or use AI suggestions..." : "Ask a question about this ticket..."}
                    rows={chatMessage.length > 50 ? 3 : 1}
                    className="w-full pl-4 pr-12 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all shadow-sm resize-none"
                />
                <button
                    type="submit"
                    disabled={!chatMessage.trim() || isTyping}
                    className="absolute right-2 top-2 p-1.5 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors disabled:bg-slate-300"
                >
                    <PaperAirplaneIcon className="w-5 h-5" />
                </button>
            </form>
          </div>
          
          {status !== TicketStatus.RESOLVED && status !== TicketStatus.AI_RESOLVED && (
            <div className="text-center pt-8 border-t border-slate-200">
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