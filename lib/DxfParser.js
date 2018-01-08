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
	dxfParser.registerEntityHandler(require('./entities/spline'));
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
				// Supported entities here
				if(curr.value === 'LWPOLYLINE') {
					log.debug('LWPOLYLINE {');
					entity = parseLWPOLYLINE();
					log.debug('}')
				} else if(curr.value === 'POLYLINE') {
					log.debug('POLYLINE {');
					entity = parsePOLYLINE();
					log.debug('}');
				} else if(curr.value === 'LINE') {
					log.debug('LINE {');
					entity = parseLINE();
					log.debug('}');
				 } else if (curr.value === '3DFACE') {
					log.debug('3DFACE {');
					entity = parse3DFACE();
					log.debug('}');
				} else if(curr.value === 'CIRCLE') {
					log.debug('CIRCLE {');
					entity = parseCIRCLE();
					log.debug('}');
				} else if(curr.value === 'ELLIPSE') {
					log.debug('ELLIPSE {');
					entity = parseELLIPSE();
					log.debug('}');
				} else if(curr.value === 'ARC') {
					log.debug('ARC {');
					// similar properties to circle?
					entity = parseCIRCLE();
					log.debug('}');
				} else if(curr.value === 'TEXT') {
					log.debug('TEXT {');
					entity = parseTEXT();
					log.debug('}');
				} else if(curr.value === 'DIMENSION') {
					log.debug('DIMENSION {');
					entity = parseDIMENSION();
					log.debug('}');
				} else if(curr.value === 'SOLID') {
					log.debug('SOLID {');
					entity = parseSOLID();
					log.debug('}');
				} else if(curr.value === 'POINT') {
					log.debug('POINT {');
					entity = parsePOINT();
					log.debug('}');
				} else if(curr.value === 'MTEXT') {
					log.debug('MTEXT {');
					entity = parseMTEXT();
					log.debug('}');
				} else if(curr.value === 'ATTDEF') {
					log.debug('ATTDEF {');
					entity = parseATTDEF();
					log.debug('}');
				} else if(curr.value === 'INSERT') {
					log.debug('INSERT {');
					entity = parseINSERT();
					log.debug('}');
				} else {
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
				}
				ensureHandle(entity);
				entities.push(entity);
			} else {
				// ignored lines from unsupported entity
				curr = scanner.next();
			}
		}
		// console.log(util.inspect(entities, { colors: true, depth: null }));
		if(endingOnValue == 'ENDSEC') curr = scanner.next(); // swallow up ENDSEC, but not ENDBLK
		return entities;
	};

	/**
	 *
	 * @param entity
	 */
	var checkCommonEntityProperties = function(entity) {
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
				// This is technically an enum. Not sure where -2 comes from.
				//From https://www.woutware.com/Forum/Topic/955/lineweight?returnUrl=%2FForum%2FUserPosts%3FuserId%3D478262319
				// An integer representing 100th of mm, must be one of the following values:
				// 0, 5, 9, 13, 15, 18, 20, 25, 30, 35, 40, 50, 53, 60, 70, 80, 90, 100, 106, 120, 140, 158, 200, 211.
				entity.lineweight = curr.value;
				break;
			case 420: // TrueColor Color
				entity.color = curr.value;
				break;
			case 100:
                //ignore
                break;
			default:
				logUnhandledGroup(curr);
				break;
		}
	};


	var parseVertex = function() {
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
					checkCommonEntityProperties(entity);
					break;
			}
			
			curr = scanner.next();
		}
		return entity;
	};

	var parseSeqEnd = function() {
        var entity = { type: curr.value };
        curr = scanner.next();
        while(curr != 'EOF') {
            if (curr.code == 0) break;
			checkCommonEntityProperties(entity);
			curr = scanner.next();
        }

		return entity;
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

	var parseLWPolylineVertices = function(n) {
		if(!n || n <= 0) throw Error('n must be greater than 0 verticies');
		var vertices = [], i;
		var vertexIsStarted = false;
		var vertexIsFinished = false;

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

	var parsePolylineVertices = function() {
		var vertices = [];
		while (curr !== 'EOF') {
			if (curr.code === 0) {
				if (curr.value === 'VERTEX') {
					vertices.push(parseVertex());
				} else if (curr.value === 'SEQEND') {
					parseSeqEnd();
					break;
				}
			}
		}
		return vertices;
	};

	var parseMTEXT = function() {
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
                    entity.position = parsePoint();
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
					checkCommonEntityProperties(entity);
					break;
			}
			curr = scanner.next();
		}
		return entity;
	};

	var parseATTDEF = function() {
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
					checkCommonEntityProperties(entity);
					break;
			}
			curr = scanner.next();
		}

		return entity;
	};
	
	var parse3dFaceVertices = function(entity) {
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

    /**
     * Called when the parser reads the beginning of a new entity,
     * 0:parse3DFACE. Scanner.next() will return the first attribute of the
     * entity.
     * @return {Object} the entity parsed
     */
    var parse3DFACE = function() {
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
                    entity.vertices = parse3dFaceVertices();
                    break;
                default:
                    checkCommonEntityProperties(entity);
                    break;
			}
			curr = scanner.next();
        }
        return entity;
    };

	/**
	 * Called when the parser reads the beginning of a new entity,
	 * 0:LWPOLYLINE. Scanner.next() will return the first attribute of the
	 * entity.
	 * @return {Object} the entity parsed
	 */
	var parseLWPOLYLINE = function() {
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
					entity.vertices = parseLWPolylineVertices(numberOfVertices);
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
					checkCommonEntityProperties(entity);
					break;
			}
			curr = scanner.next();
		}
		return entity;
	};

	/**
	 * Called when the parser reads the beginning of a new entity,
	 * 0:POLYLINE. Scanner.next() will return the first attribute of the
	 * entity.
	 * @return {Object} the entity parsed
	 */
	var parsePOLYLINE = function() {
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
                    extrusionDirection = parsePoint();
					break;
				default:
					checkCommonEntityProperties(entity);
					break;
			}
			curr = scanner.next();
		}

		entity.vertices = parsePolylineVertices();

		return entity;
	};


	/**
	 * Called when the parser reads the beginning of a new entity,
	 * 0:LINE. Scanner.next() will return the first attribute of the
	 * entity.
	 * @return {Object} the entity parsed
	 */
	var parseLINE = function() {
		var entity = { type: curr.value, vertices: [] };
		curr = scanner.next();
		while(curr !== 'EOF') {
			if(curr.code === 0) break;

			switch(curr.code) {
				case 10: // X coordinate of point
					entity.vertices.unshift(parsePoint());
					break;
				case 11:
					entity.vertices.push(parsePoint());
					break;
				case 210:
					entity.extrusionDirection = parsePoint();
					break;
				case 100:
					break;
				default:
					checkCommonEntityProperties(entity);
					break;
			}
			
			curr = scanner.next();
		}
		return entity;
	};

	/**
	 * Used to parse a circle or arc entity.
	 * @return {Object} the entity parsed
	 */
	var parseCIRCLE = function() {
		var entity, endAngle;
		entity = { type: curr.value };
		curr = scanner.next();
		while(curr !== 'EOF') {
			if(curr.code === 0) break;

			switch(curr.code) {
				case 10: // X coordinate of point
					entity.center = parsePoint();
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
					checkCommonEntityProperties(entity);
					break;
			}
			curr = scanner.next();
		}
		return entity;
	};

	var parseTEXT = function() {
		var entity;
		entity = { type: curr.value };
		curr = scanner.next();
		while(curr !== 'EOF') {
			if(curr.code === 0) break;
			switch(curr.code) {
				case 10: // X coordinate of 'first alignment point'
					entity.startPoint = parsePoint();
					break;
				case 11: // X coordinate of 'second alignment point'
					entity.endPoint = parsePoint();
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
					checkCommonEntityProperties(entity);
					break;
			}
			curr = scanner.next();
		}
		return entity;
	};

	var parseDIMENSION = function() {
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
					entity.anchorPoint = parsePoint();
					break;
				case 11:
					entity.middleOfText = parsePoint();
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
					checkCommonEntityProperties(entity);
					break;
			}
			curr = scanner.next();
		}

		return entity;
	};

	var parseSOLID = function() {
		var entity;
		entity = { type: curr.value };
		entity.points = [];
		curr = scanner.next();
		while(curr !== 'EOF') {
			if(curr.code === 0) break;

			switch(curr.code) {
				case 10:
					entity.points[0] = parsePoint();
					break;
				case 11:
					entity.points[1] = parsePoint();
					break;
				case 12:
					entity.points[2] = parsePoint();
					break;
				case 13:
					entity.points[3] = parsePoint();
					break;
				case 210:
					entity.extrusionDirection = parsePoint();
					break;
				default: // check common entity attributes
					checkCommonEntityProperties(entity);
					break;
			}
			curr = scanner.next();
		}

		return entity;
	};

	var parseINSERT = function() {
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
					entity.position = parsePoint();
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
					entity.extrusionDirection = parsePoint();
					break;
				default: // check common entity attributes
					checkCommonEntityProperties(entity);
					break;
			}
			curr = scanner.next();
		}

		return entity;
	};

	var parseSPLINE = function() {
		var entity;
		entity = { type: curr.value };
		curr = scanner.next();
		while(curr !== 'EOF')
		{
			if(curr.code === 0) break;

			switch(curr.code) {
				case 10:
					if (!entity.controlPoints) entity.controlPoints = [];
					entity.controlPoints.push(parsePoint());
					break;
				case 11:
					if (!entity.fitPoints) entity.fitPoints = [];
					entity.fitPoints.push(parsePoint());
					break;
				case 12:
					entity.startTangent = parsePoint();
					break;
				case 13:
					entity.endTangent = parsePoint();
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
					entity.normalVector = parsePoint();
					break;
				default:
					checkCommonEntityProperties(entity);
					break;
			}
			curr = scanner.next();
		}

		return entity;
	};

	var parseELLIPSE = function() {
		var entity;
		entity = { type: curr.value };
		curr = scanner.next();
		while(curr !== 'EOF') {
			if(curr.code === 0) break;

			switch(curr.code) {
				case 10:
					entity.center = parsePoint();
					break;
				case 11:
					entity.majorAxisEndPoint = parsePoint();
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
					checkCommonEntityProperties(entity);
					break;
			}
			
			curr = scanner.next();
		}

		return entity;
	}

	var parsePOINT = function() {
		var entity;
		entity = { type: curr.value };
		curr = scanner.next();
		while(curr !== 'EOF') {
			if(curr.code === 0) break;

			switch(curr.code) {
				case 10:
					entity.position = parsePoint();
					break;
				case 39:
					entity.thickness = curr.value;
					break;
				case 210:
					entity.extrusionDirection = parsePoint();
					break;
				case 100:
					break;
				default: // check common entity attributes
					checkCommonEntityProperties(entity);
					break;
			}
			curr = scanner.next();
		}

		return entity;
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