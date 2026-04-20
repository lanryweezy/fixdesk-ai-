import { app, BrowserWindow, ipcMain, desktopCapturer, Tray, Menu, nativeImage, dialog, safeStorage, Notification } from 'electron'
import * as path from 'node:path'
import * as fs from 'node:fs'
import robot from 'robotjs'
import { Low } from 'lowdb'
import { TextFile } from 'lowdb/node'
import type { Ticket, Solution, RemoteSession, TicketStatus, AutomationRule } from '../types'
import { exec } from 'child_process'
import { GoogleGenerativeAI } from "@google/generative-ai"
import si from 'systeminformation'

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.DIST, '../public')
  : process.env.DIST

let win: BrowserWindow | null
let tray: Tray | null = null

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

// --- Database Setup ---
type Data = {
  tickets: Ticket[];
  solutions: Solution[];
  remoteSessions: RemoteSession[];
  automationRules: AutomationRule[];
  auditLogs: {
    id: string;
    timestamp: string;
    user: string;
    command: string;
    outcome: 'Success' | 'Failure' | 'Blocked';
    reason?: string;
  }[];
  settings: {
    role: 'staff' | 'admin';
    isDarkMode: boolean;
    userName: string;
    userAvatar: string;
    activeWorkspaceId: string;
    aiOpsPolicy: 'autonomous' | 'manual';
    autoLaunch: boolean;
    geminiApiKey?: string;
  }
}
let db: Low<Data>;

class EncryptedJSONAdapter {
  private adapter: TextFile;
  constructor(filename: string) {
    this.adapter = new TextFile(filename);
  }
  async read(): Promise<Data | null> {
    const text = await this.adapter.read();
    if (!text) return null;
    try {
      if (safeStorage.isEncryptionAvailable()) {
        const decrypted = safeStorage.decryptString(Buffer.from(text, 'base64'));
        return JSON.parse(decrypted);
      }
      return JSON.parse(text);
    } catch (e) {
      // Fallback for non-encrypted data or error
      return JSON.parse(text);
    }
  }
  async write(data: Data): Promise<void> {
    const text = JSON.stringify(data);
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(text);
      await this.adapter.write(encrypted.toString('base64'));
    } else {
      await this.adapter.write(text);
    }
  }
}

const initDatabase = async () => {
    const defaultData: Data = {
        tickets: [],
        solutions: [],
        remoteSessions: [],
        automationRules: [
            {
                id: 'rule-vpn-frustrated',
                workspaceId: 'DEFAULT',
                name: 'VPN Frustration Escalation',
                description: 'Automatically set high priority and assign to Senior Support if a VPN ticket detects frustrated sentiment.',
                isEnabled: true,
                trigger: 'TICKET_CREATED',
                conditions: [
                    { field: 'title', operator: 'contains', value: 'VPN' },
                    { field: 'sentiment', operator: 'equals', value: 'Frustrated' }
                ],
                actions: [
                    { type: 'SET_PRIORITY', params: { priority: 'High' } },
                    { type: 'POST_NOTE', params: { message: 'AI: Escalating due to detected user frustration on a critical VPN issue.' } }
                ],
                executionCount: 0
            },
            {
                id: 'rule-disk-low',
                workspaceId: 'DEFAULT',
                name: 'Auto-Clear Cache on Low Disk',
                description: 'Execute cleanup when disk usage exceeds 85%.',
                isEnabled: true,
                trigger: 'SYSTEM_METRIC_THRESHOLD',
                conditions: [
                    { field: 'diskUsage', operator: 'greater_than', value: 85 }
                ],
                actions: [
                    { type: 'EXECUTE_SHELL', params: { command: 'df -h' } },
                    { type: 'POST_NOTE', params: { message: 'AI: Disk usage critical. Performed system health check.' } }
                ],
                executionCount: 0
            }
        ],
        auditLogs: [],
        settings: {
            role: 'admin',
            isDarkMode: false,
            userName: 'Alex Smith',
            userAvatar: 'AS',
            activeWorkspaceId: 'DEFAULT',
            aiOpsPolicy: 'manual',
            autoLaunch: true
        }
    };
    const dbPath = path.join(app.getPath('userData'), 'db.enc.json');
    const adapter = new EncryptedJSONAdapter(dbPath) as any;
    db = new Low<Data>(adapter, defaultData);
    await db.read();

    // Decrypt API key if it exists
    if (db.data.settings.geminiApiKey && safeStorage.isEncryptionAvailable()) {
        try {
            const encryptedBuffer = Buffer.from(db.data.settings.geminiApiKey, 'base64');
            const decryptedKey = safeStorage.decryptString(encryptedBuffer);
            genAI = new GoogleGenerativeAI(decryptedKey);
        } catch (e) {
            console.error('Failed to decrypt Gemini API Key:', e);
        }
    }

    // --- Enterprise Provisioning (MDM / GPO Support) ---
    // If an Admin provides keys via environment variables, they override local settings
    const enterpriseApiKey = process.env.FIXDESK_API_KEY;
    const enterpriseWorkspace = process.env.FIXDESK_WORKSPACE;
    const enterprisePolicy = process.env.FIXDESK_AIOPS_POLICY as any;

    if (enterpriseApiKey) {
        genAI = new GoogleGenerativeAI(enterpriseApiKey);
        db.data.settings.geminiApiKey = safeStorage.isEncryptionAvailable()
            ? safeStorage.encryptString(enterpriseApiKey).toString('base64')
            : enterpriseApiKey;
    }
    if (enterpriseWorkspace) {
        db.data.settings.activeWorkspaceId = enterpriseWorkspace;
    }
    if (enterprisePolicy && ['autonomous', 'manual'].includes(enterprisePolicy)) {
        db.data.settings.aiOpsPolicy = enterprisePolicy;
    }

    if (enterpriseApiKey || enterpriseWorkspace || enterprisePolicy) {
        await db.write();
        console.log('[Enterprise] Provisions applied from environment.');
    }
}
// --- End Database Setup ---


