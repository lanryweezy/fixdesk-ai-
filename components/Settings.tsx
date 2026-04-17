import React from 'react';
import { Card } from './common/Card';
import { Cog8ToothIcon, ShieldCheckIcon, UserIcon, BrainCircuit, SunIcon, MoonIcon } from './icons/Icons';
import { useToast } from '../services/ToastContext';

interface SettingsProps {
  role: 'staff' | 'admin';
  onRoleToggle: () => void;
  isDarkMode: boolean;
  onDarkModeToggle: () => void;
  userName: string;
  onUpdateProfile: (name: string) => void;
  activeWorkspaceId?: string;
  aiOpsPolicy?: 'autonomous' | 'manual';
  autoLaunch?: boolean;
  geminiApiKey?: string;
  onRefreshData?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ role, onRoleToggle, isDarkMode, onDarkModeToggle, userName, onUpdateProfile, activeWorkspaceId = 'DEFAULT', aiOpsPolicy = 'manual', autoLaunch = true, geminiApiKey = '', onRefreshData }) => {
    const [editName, setEditName] = React.useState(userName);
    const [editApiKey, setEditApiKey] = React.useState(geminiApiKey);
    const { addToast } = useToast();
    const [isGenerating, setIsGenerating] = React.useState(false);

    const handleWorkspaceChange = async (id: string) => {
        await window.electronAPI.updateSettings({ activeWorkspaceId: id });
        if (onRefreshData) onRefreshData();
        addToast(`Switched to workspace: ${id}`, 'success');
    };

    const handleGenerateMockData = async () => {
        setIsGenerating(true);
        try {
            await window.electronAPI.generateMockData();
            if (onRefreshData) onRefreshData();
            addToast('Mock data generated successfully (50 tickets)', 'success');
        } catch (error) {
            addToast('Failed to generate mock data', 'error');
        } finally {
            setIsGenerating(false);
        }
    };
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your application preferences and configuration.</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <UserIcon className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-slate-800">User Profile</h3>
        </div>
        <div className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Display Name</label>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                    />
                    <button
                        onClick={() => onUpdateProfile(editName)}
                        disabled={editName === userName || !editName.trim()}
                        className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold hover:bg-brand-primary/90 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                        Save
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">Persona Selection</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Choose your role to switch between Staff and IT Admin views.</p>
                </div>
                <button
                    onClick={onRoleToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${
                        role === 'admin' ? 'bg-brand-primary' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            role === 'admin' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>

            {role === 'admin' && (
                <div className="p-4 bg-indigo-50 dark:bg-brand-primary/10 rounded-xl border border-brand-primary/20">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <BrainCircuit className="w-4 h-4 text-brand-primary" />
                                Gemini AI Configuration
                            </p>
                            <p className="text-sm text-slate-500">Provide your Google AI Studio API key to enable AI features.</p>
                        </div>
                        <button
                            onClick={async () => {
                                await window.electronAPI.updateSettings({ geminiApiKey: editApiKey });
                                addToast('Gemini API key updated', 'success');
                                if (onRefreshData) onRefreshData();
                            }}
                            className="px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all"
                        >
                            Save Key
                        </button>
                    </div>
                    <input
                        type="password"
                        value={editApiKey}
                        onChange={(e) => setEditApiKey(e.target.value)}
                        placeholder="Paste your API key here..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                    <p className="mt-2 text-[10px] text-slate-400">Your key is stored locally and never sent to our servers.</p>
                </div>
            )}

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">Launch on Startup</p>
                        <p className="text-sm text-slate-500">Automatically start FixDesk AI when you log in.</p>
                    </div>
                    <button
                        onClick={async () => {
                            await window.electronAPI.updateSettings({ autoLaunch: !autoLaunch });
                            if (onRefreshData) onRefreshData();
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            autoLaunch ? 'bg-brand-primary' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                autoLaunch ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">Support & Diagnostics</p>
                    <p className="text-xs text-slate-500">Export a bundle of logs and tickets for IT support analysis.</p>
                </div>
                <button
                    onClick={async () => {
                        const success = await window.electronAPI.exportSupportBundle();
                        if (success) addToast('Support bundle exported successfully', 'success');
                    }}
                    className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors"
                >
                    Export Support Bundle
                </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">Active Workspace</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Isolate data between different companies or departments.</p>
                </div>
                <select
                    value={activeWorkspaceId}
                    onChange={(e) => handleWorkspaceChange(e.target.value)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-primary outline-none"
                >
                    <option value="DEFAULT">Default Workspace</option>
                    <option value="ACME_CORP">ACME Corp</option>
                    <option value="GLOBEX">Globex Corporation</option>
                    <option value="STARK_IND">Stark Industries</option>
                </select>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">Appearance Mode</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Toggle between Light and Dark mode for the interface.</p>
                </div>
                <button
                    onClick={onDarkModeToggle}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                >
                    {isDarkMode ? (
                        <>
                            <SunIcon className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-medium text-slate-200">Light Mode</span>
                        </>
                    ) : (
                        <>
                            <MoonIcon className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-medium text-slate-700">Dark Mode</span>
                        </>
                    )}
                </button>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className={`p-3 rounded-lg ${role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {role === 'admin' ? <ShieldCheckIcon className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
                </div>
                <div>
                    <p className="font-bold text-slate-800 capitalize">{role} Mode Active</p>
                    <p className="text-xs text-slate-500">
                        {role === 'admin'
                            ? 'You have full access to the dashboard, all tickets, and remote control tools.'
                            : 'You can report issues, track your tickets, and access self-service tools.'}
                    </p>
                </div>
            </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex items-center gap-3">
            <BrainCircuit className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">AI Configuration</h3>
        </div>
        <div className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Gemini API Key</label>
                <div className="flex gap-3">
                    <input
                        type="password"
                        value="••••••••••••••••••••••••••••••"
                        readOnly
                        className="flex-1 px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                    />
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                        Update Key
                    </button>
                </div>
                <p className="mt-2 text-xs text-slate-400">The API key is currently managed via environment variables for security.</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">Auto-Categorization</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Use AI to automatically categorize and prioritize incoming tickets.</p>
                </div>
                <div className="h-6 w-11 bg-brand-primary rounded-full flex items-center px-1">
                    <div className="h-4 w-4 bg-white rounded-full translate-x-5"></div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">AIOps Execution Policy</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Determine if self-healing actions require manual approval.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                        onClick={async () => {
                            await window.electronAPI.updateSettings({ aiOpsPolicy: 'manual' });
                            if (onRefreshData) onRefreshData();
                            addToast('AIOps Policy: Manual Approval required', 'success');
                        }}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                            aiOpsPolicy === 'manual'
                            ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        MANUAL
                    </button>
                    <button
                        onClick={async () => {
                            await window.electronAPI.updateSettings({ aiOpsPolicy: 'autonomous' });
                            if (onRefreshData) onRefreshData();
                            addToast('AIOps Policy: Fully Autonomous active', 'warning');
                        }}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                            aiOpsPolicy === 'autonomous'
                            ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        AUTONOMOUS
                    </button>
                </div>
            </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex items-center gap-3">
            <Cog8ToothIcon className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Developer Tools</h3>
        </div>
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">Mock Data Generator</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Populate the database with 50 realistic, time-distributed tickets for testing analytics.</p>
                </div>
                <button
                    onClick={handleGenerateMockData}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition-all disabled:bg-slate-300"
                >
                    {isGenerating ? 'Generating...' : 'Generate Data'}
                </button>
            </div>
        </div>
      </Card>
    </div>
  );
};
