const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    sendMessage: (message) => ipcRenderer.send('send-message', message),
    onMessage: (callback) => ipcRenderer.on('display-message', (_, msg) => callback(msg))
});
