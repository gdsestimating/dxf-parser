import * as fs from 'fs';
import * as path from 'path';
import DxfParser from '../esm/index.js';
import should from 'should';
import approvals from 'approvals';

// Note: fialOnLineEndingDifferences doesn't appear to work right now. Filed an issue with approvals.
approvals.configure({
	reporters: [
		'vscode',
		'opendiff',
		'p4merge',
		'tortoisemerge',
		'nodediff',
		'gitdiff'
	],
	normalizeLineEndingsTo: '\n',
	EOL: '\n',
	maxLaunches: 5,
	failOnLineEndingDifferences: false,
	stripBOM: true,
});

const __dirname = path.dirname(new URL(import.meta.url).pathname)

describe('Parser', function() {

	it('should parse the dxf header variables into an object', function(done) {
		var file = fs.createReadStream(__dirname + '/data/header.dxf', { encoding: 'utf8' });
		var parser = new DxfParser();

		parser.parseStream(file).then((result) => {
			var expected = fs.readFileSync(__dirname + '/data/header.parser.out', {encoding: 'utf8'});
			result.should.eql(JSON.parse(expected));
			done();
		}, (err) => {
			should.not.exist(err);
		});
	});

	var tables;

	it('should parse the tables section without error', function(done) {
		var file = fs.createReadStream(__dirname + '/data/tables.dxf', { encoding: 'utf8' });
		var parser = new DxfParser();

		parser.parseStream(file).then((result) => {
			tables = result.tables;
			fs.writeFileSync(path.join(__dirname, 'data', 'layer-table.actual.json'), JSON.stringify(tables.layer, null, 2));
			fs.writeFileSync(path.join(__dirname, 'data', 'ltype-table.actual.json'), JSON.stringify(tables.lineType, null, 2));
            fs.writeFileSync(path.join(__dirname, 'data', 'viewport-table.actual.json'), JSON.stringify(tables.viewPort, null, 2));
			done();
		}, (err) => {
			var errMsg = err ? err.stack : undefined;
			should.not.exist(err, errMsg);
		})
	});

	it('should parse the dxf layers', function() {
		should.exist(tables);
		tables.should.have.property('layer');

        var expectedOutputFilePath = path.join(__dirname,'data','layer-table.expected.json');
        
		var expected = fs.readFileSync(expectedOutputFilePath, {encoding: 'utf8'});
		tables.layer.should.eql(JSON.parse(expected));
	});

	it('should parse the dxf ltype table', function() {
		should.exist(tables);
		tables.should.have.property('lineType');

        var expectedOutputFilePath = path.join(__dirname,'data','ltype-table.expected.json');

		var expected = fs.readFileSync(expectedOutputFilePath, {encoding: 'utf8'});
		tables.lineType.should.eql(JSON.parse(expected));
	});
    
    it('should parse the dxf viewPort table', function() {
		should.exist(tables);
		tables.should.have.property('viewPort');

        var expectedOutputFilePath = path.join(__dirname,'data','viewport-table.expected.json');

		var expected = fs.readFileSync(expectedOutputFilePath, {encoding: 'utf8'});
		tables.viewPort.should.eql(JSON.parse(expected));
	});

	it('should parse a complex BLOCKS section', function() {
		verifyDxf(path.join(__dirname, 'data', 'blocks.dxf'))
	});
	
	it('should parse a simple BLOCKS section', function() {
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
    
    it('should parse POLYLINES', function() {
		verifyDxf(path.join(__dirname, 'data', 'polylines.dxf'));
    });

	it('should parse ELLIPSE entities', function() {
        var file = fs.readFileSync(path.join(__dirname, 'data', 'ellipse.dxf'), 'utf8');

		var parser = new DxfParser();
		var dxf;
		try {
			dxf = parser.parseSync(file);
			fs.writeFileSync(path.join(__dirname, 'data', 'ellipse.actual.json'), JSON.stringify(dxf, null, 2));
		}catch(err) {
			should.not.exist(err);
		}
		should.exist(dxf);


		var expected = fs.readFileSync(path.join(__dirname, 'data', 'ellipse.expected.json'), {encoding: 'utf8'});
		dxf.should.eql(JSON.parse(expected));
	});
	
	it('should parse SPLINE entities', function() {
        var file = fs.readFileSync(path.join(__dirname, 'data', 'splines.dxf'), 'utf8');

		var parser = new DxfParser();
		var dxf;
		try {
			dxf = parser.parseSync(file);
			fs.writeFileSync(path.join(__dirname, 'data', 'splines.actual.json'), JSON.stringify(dxf, null, 2));
		}catch(err) {
			should.not.exist(err);
		}
		should.exist(dxf);

		var expected = fs.readFileSync(path.join(__dirname, 'data', 'splines.expected.json'), {encoding: 'utf8'});
		dxf.should.eql(JSON.parse(expected));
	});

	it('should parse EXTENDED DATA', function() {
        var file = fs.readFileSync(path.join(__dirname, 'data', 'extendeddata.dxf'), 'utf8');

		var parser = new DxfParser();
		var dxf;
		try {
			dxf = parser.parseSync(file);
			fs.writeFileSync(path.join(__dirname, 'data', 'extendeddata.actual.json'), JSON.stringify(dxf, null, 2));
		}catch(err) {
			should.not.exist(err);
		}
		should.exist(dxf);

		var expected = fs.readFileSync(path.join(__dirname, 'data', 'extendeddata.expected.json'), {encoding: 'utf8'});
		dxf.should.eql(JSON.parse(expected));
	});
	
	it('should parse SPLINE entities that are like arcs and circles', function() {
		verifyDxf(path.join(__dirname, 'data', 'arcs-as-splines.dxf'));
	});

	it('should parse ARC entities (1)', function() {
		verifyDxf(path.join(__dirname, 'data', 'arc1.dxf'));
	});

	it('should parse MTEXT entities', function() {
		verifyDxf(path.join(__dirname, 'data', 'mtext-test.dxf'));
	});
	
	it('should parse MULTILEADER entities', function() {
		verifyDxf(path.join(__dirname, 'data', 'leaders.dxf'));
	});
});

function verifyDxf(sourceFilePath) {
	var baseName = path.basename(sourceFilePath, '.dxf');
	var sourceDirectory = path.dirname(sourceFilePath);

	var file = fs.readFileSync(sourceFilePath, 'utf8');
	
	var parser = new DxfParser();
	var dxf = parser.parse(file);

	approvals.verifyAsJSON(sourceDirectory, baseName, dxf);
}