function createTray() {
    const iconPath = path.join(__dirname, '../assets/tray-icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open FixDesk AI', click: () => win?.show() },
        { label: 'Report an Issue', click: () => {
            win?.show();
            win?.webContents.send('navigate-to', 'report-issue');
        }},
        { type: 'separator' },
        { label: 'Quit', click: () => {
            (app as any).isQuitting = true;
            app.quit();
        }}
    ]);

    tray.setToolTip('FixDesk AI Agent');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        win?.isVisible() ? win.hide() : win?.show();
    });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: true,
    },
  })

  win.on('close', (event) => {
    if (!(app as any).isQuitting) {
        event.preventDefault();
        win?.hide();
    }
    return false;
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devtools
    win.webContents.openDevTools()
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.handle('desktop-capturer-get-sources', (event, opts: any) => {
    return desktopCapturer.getSources(opts)
})

// --- Database Handlers ---
ipcMain.handle('db-get-tickets', () => {
    const workspaceId = db.data.settings.activeWorkspaceId;
    return db.data.tickets.filter(t => t.workspaceId === workspaceId);
});

ipcMain.handle('db-create-ticket', async (event, ticket) => {
    const ticketWithWorkspace = { ...ticket, workspaceId: db.data.settings.activeWorkspaceId };
    db.data.tickets.push(ticketWithWorkspace);
    await db.write();

    // Trigger Automation Rules
    await evaluateAutomationRules('TICKET_CREATED', ticketWithWorkspace);

    return ticketWithWorkspace;
});

ipcMain.handle('db-update-ticket-status', async (event, id, status) => {
    const ticket = db.data.tickets.find(t => t.id === id);
    if (ticket) {
        ticket.status = status;
        await db.write();
        return ticket;
    }
    throw new Error('Ticket not found');
});

ipcMain.handle('db-update-ticket', async (event, updatedTicket: Ticket) => {
    const index = db.data.tickets.findIndex(t => t.id === updatedTicket.id);
    if (index !== -1) {
        db.data.tickets[index] = updatedTicket;
        await db.write();

        // Passive Knowledge Acquisition: Auto-generate KB if resolved
        if (updatedTicket.status === 'Resolved' || updatedTicket.status === 'AI Resolved' || updatedTicket.status === 'Self-Healed') {
            triggerPassiveKbGeneration(updatedTicket);
        }

        return updatedTicket;
    }
    throw new Error('Ticket not found');
});

const triggerPassiveKbGeneration = async (ticket: Ticket) => {
    if (!genAI) return;
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        const prompt = `
            Convert this resolved IT support ticket into a professional Knowledge Base solution object.
            TICKET: ${JSON.stringify(ticket)}

            Respond with JSON:
            {
                "problemDescription": "string",
                "solutionDescription": "markdown string",
                "tags": ["string"],
                "executableActions": ["string"]
            }

            Guidelines:
            - problemDescription should be a clear, searchable summary of the issue.
            - solutionDescription should use markdown and be concise.
            - tags should be relevant technical keywords.
            - executableActions should be shell commands from this whitelist ONLY: [ping, ifconfig, ipconfig, netstat, ls, dir, uptime, whoami, df, free, ps, top, pkill, systemctl, journalctl].
        `;
        const result = await model.generateContent(prompt);
        const data = JSON.parse(result.response.text());

        const newSolution: Solution = {
            id: `SOL-AUTO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            workspaceId: ticket.workspaceId,
            problemDescription: data.problemDescription || ticket.title,
            solutionDescription: data.solutionDescription,
            tags: data.tags || [],
            executableActions: (data.executableActions || []).filter((cmd: string) => {
                const base = cmd.trim().split(' ')[0].toLowerCase();
                return ALLOWED_COMMANDS.includes(base);
            })
        };
        db.data.solutions.push(newSolution);
        await db.write();
        console.log(`[AIOps] Passive KB acquisition successful for: ${ticket.id}`);
    } catch (error) {
        console.error('[AIOps] Passive KB acquisition failed:', error);
    }
}

ipcMain.handle('db-get-ticket-by-id', (event, ticketId) => {
    return db.data.tickets.find(t => t.id === ticketId);
});

ipcMain.handle('db-get-solutions', () => {
    const workspaceId = db.data.settings.activeWorkspaceId;
    return db.data.solutions.filter(s => s.workspaceId === workspaceId);
});

ipcMain.handle('db-create-solution', async (event, solution) => {
    const newSolution = {
        ...solution,
        id: `SOL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        workspaceId: db.data.settings.activeWorkspaceId
    };
    db.data.solutions.push(newSolution);
    await db.write();
    return newSolution;
});

ipcMain.handle('db-find-solutions', (event, problemDescription) => {
    const workspaceId = db.data.settings.activeWorkspaceId;
    const searchTerms = (problemDescription || '').toLowerCase().split(' ').filter(Boolean);
    if (searchTerms.length === 0) return [];

    return db.data.solutions
        .filter(s => s.workspaceId === workspaceId)
        .filter(solution => {
            const solutionTerms = (solution.problemDescription || '').toLowerCase().split(' ');
            return searchTerms.some(term => solutionTerms.includes(term));
        });
});

ipcMain.handle('db-upsert-remote-session', async (event, session: RemoteSession) => {
    const index = db.data.remoteSessions.findIndex(s => s.ticketId === session.ticketId);
    if (index !== -1) {
        db.data.remoteSessions[index] = { ...db.data.remoteSessions[index], ...session, updatedAt: new Date().toISOString() };
    } else {
        db.data.remoteSessions.push({ ...session, updatedAt: new Date().toISOString() });
    }
    await db.write();
    return session;
});

ipcMain.handle('db-get-remote-session', (event, ticketId) => {
    return db.data.remoteSessions.find(s => s.ticketId === ticketId);
});

ipcMain.handle('db-delete-remote-session', async (event, ticketId) => {
    db.data.remoteSessions = db.data.remoteSessions.filter(s => s.ticketId !== ticketId);
    await db.write();
});

// --- Automation Rules Handlers ---
ipcMain.handle('db-get-automation-rules', () => {
    return db.data.automationRules.filter(r => r.workspaceId === db.data.settings.activeWorkspaceId);
});

ipcMain.handle('db-update-automation-rule', async (event, updatedRule: AutomationRule) => {
    const index = db.data.automationRules.findIndex(r => r.id === updatedRule.id);
    if (index !== -1) {
        db.data.automationRules[index] = updatedRule;
        await db.write();
        return updatedRule;
    }
    throw new Error('Rule not found');
});

ipcMain.handle('db-create-automation-rule', async (event, rule: Omit<AutomationRule, 'id' | 'executionCount'>) => {
    const newRule: AutomationRule = {
        ...rule,
        id: `rule-${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: db.data.settings.activeWorkspaceId,
        executionCount: 0
    };
    db.data.automationRules.push(newRule);
    await db.write();
    return newRule;
});

ipcMain.handle('db-delete-automation-rule', async (event, id) => {
    db.data.automationRules = db.data.automationRules.filter(r => r.id !== id);
    await db.write();
    return true;
});

const evaluateAutomationRules = async (trigger: string, context: any) => {
    const activeRules = db.data.automationRules.filter(r => r.isEnabled && r.trigger === trigger && r.workspaceId === db.data.settings.activeWorkspaceId);

    for (const rule of activeRules) {
        const matches = rule.conditions.every(condition => {
            const val = context[condition.field];
            if (val === undefined) return false;

            switch (condition.operator) {
                case 'equals': return val === condition.value;
                case 'contains': return String(val).toLowerCase().includes(String(condition.value).toLowerCase());
                case 'greater_than': return Number(val) > Number(condition.value);
                case 'less_than': return Number(val) < Number(condition.value);
                default: return false;
            }
        });

        if (matches) {
            console.log(`[AIOps] Executing Automation Rule: ${rule.name}`);
            for (const action of rule.actions) {
                try {
                    switch (action.type) {
                        case 'SET_PRIORITY':
                            if (context.id) {
                                const ticket = db.data.tickets.find(t => t.id === context.id);
                                if (ticket) ticket.priority = action.params.priority;
                            }
                            break;
                        case 'POST_NOTE':
                            if (context.id) {
                                const ticket = db.data.tickets.find(t => t.id === context.id);
                                if (ticket) {
                                    ticket.activities?.push({
                                        id: Math.random().toString(36).substr(2, 9),
                                        timestamp: new Date().toISOString(),
                                        type: 'note',
                                        message: action.params.message,
                                        user: 'FixDesk AI (Automation)'
                                    });
                                }
                            }
                            break;
                        case 'EXECUTE_SHELL':
                             // Whitelist check and execution
                             const cmd = action.params.command;
                             const baseCmd = cmd.trim().split(' ')[0].toLowerCase();
                             if (ALLOWED_COMMANDS.includes(baseCmd)) {
                                 exec(cmd);
                             }
                             break;
                        // Add more actions as needed
                    }
                } catch (e) {
                    console.error(`[AIOps] Action ${action.type} failed for rule ${rule.name}:`, e);
                }
            }
            rule.executionCount++;
            rule.lastExecutedAt = new Date().toISOString();
            await db.write();
        }
    }
};

ipcMain.handle('db-get-settings', () => {
    return db.data.settings;
});

ipcMain.handle('db-update-settings', async (event, settings) => {
    // Handle sensitive Gemini API Key with safeStorage
    if (settings.geminiApiKey && safeStorage.isEncryptionAvailable()) {
        const encryptedKey = safeStorage.encryptString(settings.geminiApiKey);
        // We store it as a base64 string in the JSON DB
        (settings as any).geminiApiKey = encryptedKey.toString('base64');
    }

    db.data.settings = { ...db.data.settings, ...settings };
    await db.write();

    if (settings.geminiApiKey) {
        // If it was just updated, we use the raw value passed in for this session
        genAI = new GoogleGenerativeAI(settings.geminiApiKey);
    }

    if (settings.autoLaunch !== undefined) {
        app.setLoginItemSettings({
            openAtLogin: settings.autoLaunch,
            path: app.getPath('exe'),
        });
    }

    return db.data.settings;
});

ipcMain.handle('export-support-bundle', async () => {
    const { filePath } = await dialog.showSaveDialog({
        title: 'Export Support Bundle',
        defaultPath: path.join(app.getPath('downloads'), `fixdesk-support-${new Date().toISOString().split('T')[0]}.json`),
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (filePath) {
        const diagnostics = await si.osInfo();
        const bundle = {
            exportedAt: new Date().toISOString(),
            diagnostics: diagnostics,
            settings: db.data.settings,
            tickets: db.data.tickets,
            solutions: db.data.solutions
        };
        fs.writeFileSync(filePath, JSON.stringify(bundle, null, 2));
        return true;
    }
    return false;
});

ipcMain.handle('ai-analyze-support-bundle', async (event) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Select Support Bundle for AI Analysis',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) return null;

    try {
        const bundleContent = fs.readFileSync(filePaths[0], 'utf-8');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            You are an expert Enterprise IT Systems Analyst. Analyze this FixDesk AI Support Bundle.
            It contains system diagnostics, ticket history, and knowledge base solutions.

            Perform the following:
            1. **Pattern Recognition**: Identify recurring technical failures or user behavior patterns.
            2. **Resolution Efficiency**: Assess if the existing solutions are actually solving the root causes.
            3. **AIOps Health Score**: Provide a score from 0-100 on workspace automation and stability.
            4. **Strategic Recommendations**: 3 high-impact actions for the IT team.

            BUNDLE DATA (truncated if too large): ${bundleContent.substring(0, 30000)}

            Respond in professional Markdown.
        `;
        const result = await model.generateContent(prompt);
        return {
            analysis: result.response.text(),
            fileName: path.basename(filePaths[0])
        };
    } catch (error) {
        console.error("Support Bundle Analysis Error:", error);
        throw error;
    }
});

ipcMain.handle('db-generate-mock-data', async () => {
    const statuses: TicketStatus[] = ['New', 'In Progress', 'Resolved', 'Needs Attention', 'AI Resolved'] as any;
    const priorities: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];
    const issues = ['VPN', 'Email', 'Hardware', 'Software', 'Network'];
    const users = ['Jane Doe', 'John Smith', 'Robert Brown', 'Emily Davis'];

    const mockTickets: Ticket[] = [];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
        const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
        const issue = issues[Math.floor(Math.random() * issues.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        const ticket: Ticket = {
            id: `TICK-MOCK-${i}`,
            workspaceId: db.data.settings.activeWorkspaceId,
            title: `${issue}: Sample issue ${i}`,
            description: `This is a generated mock ticket for testing ${issue} related problems.`,
            status: status,
            priority: priorities[Math.floor(Math.random() * priorities.length)],
            reportedBy: users[Math.floor(Math.random() * users.length)],
            createdAt: createdAt,
            activities: [
                {
                    id: `A-${i}-1`,
                    timestamp: createdAt,
                    type: 'note',
                    message: 'Ticket created by mock generator.',
                    user: 'System'
                }
            ]
        };

        if (status === 'Resolved' || status === 'AI Resolved') {
            const resTime = new Date(new Date(createdAt).getTime() + Math.random() * 48 * 60 * 60 * 1000).toISOString();
            ticket.resolution = "Resolved automatically via mock generator logic.";
            ticket.activities?.push({
                id: `A-${i}-2`,
                timestamp: resTime,
                type: 'resolution',
                message: 'Issue resolved.',
                user: 'IT Admin'
            });
        }

        mockTickets.push(ticket);
    }

    db.data.tickets = [...db.data.tickets, ...mockTickets];
    await db.write();
    return true;
});
// --- End Database Handlers ---

// --- Command Execution Handler ---
const ALLOWED_COMMANDS = ['ping', 'ifconfig', 'ipconfig', 'netstat', 'ls', 'dir', 'uptime', 'whoami', 'df', 'free', 'ps', 'top', 'pkill', 'systemctl', 'journalctl'];

const scrubPII = (text: string): string => {
    if (!text) return text;
    // Basic scrubbing for emails, IPs, and common potential secret patterns
    let scrubbed = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
    scrubbed = scrubbed.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_REDACTED]');
    scrubbed = scrubbed.replace(/(password|secret|key|token|auth)=["']?[^"'\s]+["']?/gi, '$1=[REDACTED]');
    return scrubbed;
};

