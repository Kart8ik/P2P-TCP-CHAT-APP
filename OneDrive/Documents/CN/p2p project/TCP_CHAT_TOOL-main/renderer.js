// DOM elements
const messagesList = document.getElementById('messages');
const messageInput = document.getElementById('message-text');
const sendButton = document.getElementById('send-btn');
const peersList = document.getElementById('peers-list');
const usernameInput = document.getElementById('username-input');
const setUsernameButton = document.getElementById('set-username-btn');
const connectionStatus = document.getElementById('connection-status');

// App state
let currentPeers = [];
let username = '';

// Initialize the app
async function init() {
  // Set initial status
  updateConnectionStatus('yellow', 'Looking for peers...');
  
  // Load saved username if exists
  const savedUsername = localStorage.getItem('username');
  if (savedUsername) {
    usernameInput.value = savedUsername;
    await setUsername(savedUsername);
  }
  
  // Set up event listeners
  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  setUsernameButton.addEventListener('click', async () => {
    const newUsername = usernameInput.value.trim();
    if (newUsername) {
      await setUsername(newUsername);
    }
  });
  
  // Register callback for peer updates
  window.api.onUpdatePeers((peers) => {
    currentPeers = peers;
    updatePeersList(peers);
    
    // Update connection status based on peer count
    if (peers.length > 0) {
      updateConnectionStatus('green', `Connected to ${peers.length} peer${peers.length > 1 ? 's' : ''}`);
    } else {
      updateConnectionStatus('yellow', 'Looking for peers...');
    }
  });
  
  // Register callback for incoming messages
  window.api.onNewMessage((message) => {
    appendMessage(message);
  });
  
  // Get initial peers list
  const initialPeers = await window.api.getPeers();
  currentPeers = initialPeers;
  updatePeersList(initialPeers);
}

// Send a message to all peers
async function sendMessage() {
  const content = messageInput.value.trim();
  if (!content) return;
  
  // Clear input
  messageInput.value = '';
  
  // Create message object
  const message = {
    content,
    sender: username || 'Anonymous',
    timestamp: new Date().toISOString()
  };
  
  // Send to all peers
  try {
    await window.api.sendMessage(message);
    
    // Display in UI
    appendMessage({
      content,
      from: 'You',
      timestamp: message.timestamp
    });
  } catch (error) {
    console.error('Error sending message:', error);
    appendSystemMessage('Failed to send message. Check your connection.');
  }
}

// Set username
async function setUsername(newUsername) {
  try {
    username = await window.api.setUsername(newUsername);
    localStorage.setItem('username', username);
    appendSystemMessage(`Username set to: ${username}`);
  } catch (error) {
    console.error('Error setting username:', error);
  }
}

// Update the peers list in the UI
function updatePeersList(peers) {
  peersList.innerHTML = '';
  
  if (peers.length === 0) {
    const noPeers = document.createElement('div');
    noPeers.className = 'no-peers';
    noPeers.textContent = 'No peers found yet...';
    peersList.appendChild(noPeers);
    return;
  }
  
  peers.forEach(peer => {
    const peerElement = document.createElement('div');
    peerElement.className = 'peer-item';
    peerElement.innerHTML = `
      <span class="peer-name">${peer.username || 'Anonymous'}</span>
      <span class="peer-address">${peer.ip}:${peer.port}</span>
    `;
    peersList.appendChild(peerElement);
  });
}

// Append a message to the chat
function appendMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  
  const sender = message.from || message.sender || 'Unknown';
  const isSystem = sender === 'System';
  const isYou = sender === 'You';
  
  if (isSystem) {
    messageElement.className += ' system-message';
  } else if (isYou) {
    messageElement.className += ' own-message';
  }
  
  const timestamp = new Date(message.timestamp);
  const timeString = timestamp.toLocaleTimeString();
  
  messageElement.innerHTML = `
    ${!isSystem ? `<div class="message-header">
      <span class="message-sender">${sender}</span>
      <span class="message-time">${timeString}</span>
    </div>` : ''}
    <div class="message-content">${escapeHtml(message.content)}</div>
  `;
  
  messagesList.appendChild(messageElement);
  
  // Scroll to bottom
  messagesList.scrollTop = messagesList.scrollHeight;
}

// Append a system message
function appendSystemMessage(content) {
  appendMessage({
    content,
    from: 'System',
    timestamp: new Date().toISOString()
  });
}

// Update connection status indicator
function updateConnectionStatus(color, text) {
  let indicator;
  
  switch (color) {
    case 'green':
      indicator = '🟢';
      break;
    case 'yellow':
      indicator = '🟡';
      break;
    case 'red':
      indicator = '🔴';
      break;
    default:
      indicator = '⚪';
  }
  
  connectionStatus.innerHTML = `${indicator} ${text}`;
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
