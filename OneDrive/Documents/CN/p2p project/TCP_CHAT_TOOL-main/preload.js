const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    sendMessage: (message, recipients) => {
      return ipcRenderer.invoke('send-message', message, recipients);
    },
    getPeers: () => {
      return ipcRenderer.invoke('get-peers');
    },
    setUsername: (username) => {
      return ipcRenderer.invoke('set-username', username);
    },
    onUpdatePeers: (callback) => {
      ipcRenderer.on('update-peers', (event, peers) => callback(peers));
    },
    onNewMessage: (callback) => {
      ipcRenderer.on('new-message', (event, message) => callback(message));
    }
  }
);
