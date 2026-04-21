import React, { useState, useRef, useEffect } from 'react';
import Peer from 'simple-peer';

import { RecordedAction, Solution } from '../types';
import { SaveSolutionModal } from './SaveSolutionModal';
import { useToast } from '../services/ToastContext';
import { SpinnerIcon } from './icons/Icons';

interface RemoteControlViewProps {
    ticketId?: string;
}

export const RemoteControlView: React.FC<RemoteControlViewProps> = ({ ticketId }) => {
    const { addToast } = useToast();
    const [offer, setOffer] = useState('');
    const [answer, setAnswer] = useState('');
    const [isPolling, setIsPolling] = useState(false);

    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (ticketId && !isConnected && !offer) {
            setIsPolling(true);
            const interval = setInterval(async () => {
                const session = await window.electronAPI.getRemoteSession(ticketId);
                if (session?.offer) {
                    setOffer(session.offer);
                    addToast('Received remote session offer', 'success');
                    clearInterval(interval);
                    setIsPolling(false);
                }
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [ticketId, isConnected, offer]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedActions, setRecordedActions] = useState<RecordedAction[]>([]);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

    const peerRef = useRef<Peer.Instance | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const viewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ticketId && !isConnected && !offer) {
            setIsPolling(true);
            const interval = setInterval(async () => {
                const session = await window.electronAPI.getRemoteSession(ticketId);
                if (session?.offer) {
                    setOffer(session.offer);
                    addToast('Received remote session offer', 'success');
                    clearInterval(interval);
                    setIsPolling(false);
                }
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [ticketId, isConnected, offer]);

    const handleAcceptOffer = () => {
        try {
            const peer = new Peer({
                initiator: false,
                trickle: false,
            });

            peer.on('signal', async (data) => {
                const answerStr = JSON.stringify(data);
                setAnswer(answerStr);
                if (ticketId) {
                    await window.electronAPI.upsertRemoteSession({ ticketId, answer: answerStr, updatedAt: new Date().toISOString() });
                    addToast('Answer sent to user', 'success');
                }
            });

            peer.on('stream', (stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            });

            peer.on('connect', () => {
                setIsConnected(true);
                addToast('Connected to user screen', 'success');
            });

            peer.on('close', () => {
                setIsConnected(false);
                peerRef.current = null;
            });

            peer.on('error', (err) => {
                console.error('Peer connection error:', err);
                addToast('Connection error: ' + err.message, 'error');
                setIsConnected(false);
            });

            peer.signal(JSON.parse(offer));
            peerRef.current = peer;

        } catch (error) {
            addToast("Invalid offer format. Please ensure you've copied it correctly.", 'error');
            console.error("Error accepting offer:", error);
        }
    };

    const sendCommand = (channel: string, payload: any) => {
        if (peerRef.current && isConnected) {
            peerRef.current.send(JSON.stringify({ channel, payload }));
            if (isRecording) {
                const actionType = channel.replace('robot-', '');
                if (actionType === 'move' || actionType === 'click' || actionType === 'key') {
                    setRecordedActions(prev => [...prev, { type: actionType, payload }]);
                }
            }
        }
    };

    useEffect(() => {
        const view = viewRef.current;
        if (!view || !isConnected) return;

        const handleMouseMove = (e: MouseEvent) => {
            const { left, top, width, height } = view.getBoundingClientRect();
            const x = (e.clientX - left) / width;
            const y = (e.clientY - top) / height;
            sendCommand('robot-mouse-move', { x, y });
        };

        const handleClick = () => {
            sendCommand('robot-mouse-click', null);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            sendCommand('robot-key-tap', e.key);
        };

        view.addEventListener('mousemove', handleMouseMove);
        view.addEventListener('click', handleClick);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            view.removeEventListener('mousemove', handleMouseMove);
            view.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isConnected]);

    const handleSaveSolution = async (solutionData: Omit<Solution, 'id'>) => {
        try {
            const finalSolutionData = {
                ...solutionData,
                problemDescription: ticketId ? `[Ticket: ${ticketId}] ${solutionData.problemDescription}` : solutionData.problemDescription
            };
            await window.electronAPI.createSolution(finalSolutionData);
            addToast('Solution saved successfully!', 'success');
        } catch (error) {
            addToast(`Error saving solution: ${(error as Error).message}`, 'error');
        }
        setRecordedActions([]);
    };

    if (isConnected) {
        return (
             <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500">
                <header className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                         <div className="relative">
                            <div className="absolute inset-0 bg-red-500 blur-md opacity-20 rounded-full animate-pulse"></div>
                            <div className="relative p-2 bg-red-500 rounded-lg">
                                <VideoCameraIcon className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Live Remote Session</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controlling Remote Machine</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                         <button
                            onClick={() => {
                                if (isRecording) {
                                    setIsSaveModalOpen(true);
                                    setIsRecording(false);
                                } else {
                                    setRecordedActions([]);
                                    setIsRecording(true);
                                }
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                isRecording
                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-red-500'
                            }`}
                        >
                            {isRecording ? <StopIcon className="w-4 h-4" /> : <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>}
                            {isRecording ? 'Stop Recording' : 'Record Solution'}
                        </button>

                        <button
                            onClick={() => {
                                if (peerRef.current) peerRef.current.destroy();
                                setIsConnected(false);
                            }}
                            className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-all"
                        >
                            End Session
                        </button>
                    </div>
                </header>

                <div
                    ref={viewRef}
                    tabIndex={0}
                    className="flex-1 bg-slate-950 rounded-3xl overflow-hidden relative shadow-2xl ring-1 ring-white/10 group focus:outline-none"
                >
                    <video ref={videoRef} autoPlay className="w-full h-full object-contain cursor-none" />

                    {/* Visual Overlay for Recording */}
                    {isRecording && (
                        <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Recording Actions ({recordedActions.length})</span>
                        </div>
                    )}

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold text-white/60 uppercase tracking-widest">
                            Mouse & Keyboard Captured
                        </div>
                    </div>
                </div>

                {isSaveModalOpen && (
                    <SaveSolutionModal
                        actions={recordedActions}
                        onClose={() => setIsSaveModalOpen(false)}
                        onSave={handleSaveSolution}
                    />
                )}
            </div>
        )
    }

    return (
        <div className="p-8 font-sans">
            <h1 className="text-2xl font-bold mb-4">Accept Remote Session</h1>
            {ticketId && (
                <div className="mb-6 p-4 bg-purple-50 border-l-4 border-purple-400 text-purple-700">
                    <p className="font-semibold">Assisting with Ticket: {ticketId}</p>
                </div>
            )}
            {isPolling && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
                    <SpinnerIcon className="w-5 h-5 animate-spin text-yellow-600" />
                    <p className="text-sm text-yellow-700 font-medium">Waiting for user to start sharing their screen...</p>
                </div>
            )}
            <div className="space-y-6">
                {!ticketId && (
                    <div>
                        <h2 className="text-lg font-semibold">Step 1: Paste User's Offer</h2>
                        <textarea
                            value={offer}
                            onChange={(e) => setOffer(e.target.value)}
                            className="w-full h-32 p-2 mt-1 border rounded"
                            placeholder="Paste the offer from the user here..."
                        />
                        <button
                            onClick={handleAcceptOffer}
                            disabled={!offer || !!answer}
                            className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
                        >
                            Accept & Generate Answer
                        </button>
                    </div>
                )}
                {ticketId && offer && !isConnected && !answer && (
                    <div>
                         <button
                            onClick={handleAcceptOffer}
                            className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
                        >
                            Connect to User's Screen
                        </button>
                    </div>
                )}

                {answer && !ticketId && (
                    <div>
                        <h2 className="text-lg font-semibold">Step 2: Send Answer to User</h2>
                        <p className="text-sm text-gray-600">Copy this answer and send it back to the user:</p>
                        <textarea
                            readOnly
                            value={answer}
                            className="w-full h-32 p-2 mt-1 border rounded bg-gray-100"
                            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                        />
                    </div>

                    {isPolling ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-10">
                            <SpinnerIcon className="w-10 h-10 text-brand-primary animate-spin" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">Waiting for User</p>
                                <p className="text-xs text-slate-500">FixDesk is listening for a screen share signal from the employee.</p>
                            </div>
                        </div>
                    ) : !offer ? (
                         <div className="space-y-4 flex-1">
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                If the user is not using a ticket-linked session, paste their connection offer string below to initiate.
                            </p>
                            <textarea
                                value={offer}
                                onChange={(e) => setOffer(e.target.value)}
                                className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-[10px] focus:ring-2 focus:ring-brand-primary outline-none transition-all resize-none"
                                placeholder="Paste user offer here..."
                            />
                             <button
                                onClick={handleAcceptOffer}
                                disabled={!offer}
                                className="w-full py-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/25 transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none"
                            >
                                Process Manual Offer
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-10">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                                <DocumentCheckIcon className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Offer Received</p>
                                <p className="text-xs text-slate-500">The connection offer has been captured and is ready to establish.</p>
                            </div>
                            <button
                                onClick={handleAcceptOffer}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
                            >
                                Connect to User
                            </button>
                        </div>
                    )}
                </Card>

                <Card className="flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">
                            <ShieldCheckIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">2. Security Bridge</h2>
                    </div>

                    {answer ? (
                         <div className="space-y-4 animate-in fade-in duration-500 flex-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Response Bridge String</p>
                            <textarea
                                readOnly
                                value={answer}
                                className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-[10px] text-slate-500 resize-none focus:outline-none"
                                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                            />
                            {ticketId ? (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                     <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold leading-relaxed">
                                        The response has been automatically synchronized via the workspace hub. The user's client will establish the connection shortly.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                     <p className="text-[11px] text-slate-500 italic font-medium">
                                        Copy the string above and provide it back to the user to complete the P2P handshake.
                                    </p>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(answer);
                                            addToast('Copied to clipboard', 'success');
                                        }}
                                        className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all text-xs"
                                    >
                                        Copy Response String
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-40">
                            <ShieldCheckIcon className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-sm font-medium text-slate-400">Response string will be generated after processing the offer.</p>
                        </div>
                    )}
                </Card>
            </div>

            <Card className="bg-slate-50 dark:bg-slate-900/50 border-dashed border-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Technical Compliance Notice</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    This remote session is end-to-end encrypted. By establishing this connection, you are responsible for following company privacy policies. All keyboard and mouse actions can be recorded into a Knowledge Base solution for future reference. Please ensure no sensitive personal information is visible during the session.
                </p>
            </Card>
        </div>
    );
};
