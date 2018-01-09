
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