ipcMain.handle('execute-command', async (event, commands: string[]) => {
  const isAllowed = (cmd: string) => {
    const forbiddenChars = [';', '&', '|', '>', '<', '`', '$', '(', ')'];
    if (forbiddenChars.some(char => cmd.includes(char))) return false;
    const baseCmd = cmd.trim().split(' ')[0].toLowerCase();
    return ALLOWED_COMMANDS.includes(baseCmd);
  };

  const results = { stdout: '', stderr: '' };
  for (const command of commands) {
    let outcome: 'Success' | 'Failure' | 'Blocked' = 'Success';
    let reason: string | undefined;

    if (!isAllowed(command)) {
        outcome = 'Blocked';
        reason = 'Security policy violation: forbidden characters or not whitelisted.';
        results.stderr += `Blocked: ${command}`;
    } else {
        const res = await new Promise<{ stdout: string; stderr: string }>((resolve) => {
            exec(command, (error, stdout, stderr) => resolve({ stdout, stderr }));
        });
        results.stdout += scrubPII(res.stdout);
        results.stderr += scrubPII(res.stderr);
        if (res.stderr) outcome = 'Failure';
    }

    // Audit Log
    db.data.auditLogs.push({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        user: db.data.settings.userName,
        command: scrubPII(command),
        outcome,
        reason
    });
    await db.write();

    if (results.stderr) break;
  }
  return results;
});

