const { contextBridge, ipcRenderer } = require('electron');

// Expose a small API for update events and commands to the renderer
contextBridge.exposeInMainWorld('electronUpdater', {
  on: (channel, listener) => {
    const valid = ['update-available', 'download-progress', 'update-downloaded', 'update-error'];
    if (!valid.includes(channel)) return;
    ipcRenderer.on(channel, (event, data) => listener(data));
  },
  send: (channel, data) => {
    const valid = ['updater:check', 'updater:download', 'updater:install', 'updater:skip'];
    if (!valid.includes(channel)) return;
    ipcRenderer.send(channel, data);
  },
});
