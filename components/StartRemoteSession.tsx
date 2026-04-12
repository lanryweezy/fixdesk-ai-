import React, { useState, useRef, useEffect } from 'react';
import Peer from 'simple-peer';
import { useToast } from '../services/ToastContext';

interface StartRemoteSessionProps {
    ticketId?: string;
}

export const StartRemoteSession: React.FC<StartRemoteSessionProps> = ({ ticketId }) => {
    const { addToast } = useToast();
    const [offer, setOffer] = useState('');
    const [answer, setAnswer] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const peerRef = useRef<Peer.Instance | null>(null);

    useEffect(() => {
        if (ticketId && offer && !isConnected) {
            const interval = setInterval(async () => {
                const session = await window.electronAPI.getRemoteSession(ticketId);
                if (session?.answer && session.answer !== answer) {
                    setAnswer(session.answer);
                    handleConnect(session.answer);
                }
            }, 3000);
            return () => {
                clearInterval(interval);
                // Cleanup session data when component unmounts if connected
                if (isConnected) {
                    window.electronAPI.deleteRemoteSession(ticketId);
                }
            };
        }
    }, [ticketId, offer, isConnected, answer]);

    const handleGenerateOffer = async () => {
        try {
            if (!window.electronAPI) {
                throw new Error("Electron API is not available.");
            }

            const sources = await window.electronAPI.getScreenSources({ types: ['screen'] });
            const primarySource = sources[0];

            if (!primarySource) {
                throw new Error("No screen to share was found.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: primarySource.id,
                    }
                } as any,
            });

            const peer = new Peer({
                initiator: true,
                trickle: false, // For easier manual copy-paste
                stream: stream,
            });

            peer.on('signal', async (data) => {
                const offerStr = JSON.stringify(data);
                setOffer(offerStr);
                if (ticketId) {
                    await window.electronAPI.upsertRemoteSession({ ticketId, offer: offerStr, updatedAt: new Date().toISOString() });
                    addToast('Offer published to IT support', 'success');
                }
            });

            peer.on('connect', () => {
                setIsConnected(true);
                addToast('IT Admin connected to your session', 'success');
                if (ticketId) {
                    window.electronAPI.deleteRemoteSession(ticketId);
                }
            });

            peer.on('data', (data) => {
                const command = JSON.parse(data);
                window.electronAPI.send(command.channel, command.payload);
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

            peerRef.current = peer;

        } catch (error) {
            console.error("Error generating offer:", error);
            addToast("Could not start remote session: " + (error as Error).message, 'error');
        }
    };

    const handleConnect = (answerStr?: string) => {
        const finalAnswer = answerStr || answer;
        if (peerRef.current && finalAnswer) {
            try {
                peerRef.current.signal(JSON.parse(finalAnswer));
            } catch (error) {
                addToast("Invalid answer format. Please ensure you've copied it correctly.", 'error');
                console.error("Error signaling answer:", error);
            }
        }
    };

    return (
        <div className="p-8 font-sans">
            <h1 className="text-2xl font-bold mb-4">Start Remote Support Session</h1>
            {ticketId && (
                <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-700">
                    <p className="font-semibold">Session for Ticket: {ticketId}</p>
                </div>
            )}

            {!isConnected ? (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold">Step 1: Generate Session Offer</h2>
                        <button
                            onClick={handleGenerateOffer}
                            disabled={!!offer}
                            className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
                        >
                            Start Sharing & Generate Offer
                        </button>
                        {offer && !ticketId && (
                            <div className="mt-4">
                                <p className="text-sm text-gray-600">Copy this offer and send it to your IT admin:</p>
                                <textarea
                                    readOnly
                                    value={offer}
                                    className="w-full h-32 p-2 mt-1 border rounded bg-gray-100"
                                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                                />
                            </div>
                        )}
                        {offer && ticketId && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-700">The offer has been automatically shared with IT support. Please wait for an admin to connect.</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <SpinnerIcon className="w-4 h-4 animate-spin text-yellow-600" />
                                    <span className="text-xs font-medium text-yellow-600">Waiting for connection...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {offer && !ticketId && (
                         <div>
                            <h2 className="text-lg font-semibold">Step 2: Paste Admin's Answer</h2>
                             <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                className="w-full h-32 p-2 mt-1 border rounded"
                                placeholder="Paste the answer from your admin here..."
                            />
                            <button
                                onClick={handleConnect}
                                disabled={!answer}
                                className="mt-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
                            >
                                Establish Connection
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-6 bg-green-100 border-l-4 border-green-500 text-green-700">
                    <h2 className="font-bold text-lg">Session Active</h2>
                    <p>An admin is now connected to your machine. The session will end when this window is closed.</p>
                </div>
            )}
        </div>
    );
};
