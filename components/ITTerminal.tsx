
import React, { useState, useRef, useEffect } from 'react';
import { Card } from './common/Card';

export const ITTerminal: React.FC = () => {
    const [history, setHistory] = useState<{ cmd: string, output: string, error?: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isScriptLibraryOpen, setIsScriptLibraryOpen] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const SCRIPT_LIBRARY = [
        { name: 'Network Health Check', cmd: 'ping -c 4 google.com', description: 'Checks internet connectivity' },
        { name: 'System Uptime', cmd: 'uptime', description: 'Shows how long the system has been running' },
        { name: 'Memory Usage', cmd: 'free -m', description: 'Displays free and used memory in MB' },
        { name: 'Disk Space', cmd: 'df -h', description: 'Shows disk space usage' },
        { name: 'Check DNS', cmd: 'netstat -nr', description: 'Display routing tables' },
        { name: 'Current User', cmd: 'whoami', description: 'Shows the current logged in user' }
    ];

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleExecute = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const cmd = input.trim();
        setInput('');
        setIsLoading(true);

        try {
            const result = await window.electronAPI.executeCommand([cmd]);
            setHistory(prev => [...prev, { cmd, output: result.stdout, error: result.stderr }]);
        } catch (err) {
            setHistory(prev => [...prev, { cmd, output: '', error: 'Execution failed.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunScript = (cmd: string) => {
        setInput(cmd);
        setIsScriptLibraryOpen(false);
    };

    return (
        <Card className="flex flex-col h-[500px] bg-slate-950 border-slate-800 text-green-500 font-mono text-sm overflow-hidden relative">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-2">Secure IT Terminal</span>
                </div>
                <button
                    onClick={() => setIsScriptLibraryOpen(!isScriptLibraryOpen)}
                    className="text-[10px] font-bold text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded transition-colors flex items-center gap-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                    Script Library
                </button>
            </div>

            {isScriptLibraryOpen && (
                <div className="absolute top-10 right-4 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-slate-700 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Pre-Approved Scripts</span>
                        <button onClick={() => setIsScriptLibraryOpen(false)} className="text-slate-500 hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                        {SCRIPT_LIBRARY.map((script, i) => (
                            <button
                                key={i}
                                onClick={() => handleRunScript(script.cmd)}
                                className="w-full text-left p-2 hover:bg-slate-800 rounded transition-colors group"
                            >
                                <div className="text-xs font-bold text-slate-300 group-hover:text-brand-primary">{script.name}</div>
                                <div className="text-[10px] text-slate-500 truncate">{script.description}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                <div className="text-slate-500 mb-4">
                    # FixDesk Secure Shell v1.0.0
                    <br />
                    # Allowed commands: ping, netstat, uptime, whoami, df, free, etc.
                </div>
                {history.map((entry, i) => (
                    <div key={i} className="space-y-1">
                        <div className="flex gap-2">
                            <span className="text-blue-400 font-bold">admin@fixdesk:~$</span>
                            <span className="text-white">{entry.cmd}</span>
                        </div>
                        {entry.output && <div className="text-slate-300 whitespace-pre-wrap pl-4">{entry.output}</div>}
                        {entry.error && <div className="text-red-400 whitespace-pre-wrap pl-4 italic">{entry.error}</div>}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-2 animate-pulse">
                        <span className="text-blue-400 font-bold">admin@fixdesk:~$</span>
                        <span className="w-2 h-4 bg-green-500"></span>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleExecute} className="p-4 bg-slate-900/50 border-t border-slate-800 flex gap-2">
                <span className="text-blue-400 font-bold">admin@fixdesk:~$</span>
                <input
                    autoFocus
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-white font-mono"
                    placeholder="Enter whitelisted command..."
                />
            </form>
        </Card>
    );
};
