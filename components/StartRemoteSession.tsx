import React, { useState, useRef, useEffect } from 'react';
import Peer from 'simple-peer';

export const StartRemoteSession: React.FC = () => {
    const [offer, setOffer] = useState('');
    const [answer, setAnswer] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const peerRef = useRef<Peer.Instance | null>(null);

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

            peer.on('signal', (data) => {
                setOffer(JSON.stringify(data));
            });

            peer.on('connect', () => {
                setIsConnected(true);
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
                // TODO: Replace with a more robust notification system
                alert('Connection error: ' + err.message);
                setIsConnected(false);
            });

            peerRef.current = peer;

        } catch (error) {
            console.error("Error generating offer:", error);
            // TODO: Replace with a more robust notification system
            alert("Could not start remote session: " + (error as Error).message);
        }
    };

    const handleConnect = () => {
        if (peerRef.current && answer) {
            try {
                peerRef.current.signal(JSON.parse(answer));
            } catch (error) {
                // TODO: Replace with a more robust notification system
                alert("Invalid answer format. Please ensure you've copied it correctly.");
                console.error("Error signaling answer:", error);
            }
        }
    };

    return (
        <div className="p-8 font-sans">
            <h1 className="text-2xl font-bold mb-4">Start Remote Support Session</h1>

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
                        {offer && (
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
                    </div>

                    {offer && (
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
