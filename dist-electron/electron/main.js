"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("node:path"));
const robotjs_1 = __importDefault(require("robotjs"));
const node_1 = require("lowdb/node");
// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
    ? path.join(process.env.DIST, '../public')
    : process.env.DIST;
let win;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
let db;
const initDatabase = async () => {
    const defaultData = { tickets: [] };
    const dbPath = path.join(electron_1.app.getPath('userData'), 'db.json');
    db = await (0, node_1.JSONFilePreset)(dbPath, defaultData);
};
// --- End Database Setup ---
function createWindow() {
    win = new electron_1.BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: true,
        },
    });
    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString());
    });
    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
        // Open devtools
        win.webContents.openDevTools();
    }
    else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(process.env.DIST, 'index.html'));
    }
}
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
        win = null;
    }
});
electron_1.app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
electron_1.ipcMain.handle('desktop-capturer-get-sources', (event, opts) => {
    return electron_1.desktopCapturer.getSources(opts);
});
// --- Database Handlers ---
electron_1.ipcMain.handle('db-get-tickets', () => {
    return db.data.tickets;
});
electron_1.ipcMain.handle('db-create-ticket', async (event, ticket) => {
    db.data.tickets.push(ticket);
    await db.write();
    return ticket;
});
electron_1.ipcMain.handle('db-get-ticket-by-id', (event, ticketId) => {
    return db.data.tickets.find(t => t.id === ticketId);
});
// --- End Database Handlers ---
// --- RobotJS Handlers ---
electron_1.ipcMain.on('robot-mouse-move', (event, { x, y }) => {
    const { width, height } = robotjs_1.default.getScreenSize();
    const absoluteX = Math.round(x * width);
    const absoluteY = Math.round(y * height);
    robotjs_1.default.moveMouse(absoluteX, absoluteY);
});
electron_1.ipcMain.on('robot-mouse-click', (event) => {
    robotjs_1.default.mouseClick();
});
electron_1.ipcMain.on('robot-key-tap', (event, key) => {
    robotjs_1.default.keyTap(key);
});
electron_1.app.whenReady().then(initDatabase).then(createWindow);
