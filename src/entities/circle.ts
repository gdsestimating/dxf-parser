import DxfArrayScanner, { IGroup } from '../DxfArrayScanner.js';
import * as helpers from '../ParseHelpers.js';
import IGeometry, { IEntity, IPoint } from './geomtry.js';

export interface ICircleEntity extends IEntity {
	center: IPoint;
	radius: number;
	startAngle: number;
	endAngle: number;
	angleLength: number;
	extrusionDirectionX: number;
	extrusionDirectionY: number;
	extrusionDirectionZ: number;
}

export default class Circle implements IGeometry {
	public ForEntityName = 'CIRCLE' as const;
	public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
		const entity = { type: curr.value } as ICircleEntity;
		curr = scanner.next();
		while (!scanner.isEOF()) {
			if (curr.code === 0) break;

			switch (curr.code) {
				case 10: // X coordinate of point
					entity.center = helpers.parsePoint(scanner);
					break;
				case 40: // radius
					entity.radius = (curr.value as number);
					break;
				case 50: // start angle
					entity.startAngle = Math.PI / 180 * (curr.value as number);
					break;
				case 51: // end angle
					const endAngle = Math.PI / 180 * (curr.value as number);
					if (endAngle < entity.startAngle)
						entity.angleLength = endAngle + 2 * Math.PI - entity.startAngle;
					else
						entity.angleLength = endAngle - entity.startAngle;
					entity.endAngle = endAngle;
					break;
				case 210:
					entity.extrusionDirectionX = curr.value as number;
					break;
				case 220:
					entity.extrusionDirectionY = curr.value as number;
					break;
				case 230:
					entity.extrusionDirectionZ = curr.value as number;
					break;
				default: // ignored attribute
					helpers.checkCommonEntityProperties(entity, curr, scanner);
					break;
			}
			curr = scanner.next();
		}
		return entity;
	}
}
