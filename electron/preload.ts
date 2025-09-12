import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getScreenSources: (opts: any) => ipcRenderer.invoke('desktop-capturer-get-sources', opts),
});
