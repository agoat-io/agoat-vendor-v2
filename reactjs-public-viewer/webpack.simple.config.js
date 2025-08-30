const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: 'http://localhost:3001/',
    clean: true,
  },
  
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: 'defaults' }],
              ['@babel/preset-react', { runtime: 'automatic' }],
              '@babel/preset-typescript'
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
    
    new webpack.container.ModuleFederationPlugin({
      name: 'viewer',
      filename: 'remoteEntry.js',
      exposes: {
        './PostsList': './src/components/PostsList',
        './PostViewer': './src/components/PostViewer',
        './App': './src/App'
      },
      shared: {
        react: { 
          singleton: true, 
          requiredVersion: '^18.3.1',
          eager: true,
          strictVersion: true
        },
        'react-dom': { 
          singleton: true, 
          requiredVersion: '^18.3.1',
          eager: true,
          strictVersion: true
        },
        axios: { 
          singleton: true,
          requiredVersion: '^1.11.0',
          eager: true
        },
        marked: { 
          singleton: true,
          requiredVersion: '^16.2.0',
          eager: true
        }
      }
    }),
    
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  
  devServer: {
    port: 3001,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    static: {
      directory: path.join(__dirname, 'public'),
    },
  },
};
