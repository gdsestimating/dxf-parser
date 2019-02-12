const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'dxf-parser.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'DxfParser',
    libraryTarget: 'umd',
    libraryExport: 'default',
    globalObject: 'typeof self !== \'undefined\' ? self : this'
  }
};