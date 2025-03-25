const dgram = require('dgram');
const os = require('os');

// UDP Discovery configuration
const UDP_PORT = 41234;
const BROADCAST_INTERVAL = 5000; // 5 seconds
const DISCOVERY_MESSAGE = 'CHAT_APP_DISCOVERY';

// Keep track of discovered peers
let peers = new Map(); // Maps IP addresses to peer info
let udpSocket = null;
let localIp = '';
let localPort = 41235; // Default TCP port
let currentUsername = '';
let discoveryCallback = null;

// Get the local IP address (first non-internal IPv4 address)
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const [name, iface] of Object.entries(interfaces)) {
      for (const info of iface) {
          if (
              info.family === "IPv4" &&
              !info.internal &&
              !info.address.startsWith("169.254.91.") && // Ignore VMware VMnet1
              !info.address.startsWith("192.168.52.") &&// Ignore VMware VMnet8
              !info.address.startsWith("192.168.142.") // Ignore VMware VMnet8
          ) {
              return info.address; // Picks the first valid non-VMware IPv4
          }
      }
  }
  return "127.0.0.1"; // Fallback if no valid IP is found
}

// Initialize UDP discovery service
function initDiscovery(onPeerDiscovered, username) {
  localIp = getLocalIpAddress();
  console.log(`Local IP address: ${localIp}`);
  currentUsername = username;
  discoveryCallback = onPeerDiscovered;
  
  udpSocket = dgram.createSocket('udp4');

  // Handle errors
  udpSocket.on('error', (err) => {
    console.error(`UDP Error: ${err}`);
    udpSocket.close();
  });

  // Configure socket for broadcasting
  udpSocket.bind(UDP_PORT, () => {
    udpSocket.setBroadcast(true);
    console.log(`UDP discovery service running on port ${UDP_PORT}`);
    
    // Start broadcasting presence
    startBroadcasting();
  });

  // Listen for discovery messages
  udpSocket.on('message', (msg, rinfo) => {
    const message = msg.toString();
    
    // Parse discovery message: CHAT_APP_DISCOVERY|TCP_PORT|USERNAME
    if (message.startsWith(DISCOVERY_MESSAGE) && rinfo.address !== localIp) {
      const parts = message.split('|');
      if (parts.length >= 2) {
        const remoteTcpPort = parseInt(parts[1]);
        const remoteUsername = parts[2] || `User@${rinfo.address}`;
        
        // Add or update peer
        if (!peers.has(rinfo.address) || 
            peers.get(rinfo.address).port !== remoteTcpPort || 
            peers.get(rinfo.address).username !== remoteUsername) {
          
          peers.set(rinfo.address, { 
            ip: rinfo.address,
            port: remoteTcpPort, 
            username: remoteUsername 
          });
          
          console.log(`Discovered peer: ${remoteUsername} at ${rinfo.address}:${remoteTcpPort}`);
          
          // Notify callback with updated peers list
          if (discoveryCallback) {
            discoveryCallback(Array.from(peers.values()));
          }
        }
      }
    }
  });

  // Return API for the discovery service
  return {
    getPeers: () => Array.from(peers.values()),
    updateUsername: (newUsername) => {
      currentUsername = newUsername;
    },
    close: () => {
      if (udpSocket) {
        udpSocket.close();
        udpSocket = null;
      }
    }
  };
}

// Broadcast presence periodically
function startBroadcasting() {
  // Broadcast immediately
  broadcastPresence();
  
  // Then set interval
  setInterval(broadcastPresence, BROADCAST_INTERVAL);
}

// Send a broadcast message announcing presence
function broadcastPresence() {
  if (!udpSocket) return;
  
  const message = Buffer.from(`${DISCOVERY_MESSAGE}|${localPort}|${currentUsername}`);
  udpSocket.send(message, 0, message.length, UDP_PORT, '255.255.255.255', (err) => {
    if (err) {
      console.error('Error broadcasting presence:', err);
    }
  });
}

module.exports = {
  initDiscovery
};