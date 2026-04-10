// Shared Worker for synchronization between tabs
let connections = [];
let currentTheme = 'light';
let tabCount = 0;
let heartbeatIntervals = new Map();

// Common utilities
const workerUtils = {
    // Broadcast message to all connections
    broadcast(message) {
        connections.forEach(connection => {
            try {
                connection.port.postMessage(message);
            } catch (error) {
                // Connection is dead, remove it
                removeConnection(connection.id);
            }
        });
    }
};

// Handle new connections
self.addEventListener('connect', (event) => {
    const port = event.ports[0];
    const connectionId = Date.now() + Math.random();
    
    connections.push({ port, id: connectionId, lastSeen: Date.now() });
    
    // Start heartbeat for this connection
    const heartbeatInterval = setInterval(() => {
        checkConnection(connectionId);
    }, 2000);
    
    heartbeatIntervals.set(connectionId, heartbeatInterval);
    
    // Update tab count based on actual connections
    updateTabCount();
    
    // Send current theme to new tab
    port.postMessage({
        type: 'theme',
        theme: currentTheme
    });
    
    // Handle messages from this tab
    port.addEventListener('message', (event) => {
        const message = event.data;
        
        // Update last seen time for heartbeat
        const connection = connections.find(c => c.id === connectionId);
        if (connection) {
            connection.lastSeen = Date.now();
        }
        
        switch (message.type) {
            case 'heartbeat':
                // Connection is alive, just update last seen
                break;
            case 'theme':
                currentTheme = message.theme;
                broadcastTheme();
                break;
            case 'getTabCount':
                port.postMessage({
                    type: 'tabCount',
                    count: connections.length
                });
                break;
            case 'getTheme':
                port.postMessage({
                    type: 'theme',
                    theme: currentTheme
                });
                break;
        }
    });
    
    // Handle disconnection
    port.addEventListener('close', () => {
        removeConnection(connectionId);
    });
    
    port.start();
});

// Check if connection is still alive
function checkConnection(connectionId) {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) {
        removeConnection(connectionId);
        return;
    }
    
    // If no heartbeat for 5 seconds, consider connection dead
    if (Date.now() - connection.lastSeen > 5000) {
        removeConnection(connectionId);
    }
}

// Remove connection and update counters
function removeConnection(connectionId) {
    const index = connections.findIndex(c => c.id === connectionId);
    if (index > -1) {
        connections.splice(index, 1);
        
        // Clear heartbeat interval
        const interval = heartbeatIntervals.get(connectionId);
        if (interval) {
            clearInterval(interval);
            heartbeatIntervals.delete(connectionId);
        }
        
        updateTabCount();
    }
}

// Update tab count based on actual connections
function updateTabCount() {
    tabCount = connections.length;
    broadcastTabCount();
}

// Broadcast tab count to all connected tabs
function broadcastTabCount() {
    workerUtils.broadcast({
        type: 'tabCount',
        count: connections.length
    });
}

// Broadcast theme to all connected tabs
function broadcastTheme() {
    workerUtils.broadcast({
        type: 'theme',
        theme: currentTheme
    });
}
