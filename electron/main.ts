import { app, BrowserWindow, ipcMain, desktopCapturer } from 'electron'
import * as path from 'node:path'
import robot from 'robotjs'
import { JSONFilePreset, Low } from 'lowdb/node'
import type { Ticket } from '../types'

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
}
let db: Low<Data>;
const initDatabase = async () => {
    const defaultData: Data = { tickets: [] };
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

ipcMain.handle('db-get-ticket-by-id', (event, ticketId) => {
    return db.data.tickets.find(t => t.id === ticketId);
});
// --- End Database Handlers ---

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
