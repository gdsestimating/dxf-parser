
import * as helpers from '../ParseHelpers'

export default function EntityParser() { }

EntityParser.ForEntityName = 'HATCH';

EntityParser.prototype.parseEntity = function (scanner, curr) {
	var entity;
	entity = { type: curr.value, boundaries: [] };
	curr = scanner.next();
	while (curr !== 'EOF') {
		if (curr.code === 0) break;
		// console.log("parseHatch pointer: " + scanner._pointer);
		// console.log("parseHatch code: " + curr.code);
		// console.log("parseHatch value: " + curr.value);
		switch (curr.code) {
			case 2:
				entity.patternName = curr.value;
				break;
			case 10:
				entity.elevationX = curr.value;
				break;
			case 20:
				entity.elevationY = curr.value;
				break;
			case 30:
				entity.elevationZ = curr.value;
				break;
			case 41: // Hatch pattern scale or spacing (pattern fill only)
				entity.scale = curr.value;
				break;
			case 47:
				entity.pixelSize = curr.value;
			case 70: // Solid fill flag (solid fill = 1; pattern fill = 0); for MPolygon, the version of MPolygon
				entity.solidFill = (curr.value & 1) !== 0;
				break;
			case 71: // Associativity flag (associative = 1; non-associative = 0); for MPolygon, solid-fill flag (has solid fill = 1; lacks solid fill = 0)
				entity.associativity = (curr.value & 1) !== 0;
				break;
			// case 72: // 16-bit integer value
			case 73: // For MPolygon, boundary annotation flag (boundary is an annotated boundary = 1; boundary is not an annotated boundary = 0)
				entity.annotatedBoundary = (curr.value & 1) !== 0;
				break;
			case 75: // Hatch style: 0 = Hatch “odd parity” area (Normal style), 1 = Hatch outermost area only (Outer style), 2 = Hatch through entire area (Ignore style)
				entity.style = curr.value;
				break;
			case 76: // Hatch pattern type: 0 = User-defined; 1 = Predefined; 2 = Custom
				entity.patternStyle = curr.value;
				break;
			case 91: // Number of boundary paths (loops)
				entity.boundaryPathsCount = curr.value;
				break;
			// case 92: // Number of bytes in the proxy entity graphics represented in the subsequent 310 groups, which are binary chunk records (optional)
			// This one is from common entity propierties
			case 93:
				var boundryVerticeCount = curr.value;
				var boundry = parseHatchVertices(boundryVerticeCount, scanner)
				entity.boundaries.push(boundry);
			// case 97: // 32-bit integer value
			case 98:
				entity.seedPointsCount = curr.value;
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
	// console.log("parseHatch exit");

	return entity;
};

function parseHatchVertices(n, scanner) {
	if (!n || n <= 0) throw Error('n must be greater than 0 verticies');
	var vertices = [], i;
	var vertexIsStarted = false;
	var vertexIsFinished = false;
	var curr = scanner.next();

	for (i = 0; i < n; i++) {
		// console.log("parseHatchVertices.i: " + i);
		var vertex = {};
		while (curr !== 'EOF') {
			if (curr.code === 0 || vertexIsFinished) break;

			switch (curr.code) {
				case 10: // X
					if (vertexIsStarted) {
						vertexIsFinished = true;
						continue;
					}
					vertex.x = curr.value;
					vertexIsStarted = true;
					break;
				case 20: // Y
					vertex.y = curr.value;
					break;
				case 42: // bulge
					if (curr.value != 0) vertex.bulge = curr.value;
					break;
				default:
					// if we do not hit known code return vertices.  Code might belong to entity
					if (vertexIsStarted) {
						vertices.push(vertex);
					}
					// console.log("parseHatchVertices exit from default");
					return vertices;
			}
			curr = scanner.next();
		}
		vertices.push(vertex);
		vertexIsStarted = false;
		vertexIsFinished = false;
	}
	// console.log("parseHatchVertices exit");
	scanner.rewind();
	return vertices;
};
