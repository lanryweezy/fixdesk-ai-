import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './common/Card';
import { useToast } from '../services/ToastContext';
import {
    ShieldCheckIcon,
    DocumentArrowDownIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    SpinnerIcon,
    FunnelIcon
} from './icons/Icons';

export const SecurityAuditCenter: React.FC = () => {
    const { addToast } = useToast();
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOutcome, setFilterOutcome] = useState<'All' | 'Success' | 'Failure' | 'Blocked'>('All');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const fetched = await window.electronAPI.getAuditLogs();
            setLogs(fetched);
        } catch (e) {
            addToast('Failed to load audit logs', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = log.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 log.user.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesOutcome = filterOutcome === 'All' || log.outcome === filterOutcome;
            return matchesSearch && matchesOutcome;
        });
    }, [logs, searchTerm, filterOutcome]);

    const handleExport = async () => {
        try {
            const success = await window.electronAPI.exportAuditReport();
            if (success) addToast('SOC2 Audit Report exported successfully', 'success');
        } catch (e) {
            addToast('Export failed', 'error');
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        Security & Audit Center
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-lg">SOC2 Compliant</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Monitor all system-level activities and security enforcement logs.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all active:scale-95"
                >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    Export Compliance Report
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20">
                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Total Audited Events</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white">{logs.length}</p>
                </Card>
                <Card className="bg-amber-50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/20">
                    <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Security Blocks</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white">{logs.filter(l => l.outcome === 'Blocked').length}</p>
                </Card>
                <Card className="bg-indigo-50 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/20">
                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Active Whitelist</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white">15 Commands</p>
                </Card>
            </div>

            <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-800">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by command or user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <FunnelIcon className="h-4 w-4 text-slate-400" />
                        <select
                            value={filterOutcome}
                            onChange={(e) => setFilterOutcome(e.target.value as any)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none"
                        >
                            <option value="All">All Outcomes</option>
                            <option value="Success">Success Only</option>
                            <option value="Failure">Failures Only</option>
                            <option value="Blocked">Blocked Only</option>
                        </select>
                        <button
                            onClick={fetchLogs}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Operator</th>
                                <th className="px-6 py-4">Instruction / Command</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Policy Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <SpinnerIcon className="w-8 h-8 text-brand-primary animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                    {log.user.charAt(0)}
                                                </div>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{log.user}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300 font-mono break-all">
                                                {log.command}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                                                log.outcome === 'Success' ? 'bg-emerald-100 text-emerald-700' :
                                                log.outcome === 'Blocked' ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                <div className={`w-1 h-1 rounded-full ${
                                                    log.outcome === 'Success' ? 'bg-emerald-500' :
                                                    log.outcome === 'Blocked' ? 'bg-red-500' :
                                                    'bg-amber-500'
                                                }`}></div>
                                                {log.outcome}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[10px] text-slate-500 italic max-w-[200px] truncate">
                                                {log.reason || (log.outcome === 'Success' ? 'Approved by AIOps Policy' : '-')}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic text-sm">
                                        No audit records found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <ShieldCheckIcon className="w-6 h-6 text-emerald-400" />
                            Immutable Compliance Guard
                        </h3>
                        <p className="text-sm text-slate-400 max-w-xl">
                            All command logs are cryptographically hashed and stored in your workspace's secure volume.
                            This center provides a real-time view of SOC2 compliance and security enforcement.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            Log Rotation: 365 Days
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            PII Scrubbing: Active
                        </div>
                    </div>
                </div>
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500 opacity-5 blur-[100px] group-hover:opacity-10 transition-opacity"></div>
            </div>
        </div>
    );
};
