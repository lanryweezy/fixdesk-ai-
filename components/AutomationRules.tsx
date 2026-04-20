import React, { useState, useEffect } from 'react';
import { AutomationRule, AutomationTrigger, AutomationAction } from '../types';
import { Card } from './common/Card';
import { useToast } from '../services/ToastContext';
import {
    Cog8ToothIcon,
    PlusIcon,
    XCircleIcon,
    SpinnerIcon,
    PlayIcon,
    TrashIcon,
    ShieldCheckIcon,
    BoltIcon,
    ChatBubbleBottomCenterTextIcon
} from './icons/Icons';

export const AutomationRules: React.FC = () => {
    const { addToast } = useToast();
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Rule State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [trigger, setTrigger] = useState<AutomationTrigger>('TICKET_CREATED');
    const [conditions, setConditions] = useState<{ field: string, operator: any, value: string }[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setIsLoading(true);
        try {
            const fetched = await window.electronAPI.getAutomationRules();
            setRules(fetched);
        } catch (e) {
            addToast('Failed to load automation rules', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleRule = async (rule: AutomationRule) => {
        try {
            const updated = { ...rule, isEnabled: !rule.isEnabled };
            await window.electronAPI.updateAutomationRule(updated);
            setRules(prev => prev.map(r => r.id === rule.id ? updated : r));
            addToast(`Rule ${updated.isEnabled ? 'enabled' : 'disabled'}`, 'success');
        } catch (e) {
            addToast('Failed to update rule', 'error');
        }
    };

    const handleDeleteRule = async (id: string) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        try {
            await window.electronAPI.deleteAutomationRule(id);
            setRules(prev => prev.filter(r => r.id !== id));
            addToast('Rule deleted', 'success');
        } catch (e) {
            addToast('Failed to delete rule', 'error');
        }
    };

    const handleCreateRule = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            const newRule: Omit<AutomationRule, 'id' | 'executionCount'> = {
                name,
                description,
                trigger,
                isEnabled: true,
                workspaceId: 'DEFAULT',
                conditions: conditions.map(c => ({
                    field: c.field,
                    operator: c.operator,
                    value: c.field === 'diskUsage' || c.field === 'cpuUsage' || c.field === 'memUsage' ? Number(c.value) : c.value
                })),
                actions: [
                    { type: 'POST_NOTE', params: { message: `AI: Automation rule "${name}" triggered.` } }
                ]
            };
            const created = await window.electronAPI.createAutomationRule(newRule);
            setRules(prev => [created, ...prev]);
            setIsModalOpen(false);
            setName('');
            setDescription('');
            setConditions([]);
            addToast('Automation rule created', 'success');
        } catch (e) {
            addToast('Failed to create rule', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        Automation Rules
                        <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase rounded-lg">AIOps Engine</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Define logic to automate repetitive IT tasks and system remediation.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-brand-primary/25 transition-all active:scale-95"
                >
                    <PlusIcon className="w-5 h-5" />
                    Create Rule
                </button>
            </header>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <SpinnerIcon className="w-12 h-12 text-brand-primary animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Engine Configuration...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {rules.map((rule) => (
                        <Card key={rule.id} className={`p-6 border-l-4 transition-all ${rule.isEnabled ? 'border-l-brand-primary' : 'border-l-slate-300 opacity-60'}`}>
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{rule.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                            rule.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {rule.isEnabled ? 'Active' : 'Paused'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{rule.description}</p>

                                    <div className="flex flex-wrap gap-6 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trigger Mechanism</span>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                                                <BoltIcon className="w-3.5 h-3.5 text-brand-primary" />
                                                {rule.trigger.replace('_', ' ')}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-Executions</span>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded-lg border border-brand-primary/10">
                                                <PlayIcon className="w-3.5 h-3.5" />
                                                {rule.executionCount} Hits
                                            </div>
                                        </div>
                                        {rule.lastExecutedAt && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Remediation</span>
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                                                    {new Date(rule.lastExecutedAt).toLocaleString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleToggleRule(rule)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                            rule.isEnabled
                                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            : 'bg-brand-primary text-white hover:bg-brand-secondary shadow-lg shadow-brand-primary/20'
                                        }`}
                                    >
                                        {rule.isEnabled ? 'Pause Rule' : 'Resume Rule'}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRule(rule.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {rules.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                                <BoltIcon className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No automation rules defined</h3>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">Start by creating a rule to automate your workspace operations.</p>
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Create Automation Rule</h3>
                                <p className="text-xs font-medium text-slate-500">Logic for autonomous IT operations.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rule Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Critical Ticket Auto-Escalation"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all text-slate-800 dark:text-slate-100 font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder="What does this rule automate?"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all text-slate-800 dark:text-slate-100 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Trigger Event</label>
                                <select
                                    value={trigger}
                                    onChange={(e) => {
                                        setTrigger(e.target.value as AutomationTrigger);
                                        setConditions([]); // Reset conditions when trigger changes
                                    }}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all text-slate-800 dark:text-slate-100 font-bold"
                                >
                                    <option value="TICKET_CREATED">When a ticket is created</option>
                                    <option value="SYSTEM_METRIC_THRESHOLD">When system metrics exceed thresholds</option>
                                </select>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Conditions</label>
                                    <button
                                        onClick={() => setConditions([...conditions, { field: trigger === 'TICKET_CREATED' ? 'title' : 'cpuUsage', operator: 'equals', value: '' }])}
                                        className="text-[10px] font-black text-brand-primary uppercase hover:underline"
                                    >
                                        + Add Condition
                                    </button>
                                </div>

                                {conditions.map((cond, idx) => (
                                    <div key={idx} className="flex gap-2 items-center animate-in slide-in-from-right-2">
                                        <select
                                            value={cond.field}
                                            onChange={(e) => {
                                                const newConds = [...conditions];
                                                newConds[idx].field = e.target.value;
                                                setConditions(newConds);
                                            }}
                                            className="flex-1 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                                        >
                                            {trigger === 'TICKET_CREATED' ? (
                                                <>
                                                    <option value="title">Title</option>
                                                    <option value="description">Description</option>
                                                    <option value="sentiment">Sentiment</option>
                                                    <option value="priority">Priority</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="cpuUsage">CPU Usage (%)</option>
                                                    <option value="memUsage">Memory Usage (%)</option>
                                                    <option value="diskUsage">Disk Usage (%)</option>
                                                </>
                                            )}
                                        </select>
                                        <select
                                            value={cond.operator}
                                            onChange={(e) => {
                                                const newConds = [...conditions];
                                                newConds[idx].operator = e.target.value;
                                                setConditions(newConds);
                                            }}
                                            className="w-24 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                                        >
                                            <option value="equals">is</option>
                                            <option value="contains">contains</option>
                                            <option value="greater_than">&gt;</option>
                                            <option value="less_than">&lt;</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={cond.value}
                                            onChange={(e) => {
                                                const newConds = [...conditions];
                                                newConds[idx].value = e.target.value;
                                                setConditions(newConds);
                                            }}
                                            placeholder="Value"
                                            className="w-24 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                                        />
                                        <button
                                            onClick={() => setConditions(conditions.filter((_, i) => i !== idx))}
                                            className="p-1 text-slate-400 hover:text-red-500"
                                        >
                                            <XCircleIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-indigo-50 dark:bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-start gap-4">
                                <ShieldCheckIcon className="w-5 h-5 text-brand-primary mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-brand-primary uppercase tracking-wider">Default Action</p>
                                    <p className="text-[10px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                                        For this version, a status note will be automatically posted when the rule triggers. Advanced conditional logic can be configured in the JSON schema.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateRule}
                                disabled={!name.trim() || isSaving}
                                className="px-8 py-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/25 transition-all disabled:bg-slate-300 disabled:shadow-none"
                            >
                                {isSaving ? 'Creating...' : 'Activate Rule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
