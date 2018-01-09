
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