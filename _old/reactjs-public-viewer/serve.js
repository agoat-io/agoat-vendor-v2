'use strict';

const express = require('express');
const path = require('path');
const history = require('connect-history-api-fallback');

const app = express();
const PORT = process.env.PORT || 3001;
const BUILD_DIR = path.join(__dirname, 'federated-dist');

// Basic CORS to allow host app to load remoteEntry.js
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

// History API Fallback for client-side routing (before static files)
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

app.use(express.static(BUILD_DIR));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Federated viewer static server listening on http://localhost:${PORT}`);
});