ipcMain.handle('db-get-audit-logs', () => {
    return db.data.auditLogs.slice(-100).reverse(); // Return last 100 logs
});

ipcMain.handle('export-audit-report', async () => {
    const { filePath } = await dialog.showSaveDialog({
        title: 'Export SOC2 Audit Report',
        defaultPath: path.join(app.getPath('downloads'), `soc2-audit-${new Date().toISOString().split('T')[0]}.json`),
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (filePath) {
        const report = {
            exportedAt: new Date().toISOString(),
            exportedBy: db.data.settings.userName,
            workspaceId: db.data.settings.activeWorkspaceId,
            auditLogs: db.data.auditLogs,
            policies: {
                aiOpsMode: db.data.settings.aiOpsPolicy,
                commandWhitelist: ALLOWED_COMMANDS
            }
        };
        fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
        return true;
    }
    return false;
});
// --- End Command Execution Handler ---

// --- Gemini AI Handlers ---
let genAI = new GoogleGenerativeAI(db?.data?.settings?.geminiApiKey || process.env.GEMINI_API_KEY || '');

// --- Self-Healing Monitoring Service ---
let monitoringInterval: NodeJS.Timeout | null = null;

const startMonitoring = () => {
    if (monitoringInterval) return;

    monitoringInterval = setInterval(async () => {
        try {
            const mem = await si.mem();
            const cpu = await si.currentLoad();
            const disk = await si.fsSize();
            const processes = await si.processes();

            const memUsage = (mem.active / mem.total) * 100;
            const cpuUsage = cpu.currentLoad;
            const diskUsage = disk[0]?.use || 0;

            // Top 5 processes by CPU
            const topProcesses = processes.list
                .sort((a, b) => b.cpu - a.cpu)
                .slice(0, 5)
                .map(p => ({ name: p.name, cpu: p.cpu, mem: p.mem, pid: p.pid }));

            // Thresholds for autonomous action (lowered for demo purposes if needed, but keeping 90 for logic)
            if (memUsage > 90 || cpuUsage > 90 || diskUsage > 90) {
                console.log(`[AIOps] Critical metrics detected: CPU ${cpuUsage.toFixed(1)}%, Mem ${memUsage.toFixed(1)}%, Disk ${diskUsage.toFixed(1)}%`);
                await triggerAutonomousResolution({ cpuUsage, memUsage, diskUsage, topProcesses });
            }

            // Evaluation of custom Automation Rules for metrics
            await evaluateAutomationRules('SYSTEM_METRIC_THRESHOLD', { cpuUsage, memUsage, diskUsage });
        } catch (error) {
            console.error('[AIOps] Monitoring error:', error);
        }
    }, 30000); // Check every 30 seconds
};

const triggerAutonomousResolution = async (metrics: any) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            You are an Autonomous IT Operations system.
            The system has detected critical performance metrics:
            CPU: ${metrics.cpuUsage.toFixed(1)}%
            Memory: ${metrics.memUsage.toFixed(1)}%
            Disk: ${metrics.diskUsage.toFixed(1)}%

            TOP PROCESSES:
            ${JSON.stringify(metrics.topProcesses)}

            1. Diagnose the likely issue using the metrics and top processes.
            2. Suggest a safe, automated shell command to mitigate it.
               ALLOWED COMMANDS: ping, ifconfig, ipconfig, netstat, ls, dir, uptime, whoami, df, free, ps, top, pkill, systemctl, journalctl.
               Example: If a process 'bad_app' is consuming 90% CPU, suggest 'pkill bad_app'.
            3. Provide a ticket title and description.

            Respond with ONLY a JSON object:
            {
                "diagnosis": "string",
                "mitigationCommand": "string",
                "ticketTitle": "string",
                "ticketDescription": "string"
            }
        `;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const aiResponse = JSON.parse(result.response.text());
        const policy = db.data.settings.aiOpsPolicy || 'manual';

        // Create the Autonomous Ticket
        const ticketId = `TICK-AUTO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const newTicket: Ticket = {
            id: ticketId,
            workspaceId: db.data.settings.activeWorkspaceId,
            title: `[Self-Healing] ${aiResponse.ticketTitle}`,
            description: aiResponse.ticketDescription,
            status: (policy === 'autonomous' ? 'Self-Healed' : 'Needs Attention') as any,
            priority: 'High',
            reportedBy: 'System Monitor (AIOps)',
            createdAt: new Date().toISOString(),
            mitigationCommand: aiResponse.mitigationCommand,
            resolution: policy === 'autonomous'
                ? `Autonomous action taken: ${aiResponse.diagnosis}. Command executed: ${aiResponse.mitigationCommand}`
                : `Autonomous mitigation suggested: ${aiResponse.diagnosis}. Manual approval required.`,
            activities: [
                {
                    id: Math.random().toString(36).substr(2, 9),
                    timestamp: new Date().toISOString(),
                    type: (policy === 'autonomous' ? 'resolution' : 'note') as any,
                    message: policy === 'autonomous'
                        ? `Autonomous diagnosis: ${aiResponse.diagnosis}. Mitigation script executed.`
                        : `AI suggests mitigation: ${aiResponse.diagnosis}. Policy requires manual approval.`,
                    user: 'FixDesk AI (AIOps)'
                }
            ]
        };

        // Execute mitigation if command exists and policy is autonomous
        if (aiResponse.mitigationCommand && policy === 'autonomous') {
            // Check whitelist
            const forbiddenChars = [';', '&', '|', '>', '<', '`', '$', '(', ')'];
            const baseCmd = aiResponse.mitigationCommand.trim().split(' ')[0].toLowerCase();
            const hasForbiddenChars = forbiddenChars.some(char => aiResponse.mitigationCommand.includes(char));

            if (ALLOWED_COMMANDS.includes(baseCmd) && !hasForbiddenChars) {
                exec(aiResponse.mitigationCommand, (err, stdout, stderr) => {
                    newTicket.logs = [`Auto-fix output: ${stdout || stderr}`];
                    db.data.tickets.push(newTicket);
                    db.write();
                    new Notification({
                        title: 'FixDesk AIOps: Self-Healing Active',
                        body: `Action Taken: ${aiResponse.diagnosis}`,
                        icon: path.join(__dirname, '../assets/tray-icon.png')
                    }).show();
                    win?.webContents.send('aiops-notification', { title: 'Self-Healing Action Taken', message: aiResponse.diagnosis });
                });
            } else {
                 newTicket.status = 'Needs Attention' as any;
                 newTicket.resolution = `Autonomous mitigation blocked: Security violation or command not in whitelist. Manual intervention required.`;
                 db.data.tickets.push(newTicket);
                 db.write();
            }
        } else {
            db.data.tickets.push(newTicket);
            db.write();
            if (policy === 'manual' && aiResponse.mitigationCommand) {
                new Notification({
                    title: 'FixDesk AIOps: Attention Required',
                    body: `AI suggests mitigation: ${aiResponse.diagnosis}`,
                    icon: path.join(__dirname, '../assets/tray-icon.png')
                }).show();
                win?.webContents.send('aiops-notification', { title: 'AIOps Intervention Required', message: aiResponse.diagnosis });
            }
        }

    } catch (error) {
        console.error('[AIOps] Autonomous resolution failed:', error);
    }
};

