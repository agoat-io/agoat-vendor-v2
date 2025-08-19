const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const DIST_DIR = path.join(__dirname, 'federated-dist');

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Remove query string and decode URL
  const url = decodeURIComponent(req.url.split('?')[0]);
  
  // Map the URL to file path
  let filePath = path.join(DIST_DIR, url);
  
  // If it's a directory, serve index.html
  if (url === '/') {
    filePath = path.join(DIST_DIR, 'index.html');
  }
  
  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    
    // Determine content type
    let contentType = 'text/plain';
    if (filePath.endsWith('.js')) {
      contentType = 'application/javascript';
    } else if (filePath.endsWith('.html')) {
      contentType = 'text/html';
    } else if (filePath.endsWith('.css')) {
      contentType = 'text/css';
    }
    
    // Read and serve the file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal server error');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Federated module server running on http://localhost:${PORT}`);
  console.log(`Remote entry available at: http://localhost:${PORT}/remoteEntry.js`);
});