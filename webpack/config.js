/**
 * Webpack config common to all CMI sources. This will create bundles for
 * page.js and transcript.js in the public/js directory of the source.
 *
 * Changes made to this file will affect all sources. Sources specific changes
 * should be made in the source weback.config.js.
 */
const path = require("path");

module.exports = {
  stats: {
    colors: true
  },

  resolve: {
    alias: {
      "common": path.resolve(__dirname, "../../cmi-common/src/js"),
      "acim": path.resolve(__dirname, "../../cmi-acim/src/js"),
      "oe": path.resolve(__dirname, "../../cmi-oe/src/js"),
      "acol": path.resolve(__dirname, "../../cmi-acol/src/js"),
      "col": path.resolve(__dirname, "../../cmi-col/src/js"),
      "ftcm": path.resolve(__dirname, "../../cmi-ftcm/src/js"),
      "jsb": path.resolve(__dirname, "../../cmi-jsb/src/js"),
      "raj": path.resolve(__dirname, "../../cmi-raj/src/js"),
      "pwom": path.resolve(__dirname, "../../cmi-pwom/src/js"),
      "wom": path.resolve(__dirname, "../../cmi-wom/src/js")
    }
  },

  entry: {
    transcript: ["./src/js/transcript.js"],
    page: ["./src/js/page.js"]
  },
  output: {
    publicPath: "/public/js",
    filename: "[name].js"
  },
  optimization: {
    splitChunks: {
      chunks: "all",
    }
  },
  module: {
    rules: [
      {
        test: /\.((png)|(eot)|(woff)|(woff2)|(ttf)|(svg)|(gif))(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file-loader?name=/[hash].[ext]"
      },
      {
        test: /\.js?$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        query: {cacheDirectory: true}
      }
    ]
  },
  plugins: [ ]
};

