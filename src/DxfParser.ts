import { Readable } from 'stream';
import DxfArrayScanner, { IGroup } from './DxfArrayScanner.js';
import AUTO_CAD_COLOR_INDEX from './AutoCadColorIndex.js';

import Face from './entities/3dface.js';
import Arc from './entities/arc.js';
import AttDef from './entities/attdef.js';
import Circle from './entities/circle.js';
import Dimension from './entities/dimension.js';
import MLeader from './entities/mleader.js';
import Ellipse from './entities/ellipse.js';
import Insert from './entities/insert.js';
import Line from './entities/line.js';
import LWPolyline from './entities/lwpolyline.js';
import MText from './entities/mtext.js';
import Point from './entities/point.js';
import Polyline from './entities/polyline.js';
import Solid from './entities/solid.js';
import Spline from './entities/spline.js';
import Text from './entities/text.js';
//import Vertex from './entities/.js';

import log from 'loglevel';
import IGeometry, { EntityName, IEntity, IPoint } from './entities/geomtry.js';

//log.setLevel('trace');
//log.setLevel('debug');
//log.setLevel('info');
//log.setLevel('warn');
log.setLevel('error');
//log.setLevel('silent');

export interface IBlock {
	entities: IEntity[];
	type: number;
	ownerHandle: string;
	// entities: any[];
	xrefPath: string;
	name: string;
	name2: string;
	handle: string;
	layer: string;
	position: IPoint;
	paperSpace: boolean;
}

export interface IViewPort {
	name: string;
	lowerLeftCorner: IPoint;
	upperRightCorner: IPoint;
	center: IPoint;
	snapBasePoint: IPoint;
	snapSpacing: IPoint;
	gridSpacing: IPoint;
	viewDirectionFromTarget: IPoint;
	viewTarget: IPoint;
	lensLength: number;
	frontClippingPlane: string | number | boolean;
	backClippingPlane: string | number | boolean;
	viewHeight: number;
	snapRotationAngle: number;
	viewTwistAngle: number;
	orthographicType: string;
	ucsOrigin: IPoint;
	ucsXAxis: IPoint;
	ucsYAxis: IPoint;
	renderMode: string;
	defaultLightingType: string;
	defaultLightingOn: string;
	ownerHandle: string;
	ambientColor: number;
}

export interface IViewPortTableDefinition {
	tableRecordsProperty: 'viewPorts';
	tableName: 'viewPort';
	dxfSymbolName: 'VPORT';
	parseTableRecords(): IViewPort[];
}

export interface ILineType {
	name: string;
	description: string;
	pattern: string[];
	patternLength: number;
}

export interface ILineTypeTableDefinition {
	tableRecordsProperty: 'lineTypes';
	tableName: 'lineType';
	dxfSymbolName: 'LTYPE';
	parseTableRecords(): Record<string, ILineType>;
}

export interface ILayer {
	name: string;
	visible: boolean;
	colorIndex: number;
	color: number;
	frozen: boolean;
}

export interface ILayerTableDefinition {
	tableRecordsProperty: 'layers';
	tableName: 'layer';
	dxfSymbolName: 'LAYER';
	parseTableRecords(): Record<string, ILayer>;
}

export interface ITableDefinitions {
	VPORT: IViewPortTableDefinition;
	LTYPE: ILineTypeTableDefinition;
	LAYER: ILayerTableDefinition;
}

export interface IBaseTable {
	handle: string;
	ownerHandle: string;
}

export interface IViewPortTable extends IBaseTable {
	viewPorts: IViewPort[];
}

export interface ILayerTypesTable extends IBaseTable {
	lineTypes: Record<string, ILineType>;
}

export interface ILayersTable extends IBaseTable {
	layers: Record<string, ILayer>;
}

export interface ITables {
	viewPort: IViewPortTable;
	lineType: ILayerTypesTable;
	layer: ILayersTable;
}

export type ITable = IViewPortTable | ILayerTypesTable | ILayersTable;

export interface IDxf {
	header: Record<string, IPoint | number>;
	entities: IEntity[];
	blocks: Record<string, IBlock>;
	tables: ITables;
}

