import React, { useState, useRef, useEffect } from 'react';
import Peer from 'simple-peer';

import { RecordedAction, Solution } from '../types';
import { SaveSolutionModal } from './SaveSolutionModal';

export const RemoteControlView: React.FC = () => {
    const [offer, setOffer] = useState('');
    const [answer, setAnswer] = useState('');
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

            peer.on('signal', (data) => {
                setAnswer(JSON.stringify(data));
            });

            peer.on('stream', (stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            });

            peer.on('connect', () => {
                setIsConnected(true);
            });

            peer.on('close', () => {
                setIsConnected(false);
                peerRef.current = null;
            });

            peer.on('error', (err) => {
                console.error('Peer connection error:', err);
                // TODO: Replace with a more robust notification system
                alert('Connection error: ' + err.message);
                setIsConnected(false);
            });

            peer.signal(JSON.parse(offer));
            peerRef.current = peer;

        } catch (error) {
            // TODO: Replace with a more robust notification system
            alert("Invalid offer format. Please ensure you've copied it correctly.");
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
            await window.electronAPI.createSolution(solutionData);
            alert('Solution saved successfully!');
        } catch (error) {
            alert(`Error saving solution: ${(error as Error).message}`);
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
            <div className="space-y-6">
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

                {answer && (
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
