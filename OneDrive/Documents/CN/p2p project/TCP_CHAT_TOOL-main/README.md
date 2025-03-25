# Electron TCP Chat App

A **desktop chat application** built using **Electron.js** and **Node.js TCP sockets**. This app allows multiple clients to communicate over a TCP network using a simple GUI.

## Features
✅ **Electron-based GUI** – Runs as a desktop app with a chat interface.
✅ **TCP Sockets** – Uses Node.js `net` module for client-server communication.
✅ **Multiple Clients** – Multiple users can connect and chat in real-time.
✅ **Simple & Minimal UI** – Basic message box + chat history.
✅ **Cross-Platform** – Works on Windows, macOS, and Linux.

---

## Tech Stack
- **Electron.js** – For GUI and app structure
- **Node.js (`net` module)** – For TCP socket communication
- **HTML + CSS + JavaScript** – For UI design

---

## Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Kart8ik/TCP_CHAT_TOOL.git
cd TCP_CHAT_TOOL
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Start the TCP Server
```bash
node src/server.js
```

### 4️⃣ Run the Electron App
```bash
npm start
```

---

## Project Structure
```
/TCP_CHAT_TOOL
 ├── /src
 │   ├── main.js        (Electron main process: manages the window & backend logic)
 │   ├── renderer.js    (Frontend logic: UI interactions)
 │   ├── index.html     (Chat UI)
 │   ├── styles.css     (Basic styling)
 │   ├── client.js      (TCP client logic)
 │   ├── server.js      (TCP server logic)
 ├── package.json      (Dependencies & scripts)
 ├── README.md         (Project overview)
```

---

## Usage
1. **Start the server** (`server.js`) to handle multiple clients.
2. **Open multiple instances** of the Electron app to simulate different users.
3. **Enter messages** and send them to communicate.

---

## Future Enhancements
🚀 Add usernames for clients.  
🚀 Implement message timestamps.  
🚀 Improve UI with chat bubbles and themes.  
🚀 Add encryption for secure messaging.  

---

## License
MIT License © 2025 Shri Karthik

