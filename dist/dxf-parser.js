(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.DxfParser = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * AutoCad files sometimes use an indexed color value between 1 and 255 inclusive.
 * Each value corresponds to a color. index 1 is red, that is 16711680 or 0xFF0000.
 * index 0 and 256, while included in this array, are actually reserved for inheritance
 * values in AutoCad so they should not be used for index color lookups.
 */

module.exports = [
 0,
 16711680,
 16776960,
 65280,
 65535,
 255,
 16711935,
 16777215,
 8421504,
 12632256,
 16711680,
 16744319,
 13369344,
 13395558,
 10027008,
 10046540,
 8323072,
 8339263,
 4980736,
 4990502,
 16727808,
 16752511,
 13382400,
 13401958,
 10036736,
 10051404,
 8331008,
 8343359,
 4985600,
 4992806,
 16744192,
 16760703,
 13395456,
 13408614,
 10046464,
 10056268,
 8339200,
 8347455,
 4990464,
 4995366,
 16760576,
 16768895,
 13408512,
 13415014,
 10056192,
 10061132,
 8347392,
 8351551,
 4995328,
 4997670,
 16776960,
 16777087,
 13421568,
 13421670,
 10000384,
 10000460,
 8355584,
 8355647,
 5000192,
 5000230,
 12582656,
 14679935,
 10079232,
 11717734,
 7510016,
 8755276,
 6258432,
 7307071,
 3755008,
 4344870,
 8388352,
 12582783,
 6736896,
 10079334,
 5019648,
 7510092,
 4161280,
 6258495,
 2509824,
 3755046,
 4194048,
 10485631,
 3394560,
 8375398,
 2529280,
 6264908,
 2064128,
 5209919,
 1264640,
 3099686,
 65280,
 8388479,
 52224,
 6736998,
 38912,
 5019724,
 32512,
 4161343,
 19456,
 2509862,
 65343,
 8388511,
 52275,
 6737023,
 38950,
 5019743,
 32543,
 4161359,
 19475,
 2509871,
 65407,
 8388543,
 52326,
 6737049,
 38988,
 5019762,
 32575,
 4161375,
 19494,
 2509881,
 65471,
 8388575,
 52377,
 6737074,
 39026,
 5019781,
 32607,
 4161391,
 19513,
 2509890,
 65535,
 8388607,
 52428,
 6737100,
 39064,
 5019800,
 32639,
 4161407,
 19532,
 2509900,
 49151,
 8380415,
 39372,
 6730444,
 29336,
 5014936,
 24447,
 4157311,
 14668,
 2507340,
 32767,
 8372223,
 26316,
 6724044,
 19608,
 5010072,
 16255,
 4153215,
 9804,
 2505036,
 16383,
 8364031,
 13260,
 6717388,
 9880,
 5005208,
 8063,
 4149119,
 4940,
 2502476,
 255,
 8355839,
 204,
 6710988,
 152,
 5000344,
 127,
 4145023,
 76,
 2500172,
 4129023,
 10452991,
 3342540,
 8349388,
 2490520,
 6245528,
 2031743,
 5193599,
 1245260,
 3089996,
 8323327,
 12550143,
 6684876,
 10053324,
 4980888,
 7490712,
 4128895,
 6242175,
 2490444,
 3745356,
 12517631,
 14647295,
 10027212,
 11691724,
 7471256,
 8735896,
 6226047,
 7290751,
 3735628,
 4335180,
 16711935,
 16744447,
 13369548,
 13395660,
 9961624,
 9981080,
 8323199,
 8339327,
 4980812,
 4990540,
 16711871,
 16744415,
 13369497,
 13395634,
 9961586,
 9981061,
 8323167,
 8339311,
 4980793,
 4990530,
 16711807,
 16744383,
 13369446,
 13395609,
 9961548,
 9981042,
 8323135,
 8339295,
 4980774,
 4990521,
 16711743,
 16744351,
 13369395,
 13395583,
 9961510,
 9981023,
 8323103,
 8339279,
 4980755,
 4990511,
 3355443,
 5987163,
 8684676,
 11382189,
 14079702,
 16777215
];
},{}],2:[function(require,module,exports){
/**
 * DxfArrayScanner
 *
 * Based off the AutoCad 2012 DXF Reference
 * http://images.autodesk.com/adsk/files/autocad_2012_pdf_dxf-reference_enu.pdf
 *
 * Reads through an array representing lines of a dxf file. Takes an array and
 * provides an easy interface to extract group code and value pairs.
 * @param data - an array where each element represents a line in the dxf file
 * @constructor
 */
function DxfArrayScanner(data) {
	this._pointer = 0;
	this._data = data;
	this._eof = false;
}

/**
 * Gets the next group (code, value) from the array. A group is two consecutive elements
 * in the array. The first is the code, the second is the value.
 * @returns {{code: Number}|*}
 */
DxfArrayScanner.prototype.next = function() {
	var group;
	if(!this.hasNext()) {
		if(!this._eof)
			throw new Error('Unexpected end of input: EOF group not read before end of file. Ended on code ' + this._data[this._pointer]);
		else
			throw new Error('Cannot call \'next\' after EOF group has been read');
	}

	group = {
		code: parseInt(this._data[this._pointer])
	};

	this._pointer++;

	group.value = parseGroupValue(group.code, this._data[this._pointer].trim());
	
	this._pointer++;

	if(group.code === 0 && group.value === 'EOF') this._eof = true;

	this.lastReadGroup = group;

	return group;
};

DxfArrayScanner.prototype.peek = function() {
	if(!this.hasNext()) {
		if(!this._eof)
			throw new Error('Unexpected end of input: EOF group not read before end of file. Ended on code ' + this._data[this._pointer]);
		else
			throw new Error('Cannot call \'next\' after EOF group has been read');
	}
	
	var group = {
		code: parseInt(this._data[this._pointer])
	};

	group.value = parseGroupValue(group.code, this._data[this._pointer + 1].trim());

	return group;
};


DxfArrayScanner.prototype.rewind = function(numberOfGroups) {
	numberOfGroups = numberOfGroups || 1;
	this._pointer = this._pointer - numberOfGroups * 2;
};

/**
 * Returns true if there is another code/value pair (2 elements in the array).
 * @returns {boolean}
 */
DxfArrayScanner.prototype.hasNext = function() {
	// Check if we have read EOF group code
	if(this._eof) {
		return false;
	}
	
	// We need to be sure there are two lines available
	if(this._pointer > this._data.length - 2) {
		return false;
	}
	return true;
};

/**
 * Returns true if the scanner is at the end of the array
 * @returns {boolean}
 */
DxfArrayScanner.prototype.isEOF = function() {
	return this._eof;
};

/**
 * Parse a value to its proper type.
 * See pages 3 - 10 of the AutoCad DXF 2012 reference given at the top of this file
 *
 * @param code
 * @param value
 * @returns {*}
 */
function parseGroupValue(code, value) {
	if(code <= 9) return value;
	if(code >= 10 && code <= 59) return parseFloat(value);
	if(code >= 60 && code <= 99) return parseInt(value);
	if(code >= 100 && code <= 109) return value;
	if(code >= 110 && code <= 149) return parseFloat(value);
	if(code >= 160 && code <= 179) return parseInt(value);
	if(code >= 210 && code <= 239) return parseFloat(value);
	if(code >= 270 && code <= 289) return parseInt(value);
	if(code >= 290 && code <= 299) return parseBoolean(value);
	if(code >= 300 && code <= 369) return value;
	if(code >= 370 && code <= 389) return parseInt(value);
	if(code >= 390 && code <= 399) return value;
	if(code >= 400 && code <= 409) return parseInt(value);
	if(code >= 410 && code <= 419) return value;
	if(code >= 420 && code <= 429) return parseInt(value);
	if(code >= 430 && code <= 439) return value;
	if(code >= 440 && code <= 459) return parseInt(value);
	if(code >= 460 && code <= 469) return parseFloat(value);
	if(code >= 470 && code <= 481) return value;
	if(code === 999) return value;
	if(code >= 1000 && code <= 1009) return value;
	if(code >= 1010 && code <= 1059) return parseFloat(value);
	if(code >= 1060 && code <= 1071) return parseInt(value);

	console.log('WARNING: Group code does not have a defined type: %j', { code: code, value: value });
	return value;
}

/**
 * Parse a boolean according to a 1 or 0 value
 * @param str
 * @returns {boolean}
 */
function parseBoolean(str) {
	if(str === '0') return false;
	if(str === '1') return true;
	throw TypeError('String \'' + str + '\' cannot be cast to Boolean type');
}

module.exports = DxfArrayScanner;
},{}],3:[function(require,module,exports){
var DxfArrayScanner = require('./DxfArrayScanner.js'),
	AUTO_CAD_COLOR_INDEX = require('./AutoCadColorIndex');

var log = require('loglevel');

//log.setLevel('trace');
//log.setLevel('debug');
//log.setLevel('info');
//log.setLevel('warn');
log.setLevel('error');
//log.setLevel('silent');

function registerDefaultEntityHandlers(dxfParser) {
	// Supported entities here (some entity code is still being refactored into this flow)
	dxfParser.registerEntityHandler(require('./entities/3dface'));
	dxfParser.registerEntityHandler(require('./entities/arc'));
	dxfParser.registerEntityHandler(require('./entities/attdef'));
	dxfParser.registerEntityHandler(require('./entities/circle'));
	dxfParser.registerEntityHandler(require('./entities/dimension'));
	dxfParser.registerEntityHandler(require('./entities/ellipse'));
	dxfParser.registerEntityHandler(require('./entities/insert'));
	dxfParser.registerEntityHandler(require('./entities/line'));
	dxfParser.registerEntityHandler(require('./entities/lwpolyline'));
	dxfParser.registerEntityHandler(require('./entities/mtext'));
	dxfParser.registerEntityHandler(require('./entities/point'));
	dxfParser.registerEntityHandler(require('./entities/polyline'));
	dxfParser.registerEntityHandler(require('./entities/solid'));
	dxfParser.registerEntityHandler(require('./entities/spline'));
	dxfParser.registerEntityHandler(require('./entities/text'));
	//dxfParser.registerEntityHandler(require('./entities/vertex'));
}

function DxfParser() {
	this._entityHandlers = {};

	registerDefaultEntityHandlers(this);
}

DxfParser.prototype.parse = function(source, done) {
	throw new Error("read() not implemented. Use readSync()");
};

DxfParser.prototype.registerEntityHandler = function(handlerType) {
	var instance = new handlerType();
	this._entityHandlers[handlerType.ForEntityName] = instance;
}

DxfParser.prototype.parseSync = function(source) {
	if(typeof(source) === 'string') {
		return this._parse(source);
	}else {
		console.error('Cannot read dxf source of type `' + typeof(source));
		return null;
	}
};

DxfParser.prototype.parseStream = function(stream, done) {

	var dxfString = "";
	var self = this;

	stream.on('data', onData);
	stream.on('end', onEnd);
	stream.on('error', onError);

	function onData(chunk) {
		dxfString += chunk;
	}

	function onEnd() {
		try {
			var dxf = self._parse(dxfString);
		}catch(err) {
			return done(err);
		}
		done(null, dxf);
	}

	function onError(err) {
		done(err);
	}
};

DxfParser.prototype._parse = function(dxfString) {
	var scanner, curr, dxf = {}, lastHandle = 0;
	var dxfLinesArray = dxfString.split(/\r\n|\r|\n/g);

	scanner = new DxfArrayScanner(dxfLinesArray);
	if(!scanner.hasNext()) throw Error('Empty file');

	var self = this;

	var parseAll = function() {
		curr = scanner.next();
		while(!scanner.isEOF()) {
			if(curr.code === 0 && curr.value === 'SECTION') {
				curr = scanner.next();

				// Be sure we are reading a section code
				if (curr.code !== 2) {
					console.error('Unexpected code %s after 0:SECTION', debugCode(curr));
					curr = scanner.next();
					continue;
				}

				if (curr.value === 'HEADER') {
					log.debug('> HEADER');
					dxf.header = parseHeader();
					log.debug('<');
				} else if (curr.value === 'BLOCKS') {
					log.debug('> BLOCKS');
					dxf.blocks = parseBlocks();
					log.debug('<');
				} else if(curr.value === 'ENTITIES') {
					log.debug('> ENTITIES');
					dxf.entities = parseEntities(false);
					log.debug('<');
				} else if(curr.value === 'TABLES') {
					log.debug('> TABLES');
					dxf.tables = parseTables();
					log.debug('<');
				} else if(curr.value === 'EOF') {
					log.debug('EOF');
				} else {
					log.warn('Skipping section \'%s\'', curr.value);
				}
			} else {
				curr = scanner.next();
			}
			// If is a new section
		}
	};

	var groupIs = function(code, value) {
		return curr.code === code && curr.value === value;
	};

	/**
	 *
	 * @return {object} header
	 */
	var parseHeader = function() {
		// interesting variables:
		//  $ACADVER, $VIEWDIR, $VIEWSIZE, $VIEWCTR, $TDCREATE, $TDUPDATE
		// http://www.autodesk.com/techpubs/autocad/acadr14/dxf/header_section_al_u05_c.htm
		// Also see VPORT table entries
		var currVarName = null, currVarValue = null;
		var header = {};
		// loop through header variables
		curr = scanner.next();

		while(true) {
			if(groupIs(0, 'ENDSEC')) {
				if(currVarName) header[currVarName] = currVarValue;
				break;
			} else if(curr.code === 9) {
				if(currVarName) header[currVarName] = currVarValue;
				currVarName = curr.value;
				// Filter here for particular variables we are interested in
			} else {
				if(curr.code === 10) {
					currVarValue = { x: curr.value };
				} else if(curr.code === 20) {
					currVarValue.y = curr.value;
				} else if(curr.code === 30) {
					currVarValue.z = curr.value;
				} else {
					currVarValue = curr.value;
				}
			}
			curr = scanner.next();
		}
		// console.log(util.inspect(header, { colors: true, depth: null }));
		curr = scanner.next(); // swallow up ENDSEC
		return header;
	};


	/**
	 *
	 */
	var parseBlocks = function() {
		var blocks = {}, block;

        curr = scanner.next();

		while(curr.value !== 'EOF') {
			if(groupIs(0, 'ENDSEC')) {
				break;
			}

			if(groupIs(0, 'BLOCK')) {
				log.debug('block {');
				block = parseBlock();
				log.debug('}');
				ensureHandle(block);
                if(!block.name)
                    log.error('block with handle "' + block.handle + '" is missing a name.');
				else
                    blocks[block.name] = block;
			} else {
				logUnhandledGroup(curr);
				curr = scanner.next();
			}
		}
		return blocks;
	};

	var parseBlock = function() {
		var block = {};
		curr = scanner.next();

		while(curr.value !== 'EOF') {
			switch(curr.code) {
				case 1:
					block.xrefPath = curr.value;
					curr = scanner.next();
					break;
				case 2:
					block.name = curr.value;
					curr = scanner.next();
					break;
				case 3:
					block.name2 = curr.value;
					curr = scanner.next();
					break;
				case 5:
					block.handle = curr.value;
					curr = scanner.next();
					break;
				case 8:
					block.layer = curr.value;
					curr = scanner.next();
					break;
				case 10:
					block.position = parsePoint();
					curr = scanner.next();
					break;
				case 67:
					block.paperSpace = (curr.value && curr.value == 1) ? true : false;
					curr = scanner.next();
					break;
				case 70:
					if (curr.value != 0) {
						//if(curr.value & BLOCK_ANONYMOUS_FLAG) console.log('  Anonymous block');
						//if(curr.value & BLOCK_NON_CONSTANT_FLAG) console.log('  Non-constant attributes');
						//if(curr.value & BLOCK_XREF_FLAG) console.log('  Is xref');
						//if(curr.value & BLOCK_XREF_OVERLAY_FLAG) console.log('  Is xref overlay');
						//if(curr.value & BLOCK_EXTERNALLY_DEPENDENT_FLAG) console.log('  Is externally dependent');
						//if(curr.value & BLOCK_RESOLVED_OR_DEPENDENT_FLAG) console.log('  Is resolved xref or dependent of an xref');
						//if(curr.value & BLOCK_REFERENCED_XREF) console.log('  This definition is a referenced xref');
						block.type = curr.value;
					}
					curr = scanner.next();
					break;
				case 100:
					// ignore class markers
					curr = scanner.next();
					break;
				case 330:
					block.ownerHandle = curr.value;
					curr = scanner.next();
					break;
				case 0:
					if(curr.value == 'ENDBLK')
						break;
					block.entities = parseEntities(true);
					break;
				default:
					logUnhandledGroup(curr);
					curr = scanner.next();
			}

			if(groupIs(0, 'ENDBLK')) {
				curr = scanner.next();
				break;
			}
		}
		return block;
	};

	/**
	 * parseTables
	 * @return {Object} Object representing tables
	 */
	var parseTables = function() {
		var tables = {};
		curr = scanner.next();
		while(curr.value !== 'EOF') {
			if(groupIs(0, 'ENDSEC'))
				break;

			if(groupIs(0, 'TABLE')) {
				curr = scanner.next();

				var tableDefinition = tableDefinitions[curr.value];
				if(tableDefinition) {
					log.debug(curr.value + ' Table {');
					tables[tableDefinitions[curr.value].tableName] = parseTable();
					log.debug('}');
				} else {
					log.debug('Unhandled Table ' + curr.value);
				}
			} else {
				// else ignored
				curr = scanner.next();
			}
		}

		curr = scanner.next();
		return tables;
	};

	const END_OF_TABLE_VALUE = 'ENDTAB';

	var parseTable = function() {
		var tableDefinition = tableDefinitions[curr.value],
			table = {},
			expectedCount = 0,
			actualCount;

		curr = scanner.next();
		while(!groupIs(0, END_OF_TABLE_VALUE)) {

			switch(curr.code) {
				case 5:
					table.handle = curr.value;
					curr = scanner.next();
					break;
				case 330:
					table.ownerHandle = curr.value;
					curr = scanner.next();
					break;
				case 100:
					if(curr.value === 'AcDbSymbolTable') {
						// ignore
						curr = scanner.next();
					}else{
						logUnhandledGroup(curr);
						curr = scanner.next();
					}
					break;
				case 70:
					expectedCount = curr.value;
					curr = scanner.next();
					break;
				case 0:
					if(curr.value === tableDefinition.dxfSymbolName) {
						table[tableDefinition.tableRecordsProperty] = tableDefinition.parseTableRecords();
					} else {
						logUnhandledGroup(curr);
						curr = scanner.next();
					}
					break;
				default:
					logUnhandledGroup(curr);
					curr = scanner.next();
			}
		}
		var tableRecords = table[tableDefinition.tableRecordsProperty];
		if(tableRecords) {
			if(tableRecords.constructor === Array){
				actualCount = tableRecords.length;
			} else if(typeof(tableRecords) === 'object') {
				actualCount = Object.keys(tableRecords).length;
			}
			if(expectedCount !== actualCount) log.warn('Parsed ' + actualCount + ' ' + tableDefinition.dxfSymbolName + '\'s but expected ' + expectedCount);
		}
		curr = scanner.next();
		return table;
	};

	var parseViewPortRecords = function() {
		var viewPorts = [], // Multiple table entries may have the same name indicating a multiple viewport configuration
			viewPort = {};

		log.debug('ViewPort {');
		curr = scanner.next();
		while(!groupIs(0, END_OF_TABLE_VALUE)) {

			switch(curr.code) {
				case 2: // layer name
					viewPort.name = curr.value;
					curr = scanner.next();
					break;
				case 10:
					viewPort.lowerLeftCorner = parsePoint();
					curr = scanner.next();
					break;
				case 11:
					viewPort.upperRightCorner = parsePoint();
					curr = scanner.next();
					break;
				case 12:
					viewPort.center = parsePoint();
					curr = scanner.next();
					break;
				case 13:
					viewPort.snapBasePoint = parsePoint();
					curr = scanner.next();
					break;
				case 14:
					viewPort.snapSpacing = parsePoint();
					curr = scanner.next();
					break;
				case 15:
					viewPort.gridSpacing = parsePoint();
					curr = scanner.next();
					break;
				case 16:
					viewPort.viewDirectionFromTarget = parsePoint();
					curr = scanner.next();
					break;
				case 17:
					viewPort.viewTarget = parsePoint();
					curr = scanner.next();
					break;
				case 42:
					viewPort.lensLength = curr.value;
					curr = scanner.next();
					break;
				case 43:
					viewPort.frontClippingPlane = curr.value;
					curr = scanner.next();
					break;
				case 44:
					viewPort.backClippingPlane = curr.value;
					curr = scanner.next();
					break;
				case 45:
					viewPort.viewHeight = curr.value;
					curr = scanner.next();
					break;
				case 50:
					viewPort.snapRotationAngle = curr.value;
					curr = scanner.next();
					break;
				case 51:
					viewPort.viewTwistAngle = curr.value;
					curr = scanner.next();
					break;
                case 79:
                    viewPort.orthographicType = curr.value;
                    curr = scanner.next();
                    break;
				case 110:
					viewPort.ucsOrigin = parsePoint();
					curr = scanner.next();
					break;
				case 111:
					viewPort.ucsXAxis = parsePoint();
					curr = scanner.next();
					break;
				case 112:
					viewPort.ucsYAxis = parsePoint();
					curr = scanner.next();
					break;
				case 110:
					viewPort.ucsOrigin = parsePoint();
					curr = scanner.next();
					break;
				case 281:
					viewPort.renderMode = curr.value;
					curr = scanner.next();
					break;
				case 281:
					// 0 is one distant light, 1 is two distant lights
					viewPort.defaultLightingType = curr.value;
					curr = scanner.next();
					break;
				case 292:
					viewPort.defaultLightingOn = curr.value;
					curr = scanner.next();
					break;
				case 330:
					viewPort.ownerHandle = curr.value;
					curr = scanner.next();
					break;
				case 63:
				case 421:
				case 431:
					viewPort.ambientColor = curr.value;
					curr = scanner.next();
					break;
				case 0:
					// New ViewPort
					if(curr.value === 'VPORT') {
						log.debug('}');
						viewPorts.push(viewPort);
						log.debug('ViewPort {');
						viewPort = {};
						curr = scanner.next();
					}
					break;
				default:
					logUnhandledGroup(curr);
					curr = scanner.next();
					break;
			}
		}
		// Note: do not call scanner.next() here,
		//  parseTable() needs the current group
		log.debug('}');
		viewPorts.push(viewPort);

		return viewPorts;
	};

	var parseLineTypes = function() {
		var ltypes = {},
			ltypeName,
			ltype = {},
			length;

		log.debug('LType {');
		curr = scanner.next();
		while(!groupIs(0, 'ENDTAB')) {

			switch(curr.code) {
				case 2:
					ltype.name = curr.value;
					ltypeName = curr.value;
					curr = scanner.next();
					break;
				case 3:
					ltype.description = curr.value;
					curr = scanner.next();
					break;
				case 73: // Number of elements for this line type (dots, dashes, spaces);
					length = curr.value;
					if(length > 0) ltype.pattern = [];
					curr = scanner.next();
					break;
				case 40: // total pattern length
					ltype.patternLength = curr.value;
					curr = scanner.next();
					break;
				case 49:
					ltype.pattern.push(curr.value);
					curr = scanner.next();
					break;
				case 0:
					log.debug('}');
					if(length > 0 && length !== ltype.pattern.length) log.warn('lengths do not match on LTYPE pattern');
					ltypes[ltypeName] = ltype;
					ltype = {};
					log.debug('LType {');
					curr = scanner.next();
					break;
				default:
					curr = scanner.next();
			}
		}

		log.debug('}');
		ltypes[ltypeName] = ltype;
		return ltypes;
	};

	var parseLayers = function() {
		var layers = {},
			layerName,
			layer = {};

		log.debug('Layer {');
		curr = scanner.next();
		while(!groupIs(0, 'ENDTAB')) {

			switch(curr.code) {
				case 2: // layer name
					layer.name = curr.value;
					layerName = curr.value;
					curr = scanner.next();
					break;
				case 62: // color, visibility
					layer.visible = curr.value >= 0;
					// TODO 0 and 256 are BYBLOCK and BYLAYER respectively. Need to handle these values for layers?.
					layer.color = getAcadColor(Math.abs(curr.value));
					curr = scanner.next();
					break;
				case 70: // frozen layer
					layer.frozen = ((curr.value & 1) != 0 || (curr.value & 2) != 0);
					curr = scanner.next();
					break;
				case 0:
					// New Layer
					if(curr.value === 'LAYER') {
						log.debug('}');
						layers[layerName] = layer;
						log.debug('Layer {');
						layer = {};
						layerName = undefined;
						curr = scanner.next();
					}
					break;
				default:
					logUnhandledGroup(curr);
					curr = scanner.next();
					break;
			}
		}
		// Note: do not call scanner.next() here,
		//  parseLayerTable() needs the current group
		log.debug('}');
		layers[layerName] = layer;

		return layers;
	};

	var tableDefinitions = {
		VPORT: {
			tableRecordsProperty: 'viewPorts',
			tableName: 'viewPort',
			dxfSymbolName: 'VPORT',
			parseTableRecords: parseViewPortRecords
		},
		LTYPE: {
			tableRecordsProperty: 'lineTypes',
			tableName: 'lineType',
			dxfSymbolName: 'LTYPE',
			parseTableRecords: parseLineTypes
		},
		LAYER: {
			tableRecordsProperty: 'layers',
			tableName: 'layer',
			dxfSymbolName: 'LAYER',
			parseTableRecords: parseLayers
		}
	};

	/**
	 * Is called after the parser first reads the 0:ENTITIES group. The scanner
	 * should be on the start of the first entity already.
	 * @return {Array} the resulting entities
	 */
	var parseEntities = function(forBlock) {
		var entities = [];

		var endingOnValue = forBlock ? 'ENDBLK' : 'ENDSEC';

		if (!forBlock) {
			curr = scanner.next();
		}
		while(true) {

			if(curr.code === 0) {
				if(curr.value === endingOnValue) {
					break;
				}

				var entity;
				var handler = self._entityHandlers[curr.value];
				if(handler != null) {
					log.debug(curr.value + ' {');
					entity = handler.parseEntity(scanner, curr);
					curr = scanner.lastReadGroup;
					log.debug('}');
				} else {
					log.warn('Unhandled entity ' + curr.value);
					curr = scanner.next();
					continue;
				}
				ensureHandle(entity);
				entities.push(entity);
			} else {
				// ignored lines from unsupported entity
				curr = scanner.next();
			}
		}
		if(endingOnValue == 'ENDSEC') curr = scanner.next(); // swallow up ENDSEC, but not ENDBLK
		return entities;
	};

	/**
	 * Parses a 2D or 3D point, returning it as an object with x, y, and
	 * (sometimes) z property if it is 3D. It is assumed the current group
	 * is x of the point being read in, and scanner.next() will return the
	 * y. The parser will determine if there is a z point automatically.
	 * @return {Object} The 2D or 3D point as an object with x, y[, z]
	 */
	var parsePoint = function() {
		var point = {},
			code = curr.code;

		point.x = curr.value;

		code += 10;
		curr = scanner.next();
		if(curr.code != code)
			throw new Error('Expected code for point value to be ' + code +
			' but got ' + curr.code + '.');
		point.y = curr.value;

		code += 10;
		curr = scanner.next();
		if(curr.code != code)
		{
			scanner.rewind();
			return point;
		}
		point.z = curr.value;
		
		return point;
	};

	var ensureHandle = function(entity) {
		if(!entity) throw new TypeError('entity cannot be undefined or null');

		if(!entity.handle) entity.handle = lastHandle++;
	};

	parseAll();
	return dxf;
};

function logUnhandledGroup(curr) {
	log.debug('unhandled group ' + debugCode(curr));
}


function debugCode(curr) {
	return curr.code + ':' + curr.value;
}

/**
 * Returns the truecolor value of the given AutoCad color index value
 * @return {Number} truecolor value as a number
 */
function getAcadColor(index) {
	return AUTO_CAD_COLOR_INDEX[index];
}

const BLOCK_ANONYMOUS_FLAG = 1;
const BLOCK_NON_CONSTANT_FLAG = 2;
const BLOCK_XREF_FLAG = 4;
const BLOCK_XREF_OVERLAY_FLAG = 8;
const BLOCK_EXTERNALLY_DEPENDENT_FLAG = 16;
const BLOCK_RESOLVED_OR_DEPENDENT_FLAG = 32;
const BLOCK_REFERENCED_XREF = 64;



module.exports = DxfParser;


/* Notes */
// Code 6 of an entity indicates inheritance of properties (eg. color).
//   BYBLOCK means inherits from block
//   BYLAYER (default) mean inherits from layer
},{"./AutoCadColorIndex":1,"./DxfArrayScanner.js":2,"./entities/3dface":5,"./entities/arc":6,"./entities/attdef":7,"./entities/circle":8,"./entities/dimension":9,"./entities/ellipse":10,"./entities/insert":11,"./entities/line":12,"./entities/lwpolyline":13,"./entities/mtext":14,"./entities/point":15,"./entities/polyline":16,"./entities/solid":17,"./entities/spline":18,"./entities/text":19,"loglevel":21}],4:[function(require,module,exports){
var AUTO_CAD_COLOR_INDEX = require('./AutoCadColorIndex');

/**
 * Returns the truecolor value of the given AutoCad color index value
 * @return {Number} truecolor value as a number
 */
exports.getAcadColor = function(index) {
	return AUTO_CAD_COLOR_INDEX[index];
}
var getAcadColor = exports.getAcadColor;

/**
 * Parses the 2D or 3D coordinate, vector, or point. When complete,
 * the scanner remains on the last group of the coordinate.
 * @param {*} scanner 
 */
exports.parsePoint = function(scanner) {
    var point = {};

    // Reread group for the first coordinate
    scanner.rewind();
    var curr = scanner.next();

    code = curr.code;
    point.x = curr.value;

    code += 10;
    curr = scanner.next();
    if(curr.code != code)
        throw new Error('Expected code for point value to be ' + code +
        ' but got ' + curr.code + '.');
    point.y = curr.value;

    code += 10;
    curr = scanner.next();
    if(curr.code != code)
    {
        // Only the x and y are specified. Don't read z.
        scanner.rewind(); // Let the calling code advance off the point
        return point;
    }
    point.z = curr.value;
    
    return point;
};

/**
 * Attempts to parse codes common to all entities. Returns true if the group
 * was handled by this function.
 * @param {*} entity - the entity currently being parsed 
 * @param {*} curr - the current group being parsed
 */
exports.checkCommonEntityProperties = function(entity, curr) {
    switch(curr.code) {
        case 0:
            entity.type = curr.value;
            break;
        case 5:
            entity.handle = curr.value;
            break;
        case 6:
            entity.lineType = curr.value;
            break;
        case 8: // Layer name
            entity.layer = curr.value;
            break;
        case 48:
            entity.lineTypeScale = curr.value;
            break;
        case 60:
            entity.visible = curr.value === 0;
            break;
        case 62: // Acad Index Color. 0 inherits ByBlock. 256 inherits ByLayer. Default is bylayer
            entity.colorIndex = curr.value;
            entity.color = getAcadColor(Math.abs(curr.value));
            break;
        case 67:
            entity.inPaperSpace = curr.value !== 0;
            break;
        case 330:
            entity.ownerHandle = curr.value;
            break;
        case 347:
            entity.materialObjectHandle = curr.value;
            break;
        case 370:
            //From https://www.woutware.com/Forum/Topic/955/lineweight?returnUrl=%2FForum%2FUserPosts%3FuserId%3D478262319
            // An integer representing 100th of mm, must be one of the following values:
            // 0, 5, 9, 13, 15, 18, 20, 25, 30, 35, 40, 50, 53, 60, 70, 80, 90, 100, 106, 120, 140, 158, 200, 211.
            // -3 = STANDARD, -2 = BYLAYER, -1 = BYBLOCK
            entity.lineweight = curr.value;
            break;
        case 420: // TrueColor Color
            entity.color = curr.value;
            break;
        case 100:
            //ignore
            break;
        default:
            return false;
    }
    return true;
};

},{"./AutoCadColorIndex":1}],5:[function(require,module,exports){

var helpers = require('../ParseHelpers');

module.exports = EntityParser;

function EntityParser() {}

EntityParser.ForEntityName = '3DFACE';

EntityParser.prototype.parseEntity = function(scanner, curr) {

    var entity = { type: curr.value, vertices: [] };
    curr = scanner.next();
    while (curr !== 'EOF') {
        if (curr.code === 0) break;
        switch (curr.code) {
            case 70: // 1 = Closed shape, 128 = plinegen?, 0 = default
                entity.shape = ((curr.value & 1) === 1);
                entity.hasContinuousLinetypePattern = ((curr.value & 128) === 128);
                break;
            case 10: // X coordinate of point
                entity.vertices = parse3dFaceVertices(scanner, curr);
                curr = scanner.lastReadGroup;
                break;
            default:
                checkCommonEntityProperties(entity);
                break;
        }
        curr = scanner.next();
    }
    return entity;
};

function parse3dFaceVertices(scanner, curr) {
    var vertices = [],
        i;
    var vertexIsStarted = false;
    var vertexIsFinished = false;
    var verticesPer3dFace = 4; // there can be up to four vertices per face, although 3 is most used for TIN
    
    for (i = 0; i <= verticesPer3dFace; i++) {
        var vertex = {};
        while (curr !== 'EOF') {
            if (curr.code === 0 || vertexIsFinished) break;

            switch (curr.code) {
                case 10: // X0
                case 11: // X1
                case 12: // X2
                case 13: // X3
                    if (vertexIsStarted) {
                        vertexIsFinished = true;
                        continue;
                    }
                    vertex.x = curr.value;
                    vertexIsStarted = true;
                    break;
                case 20: // Y
                case 21:
                case 22:
                case 23:
                    vertex.y = curr.value;
                    break;
                case 30: // Z
                case 31:
                case 32:
                case 33:
                    vertex.z = curr.value;
                    break;
                default:
                    // it is possible to have entity codes after the vertices.  
                    // So if code is not accounted for return to entity parser where it might be accounted for
                    return vertices;
                    continue;
            }
            curr = scanner.next();
        }
        // See https://groups.google.com/forum/#!topic/comp.cad.autocad/9gn8s5O_w6E
        vertices.push(vertex);
        vertexIsStarted = false;
        vertexIsFinished = false;
    }
    scanner.rewind();
    return vertices;
};
},{"../ParseHelpers":4}],6:[function(require,module,exports){

var helpers = require('../ParseHelpers');

module.exports = EntityParser;

function EntityParser() {}

EntityParser.ForEntityName = 'ARC';

EntityParser.prototype.parseEntity = function(scanner, curr) {
    var entity, endAngle;
    entity = { type: curr.value };
    curr = scanner.next();
    while(curr !== 'EOF') {
        if(curr.code === 0) break;

        switch(curr.code) {
            case 10: // X coordinate of point
                entity.center = helpers.parsePoint(scanner);
                break;
            case 40: // radius
                entity.radius = curr.value;
                break;
            case 50: // start angle
                entity.startAngle = Math.PI / 180 * curr.value;
                break;
            case 51: // end angle
                entity.endAngle = Math.PI / 180 * curr.value;
                entity.angleLength = entity.startAngle - entity.endAngle; // angleLength is deprecated
                break;
            default: // ignored attribute
                helpers.checkCommonEntityProperties(entity, curr);
                break;
        }
        curr = scanner.next();
    }
    return entity;
};
},{"../ParseHelpers":4}],7:[function(require,module,exports){

var helpers = require('../ParseHelpers');

module.exports = EntityParser;

function EntityParser() {}

EntityParser.ForEntityName = 'ATTDEF';

EntityParser.prototype.parseEntity = function(scanner, curr) {
    var entity = {
        type: curr.value,
        scale: 1,
        textStyle: 'STANDARD'
     };
    curr = scanner.next();
    while (curr !== 'EOF') {
        if (curr.code === 0) {
            break;
        }
        switch(curr.code) {
            case 1:
                entity.text = curr.value;
                break;
            case 2:
                entity.tag = curr.value;
                break;
            case 3:
                entity.prompt = curr.value;
                break;
            case 7:
                entity.textStyle = curr.value;
                break;
            case 10:
                entity.x = curr.value;
                break;
            case 20:
                entity.y = curr.value;
                break;
            case 30:
                entity.z = curr.value;
                break;
            case 39:
                entity.thickness = curr.value;
                break;
            case 40:
                entity.textHeight = curr.value;
                break;
            case 41:
                entity.scale = curr.value;
                break;
            case 50:
                entity.rotation = curr.value;
                break;
            case 51:
                entity.obliqueAngle = curr.value;
                break;
            case 70:
                entity.invisible = !!(curr.value & 0x01);
                entity.constant = !!(curr.value & 0x02);
                entity.verificationRequired = !!(curr.value & 0x04);
                entity.preset = !!(curr.value & 0x08);
                break;
            case 71:
                entity.backwards = !!(curr.value & 0x02);
                entity.mirrored = !!(curr.value & 0x04);
                break;
            case 72:
                // TODO: enum values?
                entity.horizontalJustification = curr.value;
                break;
            case 73:
                entity.fieldLength = curr.value;
                break;
            case 74:
                // TODO: enum values?
                entity.verticalJustification = curr.value;
                break;
            case 100:
                break;
            case 210:
                entity.extrusionDirectionX = curr.value;
                break;
            case 220:
                entity.extrusionDirectionY = curr.value;
                break;
            case 230:
                entity.extrusionDirectionZ = curr.value;
                break;
            default:
                helpers.checkCommonEntityProperties(entity, curr);
                break;
        }
        curr = scanner.next();
    }

    return entity;
};
},{"../ParseHelpers":4}],8:[function(require,module,exports){

var helpers = require('../ParseHelpers');

module.exports = EntityParser;

function EntityParser() {}

EntityParser.ForEntityName = 'CIRCLE';

EntityParser.prototype.parseEntity = function(scanner, curr) {
    var entity, endAngle;
    entity = { type: curr.value };
    curr = scanner.next();
    while(curr !== 'EOF') {
        if(curr.code === 0) break;

        switch(curr.code) {
            case 10: // X coordinate of point
                entity.center = helpers.parsePoint(scanner);
                break;
            case 40: // radius
                entity.radius = curr.value;
                break;
            case 50: // start angle
                entity.startAngle = Math.PI / 180 * curr.value;
                break;
            case 51: // end angle
                endAngle = Math.PI / 180 * curr.value;
                if(endAngle < entity.startAngle)
                    entity.angleLength = endAngle + 2 * Math.PI - entity.startAngle;
                else
                    entity.angleLength = endAngle - entity.startAngle;
                entity.endAngle = endAngle;
                break;
            default: // ignored attribute
                helpers.checkCommonEntityProperties(entity, curr);
                break;
        }
        curr = scanner.next();
    }
    return entity;
};
},{"../ParseHelpers":4}],9:[function(require,module,exports){

var helpers = require('../ParseHelpers');

module.exports = EntityParser;

function EntityParser() {}

EntityParser.ForEntityName = 'DIMENSION';

EntityParser.prototype.parseEntity = function(scanner, curr) {
    var entity;
		entity = { type: curr.value };
		curr = scanner.next();
		while(curr !== 'EOF') {
			if(curr.code === 0) break;

			switch(curr.code) {
				case 2: // Referenced block name
					entity.block = curr.value;
					break;
				case 10: // X coordinate of 'first alignment point'
					entity.anchorPoint = helpers.parsePoint(scanner);
					break;
				case 11:
					entity.middleOfText = helpers.parsePoint(scanner);
					break;
				case 71: // 5 = Middle center
					entity.attachmentPoint = curr.value;
					break;
				case 42: // Actual measurement
					entity.actualMeasurement = curr.value;
					break;
				case 1: // Text entered by user explicitly
					entity.text = curr.value;
					break;
				case 50: // Angle of rotated, horizontal, or vertical dimensions
					entity.angle = curr.value;
					break;
				default: // check common entity attributes
					helpers.checkCommonEntityProperties(entity, curr);
					break;
			}
			curr = scanner.next();
		}

		return entity;
};



},{"../ParseHelpers":4}],10:[function(require,module,exports){

var helpers = require('../ParseHelpers');

module.exports = EntityParser;

function EntityParser() {}

EntityParser.ForEntityName = 'ELLIPSE';

EntityParser.prototype.parseEntity = function(scanner, curr) {
    var entity;
    entity = { type: curr.value };
    curr = scanner.next();
    while(curr !== 'EOF') {
        if(curr.code === 0) break;

        switch(curr.code) {
            case 10:
                entity.center = helpers.parsePoint(scanner);
                break;
            case 11:
                entity.majorAxisEndPoint = helpers.parsePoint(scanner);
                break;
            case 40:
                entity.axisRatio = curr.value;
                break;
            case 41:
                entity.startAngle = curr.value;
                break;
            case 42:
                entity.endAngle = curr.value;
                break;
            case 2:
                entity.name = curr.value;
                break;
            default: // check common entity attributes
                helpers.checkCommonEntityProperties(entity, curr);
                break;
        }
        
        curr = scanner.next();
    }

    return entity;
};
},{"../ParseHelpers":4}],11:[function(require,module,exports){

var helpers = require('../ParseHelpers');

module.exports = EntityParser;

function EntityParser() {}

EntityParser.ForEntityName = 'INSERT';

EntityParser.prototype.parseEntity = function(scanner, curr) {
    var entity;
    entity = { type: curr.value };
    curr = scanner.next();
    while(curr !== 'EOF') {
        if(curr.code === 0) break;

        switch(curr.code) {
            case 2:
                entity.name = curr.value;
                break;
            case 41:
                entity.xScale = curr.value;
                break;
            case 42:
                entity.yScale = curr.value;
                break;
            case 43:
                entity.zScale = curr.value;
                break;
            case 10:
                entity.position = helpers.parsePoint(scanner);
                break;
            case 50:
                entity.rotation = curr.value;
                break;
            case 70:
                entity.columnCount = curr.value;
                break;
            case 71:
                entity.rowCount = curr.value;
                break;
            case 44:
                entity.columnSpacing = curr.value;
                break;
            case 45:
                entity.rowSpacing = curr.value;
                break;
            case 210:
                entity.extrusionDirection = helpers.parsePoint(scanner);
                break;
            default: // check common entity attributes
                helpers.checkCommonEntityProperties(entity, curr);
                break;
        }
        curr = scanner.next();
    }

    return entity;
};



},{"../ParseHelpers":4}],12:[function(require,module,exports){

var helpers = require('../ParseHelpers');

module.exports = EntityParser;

function EntityParser() {}

EntityParser.ForEntityName = 'LINE';

EntityParser.prototype.parseEntity = function(scanner, curr) {
    var entity = { type: curr.value, vertices: [] };
    curr = scanner.next();
    while(curr !== 'EOF') {
        if(curr.code === 0) break;

        switch(curr.code) {
            case 10: // X coordinate of point
                entity.vertices.unshift(helpers.parsePoint(scanner));
                break;
            case 11:
                entity.vertices.push(helpers.parsePoint(scanner));
                break;
            case 210:
                entity.extrusionDirection = helpers.parsePoint(scanner);
                break;
            case 100:
                break;
            default:
                helpers.checkCommonEntityProperties(entity, curr);
                break;
        }
        
        curr = scanner.next();
    }
    return entity;
};
},{"../ParseHelpers":4}],13:[function(require,module,exports){

var helpers = require('../ParseHelpers');

module.exports = EntityParser;

function EntityParser() {}

EntityParser.ForEntityName = 'LWPOLYLINE';

EntityParser.prototype.parseEntity = function(scanner, curr) {
    var entity = { type: curr.value, vertices: [] },
        numberOfVertices = 0;
    curr = scanner.next();
    while(curr !== 'EOF') {
        if(curr.code === 0) break;

        switch(curr.code) {
            case 38:
                entity.elevation = curr.value;
                break;
            case 39:
                entity.depth = curr.value;
                break;
            case 70: // 1 = Closed shape, 128 = plinegen?, 0 = default
                entity.shape = ((curr.value & 1) === 1);
                entity.hasContinuousLinetypePattern = ((curr.value & 128) === 128);
                break;
            case 90:
                numberOfVertices = curr.value;
                break;
            case 10: // X coordinate of point
                entity.vertices = parseLWPolylineVertices(numberOfVertices, scanner);
                break;
            case 43:
                if(curr.value !== 0) entity.width = curr.value;
                break;
            case 210:
                entity.extrusionDirectionX = curr.value;
                break;
            case 220:
                entity.extrusionDirectionY = curr.value;
                break;
            case 230:
                entity.extrusionDirectionZ = curr.value;
                break;
            default:
                helpers.checkCommonEntityProperties(entity, curr);
                break;
        }
        curr = scanner.next();
    }
    return entity;
};

function parseLWPolylineVertices(n, scanner) {
    if(!n || n <= 0) throw Error('n must be greater than 0 verticies');
    var vertices = [], i;
    var vertexIsStarted = false;
    var vertexIsFinished = false;
    var curr = scanner.lastReadGroup;

    for(i = 0; i < n; i++) {
        var vertex = {};
        while(curr !== 'EOF') {
            if(curr.code === 0 || vertexIsFinished) break;

            switch(curr.code) {
                case 10: // X
                    if(vertexIsStarted) {
                        vertexIsFinished = true;
                        continue;
                    }
                    vertex.x = curr.value;
                    vertexIsStarted = true;
                    break;
                case 20: // Y
                    vertex.y = curr.value;
                    break;
                case 30: // Z
                    vertex.z = curr.value;
                    break;
                case 40: // start width
                    vertex.startWidth = curr.value;
                    break;
                case 41: // end width
                    vertex.endWidth = curr.value;
                    break;
                case 42: // bulge
                    if(curr.value != 0) vertex.bulge = curr.value;
                    break;
                default:
                    // if we do not hit known code return vertices.  Code might belong to entity
                    if (vertexIsStarted) {
                        vertices.push(vertex);
                    }
                    return vertices;
            }
            curr = scanner.next();
        }
        // See https://groups.google.com/forum/#!topic/comp.cad.autocad/9gn8s5O_w6E
        vertices.push(vertex);
        vertexIsStarted = false;
        vertexIsFinished = false;
    }
    scanner.rewind();
    return vertices;
};
},{"../ParseHelpers":4}],14:[function(require,module,exports){

var helpers = require('../ParseHelpers');

module.exports = EntityParser;

function EntityParser() {}

EntityParser.ForEntityName = 'MTEXT';

EntityParser.prototype.parseEntity = function(scanner, curr) {
    var entity = { type: curr.value };
		curr = scanner.next();
    while(curr !== 'EOF') {
        if(curr.code === 0) break;

        switch(curr.code) {
            case 1:
                entity.text = curr.value;
                break;
            case 3:
                entity.text += curr.value;
                break;
            case 10:
                entity.position = helpers.parsePoint(scanner);
                break;
            case 40:
                //Note: this is the text height
                entity.height = curr.value;
                break;
            case 41:
                entity.width = curr.value;
                break;
            case 50:
                entity.rotation = curr.value;
                break;
            case 71:
                entity.attachmentPoint = curr.value;
                break;
            case 72:
                entity.drawingDirection = curr.value;
                break;
            default:
                helpers.checkCommonEntityProperties(entity, curr);
                break;
        }
        curr = scanner.next();
    }
    return entity;
};
},{"../ParseHelpers":4}],15:[function(require,module,exports){

var helpers = require('../ParseHelpers');

module.exports = EntityParser;

function EntityParser() {}

EntityParser.ForEntityName = 'POINT';

EntityParser.prototype.parseEntity = function(scanner, curr) {
    var entity;
    entity = { type: curr.value };
    curr = scanner.next();
    while(curr !== 'EOF') {
        if(curr.code === 0) break;

        switch(curr.code) {
            case 10:
                entity.position = helpers.parsePoint(scanner);
                break;
            case 39:
                entity.thickness = curr.value;
                break;
            case 210:
                entity.extrusionDirection = helpers.parsePoint(scanner);
                break;
            case 100:
                break;
            default: // check common entity attributes
                helpers.checkCommonEntityProperties(entity, curr);
                break;
        }
        curr = scanner.next();
    }

    return entity;
};
},{"../ParseHelpers":4}],16:[function(require,module,exports){

var helpers = require('../ParseHelpers');
var VertexParser = require('./vertex');

module.exports = EntityParser;

function EntityParser() {}

EntityParser.ForEntityName = 'POLYLINE';

EntityParser.prototype.parseEntity = function(scanner, curr) {
    var entity = { type: curr.value, vertices: [] };
		curr = scanner.next();
		while(curr !== 'EOF') {
			if(curr.code === 0) break;

			switch(curr.code) {
				case 10: // always 0
				case 20: // always 0
				case 30: // elevation
				case 39: // thickness
                    entity.thickness = curr.value;
					break;
				case 40: // start width
				case 41: // end width
					break;
				case 70:
					entity.shape = (curr.value & 1) !== 0;
                    entity.includesCurveFitVertices = (curr.value & 2) !== 0;
                    entity.includesSplineFitVertices = (curr.value & 4) !== 0;
                    entity.is3dPolyline = (curr.value & 8) !== 0;
                    entity.is3dPolygonMesh = (curr.value & 16) !== 0;
                    entity.is3dPolygonMeshClosed = (curr.value & 32) !== 0; // 32 = The polygon mesh is closed in the N direction
                    entity.isPolyfaceMesh = (curr.value & 64) !== 0;
                    entity.hasContinuousLinetypePattern = (curr.value & 128) !== 0;
					break;
				case 71: // Polygon mesh M vertex count
				case 72: // Polygon mesh N vertex count
				case 73: // Smooth surface M density
				case 74: // Smooth surface N density
				case 75: // Curves and smooth surface type
					break;
				case 210:
                    extrusionDirection = helpers.parsePoint(scanner);
					break;
				default:
					helpers.checkCommonEntityProperties(entity, curr);
					break;
			}
			curr = scanner.next();
		}

		entity.vertices = parsePolylineVertices(scanner, curr);

		return entity;
};

function parsePolylineVertices(scanner, curr) {
    var vertexParser = new VertexParser();

    var vertices = [];
    while (!scanner.isEOF()) {
        if (curr.code === 0) {
            if (curr.value === 'VERTEX') {
                vertices.push(vertexParser.parseEntity(scanner, curr));
                curr = scanner.lastReadGroup;
            } else if (curr.value === 'SEQEND') {
                parseSeqEnd(scanner, curr);
                break;
            }
        }
    }
    return vertices;
};

function parseSeqEnd(scanner, curr) {
    var entity = { type: curr.value };
    curr = scanner.next();
    while(curr != 'EOF') {
        if (curr.code == 0) break;
        helpers.checkCommonEntityProperties(entity, curr);
        curr = scanner.next();
    }

    return entity;
};

},{"../ParseHelpers":4,"./vertex":20}],17:[function(require,module,exports){

var helpers = require('../ParseHelpers');

module.exports = EntityParser;

function EntityParser() {}

EntityParser.ForEntityName = 'SOLID';

EntityParser.prototype.parseEntity = function(scanner, currentGroup) {
    var entity;
    entity = { type: currentGroup.value };
    entity.points = [];
    currentGroup = scanner.next();
    while(currentGroup !== 'EOF') {
        if(currentGroup.code === 0) break;

        switch(currentGroup.code) {
            case 10:
                entity.points[0] = helpers.parsePoint(scanner);
                break;
            case 11:
                entity.points[1] = helpers.parsePoint(scanner);
                break;
            case 12:
                entity.points[2] = helpers.parsePoint(scanner);
                break;
            case 13:
                entity.points[3] = helpers.parsePoint(scanner);
                break;
            case 210:
                entity.extrusionDirection = helpers.parsePoint(scanner);
                break;
            default: // check common entity attributes
                helpers.checkCommonEntityProperties(entity, currentGroup);
                break;
        }
        currentGroup = scanner.next();
    }

    return entity;
};
},{"../ParseHelpers":4}],18:[function(require,module,exports){

var helpers = require('../ParseHelpers');

module.exports = EntityParser;

function EntityParser() {}

EntityParser.ForEntityName = 'SPLINE';

EntityParser.prototype.parseEntity = function(scanner, curr) {
    var entity;
    entity = { type: curr.value };
    curr = scanner.next();
    while(curr !== 'EOF')
    {
        if(curr.code === 0) break;

        switch(curr.code) {
            case 10:
                if (!entity.controlPoints) entity.controlPoints = [];
                entity.controlPoints.push(helpers.parsePoint(scanner));
                break;
            case 11:
                if (!entity.fitPoints) entity.fitPoints = [];
                entity.fitPoints.push(helpers.parsePoint(scanner));
                break;
            case 12:
                entity.startTangent = helpers.parsePoint(scanner);
                break;
            case 13:
                entity.endTangent = helpers.parsePoint(scanner);
                break;
            case 40:
                if (!entity.knotValues) entity.knotValues = [];
                entity.knotValues.push(curr.value);
                break;
            case 70:
                if ((curr.value & 1) != 0) entity.closed = true;
                if ((curr.value & 2) != 0) entity.periodic = true;
                if ((curr.value & 4) != 0) entity.rational = true;
                if ((curr.value & 8) != 0) entity.planar = true;
                if ((curr.value & 16) != 0) 
                {
                    entity.planar = true;
                    entity.linear = true;
                }
                break;
                
            case 71:
                entity.degreeOfSplineCurve = curr.value;
                break;
            case 72:
                entity.numberOfKnots = curr.value;
                break;
            case 73:
                entity.numberOfControlPoints = curr.value;
                break;
            case 74:
                entity.numberOfFitPoints = curr.value;
                break;
            case 210:
                entity.normalVector = helpers.parsePoint(scanner);
                break;
            default:
                helpers.checkCommonEntityProperties(entity, curr);
                break;
        }
        curr = scanner.next();
    }

    return entity;
};
},{"../ParseHelpers":4}],19:[function(require,module,exports){

var helpers = require('../ParseHelpers');

module.exports = EntityParser;

function EntityParser() {}

EntityParser.ForEntityName = 'TEXT';

EntityParser.prototype.parseEntity = function(scanner, curr) {
    var entity;
		entity = { type: curr.value };
    curr = scanner.next();
    while(curr !== 'EOF') {
        if(curr.code === 0) break;
        switch(curr.code) {
            case 10: // X coordinate of 'first alignment point'
                entity.startPoint = helpers.parsePoint(scanner);
                break;
            case 11: // X coordinate of 'second alignment point'
                entity.endPoint = helpers.parsePoint(scanner);
                break;
            case 40: // Text height
                entity.textHeight = curr.value;
                break;
            case 41:
                entity.xScale = curr.value;
                break;
            case 50: // Rotation in degrees
                entity.rotation = curr.value;
                break;
            case 1: // Text
                entity.text = curr.value;
                break;
            // NOTE: 72 and 73 are meaningless without 11 (second alignment point)
            case 72: // Horizontal alignment
                entity.halign = curr.value;
                break;
            case 73: // Vertical alignment
                entity.valign = curr.value;
                break;
            default: // check common entity attributes
                helpers.checkCommonEntityProperties(entity, curr);
                break;
        }
        curr = scanner.next();
    }
    return entity;
};
},{"../ParseHelpers":4}],20:[function(require,module,exports){

var helpers = require('../ParseHelpers');

module.exports = EntityParser;

function EntityParser() {}

EntityParser.ForEntityName = 'VERTEX';

EntityParser.prototype.parseEntity = function(scanner, curr) {
    var entity = { type: curr.value };
    curr = scanner.next();
    while(curr !== 'EOF') {
        if(curr.code === 0) break;

        switch(curr.code) {
            case 10:	// X
                entity.x = curr.value;
                break;
            case 20: // Y
                entity.y = curr.value;
                break;
            case 30: // Z
                entity.z = curr.value;
                break;
            case 40: // start width
            case 41: // end width
            case 42: // bulge
                if(curr.value != 0) entity.bulge = curr.value;
                break;
            case 70: // flags
                entity.curveFittingVertex = (curr.value & 1) !== 0;
                entity.curveFitTangent = (curr.value & 2) !== 0;
                entity.splineVertex = (curr.value & 8) !== 0;
                entity.splineControlPoint = (curr.value & 16) !== 0;
                entity.threeDPolylineVertex = (curr.value & 32) !== 0;
                entity.threeDPolylineMesh = (curr.value & 64) !== 0;
                entity.polyfaceMeshVertex = (curr.value & 128) !== 0;
                break;
            case 50: // curve fit tangent direction
            case 71: // polyface mesh vertex index
            case 72: // polyface mesh vertex index
            case 73: // polyface mesh vertex index
            case 74: // polyface mesh vertex index
                break;
            default:
                helpers.checkCommonEntityProperties(entity, curr);
                break;
        }
        
        curr = scanner.next();
    }
    return entity;
};
},{"../ParseHelpers":4}],21:[function(require,module,exports){
/*
* loglevel - https://github.com/pimterry/loglevel
*
* Copyright (c) 2013 Tim Perry
* Licensed under the MIT license.
*/
(function (root, definition) {
    if (typeof module === 'object' && module.exports && typeof require === 'function') {
        module.exports = definition();
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
        define(definition);
    } else {
        root.log = definition();
    }
}(this, function () {
    var self = {};
    var noop = function() {};
    var undefinedType = "undefined";

    function realMethod(methodName) {
        if (typeof console === undefinedType) {
            return false; // We can't build a real method without a console to log to
        } else if (console[methodName] !== undefined) {
            return bindMethod(console, methodName);
        } else if (console.log !== undefined) {
            return bindMethod(console, 'log');
        } else {
            return noop;
        }
    }

    function bindMethod(obj, methodName) {
        var method = obj[methodName];
        if (typeof method.bind === 'function') {
            return method.bind(obj);
        } else {
            try {
                return Function.prototype.bind.call(method, obj);
            } catch (e) {
                // Missing bind shim or IE8 + Modernizr, fallback to wrapping
                return function() {
                    return Function.prototype.apply.apply(method, [obj, arguments]);
                };
            }
        }
    }

    function enableLoggingWhenConsoleArrives(methodName, level) {
        return function () {
            if (typeof console !== undefinedType) {
                replaceLoggingMethods(level);
                self[methodName].apply(self, arguments);
            }
        };
    }

    var logMethods = [
        "trace",
        "debug",
        "info",
        "warn",
        "error"
    ];

    function replaceLoggingMethods(level) {
        for (var i = 0; i < logMethods.length; i++) {
            var methodName = logMethods[i];
            self[methodName] = (i < level) ? noop : self.methodFactory(methodName, level);
        }
    }

    function persistLevelIfPossible(levelNum) {
        var levelName = (logMethods[levelNum] || 'silent').toUpperCase();

        // Use localStorage if available
        try {
            window.localStorage['loglevel'] = levelName;
            return;
        } catch (ignore) {}

        // Use session cookie as fallback
        try {
            window.document.cookie = "loglevel=" + levelName + ";";
        } catch (ignore) {}
    }

    function loadPersistedLevel() {
        var storedLevel;

        try {
            storedLevel = window.localStorage['loglevel'];
        } catch (ignore) {}

        if (typeof storedLevel === undefinedType) {
            try {
                storedLevel = /loglevel=([^;]+)/.exec(window.document.cookie)[1];
            } catch (ignore) {}
        }
        
        if (self.levels[storedLevel] === undefined) {
            storedLevel = "WARN";
        }

        self.setLevel(self.levels[storedLevel], false);
    }

    /*
     *
     * Public API
     *
     */

    self.levels = { "TRACE": 0, "DEBUG": 1, "INFO": 2, "WARN": 3,
        "ERROR": 4, "SILENT": 5};

    self.methodFactory = function (methodName, level) {
        return realMethod(methodName) ||
               enableLoggingWhenConsoleArrives(methodName, level);
    };

    self.setLevel = function (level, persist) {
        if (typeof level === "string" && self.levels[level.toUpperCase()] !== undefined) {
            level = self.levels[level.toUpperCase()];
        }
        if (typeof level === "number" && level >= 0 && level <= self.levels.SILENT) {
            if (persist !== false) {  // defaults to true
                persistLevelIfPossible(level);
            }
            replaceLoggingMethods(level);
            if (typeof console === undefinedType && level < self.levels.SILENT) {
                return "No console available for logging";
            }
        } else {
            throw "log.setLevel() called with invalid level: " + level;
        }
    };

    self.enableAll = function(persist) {
        self.setLevel(self.levels.TRACE, persist);
    };

    self.disableAll = function(persist) {
        self.setLevel(self.levels.SILENT, persist);
    };

    // Grab the current global log variable in case of overwrite
    var _log = (typeof window !== undefinedType) ? window.log : undefined;
    self.noConflict = function() {
        if (typeof window !== undefinedType &&
               window.log === self) {
            window.log = _log;
        }

        return self;
    };

    loadPersistedLevel();
    return self;
}));

},{}]},{},[3])(3)
});