const path = require('path');
const EsmWebpackPlugin = require("@purtuga/esm-webpack-plugin");

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'dxf-parser-module.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'LIB',
    libraryTarget: 'var',
//    libraryExport: 'default',
    globalObject: 'typeof self !== \'undefined\' ? self : this'
  },
  plugins:[new EsmWebpackPlugin()]
};