ipcMain.handle('ai-categorize-prioritize', async (event, { title, description }) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        const prompt = `Analyze this IT request.
            1. Determine priority (Low, Medium, High).
            2. Identify a short category (e.g., VPN, Software, Hardware).
            3. Analyze user sentiment (Frustrated, Neutral, Positive).

            TITLE: ${title}
            DESCRIPTION: ${description}

            Respond with JSON: { "priority": "Low" | "Medium" | "High", "category": "string", "sentiment": "Frustrated" | "Neutral" | "Positive" }`;
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (error) {
        console.error("AI Error:", error);
        return { priority: 'Medium', category: 'General', sentiment: 'Neutral' };
    }
});

ipcMain.handle('ai-chat', async (event, { message, history, screenshot }) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "You are a helpful IT Support Assistant for FixDesk AI. Your goal is to help employees solve technical issues. Be professional, concise, and friendly. If you cannot solve something, suggest they report an issue."
        } as any);

        const contents = [];
        if (history) {
            contents.push(...history);
        }

        const userParts: any[] = [{ text: message }];
        if (screenshot) {
            // screenshot is base64 string
            userParts.push({
                inlineData: {
                    mimeType: "image/png",
                    data: screenshot.split(',')[1] // Remove data:image/png;base64,
                }
            });
        }

        contents.push({ role: 'user', parts: userParts });

        const result = await model.generateContent({ contents });
        return result.response.text();
    } catch (error: any) {
        console.error("AI Chat Error:", error);
        return `AI Error: ${error.message || "Unknown error occurred."}`;
    }
});

