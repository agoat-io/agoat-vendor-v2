const { merge } = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common.config.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    static: {
      directory: path.join(__dirname, 'public'),
    },
    allowedHosts: 'all',
    client: {
      overlay: false,
    },
  },
  output: {
    publicPath: 'http://localhost:3000/',
  },
});
