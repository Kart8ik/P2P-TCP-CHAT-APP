const { app, BrowserWindow, ipcMain } = require("electron");
const { startTCPServer, startDiscovery, connectToPeers, sendMessage } = require("./network");

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: { nodeIntegration: true }
    });

    mainWindow.loadFile("index.html");

    startTCPServer(message => {
        mainWindow.webContents.send("message", `Peer: ${message}`);
    });

    startDiscovery();

    setTimeout(() => {
        connectToPeers(message => {
            mainWindow.webContents.send("message", `Peer: ${message}`);
        });
    }, 5000); // Wait 5s before connecting
});

ipcMain.on("send-message", (_, message) => {
    sendMessage(message);
    mainWindow.webContents.send("message", `You: ${message}`);
});
