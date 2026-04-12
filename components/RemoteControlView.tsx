import React, { useState, useRef, useEffect } from 'react';
import Peer from 'simple-peer';

import { RecordedAction, Solution } from '../types';
import { SaveSolutionModal } from './SaveSolutionModal';
import { useToast } from '../services/ToastContext';

interface RemoteControlViewProps {
    ticketId?: string;
}

export const RemoteControlView: React.FC<RemoteControlViewProps> = ({ ticketId }) => {
    const { addToast } = useToast();
    const [offer, setOffer] = useState('');
    const [answer, setAnswer] = useState('');
    const [isPolling, setIsPolling] = useState(false);

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
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedActions, setRecordedActions] = useState<RecordedAction[]>([]);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const peerRef = useRef<Peer.Instance | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const viewRef = useRef<HTMLDivElement>(null);

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
             <div ref={viewRef} tabIndex={0} className="w-full h-full bg-gray-900 text-white flex flex-col items-center justify-center focus:outline-none">
                <h2 className="text-2xl font-bold mb-4">Remote Control Session Active</h2>
                <p className="text-sm text-gray-400 mb-2">(Your mouse and keyboard are now controlling the remote machine)</p>
                <video ref={videoRef} autoPlay className="w-full max-w-5xl aspect-video bg-black cursor-crosshair" />
                <div className="mt-4">
                    <button
                        onClick={() => {
                            if (isRecording) {
                                setIsSaveModalOpen(true);
                                setIsRecording(false); // Stop recording when opening save modal
                            } else {
                                setRecordedActions([]); // Clear old actions before starting
                                setIsRecording(true);
                            }
                        }}
                        className={`px-4 py-2 rounded font-semibold ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                        {isRecording ? 'Stop Recording Solution' : 'Start Recording Solution'}
                    </button>
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
                )}
            </div>
        </div>
    );
};
