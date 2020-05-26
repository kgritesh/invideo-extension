const { CheckerPlugin } = require("awesome-typescript-loader");
const webpack = require("webpack");
const path = require("path");
const pjson = require("./package.json");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const ArchivePlugin = require("webpack-archive-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

const node_dir = path.join(__dirname, "node_modules");
const env = process.env.NODE_ENV || "development";
const optimize = webpack.optimize;

const plugins = [
  new webpack.DefinePlugin({
    "process.env.NODE_ENV": JSON.stringify(env),
  }),
  new webpack.ProvidePlugin({
    $: "jquery",
    jQuery: "jquery",
  }),
  new CheckerPlugin(),
  new CopyWebpackPlugin([
    {
      from: "src/manifest.json",
      transform: function (content, path) {
        const newContent = JSON.stringify({
          description: process.env.npm_package_description,
          version: process.env.npm_package_version,
          name: process.env.npm_package_name,

          ...JSON.parse(content.toString()),
        });
        return newContent;
      },
    },
    {
      from: "src/img",
      to: "img",
    },
    {
      from: "src/page_action",
      to: "page_action",
    },
  ]),
];

if (env === "production") {
  plugins.push(
    new optimize.AggressiveMergingPlugin(),
    new optimize.OccurrenceOrderPlugin(),
    new UglifyJsPlugin({
      sourceMap: false,
    })
  );
}

module.exports = {
  mode: process.env.NODE_ENV,
  devtool: "inline-source-map",
  entry: {
    content: path.join(__dirname, "src/content/content.ts"),
    background: path.join(__dirname, "src/background/background.ts"),
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].bundle.js",
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.ts?$/,
        use: 'awesome-typescript-loader?{configFileName: "tsconfig.json"}',
      },
    ],
  },
  plugins,
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      jquery: path.join(node_dir, "/jquery/src/jquery.js"),
    },
  },
};
