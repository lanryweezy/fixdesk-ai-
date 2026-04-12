import { app, BrowserWindow, ipcMain, desktopCapturer } from 'electron'
import * as path from 'node:path'
import robot from 'robotjs'
import { Low } from 'lowdb'
import { JSONFilePreset } from 'lowdb/node'
import type { Ticket, Solution, RemoteSession, TicketStatus } from '../types'
import { exec } from 'child_process'
import { GoogleGenerativeAI } from "@google/generative-ai"

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
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

// --- Database Setup ---
type Data = {
  tickets: Ticket[];
  solutions: Solution[];
  remoteSessions: RemoteSession[];
  settings: {
    role: 'staff' | 'admin';
    isDarkMode: boolean;
  }
}
let db: Low<Data>;
const initDatabase = async () => {
    const defaultData: Data = {
        tickets: [],
        solutions: [],
        remoteSessions: [],
        settings: { role: 'admin', isDarkMode: false }
    };
    const dbPath = path.join(app.getPath('userData'), 'db.json');
    db = await JSONFilePreset<Data>(dbPath, defaultData);
}
// --- End Database Setup ---


function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: true,
    },
  })

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
    return db.data.tickets;
});

ipcMain.handle('db-create-ticket', async (event, ticket) => {
    db.data.tickets.push(ticket);
    await db.write();
    return ticket;
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
        return updatedTicket;
    }
    throw new Error('Ticket not found');
});

ipcMain.handle('db-get-ticket-by-id', (event, ticketId) => {
    return db.data.tickets.find(t => t.id === ticketId);
});

ipcMain.handle('db-get-solutions', () => {
    return db.data.solutions;
});

ipcMain.handle('db-create-solution', async (event, solution) => {
    const newSolution = { ...solution, id: `SOL-${Math.random().toString(36).substr(2, 9).toUpperCase()}` };
    db.data.solutions.push(newSolution);
    await db.write();
    return newSolution;
});

ipcMain.handle('db-find-solutions', (event, problemDescription) => {
    // This is a very simple search. A real implementation would use a more sophisticated search algorithm.
    const searchTerms = problemDescription.toLowerCase().split(' ');
    return db.data.solutions.filter(solution => {
        const solutionTerms = solution.problemDescription.toLowerCase().split(' ');
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

ipcMain.handle('db-get-settings', () => {
    return db.data.settings;
});

ipcMain.handle('db-update-settings', async (event, settings) => {
    db.data.settings = { ...db.data.settings, ...settings };
    await db.write();
    return db.data.settings;
});
// --- End Database Handlers ---

// --- Command Execution Handler ---
ipcMain.handle('execute-command', async (event, commands: string[]) => {
  const execPromise = (command: string) => {
    return new Promise<{ stdout: string; stderr: string }>((resolve) => {
      exec(command, (error, stdout, stderr) => {
        // We resolve even if there's an error, but we include the stderr.
        // The renderer process will be responsible for checking the stderr property.
        resolve({ stdout, stderr });
      });
    });
  };

  const results = { stdout: '', stderr: '' };
  for (const command of commands) {
    const result = await execPromise(command);
    results.stdout += result.stdout;
    results.stderr += result.stderr;
    // If there was an error in a command, stop executing the rest of the script.
    if (result.stderr) {
      break;
    }
  }
  return results;
});
// --- End Command Execution Handler ---

// --- Gemini AI Handlers ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

ipcMain.handle('ai-categorize-prioritize', async (event, { title, description }) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        const prompt = `Analyze this IT request. Determine priority (Low, Medium, High) and a short category.
            TITLE: ${title}
            DESCRIPTION: ${description}
            Respond with JSON: { "priority": "Low" | "Medium" | "High", "category": "string" }`;
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (error) {
        console.error("AI Error:", error);
        return { priority: 'Medium', category: 'General' };
    }
});

ipcMain.handle('ai-ask-about-ticket', async (event, { ticket, question }) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are an IT support assistant. Answer the user question about this ticket.
            TICKET: ${JSON.stringify(ticket)}
            QUESTION: ${question}`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        return "I'm sorry, I couldn't process that.";
    }
});

ipcMain.handle('ai-draft-response', async (event, ticket) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Draft a professional response for this ticket: ${JSON.stringify(ticket)}`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        return "Failed to draft response.";
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

ipcMain.handle('ai-start-conversation', async (event, { videoBase64, prompt }) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // Minimal implementation for now to fix the dependency issue
        const result = await model.generateContent([
            { text: `Analyze this IT issue: ${prompt}` },
            { inlineData: { mimeType: "video/webm", data: videoBase64 } }
        ]);
        // Mocking a structured response for now
        return {
            type: 'analysis',
            data: {
                title: prompt,
                description: result.response.text(),
                status: 'New',
                priority: 'Medium'
            }
        };
    } catch (error) {
        return { type: 'error', message: 'AI Analysis failed.' };
    }
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


app.whenReady().then(initDatabase).then(createWindow)