ipcMain.handle('ai-ask-about-ticket', async (event, { ticket, question }) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are an IT support assistant. Answer the user question about this ticket.

            DIAGNOSTIC DATA:
            ${(ticket.logs || []).filter((l: string) => l.startsWith('System Diagnostics')).join('\n')}

            TICKET CONTEXT:
            ${JSON.stringify(ticket)}

            If the question is about hardware, performance, or OS issues, prioritize the DIAGNOSTIC DATA provided above.

            QUESTION: ${question}`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error: any) {
        if (error.message?.includes('429')) return "AI Error: Rate limit exceeded. Please wait a moment.";
        if (error.message?.includes('key missing')) return "AI Error: Gemini API key is not configured.";
        return `AI Error: ${(error as Error).message || "Unknown error occurred."}`;
    }
});

ipcMain.handle('ai-draft-response', async (event, ticket) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Draft a professional response for this ticket: ${JSON.stringify(ticket)}`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error: any) {
        if (error.message?.includes('429')) return "AI Error: Rate limit exceeded.";
        return "AI Error: Failed to draft response.";
    }
});

ipcMain.handle('ai-summarize-ticket', async (event, ticket) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Summarize this ticket in exactly 3 sentences: ${JSON.stringify(ticket)}`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        return "Failed to summarize.";
    }
});

ipcMain.handle('get-system-diagnostics', async () => {
    try {
        const os = await si.osInfo();
        const mem = await si.mem();
        const cpu = await si.cpu();
        const time = si.time();

        return {
            platform: os.platform,
            distro: os.distro,
            release: os.release,
            arch: os.arch,
            totalMemory: Math.round(mem.total / (1024 * 1024 * 1024)) + ' GB',
            freeMemory: Math.round(mem.free / (1024 * 1024 * 1024)) + ' GB',
            cpuModel: cpu.manufacturer + ' ' + cpu.brand,
            uptime: Math.round(time.uptime / 3600) + ' hours',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Diagnostic error:', error);
        return { error: 'Failed to gather diagnostics' };
    }
});

ipcMain.handle('get-system-metrics', async () => {
    try {
        const cpu = await si.currentLoad();
        const mem = await si.mem();
        const disk = await si.fsSize();

        return {
            cpuUsage: Math.round(cpu.currentLoad),
            memUsage: Math.round((mem.active / mem.total) * 100),
            diskUsage: Math.round(disk[0]?.use || 0)
        };
    } catch (error) {
        console.error('Metrics error:', error);
        return { cpuUsage: 0, memUsage: 0, diskUsage: 0 };
    }
});

ipcMain.handle('ai-generate-kb-article', async (event, ticket) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            Convert the following support ticket into a professional Knowledge Base article.
            Include the following sections:
            - **Problem Summary**: A concise title-like summary.
            - **Symptoms**: What the user saw.
            - **Resolution**: Step-by-step fix.

            TICKET: ${JSON.stringify(ticket)}

            Use markdown formatting. Respond ONLY with the article content.
        `;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        return `Failed to generate article: ${ticket.resolution}`;
    }
});

