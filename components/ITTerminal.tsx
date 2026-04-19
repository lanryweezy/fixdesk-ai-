
import React, { useState, useRef, useEffect } from 'react';
import { Card } from './common/Card';

export const ITTerminal: React.FC = () => {
    const [history, setHistory] = useState<{ cmd: string, output: string, error?: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

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

    return (
        <Card className="flex flex-col h-[500px] bg-slate-950 border-slate-800 text-green-500 font-mono text-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-2">Secure IT Terminal (Whitelisted)</span>
            </div>

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
