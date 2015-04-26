var DxfParser = require('../');
var fs = require('fs');
var should = require('should');
var path = require('path');

describe('Parser', function() {
	it('should parse the dxf header variables into an object', function(done) {
		var file = fs.createReadStream(__dirname + '/data/header.dxf', { encoding: 'utf8' });
		var parser = new DxfParser();

		parser.parseStream(file, function(err, result) {
			should.not.exist(err);
			var expected = fs.readFileSync(__dirname + '/data/header.parser.out', {encoding: 'utf8'});
			result.should.eql(JSON.parse(expected));
			done();
		});
	});

	it('should parse the dxf layers', function(done) {
		var file = fs.createReadStream(__dirname + '/data/tables.dxf', { encoding: 'utf8' });
		var parser = new DxfParser();

		parser.parseStream(file, function(err, result) {
			should.not.exist(err);
			result.tables.layers.should.eql({ '0': { name: '0', color: 16777215 }, 'Layer 1': { name: 'Layer 1', color: 16777215}});
			done();
		});
	});

	it('should parse the dxf ltype table', function(done) {
		var file = fs.createReadStream(__dirname + '/data/tables.dxf', { encoding: 'utf8' });
		var parser = new DxfParser();

		parser.parseStream(file, function(err, result) {
			should.not.exist(err);
			var expected = fs.readFileSync(__dirname + '/data/tables.parser.out', {encoding: 'utf8'})
			result.tables.lineTypes.should.eql(JSON.parse(expected));
			done();
		});
	});

	it('should parse the BLOCKS section', function() {
		var file = fs.readFileSync(path.join(__dirname, 'data', 'blocks.dxf'), 'utf8');

		var parser = new DxfParser();
		var dxf;
		try {
			dxf = parser.parseSync(file);
		}catch(err) {
			should.not.exist(err);
		}
		should.exist(dxf);
		var expected = require('./data/blocks.json');
		dxf.should.eql(expected);
	});
});