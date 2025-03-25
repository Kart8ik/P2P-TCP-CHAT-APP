const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initDiscovery } = require('./src/discovery');
const { initMessaging } = require('./src/messaging');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let username = `User_${Math.floor(Math.random() * 1000)}`;
let discoveryService;
let messagingService;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the index.html of the app
  mainWindow.loadFile('index.html');

  // Open DevTools during development
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  
  // Initialize networking services
  discoveryService = initDiscovery(onPeerDiscovered, username);
  messagingService = initMessaging(onMessageReceived);
  
  app.on('activate', () => {
    // On macOS it's common to re-create a window when clicking the dock icon
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Handle peer discovery
function onPeerDiscovered(peers) {
  if (mainWindow) {
    mainWindow.webContents.send('update-peers', peers);
  }
}

// Handle message reception
function onMessageReceived(message) {
  if (mainWindow) {
    mainWindow.webContents.send('new-message', message);
  }
}

// IPC handlers
ipcMain.handle('send-message', async (event, message, recipients) => {
  return messagingService.sendMessage(message, recipients);
});

ipcMain.handle('get-peers', async () => {
  return discoveryService.getPeers();
});

ipcMain.handle('set-username', async (event, newUsername) => {
  username = newUsername;
  discoveryService.updateUsername(newUsername);
  return username;
});

// Cleanup on exit
app.on('before-quit', () => {
  if (discoveryService) discoveryService.close();
  if (messagingService) messagingService.close();
});