function registerDefaultEntityHandlers(dxfParser: DxfParser) {
	// Supported entities here (some entity code is still being refactored into this flow)
	dxfParser.registerEntityHandler(Face);
	dxfParser.registerEntityHandler(Arc);
	dxfParser.registerEntityHandler(AttDef);
	dxfParser.registerEntityHandler(Circle);
	dxfParser.registerEntityHandler(Dimension);
	dxfParser.registerEntityHandler(MLeader);
	dxfParser.registerEntityHandler(Ellipse);
	dxfParser.registerEntityHandler(Insert);
	dxfParser.registerEntityHandler(Line);
	dxfParser.registerEntityHandler(LWPolyline);
	dxfParser.registerEntityHandler(MText);
	dxfParser.registerEntityHandler(Point);
	dxfParser.registerEntityHandler(Polyline);
	dxfParser.registerEntityHandler(Solid);
	dxfParser.registerEntityHandler(Spline);
	dxfParser.registerEntityHandler(Text);
	//dxfParser.registerEntityHandler(require('./entities/vertex'));
}

export default class DxfParser {
	private _entityHandlers = {} as Record<EntityName, IGeometry>;
	constructor() {
		registerDefaultEntityHandlers(this);
	}

	public parse(source: string) {
		if (typeof source === 'string') {
			return this._parse(source);
		} else {
			console.error('Cannot read dxf source of type `' + typeof (source));
			return null;
		}
	}

	public registerEntityHandler(handlerType: new () => IGeometry) {
		const instance = new handlerType();
		this._entityHandlers[instance.ForEntityName] = instance;
	}

	public parseSync(source: string) {
		return this.parse(source);
	}

	public parseStream(stream: Readable) {

		let dxfString = "";
		const self = this;
		return new Promise<IDxf>((res, rej) => {

			stream.on('data', (chunk) => {
				dxfString += chunk;
			});
			stream.on('end', () => {
				try {
					res(self._parse(dxfString));
				} catch (err) {
					rej(err);
				}
			});
			stream.on('error', (err) => {
				rej(err);
			});
		});
	}

	private _parse(dxfString: string) {
		const dxf = {} as IDxf;
		let lastHandle = 0;
		const dxfLinesArray = dxfString.split(/\r\n|\r|\n/g);

		const scanner = new DxfArrayScanner(dxfLinesArray);
		if (!scanner.hasNext()) throw Error('Empty file');

		const self = this;
		let curr: IGroup;

		function parseAll() {
			curr = scanner.next();
			while (!scanner.isEOF()) {
				if (curr.code === 0 && curr.value === 'SECTION') {
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
					} else if (curr.value === 'ENTITIES') {
						log.debug('> ENTITIES');
						dxf.entities = parseEntities(false);
						log.debug('<');
					} else if (curr.value === 'TABLES') {
						log.debug('> TABLES');
						dxf.tables = parseTables();
						log.debug('<');
					} else if (curr.value === 'EOF') {
						log.debug('EOF');
					} else {
						log.warn('Skipping section \'%s\'', curr.value);
					}
				} else {
					curr = scanner.next();
				}
				// If is a new section
			}
		}

		/**
		 *
		 * @return {object} header
		 */
		function parseHeader() {
			// interesting variables:
			//  $ACADVER, $VIEWDIR, $VIEWSIZE, $VIEWCTR, $TDCREATE, $TDUPDATE
			// http://www.autodesk.com/techpubs/autocad/acadr14/dxf/header_section_al_u05_c.htm
			// Also see VPORT table entries
			let currVarName = null as null | string;
			let currVarValue = null as null | IPoint | number;
			const header = {} as Record<string, IPoint | number>;
			// loop through header variables
			curr = scanner.next();

			while (true) {
				if (groupIs(curr, 0, 'ENDSEC')) {
					if (currVarName) header[currVarName as string] = currVarValue!;
					break;
				} else if (curr.code === 9) {
					if (currVarName) header[currVarName as string] = currVarValue!;
					currVarName = curr.value as string;
					// Filter here for particular variables we are interested in
				} else {
					if (curr.code === 10) {
						currVarValue = { x: curr.value as number } as IPoint;
					} else if (curr.code === 20) {
						(currVarValue as IPoint).y = curr.value as number;
					} else if (curr.code === 30) {
						(currVarValue as IPoint).z = curr.value as number;
					} else {
						currVarValue = curr.value as number;
					}
				}
				curr = scanner.next();
			}
			// console.log(util.inspect(header, { colors: true, depth: null }));
			curr = scanner.next(); // swallow up ENDSEC
			return header;
		}


