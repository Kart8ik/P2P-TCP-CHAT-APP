// UI helper functions for the renderer process
// This module provides consistent UI update functions that can be used by renderer.js

// Format timestamp to a readable string
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Create a peer element for the peers list
  function createPeerElement(peer) {
    const peerElement = document.createElement('div');
    peerElement.className = 'peer-item';
    
    const statusIndicator = document.createElement('span');
    statusIndicator.className = 'peer-status online';
    
    const peerName = document.createElement('span');
    peerName.className = 'peer-name';
    peerName.textContent = peer.username || 'Anonymous';
    
    const peerAddress = document.createElement('span');
    peerAddress.className = 'peer-address';
    peerAddress.textContent = `${peer.ip}:${peer.port}`;
    
    peerElement.appendChild(statusIndicator);
    peerElement.appendChild(peerName);
    peerElement.appendChild(peerAddress);
    
    return peerElement;
  }
  
  // Create a message element
  function createMessageElement(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    
    const sender = message.from || message.sender || 'Unknown';
    const isSystem = sender === 'System';
    const isOwn = sender === 'You';
    
    if (isSystem) {
      messageElement.className += ' system-message';
    } else if (isOwn) {
      messageElement.className += ' own-message';
    }
    
    // Create message header (sender + timestamp)
    if (!isSystem) {
      const messageHeader = document.createElement('div');
      messageHeader.className = 'message-header';
      
      const senderElement = document.createElement('span');
      senderElement.className = 'message-sender';
      senderElement.textContent = sender;
      
      const timeElement = document.createElement('span');
      timeElement.className = 'message-time';
      timeElement.textContent = formatTimestamp(message.timestamp);
      
      messageHeader.appendChild(senderElement);
      messageHeader.appendChild(timeElement);
      messageElement.appendChild(messageHeader);
    }
    
    // Create message content
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.textContent = message.content;
    messageElement.appendChild(contentElement);
    
    return messageElement;
  }
  
  // Update connection status indicator with color and text
  function updateConnectionStatus(statusElement, color, text) {
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
    
    statusElement.innerHTML = `${indicator} ${text}`;
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
  
  // Format peers count with appropriate plural form
  function formatPeersCount(count) {
    return `${count} peer${count !== 1 ? 's' : ''}`;
  }
  
  // Parse URLs in text and make them clickable
  function linkifyText(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`);
  }
  
  // Export all UI helper functions
  module.exports = {
    formatTimestamp,
    createPeerElement,
    createMessageElement,
    updateConnectionStatus,
    escapeHtml,
    formatPeersCount,
    linkifyText
  };