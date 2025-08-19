const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'federated-dist'),
    filename: '[name].[contenthash].js',
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
              '@babel/preset-env',
              '@babel/preset-react',
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
};