		/**
		 *
		 */
		function parseBlocks() {
			const blocks = {} as Record<string, IBlock>;

			curr = scanner.next();

			while (curr.value !== 'EOF') {
				if (groupIs(curr, 0, 'ENDSEC')) {
					break;
				}

				if (groupIs(curr, 0, 'BLOCK')) {
					log.debug('block {');
					const block = parseBlock();
					log.debug('}');
					ensureHandle(block);
					if (!block.name)
						log.error('block with handle "' + block.handle + '" is missing a name.');
					else
						blocks[block.name] = block;
				} else {
					logUnhandledGroup(curr);
					curr = scanner.next();
				}
			}
			return blocks;
		}

		function parseBlock() {
			const block = {} as IBlock;
			curr = scanner.next();

			while (curr.value !== 'EOF') {
				switch (curr.code) {
					case 1:
						block.xrefPath = curr.value as string;
						curr = scanner.next();
						break;
					case 2:
						block.name = curr.value as string;
						curr = scanner.next();
						break;
					case 3:
						block.name2 = curr.value as string;
						curr = scanner.next();
						break;
					case 5:
						block.handle = curr.value as string;
						curr = scanner.next();
						break;
					case 8:
						block.layer = curr.value as string;
						curr = scanner.next();
						break;
					case 10:
						block.position = parsePoint(curr);
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
							block.type = curr.value as number;
						}
						curr = scanner.next();
						break;
					case 100:
						// ignore class markers
						curr = scanner.next();
						break;
					case 330:
						block.ownerHandle = curr.value as string;
						curr = scanner.next();
						break;
					case 0:
						if (curr.value == 'ENDBLK')
							break;
						block.entities = parseEntities(true);
						break;
					default:
						logUnhandledGroup(curr);
						curr = scanner.next();
				}

				if (groupIs(curr, 0, 'ENDBLK')) {
					curr = scanner.next();
					break;
				}
			}
			return block;
		}

		/**
		 * parseTables
		 * @return {Object} Object representing tables
		 */
		function parseTables() {
			const tables = {} as ITables;
			curr = scanner.next();
			while (curr.value !== 'EOF') {
				if (groupIs(curr, 0, 'ENDSEC'))
					break;

				if (groupIs(curr, 0, 'TABLE')) {
					curr = scanner.next();

					const tableDefinition = tableDefinitions[curr.value as keyof ITableDefinitions];
					if (tableDefinition) {
						log.debug(curr.value + ' Table {');
						tables[tableDefinitions[curr.value as keyof ITableDefinitions].tableName] = parseTable(curr);
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
		}

		const END_OF_TABLE_VALUE = 'ENDTAB';

		function parseTable<T extends IBaseTable = ITable>(group: IGroup) {
			const tableDefinition = tableDefinitions[group.value as keyof ITableDefinitions];
			const table = {} as T;
			let expectedCount = 0;

			curr = scanner.next();
			while (!groupIs(curr, 0, END_OF_TABLE_VALUE)) {

				switch (curr.code) {
					case 5:
						table.handle = curr.value as string;
						curr = scanner.next();
						break;
					case 330:
						table.ownerHandle = curr.value as string;
						curr = scanner.next();
						break;
					case 100:
						if (curr.value === 'AcDbSymbolTable') {
							// ignore
							curr = scanner.next();
						} else {
							logUnhandledGroup(curr);
							curr = scanner.next();
						}
						break;
					case 70:
						expectedCount = curr.value as number;
						curr = scanner.next();
						break;
					case 0:
						if (curr.value === tableDefinition.dxfSymbolName) {
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
			const tableRecords = table[tableDefinition.tableRecordsProperty];
			if (tableRecords) {
				let actualCount = (() => {
					if (tableRecords.constructor === Array) {
						return tableRecords.length;
					} else if (typeof (tableRecords) === 'object') {
						return Object.keys(tableRecords).length;
					}
					return undefined;
				})();
				if (expectedCount !== actualCount) log.warn('Parsed ' + actualCount + ' ' + tableDefinition.dxfSymbolName + '\'s but expected ' + expectedCount);
			}
			curr = scanner.next();
			return table;
		}

		function parseViewPortRecords() {
			const viewPorts = [] as IViewPort[]; // Multiple table entries may have the same name indicating a multiple viewport configuration
			let viewPort = {} as IViewPort;

			log.debug('ViewPort {');
			curr = scanner.next();
			while (!groupIs(curr, 0, END_OF_TABLE_VALUE)) {

				switch (curr.code) {
					case 2: // layer name
						viewPort.name = curr.value as string;
						curr = scanner.next();
						break;
					case 10:
						viewPort.lowerLeftCorner = parsePoint(curr);
						curr = scanner.next();
						break;
					case 11:
						viewPort.upperRightCorner = parsePoint(curr);
						curr = scanner.next();
						break;
					case 12:
						viewPort.center = parsePoint(curr);
						curr = scanner.next();
						break;
					case 13:
						viewPort.snapBasePoint = parsePoint(curr);
						curr = scanner.next();
						break;
					case 14:
						viewPort.snapSpacing = parsePoint(curr);
						curr = scanner.next();
						break;
					case 15:
						viewPort.gridSpacing = parsePoint(curr);
						curr = scanner.next();
						break;
					case 16:
						viewPort.viewDirectionFromTarget = parsePoint(curr);
						curr = scanner.next();
						break;
					case 17:
						viewPort.viewTarget = parsePoint(curr);
						curr = scanner.next();
						break;
					case 42:
						viewPort.lensLength = curr.value as number;
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
						viewPort.viewHeight = curr.value as number;
						curr = scanner.next();
						break;
					case 50:
						viewPort.snapRotationAngle = curr.value as number;
						curr = scanner.next();
						break;
					case 51:
						viewPort.viewTwistAngle = curr.value as number;
						curr = scanner.next();
						break;
					case 79:
						viewPort.orthographicType = curr.value as string;
						curr = scanner.next();
						break;
					case 110:
						viewPort.ucsOrigin = parsePoint(curr);
						curr = scanner.next();
						break;
					case 111:
						viewPort.ucsXAxis = parsePoint(curr);
						curr = scanner.next();
						break;
					case 112:
						viewPort.ucsYAxis = parsePoint(curr);
						curr = scanner.next();
						break;
					case 281:
						viewPort.renderMode = curr.value as string;
						curr = scanner.next();
						break;
					case 282:
						// 0 is one distant light, 1 is two distant lights
						viewPort.defaultLightingType = curr.value as string;
						curr = scanner.next();
						break;
					case 292:
						viewPort.defaultLightingOn = curr.value as string;
						curr = scanner.next();
						break;
					case 330:
						viewPort.ownerHandle = curr.value as string;
						curr = scanner.next();
						break;
					case 63: // These are all ambient color. Perhaps should be a gradient when multiple are set.
					case 421:
					case 431:
						viewPort.ambientColor = curr.value as number;
						curr = scanner.next();
						break;
					case 0:
						// New ViewPort
						if (curr.value === 'VPORT') {
							log.debug('}');
							viewPorts.push(viewPort);
							log.debug('ViewPort {');
							viewPort = {} as IViewPort;
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
		}

		function parseLineTypes() {
			const ltypes = {} as Record<string, ILineType>;
			let ltype = {} as ILineType;
			let length = 0;
			let ltypeName: string;

			log.debug('LType {');
			curr = scanner.next();
			while (!groupIs(curr, 0, 'ENDTAB')) {

				switch (curr.code) {
					case 2:
						ltype.name = curr.value as string;
						ltypeName = curr.value as string;
						curr = scanner.next();
						break;
					case 3:
						ltype.description = curr.value as string;
						curr = scanner.next();
						break;
					case 73: // Number of elements for this line type (dots, dashes, spaces);
						length = curr.value as number;
						if (length > 0) ltype.pattern = [];
						curr = scanner.next();
						break;
					case 40: // total pattern length
						ltype.patternLength = curr.value as number;
						curr = scanner.next();
						break;
					case 49:
						ltype.pattern.push(curr.value as string);
						curr = scanner.next();
						break;
					case 0:
						log.debug('}');
						if (length > 0 && length !== ltype.pattern.length) log.warn('lengths do not match on LTYPE pattern');
						ltypes[ltypeName!] = ltype;
						ltype = {} as ILineType;
						log.debug('LType {');
						curr = scanner.next();
						break;
					default:
						curr = scanner.next();
				}
			}

			log.debug('}');
			ltypes[ltypeName!] = ltype;
			return ltypes;
		}

		function parseLayers() {
			const layers = {} as Record<string, ILayer>;
			let layer = {} as ILayer;
			let layerName: string | undefined;

			log.debug('Layer {');
			curr = scanner.next();
			while (!groupIs(curr, 0, 'ENDTAB')) {

				switch (curr.code) {
					case 2: // layer name
						layer.name = curr.value as string;
						layerName = curr.value as string;
						curr = scanner.next();
						break;
					case 62: // color, visibility
						layer.visible = curr.value >= 0;
						// TODO 0 and 256 are BYBLOCK and BYLAYER respectively. Need to handle these values for layers?.
						layer.colorIndex = Math.abs(curr.value as number);
						layer.color = getAcadColor(layer.colorIndex as number);
						curr = scanner.next();
						break;
					case 70: // frozen layer
						layer.frozen = (((curr.value as number) & 1) != 0 || ((curr.value as number) & 2) != 0);
						curr = scanner.next();
						break;
					case 420: // TrueColor
						layer.color = Math.abs(curr.value as number);
						curr = scanner.next();
						break;
					case 0:
						// New Layer
						if (curr.value === 'LAYER') {
							log.debug('}');
							layers[layerName!] = layer;
							log.debug('Layer {');
							layer = {} as ILayer;
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
			layers[layerName!] = layer;

			return layers;
		}

		const tableDefinitions = {
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
		} as ITableDefinitions;

		/**
		 * Is called after the parser first reads the 0:ENTITIES group. The scanner
		 * should be on the start of the first entity already.
		 * @return {Array} the resulting entities
		 */
		function parseEntities(forBlock: boolean) {
			const entities = [] as IEntity[];

			const endingOnValue = forBlock ? 'ENDBLK' : 'ENDSEC';

			if (!forBlock) {
				curr = scanner.next();
			}
			while (true) {

				if (curr.code === 0) {
					if (curr.value === endingOnValue) {
						break;
					}

					const handler = self._entityHandlers[curr.value as EntityName];
					if (handler != null) {
						log.debug(curr.value + ' {');
						const entity = handler.parseEntity(scanner, curr);
						curr = scanner.lastReadGroup!;
						log.debug('}');
						ensureHandle(entity);
						entities.push(entity);
					} else {
						log.warn('Unhandled entity ' + curr.value);
						curr = scanner.next();
						continue;
					}
				} else {
					// ignored lines from unsupported entity
					curr = scanner.next();
				}
			}
			if (endingOnValue == 'ENDSEC') curr = scanner.next(); // swallow up ENDSEC, but not ENDBLK
			return entities;
		}

		/**
		 * Parses a 2D or 3D point, returning it as an object with x, y, and
		 * (sometimes) z property if it is 3D. It is assumed the current group
		 * is x of the point being read in, and scanner.next() will return the
		 * y. The parser will determine if there is a z point automatically.
		 * @return {Object} The 2D or 3D point as an object with x, y[, z]
		 */
		function parsePoint(curr: IGroup) {
			const point = {} as IPoint;
			let code = curr.code;

			point.x = curr.value as number;

			code += 10;
			curr = scanner.next();
			if (curr.code != code)
				throw new Error('Expected code for point value to be ' + code +
					' but got ' + curr.code + '.');
			point.y = curr.value as number;

			code += 10;
			curr = scanner.next();
			if (curr.code != code) {
				scanner.rewind();
				return point;
			}
			point.z = curr.value as number;

			return point;
		}

		function ensureHandle(entity: IEntity | IBlock) {
			if (!entity) throw new TypeError('entity cannot be undefined or null');

			if (!entity.handle) entity.handle = lastHandle++;
		}

		parseAll();
		return dxf;
	}
}

function groupIs(group: IGroup, code: number, value: string | number | boolean) {
	return group.code === code && group.value === value;
}

function logUnhandledGroup(curr: IGroup) {
	log.debug('unhandled group ' + debugCode(curr));
}


function debugCode(curr: IGroup) {
	return curr.code + ':' + curr.value;
}

/**
 * Returns the truecolor value of the given AutoCad color index value
 * @return {Number} truecolor value as a number
 */
function getAcadColor(index: number) {
	return AUTO_CAD_COLOR_INDEX[index];
}

// const BLOCK_ANONYMOUS_FLAG = 1;
// const BLOCK_NON_CONSTANT_FLAG = 2;
// const BLOCK_XREF_FLAG = 4;
// const BLOCK_XREF_OVERLAY_FLAG = 8;
// const BLOCK_EXTERNALLY_DEPENDENT_FLAG = 16;
// const BLOCK_RESOLVED_OR_DEPENDENT_FLAG = 32;
// const BLOCK_REFERENCED_XREF = 64;


/* Notes */
// Code 6 of an entity indicates inheritance of properties (eg. color).
//   BYBLOCK means inherits from block
//   BYLAYER (default) mean inherits from layer
