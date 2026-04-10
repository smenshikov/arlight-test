const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from current directory
app.use(express.static(__dirname));

// Enable CORS for Shared Worker
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  // Handle Shared Worker headers
  if (req.url.endsWith('.js')) {
    res.header('Content-Type', 'application/javascript');
    res.header('Service-Worker-Allowed', '/');
  }

  next();
});

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, 'localhost', () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Open your browser and navigate to http://localhost:3000');
  console.log('Shared Worker will work correctly on localhost');
});
