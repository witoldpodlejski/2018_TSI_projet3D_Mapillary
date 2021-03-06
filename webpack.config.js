var path = require('path');
var Uglify = require("uglifyjs-webpack-plugin");

module.exports = {
  entry: {
      'itowns-mapillary': [path.resolve(__dirname, 'itowns-mapillary.js') ]
  },
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  devServer: {
    publicPath: '/dist/'
  },
  plugins: [
      new Uglify()
  ]
};
