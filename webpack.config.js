const path = require('path');

module.exports = {
	entry: './dist/index.js',
	output: {
		filename: 'dxf-parser.js',
		path: path.resolve(__dirname, 'dist'),
		library: {
			name: 'DxfParser',
			type: 'umd',
			export: 'DxfParser'
		},
		globalObject: 'typeof self !== \'undefined\' ? self : this'
	}
};
