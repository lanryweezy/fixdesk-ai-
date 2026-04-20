import React from 'react';
import { Card } from './common/Card';
import { Cog8ToothIcon, ShieldCheckIcon, UserIcon, BrainCircuit, SunIcon, MoonIcon, KeyIcon, PlusIcon, TrashIcon } from './icons/Icons';
import { useToast } from '../services/ToastContext';
import { LicenseInfo, CustomFieldDefinition } from '../types';

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
    const [isTestingSSO, setIsTestingSSO] = React.useState(false);
    const [ssoConfig, setSsoConfig] = React.useState({ discoveryUrl: '', clientId: '' });
    const [showLegal, setShowLegal] = React.useState<{ title: string, content: string } | null>(null);
    const [license, setLicense] = React.useState<LicenseInfo | null>(null);
    const [activationKey, setActivationKey] = React.useState('');
    const [isActivating, setIsActivating] = React.useState(false);
    const [customFields, setCustomFields] = React.useState<CustomFieldDefinition[]>([]);
    const [newField, setNewField] = React.useState<Partial<CustomFieldDefinition>>({ name: '', type: 'text', isRequired: false });

    React.useEffect(() => {
        loadLicense();
        loadCustomFields();
    }, [activeWorkspaceId]);

    const loadLicense = async () => {
        const info = await window.electronAPI.getLicense();
        setLicense(info);
    };

    const loadCustomFields = async () => {
        const fields = await window.electronAPI.getCustomFields();
        setCustomFields(fields);
    };

    const handleCreateCustomField = async () => {
        if (!newField.name) return;
        await window.electronAPI.createCustomField(newField as any);
        setNewField({ name: '', type: 'text', isRequired: false });
        loadCustomFields();
        addToast('Custom field created', 'success');
    };

    const handleDeleteCustomField = async (id: string) => {
        await window.electronAPI.deleteCustomField(id);
        loadCustomFields();
        addToast('Custom field removed', 'success');
    };

    const handleActivate = async () => {
        setIsActivating(true);
        const result = await window.electronAPI.activateLicense(activationKey);
        setIsActivating(false);
        if (result.success) {
            addToast('License activated successfully!', 'success');
            setLicense(result.license);
            setActivationKey('');
        } else {
            addToast(result.message, 'error');
        }
    };

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

            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className={`p-3 rounded-lg ${role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {role === 'admin' ? <ShieldCheckIcon className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
                </div>
                <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 capitalize">{role} Mode Active</p>
                    <p className="text-xs text-slate-500">
                        {role === 'admin'
                            ? 'You have full access to the dashboard, all tickets, and remote control tools.'
                            : 'You can report issues, track your tickets, and access self-service tools.'}
                    </p>
                </div>
            </div>
        </div>
      </Card>

      {role === 'admin' && (
        <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex items-center gap-3">
                <ShieldCheckIcon className="w-5 h-5 text-slate-500" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Enterprise Authentication (SSO)</h3>
            </div>
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">OIDC Discovery URL</label>
                        <input
                            type="text"
                            value={ssoConfig.discoveryUrl}
                            onChange={(e) => setSsoConfig({ ...ssoConfig, discoveryUrl: e.target.value })}
                            placeholder="https://auth.company.com/.well-known/openid-configuration"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-brand-primary outline-none text-slate-700 dark:text-slate-200"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Client ID</label>
                        <input
                            type="text"
                            value={ssoConfig.clientId}
                            onChange={(e) => setSsoConfig({ ...ssoConfig, clientId: e.target.value })}
                            placeholder="fixdesk-enterprise-client"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-brand-primary outline-none text-slate-700 dark:text-slate-200"
                        />
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 italic">SSO settings allow you to map Enterprise roles (Admin, Manager, Staff) to FixDesk permissions.</p>
                <button
                    onClick={async () => {
                        setIsTestingSSO(true);
                        const result = await window.electronAPI.testSSO(ssoConfig);
                        setIsTestingSSO(false);
                        if (result.success) addToast(result.message, 'success');
                        else addToast(result.message, 'error');
                    }}
                    disabled={isTestingSSO || !ssoConfig.discoveryUrl}
                    className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {isTestingSSO ? 'Verifying Provider...' : 'Test SSO Connection'}
                </button>
            </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex items-center gap-3">
            <BrainCircuit className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">AI Configuration</h3>
        </div>
        <div className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Gemini API Key</label>
                <div className="flex gap-3">
                    <input
                        type="password"
                        value={editApiKey ? "••••••••••••••••••••••••••••••" : ""}
                        readOnly
                        className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
                    />
                    <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                        Update Key
                    </button>
                </div>
                <p className="mt-2 text-xs text-slate-400">The API key is encrypted at rest using OS-level safeStorage.</p>
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
            <KeyIcon className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">License Management</h3>
        </div>
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">Current Status</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            license?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                            {license?.status || 'Unknown'}
                        </span>
                        <span className="text-xs text-slate-500">Expires: {license?.expiryDate ? new Date(license.expiryDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">Seats</p>
                    <p className="text-xs text-slate-500">{license?.seats || 0} Professional Seats</p>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Activation Key</label>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={activationKey}
                        onChange={(e) => setActivationKey(e.target.value)}
                        placeholder="FIX-XXXX-XXXX-XXXX"
                        className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                    <button
                        onClick={handleActivate}
                        disabled={isActivating || !activationKey.trim()}
                        className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg text-sm hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {isActivating ? 'Activating...' : 'Activate'}
                    </button>
                </div>
            </div>
        </div>
      </Card>

      {role === 'admin' && (
        <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex items-center gap-3">
                <PlusIcon className="w-5 h-5 text-slate-500" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Workspace Custom Fields</h3>
            </div>
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Field Name</label>
                        <input
                            type="text"
                            value={newField.name}
                            onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                            placeholder="e.g., Asset ID"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-brand-primary outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Type</label>
                        <select
                            value={newField.type}
                            onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-brand-primary outline-none"
                        >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 pb-2">
                        <input
                            type="checkbox"
                            checked={newField.isRequired}
                            onChange={(e) => setNewField({ ...newField, isRequired: e.target.checked })}
                            className="w-4 h-4 text-brand-primary rounded"
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Required</span>
                    </div>
                    <button
                        onClick={handleCreateCustomField}
                        disabled={!newField.name}
                        className="w-full px-4 py-2 bg-brand-primary text-white font-bold rounded-lg text-xs hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        Add Field
                    </button>
                </div>

                <div className="space-y-2">
                    {customFields.length > 0 ? (
                        customFields.map(field => (
                            <div key={field.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500">
                                        <PlusIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{field.name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-black">{field.type} • {field.isRequired ? 'Required' : 'Optional'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteCustomField(field.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center py-4 text-xs text-slate-400 italic">No custom fields defined for this workspace.</p>
                    )}
                </div>
            </div>
        </Card>
      )}

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

      <div className="pt-10 pb-20 border-t border-slate-200 dark:border-slate-800 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-2 bg-brand-primary rounded-xl shadow-lg shadow-brand-primary/20">
                    <BrainCircuit className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">FixDesk <span className="text-brand-primary">AI</span></h1>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Version 0.1.0-release (Alpha)</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                Autonomous IT Operations & Service Desk Platform.
                Built with security, privacy, and ROI at its core.
            </p>
            <div className="mt-8 flex justify-center gap-6 text-[10px] font-black text-brand-primary uppercase tracking-widest">
                <button onClick={() => setShowLegal({
                    title: 'Terms of Service',
                    content: '### FixDesk AI Terms of Service\n\n1. **License**: We grant you a non-exclusive license to use this software...\n2. **AI Usage**: You acknowledge that AI outputs should be verified by humans...\n3. **Privacy**: We do not store your data on our servers unless configured...'
                })} className="hover:underline">Terms of Service</button>
                <button onClick={() => setShowLegal({
                    title: 'Privacy Policy',
                    content: '### FixDesk AI Privacy Policy\n\n- **Data Localization**: All ticket data is stored locally in an encrypted database.\n- **Encryption**: We use OS-level safeStorage for sensitive keys.\n- **Gemini AI**: Data sent to Gemini is subject to your Google Cloud agreement.'
                })} className="hover:underline">Privacy Policy</button>
                <button onClick={() => setShowLegal({
                    title: 'Security Whitepaper',
                    content: '### Security Whitepaper Summary\n\n- **SOC2 Compliance Ready**: Full audit logs for every command.\n- **Zero Trust**: No remote access without user approval.\n- **Vulnerability Management**: Whitelisted command execution only.'
                })} className="hover:underline">Security Whitepaper</button>
            </div>
            <p className="mt-10 text-[10px] text-slate-400">© 2026 FixDesk AI. All rights reserved.</p>
      </div>

      {showLegal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-8 animate-in fade-in duration-200">
            <Card className="max-w-2xl w-full p-0 overflow-hidden shadow-2xl animate-in zoom-in-95">
                <div className="px-8 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest">{showLegal.title}</h3>
                    <button onClick={() => setShowLegal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-8 max-h-[60vh] overflow-y-auto prose dark:prose-invert">
                    <ReactMarkdown>{showLegal.content}</ReactMarkdown>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 text-right">
                    <button onClick={() => setShowLegal(null)} className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg hover:opacity-90 transition-all">
                        Close
                    </button>
                </div>
            </Card>
        </div>
      )}
    </div>
  );
};
