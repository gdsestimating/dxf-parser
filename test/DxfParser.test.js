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

	var tables;

	it('should parse the tables section without error', function(done) {
		var file = fs.createReadStream(__dirname + '/data/tables.dxf', { encoding: 'utf8' });
		var parser = new DxfParser();

		parser.parseStream(file, function(err, result) {
			should.not.exist(err);
			tables = result.tables;
			fs.writeFileSync(path.join(__dirname, 'data', 'layer-table.actual.json'), JSON.stringify(tables.layer, null, 2));
			fs.writeFileSync(path.join(__dirname, 'data', 'ltype-table.actual.json'), JSON.stringify(tables.lineType, null, 2));
			done();
		});
	});

	it('should parse the dxf layers', function() {
		should.exist(tables);
		tables.should.have.property('layer');

		//fs.writeFileSync(__dirname + '/data/layer-table.actual.json', JSON.stringify(tables.layer, null, 2));
		var expected = fs.readFileSync(path.join(__dirname,'data','layer-table.expected.json'), {encoding: 'utf8'});
		tables.layer.should.eql(JSON.parse(expected));
	});

	it('should parse the dxf ltype table', function() {
		should.exist(tables);
		tables.should.have.property('lineType');

		//fs.writeFileSync(__dirname + '/data/ltype-table.actual.json', JSON.stringify(tables.lineType, null, 2));

		var expected = fs.readFileSync(path.join(__dirname,'data','ltype-table.expected.json'), {encoding: 'utf8'});
		tables.lineType.should.eql(JSON.parse(expected));
	});

	it('should parse the BLOCKS section', function() {
		var file = fs.readFileSync(path.join(__dirname, 'data', 'blocks.dxf'), 'utf8');

		var parser = new DxfParser();
		var dxf;
		try {
			dxf = parser.parseSync(file);
			fs.writeFileSync(path.join(__dirname, 'data', 'blocks.actual.json'), JSON.stringify(dxf, null, 2));
		}catch(err) {
			should.not.exist(err);
		}
		should.exist(dxf);


		var expected = fs.readFileSync(path.join(__dirname,'data','blocks.expected.json'), {encoding: 'utf8'});
		dxf.should.eql(JSON.parse(expected));
	});
	
	it('should parse the BLOCKS section', function() {
		var file = fs.readFileSync(path.join(__dirname, 'data', 'blocks2.dxf'), 'utf8');

		var parser = new DxfParser();
		var dxf;
		try {
			dxf = parser.parseSync(file);
			fs.writeFileSync(path.join(__dirname, 'data', 'blocks2.actual.json'), JSON.stringify(dxf, null, 2));
		}catch(err) {
			should.not.exist(err);
		}
		should.exist(dxf);


		var expected = fs.readFileSync(path.join(__dirname, 'data', 'blocks2.expected.json'), {encoding: 'utf8'});
		dxf.should.eql(JSON.parse(expected));
	});
});