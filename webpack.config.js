//@ts-check

'use strict';

const path = require('path');
const webpack = require("webpack");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

const babelCommonRules = {
  loader: "babel-loader",
  options: {
    presets: ["@babel/preset-env", "@babel/preset-react"],
  },
};

const tsLoader = {
  loader: "ts-loader",
  options: {
    transpileOnly: true,
  },
};

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'node',
	mode: 'development',

  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
    fallback: {
      buffer: require.resolve("buffer"),
      path: require.resolve("path-browserify"),
      url: require.resolve("url")
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.tsx?$/,
        use: [tsLoader],
        exclude: path.resolve(__dirname, "node_modules")
      }
    ]
  },
  devtool: 'source-map',
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
};

const mainWebViewConfig = {
  mode: "development",
  entry: "./webview/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    }),
    new NodePolyfillPlugin()
  ],
  resolve: {
    mainFields: ["browser", "module", "main"],
    extensions: [".js", ".ts", ".tsx"]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [tsLoader],
        exclude: path.resolve(__dirname, "node_modules"),
      },
      {
        test: /\.(png|svg)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "images/[hash]-[name].[ext]",
            },
          },
        ],
      },
      {
        test: /\.(js)$/,
        exclude: path.resolve(__dirname, "node_modules"),
        use: babelCommonRules,
      },
    ],
  },
};

module.exports = [ extensionConfig, mainWebViewConfig ];