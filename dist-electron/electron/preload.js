"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Whitelist of valid channels for IPC communication
const validChannels = [
    'desktop-capturer-get-sources',
    'robot-mouse-move',
    'robot-mouse-click',
    'robot-key-tap'
];
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Screen recording (invoke for two-way communication)
    getScreenSources: (opts) => electron_1.ipcRenderer.invoke('desktop-capturer-get-sources', opts),
    // Database operations
    getTickets: () => electron_1.ipcRenderer.invoke('db-get-tickets'),
    createTicket: (ticket) => electron_1.ipcRenderer.invoke('db-create-ticket', ticket),
    getTicketById: (id) => electron_1.ipcRenderer.invoke('db-get-ticket-by-id', id),
    // Remote control actions (send for one-way communication)
    send: (channel, data) => {
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.send(channel, data);
        }
    },
});
