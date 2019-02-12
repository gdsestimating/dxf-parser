const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'dxf-parser.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'DxfParser',
    libraryTarget: 'var',
    libraryExport: 'default'
  }
};