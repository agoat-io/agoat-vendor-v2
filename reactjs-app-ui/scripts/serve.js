const express = require('express');
const path = require('path');
const history = require('connect-history-api-fallback');

const app = express();
const PORT = process.env.PORT || 3000;
const BUILD_DIR = path.join(__dirname, '../dist');

// History API Fallback for client-side routing
app.use(history({
  // Don't rewrite requests for static assets
  rewrites: [
    { from: /^\/static\/.*$/, to: function(context) {
      return context.parsedUrl.pathname;
    }},
    { from: /^\/remoteEntry\.js$/, to: function(context) {
      return context.parsedUrl.pathname;
    }}
  ]
}));

// Serve static files
app.use(express.static(BUILD_DIR));

// API proxy
app.use('/api', (req, res) => {
  // Proxy API requests to the Go backend
  const targetUrl = `http://localhost:8080${req.url}`;
  console.log(`Proxying API request: ${req.method} ${req.url} -> ${targetUrl}`);
  
  // For now, just return a placeholder response
  res.json({ message: 'API proxy not implemented yet' });
});

// Catch all handler for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 React.js app serving on http://localhost:${PORT}`);
  console.log(`📁 Serving from: ${BUILD_DIR}`);
  console.log(`🔗 API proxy: /api/* → http://localhost:8080/api/*`);
});
