const net = require("net");
const dgram = require("dgram");

const PORT = 3000;
const DISCOVERY_PORT = 4000;
const peers = new Set();

// Start TCP Server
function startTCPServer(onMessageReceived) {
    const server = net.createServer(socket => {
        socket.on("data", data => {
            onMessageReceived(data.toString());
        });

        socket.on("error", err => console.log("Socket error:", err));
    });

    server.listen(PORT, () => console.log(`Listening on TCP port ${PORT}`));
}

// Peer Discovery using UDP Broadcast
function startDiscovery() {
    const udpServer = dgram.createSocket("udp4");

    udpServer.on("message", (msg, rinfo) => {
        const peer = `${rinfo.address}:${PORT}`;
        if (!peers.has(peer)) {
            peers.add(peer);
            console.log(`Discovered peer: ${peer}`);
        }
    });

    udpServer.bind(DISCOVERY_PORT, () => {
        udpServer.setBroadcast(true);
        setInterval(() => {
            const message = Buffer.from("DISCOVER");
            udpServer.send(message, 0, message.length, DISCOVERY_PORT, "255.255.255.255");
        }, 3000);
    });
}

// Connect to Discovered Peers
function connectToPeers(onMessageReceived) {
    peers.forEach(peer => {
        const [host, port] = peer.split(":");
        const socket = net.createConnection({ host, port }, () => {
            console.log(`Connected to peer: ${peer}`);
        });

        socket.on("data", data => onMessageReceived(data.toString()));
        socket.on("error", err => console.log("Connection error:", err));
    });
}

// Send Message to All Peers
function sendMessage(message) {
    peers.forEach(peer => {
        const [host, port] = peer.split(":");
        const socket = net.createConnection({ host, port }, () => {
            socket.write(message);
            socket.end();
        });
    });
}

module.exports = { startTCPServer, startDiscovery, connectToPeers, sendMessage };
