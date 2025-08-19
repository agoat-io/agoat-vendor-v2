const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const path = require('path');

const app = express();
const config = require('./webpack.simple.config.js');
const compiler = webpack(config);

// Enable CORS for all origins
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

// Tell express to use the webpack-dev-middleware and use the webpack.config.js
// configuration file as a base.
app.use(
  webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
  })
);

// Serve static files from public directory
app.use(express.static('public'));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Federated module server listening on port ${PORT}!`);
  console.log(`Remote entry available at: http://localhost:${PORT}/remoteEntry.js`);
});