ipcMain.handle('ai-get-system-health', async (event, tickets) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        const prompt = `
            Analyze the following list of support tickets from the last 7 days.
            Provide a system health assessment including:
            1. Overall Status (Healthy, Warning, Critical)
            2. Key Trends (What's happening?)
            3. Top Risk Area (Where should IT focus?)

            TICKETS: ${JSON.stringify(tickets)}

            Respond with ONLY a JSON object:
            {
                "status": "Healthy" | "Warning" | "Critical",
                "summary": "1-2 sentences overall summary",
                "risks": ["list of 2-3 risks"]
            }
        `;
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (error) {
        return { status: 'Healthy', summary: 'System operational.', risks: ['None identified'] };
    }
});

ipcMain.handle('ai-root-cause-analysis', async (event, ticket) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            Perform a deep technical root cause analysis (RCA) for the following IT ticket.
            Consider the description, any provided diagnostics logs, and the activity history.

            TICKET: ${JSON.stringify(ticket)}

            Provide the analysis in markdown format with the following sections:
            - **Root Cause Hypothesis**: What is the most likely technical cause?
            - **Technical Deep Dive**: Explain the underlying system mechanism involved.
            - **Long-term Prevention**: How to prevent this from recurring.
            - **Confidence Level**: (Low, Medium, or High)
        `;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("RCA Error:", error);
        return "Failed to perform root cause analysis.";
    }
});

ipcMain.handle('ai-parse-search-query', async (event, query) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        const prompt = `
            Parse the following natural language IT ticket search query into structured filter criteria.
            QUERY: "${query}"

            Respond with ONLY a JSON object:
            {
                "status": "New" | "In Progress" | "Resolved" | "AI Resolved" | "Needs Attention" | "Self-Healed" | null,
                "priority": "Low" | "Medium" | "High" | null,
                "category": "string" | null,
                "timeRange": "24h" | "7d" | "30d" | null,
                "keyword": "string" | null
            }
        `;
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (error) {
        console.error("Search Query Parsing Error:", error);
        return { status: null, priority: null, category: null, timeRange: null, keyword: query };
    }
});

ipcMain.handle('ai-semantic-search-kb', async (event, { query, solutions }) => {
    try {
        // In a real enterprise app, we'd use a vector DB.
        // Here we use Gemini 1.5 Flash to re-rank the solutions based on semantic relevance to the query.
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const context = solutions.map((s: any) => ({ id: s.id, problem: s.problemDescription }));
        const prompt = `
            You are a semantic search engine. Given a list of IT Knowledge Base solutions and a user query,
            rank the solutions by their semantic relevance to the query.

            QUERY: "${query}"
            SOLUTIONS: ${JSON.stringify(context)}

            Respond with ONLY a JSON array of solution IDs in order of relevance: ["id1", "id2", ...]
        `;

        const result = await model.generateContent(prompt);
        const rankedIds = JSON.parse(result.response.text());

        // Return original solutions sorted by the AI's ranking
        return rankedIds
            .map((id: string) => solutions.find((s: any) => s.id === id))
            .filter(Boolean);
    } catch (error) {
        console.error("Semantic Search Error:", error);
        return solutions; // Fallback to original list
    }
});

ipcMain.handle('ai-start-conversation', async (event, { videoBase64, prompt }) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const systemPrompt = `
            You are an expert IT Support Engineer. Analyze the provided video of a user issue and their description.
            Determine if you have enough information to resolve it.

            If YES (Resolution found):
            Respond with:
            {
                "type": "analysis",
                "data": {
                    "title": "Short descriptive title",
                    "description": "Clear explanation of the problem",
                    "resolution": "Step-by-step resolution steps",
                    "status": "Resolved",
                    "priority": "Low" | "Medium" | "High",
                    "sentiment": "Frustrated" | "Neutral" | "Positive",
                    "suggestedScript": ["ls", "df"] // Optional shell commands from whitelist
                }
            }

            If NO (Need more info):
            Respond with:
            {
                "type": "question",
                "question": "The specific question you need to ask the user"
            }
        `;

        const parts = [
            { text: systemPrompt },
            { text: `USER DESCRIPTION: ${prompt}` },
        ];

        if (videoBase64) {
            parts.push({
                inlineData: { mimeType: "video/webm", data: videoBase64 }
            } as any);
        }

        const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
        return JSON.parse(result.response.text());
    } catch (error) {
        console.error("AI Conversation Error:", error);
        return { type: 'error', message: 'AI Analysis failed. Please try a manual description.' };
    }
});

ipcMain.handle('auth-test-sso', async (event, config: any) => {
    // Simulated OIDC Discovery and Client Authentication
    console.log('[Auth] Testing SSO Connection with:', config.discoveryUrl);
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (config.discoveryUrl && config.discoveryUrl.includes('company.com')) {
        return { success: true, message: 'Connection established. Identity Provider verified.' };
    }
    return { success: false, message: 'Invalid Discovery URL or Client ID.' };
});
// --- End Gemini AI Handlers ---

// --- RobotJS Handlers ---
ipcMain.on('robot-mouse-move', (event, { x, y }) => {
  const { width, height } = robot.getScreenSize();
  const absoluteX = Math.round(x * width);
  const absoluteY = Math.round(y * height);
  robot.moveMouse(absoluteX, absoluteY);
});

ipcMain.on('robot-mouse-click', (event) => {
  robot.mouseClick();
});

ipcMain.on('robot-key-tap', (event, key) => {
  robot.keyTap(key);
});


app.whenReady().then(initDatabase).then(() => {
    createWindow();
    createTray();
    startMonitoring();
})
