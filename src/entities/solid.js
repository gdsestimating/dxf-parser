
import * as helpers from '../ParseHelpers'

export default function EntityParser() {}

EntityParser.ForEntityName = 'SOLID';

EntityParser.prototype.parseEntity = function(scanner, curr) {
    var entity;
    entity = { type: curr.value };
    entity.points = [];
    curr = scanner.next();
    while(curr !== 'EOF') {
        if(curr.code === 0) break;

        switch(curr.code) {
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
                helpers.checkCommonEntityProperties(entity, curr, scanner);
                break;
        }
        curr = scanner.next();
    }

    return entity;
};