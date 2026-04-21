
import React, { useState, useRef, useEffect } from 'react';
import { BrainCircuit } from './icons/Icons';
import { Card } from './common/Card';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export const GlobalAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    const handleCaptureScreen = async () => {
        setIsCapturing(true);
        try {
            const sources = await window.electronAPI.getScreenSources({ types: ['screen'] });
            if (sources && sources.length > 0) {
                const stream = await (navigator.mediaDevices as any).getUserMedia({
                    audio: false,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: sources[0].id,
                        }
                    }
                });

                const video = document.createElement('video');
                video.srcObject = stream;
                await video.play();

                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d')?.drawImage(video, 0, 0);

                const base64 = canvas.toDataURL('image/png');
                setScreenshot(base64);

                stream.getTracks().forEach((t: any) => t.stop());
            }
        } catch (error) {
            console.error('Failed to capture screen:', error);
        } finally {
            setIsCapturing(false);
        }
    };

    const handleSend = async () => {
        if (!message.trim() || isLoading) return;

        const userParts: any[] = [{ text: message }];
        if (screenshot) {
            userParts.push({ text: "[Screenshot attached]" });
        }

        const userMsg: Message = { role: 'user', parts: userParts };
        setChatHistory(prev => [...prev, userMsg]);
        const currentMsg = message;
        const currentScreenshot = screenshot;

        setMessage('');
        setScreenshot(null);
        setIsLoading(true);

        try {
            const response = await window.electronAPI.aiChat(currentMsg, chatHistory, currentScreenshot || undefined);
            const aiMsg: Message = { role: 'model', parts: [{ text: response }] };
            setChatHistory(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('Chat failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <Card className="w-96 h-[500px] mb-4 flex flex-col shadow-2xl border-brand-primary/20 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    <div className="p-4 bg-brand-primary text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5" />
                            <span className="font-bold">FixDesk AI Assistant</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
                        {chatHistory.length === 0 && (
                            <div className="text-center py-8">
                                <BrainCircuit className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">How can I help you today?</p>
                                <div className="mt-4 grid grid-cols-1 gap-2">
                                    {['"How do I reset my VPN?"', '"My internet is slow"', '"Help with Outlook settings"'].map(q => (
                                        <button
                                            key={q}
                                            onClick={() => setMessage(q.replace(/"/g, ''))}
                                            className="text-xs p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:border-brand-primary transition-all"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                    msg.role === 'user'
                                        ? 'bg-brand-primary text-white rounded-tr-none'
                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm'
                                }`}>
                                    <div className="prose prose-sm dark:prose-invert max-w-none prose-indigo">
                                        <ReactMarkdown>
                                            {msg.parts[0].text}
                                        </ReactMarkdown>
                                    </div>
                                    {msg.parts.length > 1 && msg.parts[1].text === "[Screenshot attached]" && (
                                        <div className="mt-2 text-[10px] uppercase font-bold opacity-50 flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm3.25-1.5a.75.75 0 00-.75.75v9.5c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-9.5a.75.75 0 00-.75-.75H3.25z" clipRule="evenodd" />
                                                <path d="M4.75 8.5a1.25 1.25 0 112.5 0 1.25 1.25 0 01-2.5 0zM12.243 8.914a1 1 0 011.414 0l2.5 2.5a1 1 0 010 1.414l-5.336 5.336a1 1 0 01-1.414 0l-4.5-4.5a1 1 0 010-1.414l5.336-5.336z" />
                                            </svg>
                                            Visual Data Attached
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
                        {screenshot && (
                            <div className="mb-2 relative w-20 h-20 group">
                                <img src={screenshot} className="w-full h-full object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                                <button
                                    onClick={() => setScreenshot(null)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={handleCaptureScreen}
                                disabled={isCapturing || isLoading}
                                className="p-2 text-slate-400 hover:text-brand-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                                title="Capture Screen"
                            >
                                {isCapturing ? (
                                    <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                    </svg>
                                )}
                            </button>
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type your message..."
                                className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none text-slate-800 dark:text-slate-100"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!message.trim() || isLoading}
                                className="p-2 bg-brand-primary text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 ${
                    isOpen ? 'bg-slate-800 rotate-90' : 'bg-brand-primary'
                }`}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <BrainCircuit className="w-7 h-7 text-white" />
                )}
                {!isOpen && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                )}
            </button>
        </div>
    );
};
