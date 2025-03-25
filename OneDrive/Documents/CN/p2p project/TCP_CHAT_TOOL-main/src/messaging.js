const net = require('net');
const os = require('os');

// TCP messaging configuration
const TCP_PORT = 41235;

// Keep track of TCP connections
let tcpServer = null;
let tcpConnections = new Map(); // Maps IP addresses to socket connections
let messageCallback = null;
let localIp = '';

// Get the local IP address
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

// Initialize TCP messaging service
function initMessaging(onMessageReceived) {
  localIp = getLocalIpAddress();
  console.log(`Local IP address: ${localIp}`);
  messageCallback = onMessageReceived;
  
  // Start TCP server
  tcpServer = net.createServer();

  tcpServer.on('connection', (socket) => {
    // Get the remote address, handling IPv6-mapped IPv4 addresses
    let remoteAddress = socket.remoteAddress;
    if (remoteAddress.includes('::ffff:')) {
      remoteAddress = remoteAddress.replace(/^.*:/, '');
    }
    
    console.log(`New TCP connection from ${remoteAddress}`);

    // Store the connection
    tcpConnections.set(remoteAddress, socket);

    // Handle incoming data
    socket.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Call the message callback with received message
        if (messageCallback) {
          messageCallback({
            from: message.sender || `User@${remoteAddress}`,
            content: message.content,
            timestamp: message.timestamp
          });
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });

    // Handle socket close
    socket.on('close', () => {
      console.log(`Connection from ${remoteAddress} closed`);
      tcpConnections.delete(remoteAddress);
    });

    // Handle errors
    socket.on('error', (err) => {
      console.error(`Socket error from ${remoteAddress}:`, err);
      tcpConnections.delete(remoteAddress);
    });
  });

  // Handle server errors
  tcpServer.on('error', (err) => {
    console.error('TCP Server error:', err);
  });

  // Start listening
  tcpServer.listen(TCP_PORT, () => {
    console.log(`TCP server listening on port ${TCP_PORT}`);
  });

  // Return API for the messaging service
  return {
    sendMessage: (message, recipients = null) => {
      return sendMessageToAllPeers(message, recipients);
    },
    close: () => {
      if (tcpServer) {
        tcpServer.close();
        tcpServer = null;
      }
      
      // Close all connections
      for (const socket of tcpConnections.values()) {
        socket.destroy();
      }
      tcpConnections.clear();
    }
  };
}

// Connect to a peer if not already connected
function connectToPeer(ip, port) {
  if (tcpConnections.has(ip)) {
    return Promise.resolve(); // Already connected
  }
  
  return new Promise((resolve, reject) => {
    try {
      const socket = new net.Socket();
      
      socket.on('error', (err) => {
        console.error(`Error connecting to ${ip}:${port}:`, err);
        tcpConnections.delete(ip);
        reject(err);
      });
      
      socket.on('close', () => {
        console.log(`Connection to ${ip}:${port} closed`);
        tcpConnections.delete(ip);
      });
      
      socket.connect(port, ip, () => {
        console.log(`Connected to ${ip}:${port}`);
        tcpConnections.set(ip, socket);
        resolve();
      });
    } catch (err) {
      console.error(`Exception connecting to ${ip}:${port}:`, err);
      reject(err);
    }
  });
}

// Send a message to all connected peers or specific recipients
async function sendMessageToAllPeers(message, recipients = null) {
  const messageString = JSON.stringify(message);
  const messageBuffer = Buffer.from(messageString);
  
  // Create an array to track successful sends
  const sentTo = [];
  const failed = [];
  
  // If recipients is specified, only send to those IPs
  const targetPeers = recipients || Array.from(tcpConnections.keys());
  
  // Send to each connected peer
  for (const ip of targetPeers) {
    // Skip self
    if (ip === localIp) continue;
    
    try {
      // Get socket if connected
      let socket = tcpConnections.get(ip);
      
      // Connect if not already connected (and ip contains port info)
      if (!socket && ip.includes(':')) {
        const [peerIp, peerPort] = ip.split(':');
        try {
          await connectToPeer(peerIp, parseInt(peerPort));
          socket = tcpConnections.get(peerIp);
        } catch (err) {
          failed.push(ip);
          continue;
        }
      }
      
      // Send message if we have a socket
      if (socket) {
        socket.write(messageBuffer, (err) => {
          if (err) {
            console.error(`Error sending to ${ip}:`, err);
            failed.push(ip);
          } else {
            sentTo.push(ip);
          }
        });
      } else {
        failed.push(ip);
      }
    } catch (err) {
      console.error(`Exception sending to ${ip}:`, err);
      failed.push(ip);
    }
  }
  
  return { sentTo, failed };
}

module.exports = {
  initMessaging
};