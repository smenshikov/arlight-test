let connections = [];
let currentTheme = 'light';
let heartbeatIntervals = new Map();

const workerUtils = {
  // Broadcast message to all connections
  broadcast(message) {
    connections.forEach(connection => {
      try {
        connection.port.postMessage(message);
      } catch (error) {
        // Connection is dead, remove it
        console.error('Failed to send message to connection:', error);
        removeConnection(connection.id);
      }
    });
  },
};

self.addEventListener('connect', event => {
  const port = event.ports[0];
  const connectionId = Date.now() + Math.random();

  connections.push({ port, id: connectionId, lastSeen: Date.now() });

  const heartbeatInterval = setInterval(() => {
    checkConnection(connectionId);
  }, 2000);

  heartbeatIntervals.set(connectionId, heartbeatInterval);

  broadcastTabCount();

  port.postMessage({
    type: 'theme',
    theme: currentTheme,
  });
  port.addEventListener('message', event => {
    const message = event.data;

    switch (message.type) {
      case 'heartbeat': {
        // Connection is alive, update last seen timestamp
        const connection = connections.find(c => c.id === connectionId);
        if (connection) {
          connection.lastSeen = Date.now();
        }
        break;
      }
      case 'disconnect':
        removeConnection(connectionId);
        break;
      case 'initTheme':
        currentTheme = message.theme;
        broadcastTheme();
        break;
      case 'theme':
        currentTheme = message.theme;
        broadcastTheme();
        break;
      case 'getTabCount':
        port.postMessage({
          type: 'tabCount',
          count: connections.length,
        });
        break;
      case 'getTheme':
        port.postMessage({
          type: 'theme',
          theme: currentTheme,
        });
        break;
    }
  });

  port.addEventListener('close', () => {
    removeConnection(connectionId);
  });

  port.start();
});

function checkConnection(connectionId) {
  const connection = connections.find(c => c.id === connectionId);
  if (!connection) {
    removeConnection(connectionId);
    return;
  }

  if (Date.now() - connection.lastSeen > 5000) {
    removeConnection(connectionId);
  }
}

function removeConnection(connectionId) {
  const index = connections.findIndex(c => c.id === connectionId);
  if (index > -1) {
    connections.splice(index, 1);

    const interval = heartbeatIntervals.get(connectionId);
    if (interval) {
      clearInterval(interval);
      heartbeatIntervals.delete(connectionId);
    }

    broadcastTabCount();
  }
}

// Broadcast tab count to all connected tabs
function broadcastTabCount() {
  workerUtils.broadcast({
    type: 'tabCount',
    count: connections.length,
  });
}

// Broadcast theme to all connected tabs
function broadcastTheme() {
  workerUtils.broadcast({
    type: 'theme',
    theme: currentTheme,
  });
}
