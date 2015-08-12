var DxfArrayScanner = require('./DxfArrayScanner.js'),
	AUTO_CAD_COLOR_INDEX = require('./AutoCadColorIndex');

var log = require('loglevel');

//log.setLevel('trace');
// log.setLevel('debug');
log.setLevel('info');
//log.setLevel('warn');
//log.setLevel('error');
//log.setLevel('silent');


function DxfParser(stream) {}

DxfParser.prototype.parse = function(source, done) {
	throw new Error("read() not implemented. Use readSync()");
};

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
	var scanner, curr, dxf = {};
	var dxfLinesArray = dxfString.split(/\r\n|\r|\n/g);

	scanner = new DxfArrayScanner(dxfLinesArray);
	if(!scanner.hasNext()) throw Error('Empty file');

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
				blocks[block.handle] = block;
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
		console.error(typeof(tableRecords));
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
					break;
				case 11:
					viewPort.upperRightCorner = parsePoint();
					break;
				case 12:
					viewPort.center = parsePoint();
					break;
				case 13:
					viewPort.snapBasePoint = parsePoint();
					break;
				case 14:
					viewPort.snapSpacing = parsePoint();
					break;
				case 15:
					viewPort.gridSpacing = parsePoint();
					break;
				case 16:
					viewPort.viewDirectionFromTarget = parsePoint();
					break;
				case 17:
					viewPort.viewTarget = parsePoint();
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
				case 110:
					viewPort.ucsOrigin = parsePoint();
					break;
				case 111:
					viewPort.ucsXAxis = parsePoint();
					break;
				case 112:
					viewPort.ucsYAxis = parsePoint();
					break;
				case 110:
					viewPort.ucsOrigin = parsePoint();
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
					layer.visible = curr.value <= 0;
					// TODO 0 and 256 are BYBLOCK and BYLAYER respectively. Need to handle these values for layers?.
					layer.color = getAcadColor(Math.abs(curr.value));
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

		curr = scanner.next();
		while(true) {

			if(curr.code === 0) {
				if(curr.value === endingOnValue) {
					break;
				}

				// Supported entities here
				if(curr.value === 'LWPOLYLINE') {
					log.debug('LWPOLYLINE {');
					entities.push(parseLWPOLYLINE());
					log.debug('}')
				} else if(curr.value === 'LINE') {
					log.debug('LINE {');
					entities.push(parseLINE());
					log.debug('}');
				} else if(curr.value === 'CIRCLE') {
					log.debug('CIRCLE {');
					entities.push(parseCIRCLE());
					log.debug('}');
				} else if(curr.value === 'ARC') {
					log.debug('ARC {');
					// similar properties to circle?
					entities.push(parseCIRCLE());
					log.debug('}')
				} else if(curr.value === 'TEXT') {
					log.debug('TEXT {');
					entities.push(parseTEXT());
					log.debug('}')
				} else if(curr.value === 'DIMENSION') {
					log.debug('DIMENSION {');
					entities.push(parseDIMENSION());
					log.debug('}')
				} else if(curr.value === 'SOLID') {
					log.debug('SOLID {');
					entities.push(parseSOLID());
					log.debug('}')
				} else if(curr.value === 'POINT') {
					log.debug('POINT {');
					entities.push(parsePOINT());
					log.debug('}')
				} else if(curr.value === 'MTEXT') {
					log.debug('MTEXT {');
					entities.push(parseMTEXT());
					log.debug('}')
				} else if(curr.value === 'ATTDEF') {
					log.debug('ATTDEF {');
					entities.push(parseATTDEF());
					log.debug('}')
				} else {
					log.warn('Unhandled entity ' + curr.value);
					curr = scanner.next();
				}

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
				curr = scanner.next();
				break;
			case 5:
				entity.handle = curr.value;
				curr = scanner.next();
				break;
			case 6:
				entity.lineType = curr.value;
				curr = scanner.next();
				break;
			case 8: // Layer name
				entity.layer = curr.value;
				curr = scanner.next();
				break;
			case 48:
				entity.lineTypeScale = curr.value;
				curr = scanner.next();
				break;
			case 60:
				entity.visible = curr.value === 0;
				curr = scanner.next();
				break;
			case 62: // Acad Index Color. 0 inherits ByBlock. 256 inherits ByLayer. Default is bylayer
				entity.colorIndex = curr.value;
				entity.color = getAcadColor(Math.abs(curr.value));
				curr = scanner.next();
				break;
			case 67:
				entity.inPaperSpace = curr.value !== 0;
				curr = scanner.next();
				break;
			case 330:
				entity.ownerHandle = curr.value;
				curr = scanner.next();
				break;
			case 347:
				entity.materialObjectHandle = curr.value;
				curr = scanner.next();
				break;
			case 370:
				// This is technically an enum. Not sure where -2 comes from.
				//From https://www.woutware.com/Forum/Topic/955/lineweight?returnUrl=%2FForum%2FUserPosts%3FuserId%3D478262319
				// An integer representing 100th of mm, must be one of the following values:
				// 0, 5, 9, 13, 15, 18, 20, 25, 30, 35, 40, 50, 53, 60, 70, 80, 90, 100, 106, 120, 140, 158, 200, 211.
				entity.lineweight = curr.value;
				curr = scanner.next();
				break;
			case 420: // TrueColor Color
				entity.color = curr.value;
				curr = scanner.next();
				break;
			case 100:
				if(curr.value == 'AcDbEntity') {
					curr = scanner.next();
					break;
				}
			default:
				logUnhandledGroup(curr);
				curr = scanner.next();
				break;
		}
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
			return point;
		point.z = curr.value;

		curr = scanner.next(); // advance the scanner before returning
		return point;
	};

	var parsePolylineVertices = function(n) {
		if(!n || n <= 0) throw Error('n must be greater than 0 verticies');
		var vertices = [], i, vertex;

		for(i = 0; i < n; i++) {
			vertex = parsePoint();

			// check for bulge. Save it with the start point vertex of the bulge
			if(curr.code === 42 && curr.value !== 0) {
				vertex.bulge = curr.value;
				curr = scanner.next();
			}

			// bulge creates an arc in a polyline
			// 0.0 means straight line.
			// See https://groups.google.com/forum/#!topic/comp.cad.autocad/9gn8s5O_w6E
			vertices.push(vertex);
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
                    curr = scanner.next();
                    break;
                case 3:
                    entity.text += curr.value;
                    curr = scanner.next();
                    break;
                case 10:
                    entity.position = parsePoint();
                    break;
                case 40:
                    entity.height = curr.value;
                    curr = scanner.next();
                    break;
                case 41:
                    entity.width = curr.value;
                    curr = scanner.next();
                    break;
                case 71:
                    entity.attachmentPoint = curr.value;
                    curr = scanner.next();
                    break;
                case 72:
                    entity.drawingDirection = curr.value;
                    curr = scanner.next();
                    break;
				default:
					checkCommonEntityProperties(entity);
					break;
			}
		}
		return entity;
	};

	var parseATTDEF = function() {
		var entity = { type: curr.value };
		curr = scanner.next();
		while (curr !== 'EOF') {
			if (curr.code === 0) {
				break;
			}
			switch(curr.code) {
				case 1:
					entity.text = curr.value;
					curr = scanner.next();
					break;
				case 2:
					entity.tag = curr.value;
					curr = scanner.next();
					break;
				case 3:
					entity.prompt = curr.value;
					curr = scanner.next();
					break;
				case 7:
					entity.text_style = curr.value;
					curr = scanner.next();
					break;
				case 10:
					entity.x = curr.value;
					curr = scanner.next();
					break;
				case 20:
					entity.y = curr.value;
					curr = scanner.next();
					break;
				case 30:
					entity.z = curr.value;
					curr = scanner.next();
					break;
				case 39:
					entity.thickness = curr.value;
					curr = scanner.next();
					break;
				case 40:
					entity.text_height = curr.value;
					curr = scanner.next();
					break;
				case 41:
					entity.scale = curr.value;
					curr = scanner.next();
					break;
				case 50:
					entity.rotation = curr.value;
					curr = scanner.next();
					break;
				case 51:
					entity.oblique_angle = curr.value;
					curr = scanner.next();
					break;
				case 70:
					// flags
					curr = scanner.next();
					break;
				case 71:
					// flags
					curr = scanner.next();
					break;
				case 72:
					// flags
					curr = scanner.next();
					break;
				case 73:
					entity.field_length = curr.value;
					curr = scanner.next();
					break;
				case 74:
					// flags
					curr = scanner.next();
					break;
				case 100:
					// subclass
					curr = scanner.next();
					break;
				case 210:
					entity.extrusion_direction_x = curr.value;
					curr = scanner.next();
					break;
				case 220:
					entity.extrusion_direction_y = curr.value;
					curr = scanner.next();
					break;
				case 230:
					entity.extrusion_direction_z = curr.value;
					curr = scanner.next();
					break;
				default:
					checkCommonEntityProperties(entity);
					break;
			}
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
				case 70: // 1 = Closed shape, 128 = plinegen?, 0 = default
					entity.shape = (curr.value === 1);
					curr = scanner.next();
					break;
				case 90:
					numberOfVertices = curr.value;
					curr = scanner.next();
					break;
				case 10: // X coordinate of point
					entity.vertices = parsePolylineVertices(numberOfVertices);
					break;
				default:
					checkCommonEntityProperties(entity);
					break;
			}
		}
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
					entity.vertices = parsePolylineVertices(2);
					break;
				case 100:
					if(curr.value == 'AcDbLine') {
						curr = scanner.next();
						break;
					}
				default:
					checkCommonEntityProperties(entity);
					break;
			}
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
					curr = scanner.next();
					break;
				case 50: // start angle
					entity.startAngle = Math.PI / 180 * curr.value;
					curr = scanner.next();
					break;
				case 51: // end angle
					endAngle = Math.PI / 180 * curr.value;
					if(endAngle < entity.startAngle)
						entity.angleLength = endAngle + 2 * Math.PI - entity.startAngle;
					else
						entity.angleLength = endAngle - entity.startAngle;
					entity.endAngle = endAngle;
					curr = scanner.next();
					break;
				default: // ignored attribute
					checkCommonEntityProperties(entity);
					break;
			}
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
					curr = scanner.next();
					break;
				case 41:
					entity.xScale = curr.value;
					curr = scanner.next();
					break;
				case 1: // Text
					entity.text = curr.value;
					curr = scanner.next();
					break;
				// NOTE: 72 and 73 are meaningless without 11 (second alignment point)
				case 72: // Horizontal alignment
					entity.halign = curr.value;
					curr = scanner.next();
					break;
				case 73: // Vertical alignment
					entity.valign = curr.value;
					curr = scanner.next();
					break;
				default: // check common entity attributes
					checkCommonEntityProperties(entity);
					break;
			}
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
					curr = scanner.next();
					break;
				case 10: // X coordinate of 'first alignment point'
					entity.anchorPoint = parsePoint();
					break;
				case 11:
					entity.middleOfText = parsePoint();
					break;
				case 71: // 5 = Middle center
					entity.attachmentPoint = curr.value;
					curr = scanner.next();
					break;
				case 42: // Actual measurement
					entity.actualMeasurement = curr.value;
					curr = scanner.next();
					break;
				case 1: // Text entered by user explicitly
					entity.text = curr.value;
					curr = scanner.next();
					break;
				case 50: // Angle of rotated, horizontal, or vertical dimensions
					entity.angle = curr.value;
					curr = scanner.next();
					break;
				default: // check common entity attributes
					checkCommonEntityProperties(entity);
					break;
			}
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
		}

		return entity;
	};

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
					curr = scanner.next();
					break;
				case 210:
					entity.extrusionDirection = parsePoint();
					break;
				case 100:
					if(curr.value == 'AcDbPoint') {
						curr = scanner.next();
						break;
					}
				default: // check common entity attributes
					checkCommonEntityProperties(entity);
					break;
			}
		}

		return entity;
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