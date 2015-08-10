var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var b = browserify(path.join(__dirname, '..', 'lib', 'DxfParser.js'), {standalone: 'dxfParser'});
b.bundle().pipe(fs.createWriteStream(path.join(__dirname, '..', 'dist', '/dxf-parser.js')));